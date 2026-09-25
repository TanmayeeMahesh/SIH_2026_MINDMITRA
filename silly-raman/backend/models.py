from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import time

class Coordinates(BaseModel):
    latitude: float
    longitude: float

class SafeLocation(BaseModel):
    id: str
    name: str
    category: str  # 'home', 'temple', 'mart', 'hospital', 'park', 'relative', 'custom'
    icon: str
    coord: Coordinates
    safe_radius_m: float = 30.0
    landmark_cue: Optional[str] = ""
    audio_note: Optional[str] = ""

class LandmarkStamp(BaseModel):
    id: str
    name: str
    icon: str  # '🌺', '🫖', '🛕', '🌳', '🏥'
    description: str
    points_reward: int = 25
    collected: bool = False
    collected_at: Optional[float] = None

class Waypoint(BaseModel):
    id: str
    name: str
    coord: Coordinates
    instruction: str
    voice_prompts: Dict[str, str] = Field(default_factory=dict)
    landmark_hint: Optional[str] = ""
    arrow_type: str = "STRAIGHT"  # 'STRAIGHT', 'LEFT', 'RIGHT', 'SLIGHT_LEFT', 'SLIGHT_RIGHT', 'ARRIVE'
    stamp: Optional[LandmarkStamp] = None

class Route(BaseModel):
    id: str
    origin_name: str
    destination_name: str
    origin_coord: Coordinates
    destination_coord: Coordinates
    waypoints: List[Waypoint]
    total_distance_m: float
    estimated_minutes: int
    corridor_radius_m: float = 25.0
    polyline_coords: List[Coordinates] = Field(default_factory=list)

class PatientTelemetry(BaseModel):
    patient_id: str = "patient_001"
    current_coord: Coordinates
    heading_deg: float = 0.0  # 0 to 360
    speed_mps: float = 1.0
    accuracy_m: float = 5.0
    battery_pct: int = 88
    timestamp: float = Field(default_factory=time.time)

class GardenTile(BaseModel):
    row: int
    col: int
    type: str  # 'empty_soil', 'sprout', 'herb', 'marigold', 'orchid', 'banyan_tree', 'butterfly'
    label: str

class GardenState(BaseModel):
    total_points: int = 0
    stage_name: str = "🌱 Fertile Soil & Small Sprouts"
    stage_level: int = 1  # 1 to 4
    grid: List[List[str]] = Field(default_factory=list)
    recent_event: Optional[str] = "Started journey with a new planted seed"
    streak_count: int = 3

class DeviationAlert(BaseModel):
    alert_id: str
    patient_id: str
    level: int  # 1 = Soft Reorient (Patient only), 2 = Critical (Caregiver notification)
    status: str # 'WARNING' or 'CRITICAL'
    message: str
    voice_prompt: str
    timestamp: float
    current_coord: Coordinates
    target_destination: str
    deviation_seconds: float
    resolved: bool = False

class JourneyPostcard(BaseModel):
    postcard_id: str
    origin_name: str
    destination_name: str
    destination_icon: str
    stamps_collected: List[LandmarkStamp] = Field(default_factory=list)
    total_stamps_available: int = 3
    distance_walked_m: float = 0.0
    garden_points_earned: int = 0
    garden_stage_name: str = ""
    completion_message: str = "Wonderful stroll! You safely nurtured your garden today."
    date_str: str = Field(default_factory=lambda: time.strftime("%B %d, %Y"))

class NavigationUpdateResponse(BaseModel):
    session_id: str
    status: str  # 'NAVIGATING_NORMAL', 'WAYPOINT_REACHED', 'GENTLE_REORIENT', 'CRITICAL_DEVIATION', 'DESTINATION_ARRIVED'
    current_waypoint_idx: int
    total_waypoints: int
    current_instruction: str
    voice_prompts: Dict[str, str]
    arrow_type: str
    distance_to_next_m: float
    distance_total_remaining_m: float
    garden_state: GardenState
    alert: Optional[DeviationAlert] = None
    escalate_caregiver: bool = False
    unlocked_stamp: Optional[LandmarkStamp] = None
    all_stamps: List[LandmarkStamp] = Field(default_factory=list)
    postcard: Optional[JourneyPostcard] = None
