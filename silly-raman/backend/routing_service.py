import json
import urllib.request
import urllib.parse
from typing import List, Dict, Optional, Tuple

try:
    from backend.models import Coordinates, Waypoint, Route, SafeLocation
    from backend.geodesic_engine import GeodesicEngine
except ImportError:
    from models import Coordinates, Waypoint, Route, SafeLocation
    from geodesic_engine import GeodesicEngine

class StreetRoutingService:
    """
    Real-Time Street & Pedestrian Network Routing Service.
    Queries OSRM Foot Network for exact road polylines, curves, and turn-by-turn maneuver steps.
    Includes offline high-accuracy street fallback for Bangalore / Hunasamaranahalli.
    """

    @staticmethod
    def get_route(origin: Coordinates, destination_loc: SafeLocation) -> Route:
        total_dist_direct = GeodesicEngine.haversine_distance(origin, destination_loc.coord)
        
        # 1. Proximity check (< 100m)
        if total_dist_direct <= max(destination_loc.safe_radius_m, 100.0):
            return Route(
                id=f"route_to_{destination_loc.id}",
                origin_name="Current Location",
                destination_name=destination_loc.name,
                origin_coord=origin,
                destination_coord=destination_loc.coord,
                waypoints=[
                    Waypoint(
                        id="wp_arrive_direct",
                        name=f"Current Location: {destination_loc.name}",
                        coord=destination_loc.coord,
                        instruction=f"You are already safely at {destination_loc.name}.",
                        voice_prompts={
                            "en": f"You are already safely at {destination_loc.name}.",
                            "hi": f"आप पहले से ही {destination_loc.name} पर सुरक्षित हैं।",
                            "mr": f"तुम्ही आधीच {destination_loc.name} वर सुरक्षित आहात.",
                            "as": f"আপুনি ইতিমধ্যে {destination_loc.name}ত কুশলে আছে।",
                            "bn": f"আপনি ইতিমধ্যে {destination_loc.name}-এ নিরাপদে আছেন।"
                        },
                        landmark_hint=destination_loc.landmark_cue or "Safe zone location",
                        arrow_type="ARRIVE"
                    )
                ],
                total_distance_m=round(total_dist_direct, 1),
                estimated_minutes=1,
                corridor_radius_m=60.0,
                polyline_coords=[origin, destination_loc.coord]
            )

        # 2. Try OSRM Foot/Driving Routing API for exact road network geometry
        for profile in ["foot", "driving"]:
            osrm_route = StreetRoutingService._fetch_osrm_route(origin, destination_loc, profile=profile)
            if osrm_route and len(osrm_route.polyline_coords) > 5:
                return osrm_route

        # 3. Offline High-Resolution Street Fallback
        return StreetRoutingService._generate_fallback_street_route(origin, destination_loc)

    @staticmethod
    def _fetch_osrm_route(origin: Coordinates, destination_loc: SafeLocation, profile: str = "foot") -> Optional[Route]:
        url = (
            f"https://router.project-osrm.org/route/v1/{profile}/"
            f"{origin.longitude:.6f},{origin.latitude:.6f};"
            f"{destination_loc.coord.longitude:.6f},{destination_loc.coord.latitude:.6f}"
            f"?overview=full&geometries=geojson&steps=true"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MindMitraSafeNav/1.0 (Dementia Safety)"})
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode())
                
                if data.get("code") != "Ok" or not data.get("routes"):
                    return None

                route_data = data["routes"][0]
                total_dist = float(route_data.get("distance", 0.0))
                duration_sec = float(route_data.get("duration", 0.0))
                est_min = max(2, int(duration_sec / 60))

                raw_coords = route_data.get("geometry", {}).get("coordinates", [])
                polyline_coords = [Coordinates(latitude=c[1], longitude=c[0]) for c in raw_coords]
                
                # Build detailed waypoints from maneuver steps
                waypoints: List[Waypoint] = []
                step_idx = 1

                for leg in route_data.get("legs", []):
                    for step in leg.get("steps", []):
                        maneuver = step.get("maneuver", {})
                        m_type = maneuver.get("type", "turn")
                        m_mod = maneuver.get("modifier", "")
                        loc = maneuver.get("location", [0, 0])
                        step_dist = step.get("distance", 0.0)
                        street_name = step.get("name") or "the safe road"

                        arrow = StreetRoutingService._map_maneuver_to_arrow(m_type, m_mod)
                        instruction, voice = StreetRoutingService._format_instruction(
                            m_type, m_mod, street_name, step_dist, destination_loc.name
                        )

                        wp_coord = Coordinates(latitude=loc[1], longitude=loc[0])
                        
                        waypoints.append(
                            Waypoint(
                                id=f"wp_step_{step_idx}",
                                name=street_name,
                                coord=wp_coord,
                                instruction=instruction,
                                voice_prompts=voice,
                                landmark_hint=f"Along {street_name}",
                                arrow_type=arrow
                            )
                        )
                        step_idx += 1

                # If last waypoint is not ARRIVE, ensure final arrival waypoint
                if not waypoints or waypoints[-1].arrow_type != "ARRIVE":
                    waypoints.append(
                        Waypoint(
                            id=f"wp_arrive_{destination_loc.id}",
                            name=destination_loc.name,
                            coord=destination_loc.coord,
                            instruction=f"You have arrived safely at {destination_loc.name}.",
                            voice_prompts={
                                "en": f"You have arrived safely at {destination_loc.name}."
                            },
                            landmark_hint=destination_loc.landmark_cue or "Safe Destination",
                            arrow_type="ARRIVE"
                        )
                    )

                return Route(
                    id=f"route_to_{destination_loc.id}",
                    origin_name="Current Location",
                    destination_name=destination_loc.name,
                    origin_coord=origin,
                    destination_coord=destination_loc.coord,
                    waypoints=waypoints,
                    total_distance_m=round(total_dist, 1),
                    estimated_minutes=est_min,
                    corridor_radius_m=35.0,
                    polyline_coords=polyline_coords
                )
        except Exception as e:
            print(f"[StreetRoutingService] OSRM query failed for {profile}: {e}")
            return None

    @staticmethod
    def _generate_fallback_street_route(origin: Coordinates, destination_loc: SafeLocation) -> Route:
        """
        High-Resolution fallback with street-snapped coordinates along Hunasamaranahalli layout roads.
        """
        raw_polyline_tuples = []
        inter_waypoints = []

        if destination_loc.id == "loc_lake":
            # Exact street polyline following residential roads out of Laila PG to Hunasamaranahalli Lake
            raw_polyline_tuples = [
                (13.14537, 77.61979),  # Laila PG Gents 2
                (13.14538, 77.61973),  # Exit alley
                (13.14510, 77.61968),  # Lane south
                (13.14447, 77.61965),  # 1st Cross corner
                (13.14371, 77.61959),  # Hosahalli Main Road corner
                (13.14384, 77.61931),  # Hosahalli Main Rd
                (13.14432, 77.61829),  # Hosahalli Main Rd West
                (13.14434, 77.61778),  # Suggatta Main Rd Junction
                (13.14327, 77.61772),  # Suggatta Main Rd South
                (13.14265, 77.61772),  # Suggatta Main Rd
                (13.14172, 77.61771),  # Lakeside approach
                (13.14080, 77.61680),  # Lakeside path
                (13.14020, 77.61580)   # Hunasamaranahalli Lake Promenade
            ]
            inter_waypoints = [
                (Coordinates(latitude=13.14538, longitude=77.61973), "Layout Alley", "Start walking out of the residential lane.", "STRAIGHT"),
                (Coordinates(latitude=13.14447, longitude=77.61965), "1st Cross Road", "Turn right onto 1st Cross Road for 85 meters.", "RIGHT"),
                (Coordinates(latitude=13.14371, longitude=77.61959), "Hosahalli Main Road", "Turn right onto Hosahalli Main Road for 210 meters.", "RIGHT"),
                (Coordinates(latitude=13.14434, longitude=77.61778), "Suggatta Main Road", "Turn left onto Suggatta Main Road towards the lake.", "LEFT"),
                (Coordinates(latitude=13.14172, longitude=77.61771), "Lakeside Promenade Path", "Turn right onto the peaceful lakeside trail.", "RIGHT"),
                (destination_loc.coord, destination_loc.name, f"You have arrived safely at {destination_loc.name}.", "ARRIVE")
            ]
        elif destination_loc.id == "loc_dmart":
            raw_polyline_tuples = [
                (13.14537, 77.61979),
                (13.14538, 77.61973),
                (13.14447, 77.61965),
                (13.14371, 77.61959),
                (13.14350, 77.62150),
                (13.14280, 77.62450),
                (13.14150, 77.62680)
            ]
            inter_waypoints = [
                (Coordinates(latitude=13.14447, longitude=77.61965), "1st Cross Road", "Turn right onto 1st Cross Road.", "RIGHT"),
                (Coordinates(latitude=13.14371, longitude=77.61959), "Hosahalli Main Road", "Turn left onto Hosahalli Main Road towards the market.", "LEFT"),
                (Coordinates(latitude=13.14280, longitude=77.62450), "DMart Commercial Lane", "Walk along the pedestrian footpath to DMart Ready.", "STRAIGHT"),
                (destination_loc.coord, destination_loc.name, f"You have arrived safely at {destination_loc.name}.", "ARRIVE")
            ]
        elif destination_loc.id == "loc_vu":
            raw_polyline_tuples = [
                (13.14537, 77.61979),
                (13.14538, 77.61973),
                (13.14447, 77.61965),
                (13.14434, 77.61778),
                (13.15200, 77.61500),
                (13.18000, 77.60800),
                (13.20170, 77.60080)
            ]
            inter_waypoints = [
                (Coordinates(latitude=13.14447, longitude=77.61965), "1st Cross Road", "Turn right onto 1st Cross Road.", "RIGHT"),
                (Coordinates(latitude=13.15200, longitude=77.61500), "Sir MVIT College Road", "Follow Sir MVIT College Road heading North.", "STRAIGHT"),
                (Coordinates(latitude=13.18000, longitude=77.60800), "Chapparkallu Main Road", "Continue along Chapparkallu Road towards Vidyashilp.", "STRAIGHT"),
                (destination_loc.coord, destination_loc.name, f"You have arrived safely at {destination_loc.name}.", "ARRIVE")
            ]
        else:
            raw_polyline_tuples = [(origin.latitude, origin.longitude), (destination_loc.coord.latitude, destination_loc.coord.longitude)]
            inter_waypoints = [
                (destination_loc.coord, destination_loc.name, f"You have arrived safely at {destination_loc.name}.", "ARRIVE")
            ]

        # Convert tuples to Coordinates list
        polyline_coords = [Coordinates(latitude=lat, longitude=lng) for lat, lng in raw_polyline_tuples]

        waypoints = []
        for idx, (coord, street, instr, arrow) in enumerate(inter_waypoints, 1):
            waypoints.append(
                Waypoint(
                    id=f"wp_fall_{idx}",
                    name=street,
                    coord=coord,
                    instruction=instr,
                    voice_prompts={"en": instr},
                    landmark_hint=f"Near {street}",
                    arrow_type=arrow
                )
            )

        total_dist = GeodesicEngine.haversine_distance(origin, destination_loc.coord) * 1.35
        return Route(
            id=f"route_to_{destination_loc.id}",
            origin_name="Current Location",
            destination_name=destination_loc.name,
            origin_coord=origin,
            destination_coord=destination_loc.coord,
            waypoints=waypoints,
            total_distance_m=round(total_dist, 1),
            estimated_minutes=max(2, int(total_dist / 65)),
            corridor_radius_m=35.0,
            polyline_coords=polyline_coords
        )

    @staticmethod
    def _map_maneuver_to_arrow(m_type: str, m_mod: str) -> str:
        if m_type == "arrive":
            return "ARRIVE"
        if "left" in m_mod:
            return "SLIGHT_LEFT" if "slight" in m_mod else "LEFT"
        if "right" in m_mod:
            return "SLIGHT_RIGHT" if "slight" in m_mod else "RIGHT"
        if "uturn" in m_mod:
            return "U_TURN"
        return "STRAIGHT"

    @staticmethod
    def _format_instruction(m_type: str, m_mod: str, street: str, dist_m: float, dest_name: str) -> Tuple[str, Dict[str, str]]:
        dist_str = f" for {int(dist_m)} meters" if dist_m > 15 else ""
        
        if m_type == "depart":
            en = f"Start walking along {street}{dist_str}."
            hi = f"{street} पर सीधे चलना शुरू करें।"
        elif m_type == "arrive":
            en = f"You have arrived safely at {dest_name}."
            hi = f"आप {dest_name} पर सुरक्षित पहुँच गए हैं।"
        elif "left" in m_mod:
            en = f"Turn left onto {street}{dist_str}."
            hi = f"{street} पर बाएं मुड़ें।"
        elif "right" in m_mod:
            en = f"Turn right onto {street}{dist_str}."
            hi = f"{street} पर दाएं मुड़ें।"
        elif "uturn" in m_mod:
            en = f"Make a safe U-turn on {street}."
            hi = f"{street} पर वापस मुड़ें।"
        else:
            en = f"Continue straight on {street}{dist_str}."
            hi = f"{street} पर सीधे आगे बढ़ें।"

        return en, {
            "en": en,
            "hi": hi,
            "mr": en,
            "as": en,
            "bn": en
        }
