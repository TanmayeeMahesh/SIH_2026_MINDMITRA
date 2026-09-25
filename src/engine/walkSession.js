// WALK SESSION — the corridor/hysteresis safety state machine for Safe Walk.
//
// Rewritten from a teammate's Python prototype (silly-raman/backend/
// navigation_state.py), with two robustness additions pulled from that
// prototype's OWN frontend (navigation.js), which weren't in the Python
// engine: GPS exponential-moving-average smoothing, and a corridor tolerance
// that widens automatically when the phone's own GPS accuracy is poor rather
// than staying fixed. See docs/18 §3 for the full source audit.
//
// This class does not care whether its route came from a caregiver's
// recorded waypoints or a live OSRM call (engine/routing.js) — it only ever
// consumes an ordered list of {lat,lng} points. That's deliberate: one
// safety engine, two route sources.
//
// Stateful by design (it tracks a deviation timer across GPS ticks), so hold
// one instance in a useRef in the screen — same pattern as `misses.current`
// elsewhere in this codebase.

import { distance, bearing, signedBearingDiff, withinCorridor } from './geodesic.js';

const ARRIVAL_RADIUS_M = 15;
const WAYPOINT_ADVANCE_M = 12;
const SOFT_ALERT_SEC = 12;   // off-corridor this long -> one gentle voice prompt to her only
const CRITICAL_ALERT_SEC = 35; // off-corridor this long, OR...
const EXTREME_DIST_M = 75;      // ...this far off-corridor -> caregiver is notified

export class WalkSession {
  constructor(route) {
    this.route = route;
    this.waypointIdx = 0;
    this.smoothedCoord = null;
    this.firstDeviationAt = null;
    this.turnWarnedAt25 = false;
    this.arrived = false;
    this.startedAt = Date.now();
    this.distanceWalkedM = 0;
    this._lastRaw = null;
  }

  /** One GPS tick. Returns a status object; never throws. */
  update({ lat, lng, headingDeg = null, accuracyM = 12, timestampMs = Date.now() }) {
    this.lastHeadingDeg = headingDeg; // surfaced via _status so a caregiver-side view can draw it too
    const raw = { lat, lng };

    // EMA smoothing — a single noisy GPS reading should not read as a lurch.
    this.smoothedCoord = this.smoothedCoord
      ? { lat: this.smoothedCoord.lat * 0.65 + raw.lat * 0.35, lng: this.smoothedCoord.lng * 0.65 + raw.lng * 0.35 }
      : raw;
    if (this._lastRaw) this.distanceWalkedM += distance(this._lastRaw, raw);
    this._lastRaw = raw;

    const here = this.smoothedCoord;
    const dest = this.route.destination;
    const distToDest = distance(here, dest);

    if (distToDest <= ARRIVAL_RADIUS_M) {
      this.arrived = true;
      return this._status('ARRIVED', { distanceToDestM: distToDest, gardenAction: 'DESTINATION_SAFE' });
    }

    const waypoints = this.route.waypoints;
    let target = waypoints[this.waypointIdx];
    let distToTarget = target ? distance(here, target) : distToDest;

    // Advance through waypoints we've effectively reached.
    let justReachedCheckpoint = false;
    while (target && distToTarget <= WAYPOINT_ADVANCE_M && this.waypointIdx < waypoints.length - 1) {
      this.waypointIdx++;
      justReachedCheckpoint = true;
      target = waypoints[this.waypointIdx];
      distToTarget = target ? distance(here, target) : distToDest;
    }

    const prev = this.waypointIdx === 0 ? (this.route.origin || here) : waypoints[this.waypointIdx - 1];
    const corridorM = Math.max(this.route.corridorM || 30, accuracyM + 18); // widen when GPS is noisy
    // crossTrackM is how far she has actually wandered OFF the path — not to
    // be confused with distToTarget, which is just distance to the next
    // waypoint along it and stays large even while perfectly on-course on a
    // long straight segment. Escalation must key off the former.
    const { inside, crossTrackM } = withinCorridor(here, prev, target || dest, corridorM);

    const targetBearing = bearing(here, target || dest);
    const arrowDiff = headingDeg != null ? signedBearingDiff(headingDeg, targetBearing) : 0;

    if (!inside) {
      if (this.firstDeviationAt == null) this.firstDeviationAt = timestampMs;
      const deviatedFor = (timestampMs - this.firstDeviationAt) / 1000;

      if (deviatedFor >= CRITICAL_ALERT_SEC || crossTrackM >= EXTREME_DIST_M) {
        return this._status('CRITICAL_DEVIATION', {
          distanceToDestM: distToDest, targetBearing, arrowDiff,
          alertLevel: 2, deviatedForSec: deviatedFor,
        });
      }
      if (deviatedFor >= SOFT_ALERT_SEC) {
        return this._status('GENTLE_REORIENT', {
          distanceToDestM: distToDest, targetBearing, arrowDiff,
          alertLevel: 1, deviatedForSec: deviatedFor, gardenAction: 'DEVIATION_RESTORE',
        });
      }
      // Inside the forgiveness window — say nothing yet, just keep walking normally.
    } else {
      this.firstDeviationAt = null;
    }

    // Two-stage "turn coming up" cue, de-duplicated per waypoint.
    let turnCue = null;
    if (distToTarget <= 25 && !this.turnWarnedAt25) { this.turnWarnedAt25 = true; turnCue = 'approaching'; }
    else if (distToTarget <= 10 && this.turnWarnedAt25) { turnCue = 'now'; }
    if (justReachedCheckpoint) this.turnWarnedAt25 = false;

    return this._status('NAVIGATING_NORMAL', {
      distanceToDestM: distToDest, distanceToNextM: distToTarget, targetBearing, arrowDiff,
      turnCue, justReachedCheckpoint,
      gardenAction: justReachedCheckpoint ? 'CHECKPOINT_REACHED' : inside ? 'STAY_ON_PATH' : null,
    });
  }

  _status(status, extra) {
    return {
      status,
      here: this.smoothedCoord, // her actual live {lat,lng} — needed by any map view, not just the arrow's angle math
      waypointIdx: this.waypointIdx,
      totalWaypoints: this.route.waypoints.length,
      distanceWalkedM: Math.round(this.distanceWalkedM),
      elapsedMs: Date.now() - this.startedAt,
      headingDeg: this.lastHeadingDeg ?? 0,
      ...extra,
    };
  }
}
