// GEODESIC MATH for Safe Walk — ported from a teammate's working Python
// prototype (silly-raman/backend/geodesic_engine.py), not reinvented. The
// formulas are standard great-circle navigation; only the language changed.
//
// Everything here is pure and synchronous — no fetch, no GPS, no state. It
// answers one question: given two or three coordinates, what is the distance,
// bearing, or corridor error between them.

const EARTH_RADIUS_M = 6371000.0;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Great-circle distance in metres between two {lat,lng} points (Haversine). */
export function distance(a, b) {
  const phi1 = toRad(a.lat), phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLambda = toRad(b.lng - a.lng);
  const s = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(clamp(s, 0, 1)), Math.sqrt(1 - clamp(s, 0, 1)));
  return EARTH_RADIUS_M * c;
}

/** Initial compass bearing from a to b, in degrees [0, 360). 0 = North. */
export function bearing(a, b) {
  const phi1 = toRad(a.lat), phi2 = toRad(b.lat);
  const dLambda = toRad(b.lng - a.lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest angular difference between two bearings, in degrees [0, 180]. */
export function bearingDiff(b1, b2) {
  const d = Math.abs(b1 - b2) % 360;
  return d > 180 ? 360 - d : d;
}

/** Perpendicular distance in metres from `curr` to the great-circle segment
 *  start→end — how far off the planned path she has wandered. */
export function crossTrack(curr, start, end) {
  const segLen = distance(start, end);
  if (segLen < 1) return distance(curr, start);
  const d13 = distance(start, curr) / EARTH_RADIUS_M;
  const theta13 = toRad(bearing(start, curr));
  const theta12 = toRad(bearing(start, end));
  const sinDxt = clamp(Math.sin(d13) * Math.sin(theta13 - theta12), -1, 1);
  return Math.abs(Math.asin(sinDxt) * EARTH_RADIUS_M);
}

/** Is `curr` within `corridorM` of the segment start→end? Returns the
 *  cross-track distance alongside the boolean so a caller can log/explain it. */
export function withinCorridor(curr, start, end, corridorM = 25) {
  const xt = crossTrack(curr, start, end);
  if (xt > corridorM) return { inside: false, crossTrackM: xt };

  const segLen = distance(start, end);
  const dStart = distance(curr, start);
  const dEnd = distance(curr, end);
  const margin = segLen + corridorM + 30;
  if (dStart > margin && dEnd > margin) return { inside: false, crossTrackM: xt };
  return { inside: true, crossTrackM: xt };
}

/** A compass-relative direction word for a bearing difference — used to pick
 *  which way the big arrow points without needing a magnetometer reading. */
export function arrowForBearingDiff(diff, signedDiff) {
  if (diff <= 20) return 'STRAIGHT';
  if (diff >= 150) return 'U_TURN';
  if (signedDiff > 0) return diff >= 60 ? 'RIGHT' : 'SLIGHT_RIGHT';
  return diff >= 60 ? 'LEFT' : 'SLIGHT_LEFT';
}

/** Signed bearing difference in (-180, 180]: positive = target is to the
 *  right of current heading, negative = to the left. */
export function signedBearingDiff(headingDeg, targetBearing) {
  let d = targetBearing - headingDeg;
  d = ((d + 180) % 360 + 360) % 360 - 180;
  return d;
}
