import pytest
import time
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import Coordinates, Waypoint, Route, PatientTelemetry
from geodesic_engine import GeodesicEngine
from garden_engine import JourneyGardenEngine
from navigation_state import NavigationSession

def test_haversine_distance_accuracy():
    # Same point distance is 0
    p1 = Coordinates(latitude=26.14450, longitude=91.73620)
    assert GeodesicEngine.haversine_distance(p1, p1) == 0.0

    # Approx 111km per degree of latitude
    p2 = Coordinates(latitude=27.14450, longitude=91.73620)
    dist = GeodesicEngine.haversine_distance(p1, p2)
    assert 110000.0 < dist < 112000.0

def test_calculate_bearing_cardinal_directions():
    p_center = Coordinates(latitude=26.0, longitude=91.0)
    p_north = Coordinates(latitude=27.0, longitude=91.0)
    p_east = Coordinates(latitude=26.0, longitude=92.0)
    
    bearing_north = GeodesicEngine.calculate_bearing(p_center, p_north)
    bearing_east = GeodesicEngine.calculate_bearing(p_center, p_east)
    
    assert abs(bearing_north - 0.0) < 1.0 or abs(bearing_north - 360.0) < 1.0
    assert abs(bearing_east - 90.0) < 1.0

def test_bearing_difference_wraparound():
    # 355 deg vs 5 deg should be 10 deg difference, not 350 deg
    diff = GeodesicEngine.calculate_bearing_difference(355.0, 5.0)
    assert abs(diff - 10.0) < 0.01

    # 180 deg opposite
    diff_opp = GeodesicEngine.calculate_bearing_difference(0.0, 180.0)
    assert abs(diff_opp - 180.0) < 0.01

def test_cross_track_distance():
    p_start = Coordinates(latitude=26.000, longitude=91.000)
    p_end = Coordinates(latitude=26.010, longitude=91.000) # Pure North line
    
    # Point directly on line
    p_on_line = Coordinates(latitude=26.005, longitude=91.000)
    xt_on = GeodesicEngine.cross_track_distance(p_on_line, p_start, p_end)
    assert xt_on < 1.0

    # Point shifted East
    p_off_east = Coordinates(latitude=26.005, longitude=91.001)
    xt_off = GeodesicEngine.cross_track_distance(p_off_east, p_start, p_end)
    assert 90.0 < xt_off < 110.0 # ~100 meters East

def test_journey_garden_positive_reinforcement():
    garden = JourneyGardenEngine(initial_points=20, streak_days=2)
    
    # Points accumulate positively
    garden.record_action("START_JOURNEY")
    assert garden.points == 30
    
    garden.record_action("CHECKPOINT_REACHED")
    assert garden.points == 55
    
    # Milestone progression
    garden.points = 120
    lvl, name = garden.get_garden_stage()
    assert lvl == 2
    assert "Tulsi" in name

    garden.points = 350
    lvl, name = garden.get_garden_stage()
    assert lvl == 3
    assert "Marigolds" in name

    garden.points = 650
    lvl, name = garden.get_garden_stage()
    assert lvl == 4
    assert "Sanctuary" in name

def test_navigation_hysteresis_and_deviation():
    route = Route(
        id="test_route",
        origin_name="Start",
        destination_name="Temple",
        origin_coord=Coordinates(latitude=26.14450, longitude=91.73620),
        destination_coord=Coordinates(latitude=26.14720, longitude=91.73910),
        waypoints=[
            Waypoint(
                id="wp_1",
                name="Waypoint 1",
                coord=Coordinates(latitude=26.14550, longitude=91.73630),
                instruction="Walk straight 100m",
                voice_prompts={"en": "Walk straight"},
                arrow_type="STRAIGHT"
            ),
            Waypoint(
                id="wp_2",
                name="Temple Gate",
                coord=Coordinates(latitude=26.14720, longitude=91.73910),
                instruction="Arrive at temple",
                voice_prompts={"en": "Arrived at temple"},
                arrow_type="ARRIVE"
            )
        ],
        total_distance_m=350.0,
        estimated_minutes=5,
        corridor_radius_m=25.0
    )

    session = NavigationSession(session_id="test_sess", patient_id="p1", route=route)
    t0 = 1000.0

    # Step 1: Normal on-route walking at t0
    tel_normal = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14480, longitude=91.73625),
        heading_deg=5.0,
        timestamp=t0
    )
    res1 = session.process_telemetry(tel_normal)
    assert res1.status == "NAVIGATING_NORMAL"
    assert not res1.escalate_caregiver

    # Step 2: Off corridor starts at t0 + 10.0 (Transient buffer 0-5s -> absorbed without jarring alerts)
    tel_dev_start = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14480, longitude=91.73680), # ~55m away East
        heading_deg=180.0,
        timestamp=t0 + 10.0
    )
    res2 = session.process_telemetry(tel_dev_start)
    assert res2.status == "NAVIGATING_NORMAL" # Absorbed by buffer
    assert not res2.escalate_caregiver

    # Step 3: Sustained mild deviation of 16 seconds (at t0 + 26.0) -> Triggers GENTLE_REORIENT
    tel_dev_16s = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14480, longitude=91.73680),
        heading_deg=180.0,
        timestamp=t0 + 26.0
    )
    res3 = session.process_telemetry(tel_dev_16s)
    assert res3.status == "GENTLE_REORIENT"
    assert res3.arrow_type == "U_TURN"
    assert not res3.escalate_caregiver

    # Step 4: Sustained deviation for 45 seconds (at t0 + 55.0) -> Triggers CRITICAL_DEVIATION & Caregiver alert
    tel_dev_45s = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14480, longitude=91.73680),
        heading_deg=180.0,
        timestamp=t0 + 55.0
    )
    res4 = session.process_telemetry(tel_dev_45s)
    assert res4.status == "CRITICAL_DEVIATION"
    assert res4.escalate_caregiver is True
    assert res4.alert is not None
    assert res4.alert.level == 2

def test_landmark_stamp_quest_and_postcard():
    from models import LandmarkStamp
    
    route = Route(
        id="stamp_route",
        origin_name="Home",
        destination_name="Temple",
        origin_coord=Coordinates(latitude=26.14450, longitude=91.73620),
        destination_coord=Coordinates(latitude=26.14720, longitude=91.73910),
        waypoints=[
            Waypoint(
                id="wp_1",
                name="Blue Gate",
                coord=Coordinates(latitude=26.14550, longitude=91.73630),
                instruction="Walk straight 100m",
                voice_prompts={"en": "Walk straight"},
                arrow_type="STRAIGHT",
                stamp=LandmarkStamp(
                    id="st_1",
                    name="Blue Gate Stamp",
                    icon="🌺",
                    description="Bougainvillea Gate",
                    points_reward=25
                )
            ),
            Waypoint(
                id="wp_2",
                name="Temple Entrance",
                coord=Coordinates(latitude=26.14720, longitude=91.73910),
                instruction="Arrive at Temple",
                voice_prompts={"en": "Arrive at temple"},
                arrow_type="ARRIVE",
                stamp=LandmarkStamp(
                    id="st_2",
                    name="Temple Bell Stamp",
                    icon="🛕",
                    description="Golden Temple Bell",
                    points_reward=50
                )
            )
        ],
        total_distance_m=350.0,
        estimated_minutes=5,
        corridor_radius_m=25.0
    )

    session = NavigationSession(session_id="stamp_sess", patient_id="p1", route=route)
    assert len(session.all_stamps) == 2
    assert len(session.collected_stamps) == 0

    # Reach Waypoint 1 (within 15m)
    tel_wp1 = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14550, longitude=91.73630),
        timestamp=2000.0
    )
    res1 = session.process_telemetry(tel_wp1)
    assert res1.status == "WAYPOINT_REACHED"
    assert res1.unlocked_stamp is not None
    assert res1.unlocked_stamp.id == "st_1"
    assert len(session.collected_stamps) == 1

    # Reach Waypoint 2 (Destination Arrival)
    tel_wp2 = PatientTelemetry(
        patient_id="p1",
        current_coord=Coordinates(latitude=26.14720, longitude=91.73910),
        timestamp=2100.0
    )
    res2 = session.process_telemetry(tel_wp2)
    assert res2.status == "DESTINATION_ARRIVED"
    assert res2.unlocked_stamp is not None
    assert res2.unlocked_stamp.id == "st_2"
    assert len(session.collected_stamps) == 2
    assert res2.postcard is not None
    assert len(res2.postcard.stamps_collected) == 2
    assert res2.postcard.destination_name == "Temple"
