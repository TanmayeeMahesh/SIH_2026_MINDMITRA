import os
import json
import time
import uuid
import asyncio
from typing import Dict, List, Optional, Set, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

try:
    from backend.models import (
        Coordinates, SafeLocation, Waypoint, Route,
        PatientTelemetry, DeviationAlert, NavigationUpdateResponse, GardenState
    )
    from backend.database import Database
    from backend.navigation_state import NavigationSession
except ImportError:
    from models import (
        Coordinates, SafeLocation, Waypoint, Route,
        PatientTelemetry, DeviationAlert, NavigationUpdateResponse, GardenState
    )
    from database import Database
    from navigation_state import NavigationSession

app = FastAPI(
    title="MindMitra SafeNav & Journey Garden Engine",
    description="Dementia-Friendly Safe Navigation with Hysteresis Deviation Detection and Gamified Garden",
    version="1.0.0"
)

# Enable CORS for cross-origin frontend support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()

# In-memory active navigation sessions: { session_id: NavigationSession }
active_sessions: Dict[str, NavigationSession] = {}
latest_patient_telemetry: Dict[str, Any] = {}

# Active WebSocket connections for Caregiver Dashboard live streaming
class CaregiverConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

caregiver_ws_manager = CaregiverConnectionManager()


# --- CAREGIVER SAFE PLACES API ---

@app.get("/api/safe-locations", response_model=List[SafeLocation])
def get_safe_locations():
    """Retrieve all caregiver-approved safe destinations."""
    return db.get_all_safe_locations()

@app.post("/api/safe-locations", response_model=SafeLocation)
def add_safe_location(loc: SafeLocation):
    """Caregiver creates or updates a trusted safe location."""
    if not loc.id:
        loc.id = f"loc_{uuid.uuid4().hex[:8]}"
    db.add_safe_location(loc)
    return loc

@app.delete("/api/safe-locations/{loc_id}")
def delete_safe_location(loc_id: str):
    """Remove a safe location."""
    db.delete_safe_location(loc_id)
    return {"status": "deleted", "id": loc_id}


# --- NAVIGATION ENGINE API ---

class StartNavigationRequest(Coordinates):
    patient_id: str = "patient_001"
    destination_id: str

@app.post("/api/navigation/start")
async def start_navigation(req: StartNavigationRequest):
    """
    Initializes a dementia-safe navigation session.
    Retrieves or generates a simple safe route with minimum turns.
    """
    locations = {loc.id: loc for loc in db.get_all_safe_locations()}
    dest_loc = locations.get(req.destination_id)
    if not dest_loc:
        raise HTTPException(status_code=404, detail="Destination safe location not found")

    origin_coord = Coordinates(latitude=req.latitude, longitude=req.longitude)
    
    # Dynamically generate real street-following route (OSRM foot road network)
    route = db.generate_safe_route(origin_coord, dest_loc)

    session_id = f"nav_{uuid.uuid4().hex[:8]}"
    session = NavigationSession(session_id=session_id, patient_id=req.patient_id, route=route)
    session.garden_engine.record_action("START_JOURNEY")
    active_sessions[session_id] = session

    first_wp = route.waypoints[0]
    
    # Broadcast start event to Caregiver
    await caregiver_ws_manager.broadcast({
        "type": "SESSION_STARTED",
        "session_id": session_id,
        "patient_id": req.patient_id,
        "destination": dest_loc.name,
        "origin": origin_coord.dict(),
        "total_distance_m": route.total_distance_m,
        "waypoints": [wp.dict() for wp in route.waypoints],
        "timestamp": time.time()
    })

    return {
        "session_id": session_id,
        "route_id": route.id,
        "destination_name": dest_loc.name,
        "destination_icon": dest_loc.icon,
        "destination_coord": dest_loc.coord.dict(),
        "total_distance_m": route.total_distance_m,
        "estimated_minutes": route.estimated_minutes,
        "current_waypoint_idx": 0,
        "total_waypoints": len(route.waypoints),
        "initial_instruction": first_wp.instruction,
        "voice_prompts": first_wp.voice_prompts,
        "arrow_type": first_wp.arrow_type,
        "corridor_radius_m": route.corridor_radius_m,
        "waypoints": [wp.dict() for wp in route.waypoints],
        "polyline_coords": [p.dict() for p in (route.polyline_coords or [origin_coord, dest_loc.coord])],
        "garden_state": session.garden_engine.get_state().dict()
    }

class TelemetryPayload(PatientTelemetry):
    session_id: str

@app.post("/api/navigation/telemetry", response_model=NavigationUpdateResponse)
async def process_patient_telemetry(payload: TelemetryPayload):
    """
    Ingests live GPS coordinates from patient device.
    Evaluates cross-track corridor deviation, bearing consistency, hysteresis buffer,
    updates garden growth state, and triggers caregiver escalation if needed.
    """
    session = active_sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Navigation session expired or invalid")

    telemetry = PatientTelemetry(
        patient_id=payload.patient_id,
        current_coord=payload.current_coord,
        heading_deg=payload.heading_deg,
        speed_mps=payload.speed_mps,
        accuracy_m=payload.accuracy_m,
        battery_pct=payload.battery_pct,
        timestamp=payload.timestamp
    )

    response = session.process_telemetry(telemetry)

    # Store latest telemetry for Caregiver polling/sync
    latest_patient_telemetry[payload.patient_id] = {
        "session_id": payload.session_id,
        "patient_id": payload.patient_id,
        "coord": payload.current_coord.dict(),
        "heading_deg": payload.heading_deg,
        "speed_mps": payload.speed_mps,
        "battery_pct": payload.battery_pct,
        "status": response.status,
        "destination_name": session.route.destination_name,
        "distance_remaining_m": response.distance_total_remaining_m,
        "garden_points": response.garden_state.total_points,
        "garden_stage": response.garden_state.stage_name,
        "escalate_caregiver": response.escalate_caregiver,
        "timestamp": time.time()
    }

    # Log critical alert if escalated
    if response.alert:
        db.log_alert(response.alert)

    # Real-time WebSocket Push to Caregivers
    await caregiver_ws_manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "telemetry": latest_patient_telemetry[payload.patient_id],
        "alert": response.alert.dict() if response.alert else None
    })

    return response


# --- CAREGIVER DASHBOARD & SOS ENDPOINTS ---

@app.get("/api/caregiver/telemetry")
def get_caregiver_telemetry(patient_id: str = "patient_001"):
    """Fetch live location and state of the patient."""
    data = latest_patient_telemetry.get(patient_id)
    if not data:
        # Provide base default if session not yet active
        return {
            "session_id": None,
            "patient_id": patient_id,
            "coord": {"latitude": 13.14537, "longitude": 77.61979},
            "heading_deg": 0.0,
            "speed_mps": 0.0,
            "battery_pct": 92,
            "status": "IDLE",
            "destination_name": "None",
            "distance_remaining_m": 0.0,
            "garden_points": 40,
            "garden_stage": "🌱 Moist Soil & Sprouting Seeds",
            "escalate_caregiver": False,
            "timestamp": time.time()
        }
    return data

@app.get("/api/caregiver/alerts", response_model=List[DeviationAlert])
def get_caregiver_alerts():
    """Retrieve history of deviation and SOS alerts."""
    return db.get_recent_alerts(limit=25)

@app.post("/api/patient/sos")
async def trigger_emergency_sos(payload: Dict[str, Any]):
    """Patient or Companion taps high-contrast Emergency SOS button."""
    patient_id = payload.get("patient_id", "patient_001")
    coord_dict = payload.get("coord", {"latitude": 13.14537, "longitude": 77.61979})
    coord = Coordinates(**coord_dict)
    
    alert = DeviationAlert(
        alert_id=f"sos_{uuid.uuid4().hex[:8]}",
        patient_id=patient_id,
        level=2,
        status="CRITICAL",
        message="EMERGENCY SOS: Patient pressed the 'I Need Help' button!",
        voice_prompt="Help is on the way. Please stay right where you are.",
        timestamp=time.time(),
        current_coord=coord,
        target_destination="Emergency Assistance",
        deviation_seconds=0.0,
        resolved=False
    )
    db.log_alert(alert)

    await caregiver_ws_manager.broadcast({
        "type": "SOS_EMERGENCY",
        "alert": alert.dict()
    })

    return {"status": "SOS_DISPATCHED", "alert_id": alert.alert_id}


# --- WEBSOCKET LIVE STREAMING ---

@app.websocket("/ws/caregiver")
async def websocket_caregiver_endpoint(websocket: WebSocket):
    await caregiver_ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat & bidirectional commands
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        caregiver_ws_manager.disconnect(websocket)
    except Exception:
        caregiver_ws_manager.disconnect(websocket)


# --- SERVE FRONTEND STATIC FILES ---

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "MindMitra SafeNav & Garden API is running. Frontend static directory initializing."}
