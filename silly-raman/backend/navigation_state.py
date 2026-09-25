import time
import uuid
from typing import List, Dict, Optional, Tuple, Any

try:
    from backend.models import (
        Coordinates, Waypoint, Route, PatientTelemetry, 
        DeviationAlert, NavigationUpdateResponse, GardenState,
        LandmarkStamp, JourneyPostcard
    )
    from backend.geodesic_engine import GeodesicEngine
    from backend.garden_engine import JourneyGardenEngine
except ImportError:
    from models import (
        Coordinates, Waypoint, Route, PatientTelemetry, 
        DeviationAlert, NavigationUpdateResponse, GardenState,
        LandmarkStamp, JourneyPostcard
    )
    from geodesic_engine import GeodesicEngine
    from garden_engine import JourneyGardenEngine

class NavigationSession:
    def __init__(self, session_id: str, patient_id: str, route: Route):
        self.session_id = session_id
        self.patient_id = patient_id
        self.route = route
        self.current_waypoint_idx = 0
        self.garden_engine = JourneyGardenEngine(initial_points=35, streak_days=3)
        
        # Temporal Hysteresis Tracking
        self.first_deviation_time: Optional[float] = None
        self.last_telemetry_time: float = time.time()
        self.active_alert: Optional[DeviationAlert] = None
        self.is_completed = False
        
        # Gamification: Landmark Stamp Passport & Single Postcard Emission
        self.all_stamps: List[LandmarkStamp] = [wp.stamp for wp in route.waypoints if wp.stamp]
        self.collected_stamps: List[LandmarkStamp] = []
        self.postcard: Optional[JourneyPostcard] = None
        self.has_emitted_postcard: bool = False
        
        # Thresholds
        self.arrival_radius_m = 15.0
        self.corridor_radius_m = route.corridor_radius_m or 25.0
        self.soft_alert_threshold_sec = 12.0
        self.caregiver_alert_threshold_sec = 35.0
        self.extreme_distance_threshold_m = 75.0

    def process_telemetry(self, telemetry: PatientTelemetry) -> NavigationUpdateResponse:
        current_time = telemetry.timestamp or time.time()
        self.last_telemetry_time = current_time
        
        waypoints = self.route.waypoints
        if self.current_waypoint_idx >= len(waypoints):
            # Already arrived - do not re-emit postcard on continuous background pings
            postcard_to_emit = None
            if not self.has_emitted_postcard:
                self.postcard = self._create_postcard()
                postcard_to_emit = self.postcard
                self.has_emitted_postcard = True

            return self._build_response(
                status="DESTINATION_ARRIVED",
                instruction=f"You are at {self.route.destination_name}.",
                arrow_type="ARRIVE",
                voice_prompts={
                    "en": f"You are at {self.route.destination_name}."
                },
                dist_to_next=0.0,
                dist_total=0.0,
                postcard=postcard_to_emit
            )

        target_wp = waypoints[self.current_waypoint_idx]
        prev_coord = self.route.origin_coord if self.current_waypoint_idx == 0 else waypoints[self.current_waypoint_idx - 1].coord
        
        dist_to_target = GeodesicEngine.haversine_distance(telemetry.current_coord, target_wp.coord)
        dist_total_remaining = self._calculate_remaining_route_distance(telemetry.current_coord)
        unlocked_stamp: Optional[LandmarkStamp] = None

        # 1. CHECK IF CURRENT WAYPOINT IS REACHED
        if dist_to_target <= self.arrival_radius_m:
            self.first_deviation_time = None
            self.active_alert = None
            
            # Unlock Landmark Stamp for this waypoint if available
            if target_wp.stamp and not target_wp.stamp.collected:
                target_wp.stamp.collected = True
                target_wp.stamp.collected_at = current_time
                self.collected_stamps.append(target_wp.stamp)
                unlocked_stamp = target_wp.stamp
                self.garden_engine.points += target_wp.stamp.points_reward

            # Check if this is the final destination
            if self.current_waypoint_idx == len(waypoints) - 1:
                self.is_completed = True
                self.garden_engine.record_action("DESTINATION_SAFE")
                self.current_waypoint_idx += 1
                
                # Emit postcard once
                postcard_to_emit = None
                if not self.has_emitted_postcard:
                    self.postcard = self._create_postcard()
                    postcard_to_emit = self.postcard
                    self.has_emitted_postcard = True
                
                return self._build_response(
                    status="DESTINATION_ARRIVED",
                    instruction=f"Welcome to {self.route.destination_name}!",
                    arrow_type="ARRIVE",
                    voice_prompts={
                        "en": f"Wonderful! You have arrived safely at {self.route.destination_name}. Your garden is in full bloom!"
                    },
                    dist_to_next=0.0,
                    dist_total=0.0,
                    unlocked_stamp=unlocked_stamp,
                    postcard=postcard_to_emit
                )
            else:
                # Intermediate Waypoint Cleared
                self.garden_engine.record_action("CHECKPOINT_REACHED")
                self.current_waypoint_idx += 1
                next_wp = waypoints[self.current_waypoint_idx]
                dist_to_next = GeodesicEngine.haversine_distance(telemetry.current_coord, next_wp.coord)
                
                return self._build_response(
                    status="WAYPOINT_REACHED",
                    instruction=next_wp.instruction,
                    arrow_type=next_wp.arrow_type,
                    voice_prompts=next_wp.voice_prompts,
                    dist_to_next=dist_to_next,
                    dist_total=dist_total_remaining,
                    unlocked_stamp=unlocked_stamp
                )

        # 2. CHECK CORRIDOR & BEARING DEVIATIONS
        is_in_corridor, xt_dist = GeodesicEngine.is_within_corridor(
            telemetry.current_coord, prev_coord, target_wp.coord, self.corridor_radius_m
        )
        
        expected_bearing = GeodesicEngine.calculate_bearing(telemetry.current_coord, target_wp.coord)
        bearing_diff = GeodesicEngine.calculate_bearing_difference(telemetry.heading_deg, expected_bearing)
        
        is_deviating = (not is_in_corridor) or (bearing_diff > 95.0 and dist_to_target > 25.0)

        # 3. APPLY TEMPORAL HYSTERESIS FILTER
        if is_deviating:
            if self.first_deviation_time is None:
                self.first_deviation_time = current_time
            
            deviation_duration = current_time - self.first_deviation_time
            
            # Critical Escalation
            if deviation_duration >= self.caregiver_alert_threshold_sec or xt_dist >= self.extreme_distance_threshold_m:
                alert = DeviationAlert(
                    alert_id=f"alt_{uuid.uuid4().hex[:8]}",
                    patient_id=self.patient_id,
                    level=2,
                    status="CRITICAL",
                    message=f"Patient has strayed from the safe corridor to {self.route.destination_name} for {int(deviation_duration)}s.",
                    voice_prompt="Let's take a calm pause here. A family member is checking in to guide you safely.",
                    timestamp=current_time,
                    current_coord=telemetry.current_coord,
                    target_destination=self.route.destination_name,
                    deviation_seconds=deviation_duration,
                    resolved=False
                )
                self.active_alert = alert
                
                return self._build_response(
                    status="CRITICAL_DEVIATION",
                    instruction="Please take a gentle pause here. Your caregiver is helping you.",
                    arrow_type="STOP_OR_REST",
                    voice_prompts={
                        "en": "Let's take a calm pause here. We are checking the safe path together."
                    },
                    dist_to_next=dist_to_target,
                    dist_total=dist_total_remaining,
                    alert=alert,
                    escalate_caregiver=True
                )
                
            elif deviation_duration >= self.soft_alert_threshold_sec:
                self.garden_engine.record_action("DEVIATION_RESTORE")
                alert = DeviationAlert(
                    alert_id=f"alt_{uuid.uuid4().hex[:8]}",
                    patient_id=self.patient_id,
                    level=1,
                    status="WARNING",
                    message="Gentle reorientation prompt presented to patient.",
                    voice_prompt="Let's turn back gently to keep our garden growing in the sunshine.",
                    timestamp=current_time,
                    current_coord=telemetry.current_coord,
                    target_destination=self.route.destination_name,
                    deviation_seconds=deviation_duration,
                    resolved=False
                )
                self.active_alert = alert
                
                return self._build_response(
                    status="GENTLE_REORIENT",
                    instruction="Turn around gently and walk towards the sunny road.",
                    arrow_type="U_TURN",
                    voice_prompts={
                        "en": "Let's turn around slowly and walk back along the road to help your flowers blossom."
                    },
                    dist_to_next=dist_to_target,
                    dist_total=dist_total_remaining,
                    alert=alert,
                    escalate_caregiver=False
                )
            else:
                pass
        else:
            self.first_deviation_time = None
            self.active_alert = None
            self.garden_engine.record_action("STAY_ON_PATH")

        # 4. NORMAL NAVIGATION RESPONSE
        return self._build_response(
            status="NAVIGATING_NORMAL",
            instruction=target_wp.instruction,
            arrow_type=target_wp.arrow_type,
            voice_prompts=target_wp.voice_prompts,
            dist_to_next=dist_to_target,
            dist_total=dist_total_remaining
        )

    def _create_postcard(self) -> JourneyPostcard:
        return JourneyPostcard(
            postcard_id=f"card_{uuid.uuid4().hex[:8]}",
            origin_name=self.route.origin_name,
            destination_name=self.route.destination_name,
            destination_icon="🛕",
            stamps_collected=self.collected_stamps,
            total_stamps_available=len(self.all_stamps) or 3,
            distance_walked_m=self.route.total_distance_m,
            garden_points_earned=self.garden_engine.points,
            garden_stage_name=self.garden_engine.get_state().stage_name,
            completion_message="Awesome journey! You safely unlocked your memory stamps and blossomed your garden today."
        )

    def _calculate_remaining_route_distance(self, current_coord: Coordinates) -> float:
        waypoints = self.route.waypoints
        if self.current_waypoint_idx >= len(waypoints):
            return 0.0
        
        total = GeodesicEngine.haversine_distance(current_coord, waypoints[self.current_waypoint_idx].coord)
        for i in range(self.current_waypoint_idx, len(waypoints) - 1):
            total += GeodesicEngine.haversine_distance(waypoints[i].coord, waypoints[i + 1].coord)
            
        return round(total, 1)

    def _build_response(self, status: str, instruction: str, arrow_type: str, 
                        voice_prompts: Dict[str, str], dist_to_next: float, 
                        dist_total: float, alert: Optional[DeviationAlert] = None, 
                        escalate_caregiver: bool = False,
                        unlocked_stamp: Optional[LandmarkStamp] = None,
                        postcard: Optional[JourneyPostcard] = None) -> NavigationUpdateResponse:
        return NavigationUpdateResponse(
            session_id=self.session_id,
            status=status,
            current_waypoint_idx=self.current_waypoint_idx,
            total_waypoints=len(self.route.waypoints),
            current_instruction=instruction,
            voice_prompts=voice_prompts,
            arrow_type=arrow_type,
            distance_to_next_m=round(dist_to_next, 1),
            distance_total_remaining_m=round(dist_total, 1),
            garden_state=self.garden_engine.get_state(),
            alert=alert,
            escalate_caregiver=escalate_caregiver,
            unlocked_stamp=unlocked_stamp,
            all_stamps=self.all_stamps,
            postcard=postcard
        )
