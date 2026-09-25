import sqlite3
import json
import os
from typing import List, Dict, Optional, Any

try:
    from backend.models import SafeLocation, Waypoint, Route, Coordinates, DeviationAlert, LandmarkStamp
    from backend.geodesic_engine import GeodesicEngine
except ImportError:
    from models import SafeLocation, Waypoint, Route, Coordinates, DeviationAlert, LandmarkStamp
    from geodesic_engine import GeodesicEngine

DB_PATH = os.path.join(os.path.dirname(__file__), "mindmitra.db")

class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()
        self._seed_default_data_if_empty()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS safe_locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                icon TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                safe_radius_m REAL DEFAULT 30.0,
                landmark_cue TEXT DEFAULT '',
                audio_note TEXT DEFAULT ''
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY,
                origin_name TEXT NOT NULL,
                destination_name TEXT NOT NULL,
                origin_coord_json TEXT NOT NULL,
                destination_coord_json TEXT NOT NULL,
                waypoints_json TEXT NOT NULL,
                total_distance_m REAL NOT NULL,
                estimated_minutes INTEGER NOT NULL,
                corridor_radius_m REAL DEFAULT 25.0
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                level INTEGER NOT NULL,
                status TEXT NOT NULL,
                message TEXT NOT NULL,
                voice_prompt TEXT NOT NULL,
                timestamp REAL NOT NULL,
                coord_json TEXT NOT NULL,
                target_destination TEXT NOT NULL,
                deviation_seconds REAL NOT NULL,
                resolved INTEGER DEFAULT 0
            );
            """)
            conn.commit()

    def _seed_default_data_if_empty(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM safe_locations")
            if cursor.fetchone()["count"] == 0:
                default_places = [
                    SafeLocation(
                        id="loc_home",
                        name="Home (Laila PG)",
                        category="home",
                        icon="🏠",
                        coord=Coordinates(latitude=13.14537, longitude=77.61979),
                        safe_radius_m=90.0,
                        landmark_cue="Chandramouleswar layout main arch & residential lane",
                        audio_note="Home residence at Laila PG"
                    ),
                    SafeLocation(
                        id="loc_vu",
                        name="VU (Vidyashilp University)",
                        category="custom",
                        icon="🎓",
                        coord=Coordinates(latitude=13.20170, longitude=77.60080),
                        safe_radius_m=90.0,
                        landmark_cue="University grand entrance gate on Chapparkallu Road",
                        audio_note="Vidyashilp University Campus"
                    ),
                    SafeLocation(
                        id="loc_dmart",
                        name="D-Mart (DMart Ready)",
                        category="mart",
                        icon="🛒",
                        coord=Coordinates(latitude=13.14150, longitude=77.62680),
                        safe_radius_m=60.0,
                        landmark_cue="Bright green grocery signage near main market lane",
                        audio_note="DMart grocery store"
                    ),
                    SafeLocation(
                        id="loc_lake",
                        name="Lake (Hunasamaranahalli Lake)",
                        category="park",
                        icon="🌊",
                        coord=Coordinates(latitude=13.14020, longitude=77.61580),
                        safe_radius_m=80.0,
                        landmark_cue="Scenic lakeside walking trail & shady trees",
                        audio_note="Peaceful Lake promenade"
                    )
                ]
                for p in default_places:
                    self.add_safe_location(p)

                # Routes are generated dynamically via StreetRoutingService (OSRM real street network)
                pass

    def get_all_safe_locations(self) -> List[SafeLocation]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM safe_locations")
            rows = cursor.fetchall()
            return [
                SafeLocation(
                    id=row["id"],
                    name=row["name"],
                    category=row["category"],
                    icon=row["icon"],
                    coord=Coordinates(latitude=row["latitude"], longitude=row["longitude"]),
                    safe_radius_m=row["safe_radius_m"],
                    landmark_cue=row["landmark_cue"],
                    audio_note=row["audio_note"]
                )
                for row in rows
            ]

    def add_safe_location(self, loc: SafeLocation):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO safe_locations (id, name, category, icon, latitude, longitude, safe_radius_m, landmark_cue, audio_note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (loc.id, loc.name, loc.category, loc.icon, loc.coord.latitude, loc.coord.longitude, loc.safe_radius_m, loc.landmark_cue, loc.audio_note))
            conn.commit()

    def delete_safe_location(self, loc_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM safe_locations WHERE id = ?", (loc_id,))
            conn.commit()

    def get_route_by_id(self, route_id: str) -> Optional[Route]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM routes WHERE id = ?", (route_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return Route(
                id=row["id"],
                origin_name=row["origin_name"],
                destination_name=row["destination_name"],
                origin_coord=Coordinates(**json.loads(row["origin_coord_json"])),
                destination_coord=Coordinates(**json.loads(row["destination_coord_json"])),
                waypoints=[Waypoint(**wp) for wp in json.loads(row["waypoints_json"])],
                total_distance_m=row["total_distance_m"],
                estimated_minutes=row["estimated_minutes"],
                corridor_radius_m=row["corridor_radius_m"]
            )

    def save_route(self, route: Route):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO routes (id, origin_name, destination_name, origin_coord_json, destination_coord_json, waypoints_json, total_distance_m, estimated_minutes, corridor_radius_m)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                route.id,
                route.origin_name,
                route.destination_name,
                json.dumps(route.origin_coord.dict()),
                json.dumps(route.destination_coord.dict()),
                json.dumps([wp.dict() for wp in route.waypoints]),
                route.total_distance_m,
                route.estimated_minutes,
                route.corridor_radius_m
            ))
            conn.commit()

    def generate_safe_route(self, origin: Coordinates, destination_loc: SafeLocation) -> Route:
        """
        Dynamically generates a safe, high-resolution street-following route using OSRM & road network.
        """
        try:
            from backend.routing_service import StreetRoutingService
        except ImportError:
            from routing_service import StreetRoutingService
            
        return StreetRoutingService.get_route(origin, destination_loc)

    def log_alert(self, alert: DeviationAlert):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO alerts (alert_id, patient_id, level, status, message, voice_prompt, timestamp, coord_json, target_destination, deviation_seconds, resolved)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.alert_id,
                alert.patient_id,
                alert.level,
                alert.status,
                alert.message,
                alert.voice_prompt,
                alert.timestamp,
                json.dumps(alert.current_coord.dict()),
                alert.target_destination,
                alert.deviation_seconds,
                1 if alert.resolved else 0
            ))
            conn.commit()

    def get_recent_alerts(self, limit: int = 20) -> List[DeviationAlert]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [
                DeviationAlert(
                    alert_id=row["alert_id"],
                    patient_id=row["patient_id"],
                    level=row["level"],
                    status=row["status"],
                    message=row["message"],
                    voice_prompt=row["voice_prompt"],
                    timestamp=row["timestamp"],
                    current_coord=Coordinates(**json.loads(row["coord_json"])),
                    target_destination=row["target_destination"],
                    deviation_seconds=row["deviation_seconds"],
                    resolved=bool(row["resolved"])
                )
                for row in rows
            ]
