import math
from typing import Tuple

try:
    from backend.models import Coordinates
except ImportError:
    from models import Coordinates

EARTH_RADIUS_METERS = 6371000.0

class GeodesicEngine:
    @staticmethod
    def haversine_distance(c1: Coordinates, c2: Coordinates) -> float:
        """
        Calculates Great-Circle distance in meters between two coordinates.
        Uses the standard Haversine formula on a spherical earth of radius 6371km.
        """
        phi1 = math.radians(c1.latitude)
        phi2 = math.radians(c2.latitude)
        delta_phi = math.radians(c2.latitude - c1.latitude)
        delta_lambda = math.radians(c2.longitude - c1.longitude)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        
        # Clamp 'a' to avoid floating point domain errors with sqrt
        a = max(0.0, min(1.0, a))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return EARTH_RADIUS_METERS * c

    @staticmethod
    def calculate_bearing(c1: Coordinates, c2: Coordinates) -> float:
        """
        Calculates initial compass forward azimuth / bearing from c1 to c2 in degrees [0, 360).
        0° = North, 90° = East, 180° = South, 270° = West.
        """
        phi1 = math.radians(c1.latitude)
        phi2 = math.radians(c2.latitude)
        delta_lambda = math.radians(c2.longitude - c1.longitude)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = (math.cos(phi1) * math.sin(phi2) -
             math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))
        
        initial_bearing = math.atan2(y, x)
        return (math.degrees(initial_bearing) + 360.0) % 360.0

    @staticmethod
    def calculate_bearing_difference(bearing1: float, bearing2: float) -> float:
        """
        Computes the minimal angular difference between two compass bearings in degrees [0, 180].
        Correctly handles wrap-around (e.g. 355° vs 5° -> 10° difference).
        """
        diff = abs(bearing1 - bearing2) % 360.0
        if diff > 180.0:
            diff = 360.0 - diff
        return diff

    @classmethod
    def cross_track_distance(cls, p_curr: Coordinates, p_start: Coordinates, p_end: Coordinates) -> float:
        """
        Calculates cross-track distance (perpendicular distance) in meters from p_curr
        to the great-circle path from p_start to p_end.
        """
        dist_start_end = cls.haversine_distance(p_start, p_end)
        if dist_start_end < 1.0:
            return cls.haversine_distance(p_curr, p_start)

        d13 = cls.haversine_distance(p_start, p_curr) / EARTH_RADIUS_METERS
        theta13 = math.radians(cls.calculate_bearing(p_start, p_curr))
        theta12 = math.radians(cls.calculate_bearing(p_start, p_end))

        sin_dxt = math.sin(d13) * math.sin(theta13 - theta12)
        # Numerical guard
        sin_dxt = max(-1.0, min(1.0, sin_dxt))
        d_xt = math.asin(sin_dxt) * EARTH_RADIUS_METERS
        return abs(d_xt)

    @classmethod
    def along_track_distance(cls, p_curr: Coordinates, p_start: Coordinates, p_end: Coordinates) -> float:
        """
        Calculates along-track distance (distance from p_start to the projection of p_curr on path) in meters.
        """
        d13 = cls.haversine_distance(p_start, p_curr) / EARTH_RADIUS_METERS
        d_xt_rad = cls.cross_track_distance(p_curr, p_start, p_end) / EARTH_RADIUS_METERS
        
        # d_at = acos(cos(d13) / cos(d_xt)) * R
        val = math.cos(d13) / max(1e-9, math.cos(d_xt_rad))
        val = max(-1.0, min(1.0, val))
        return math.acos(val) * EARTH_RADIUS_METERS

    @classmethod
    def is_within_corridor(cls, p_curr: Coordinates, p_start: Coordinates, p_end: Coordinates, corridor_radius_m: float = 25.0) -> Tuple[bool, float]:
        """
        Determines whether the patient coordinate is within the defined safe corridor around
        the path segment between p_start and p_end.
        Returns (is_inside, cross_track_distance_meters).
        """
        xt_dist = cls.cross_track_distance(p_curr, p_start, p_end)
        # Check if cross track is within bounds
        if xt_dist > corridor_radius_m:
            return False, xt_dist
        
        # Also check if user is not hopelessly before p_start or past p_end with high margin
        d_to_start = cls.haversine_distance(p_curr, p_start)
        d_to_end = cls.haversine_distance(p_curr, p_end)
        seg_length = cls.haversine_distance(p_start, p_end)
        
        # Elliptical / buffer margin around endpoints
        if d_to_start > (seg_length + corridor_radius_m + 30.0) and d_to_end > (seg_length + corridor_radius_m + 30.0):
            return False, xt_dist

        return True, xt_dist
