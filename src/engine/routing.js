// ROUTE SOURCING for Safe Walk — deliberately separate from walkSession.js.
//
// The corridor/hysteresis safety engine (walkSession.js) does not care where
// a route came from. It just walks an ordered list of {lat,lng} waypoints and
// checks her live position against each segment. That's what makes the two
// tiers below share one safety engine instead of needing two:
//
//   TIER 0 — fixed route: the caregiver's own recorded waypoints. Zero
//     network, works anywhere, everywhere, always. Not "from anywhere" — it
//     only starts where she recorded it starting. This is the real safety
//     net and it is always available once a place has waypoints.
//
//   TIER 1 — dynamic route: a live call to OSRM's public routing API,
//     computing an actual turn-by-turn street path from her CURRENT position
//     to the destination, same as a real navigation app. Only available
//     online; silently unavailable otherwise — never a hard error, because
//     Tier 0 is there to fall back to.
//
// getRoute() tries Tier 1 first when online, and always has Tier 0 as the
// fallback — so a real connection gets real "from anywhere" routing, and a
// dropped connection mid-village never leaves her with nothing.

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';
// The public OSRM demo server is rate-limited and explicitly NOT meant for
// production load (see https://project-osrm.org/docs/v5.24.0/api/#general-options
// and OSRM's own "Demo server" notice). Fine for a prototype/pilot; a real
// deployment should self-host OSRM (or use a paid routing provider) fed with
// an OpenStreetMap extract for the districts actually being served — a
// realistic engineering task, not a config change.

/** Tier 0 — the caregiver's own recorded path. Available once a place has
 *  waypoints; this is what makes the app work with zero signal.
 *
 *  Deliberately returns null (not a degenerate straight line) when nothing
 *  has been recorded. A first version of this fell back to origin=target=
 *  place.coord, which collapses the corridor to a single point sitting AT
 *  the destination — meaning she'd read as "off corridor" for the entire
 *  walk from wherever she actually starts, right up until she's within a
 *  wide fallback radius of arriving. That's a false alarm, not a safety
 *  net, and it would only ever fire in exactly the situation that matters
 *  most: online routing having just failed. Better to say plainly that
 *  there's no route than to guide her with one that doesn't reflect a real,
 *  caregiver-verified path. */
export function fixedRoute(place) {
  if (!place?.coord) return null;
  const waypoints = (place.waypoints || []).map((w) => ({ lat: w.lat, lng: w.lng, label: w.label }));
  if (!waypoints.length) return null;
  return {
    tier: 'fixed',
    origin: place.origin || waypoints[0],
    waypoints: [...waypoints, { lat: place.coord.lat, lng: place.coord.lng, label: place.name }],
    destination: place.coord,
    corridorM: 30,
    distanceHint: place.recordedDistanceM || null,
  };
}

/** Tier 1 — a live turn-by-turn street route from `origin` to the place,
 *  fetched from OSRM. Returns null (never throws to the caller) on any
 *  failure — offline, timeout, no route found, server error — so the caller
 *  can fall back to fixedRoute() without special-casing the reason. */
export async function dynamicRoute(origin, place, { timeoutMs = 6000 } = {}) {
  if (!origin || !place?.coord) return null;
  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${place.coord.lng},${place.coord.lat}`
    + `?overview=full&geometries=geojson&steps=false`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coords = route.geometry?.coordinates || [];
    if (coords.length < 2) return null;

    // Thin the polyline to a manageable waypoint list — every point is not
    // needed for corridor checking, just enough to keep the "am I still on
    // the street" math segment-by-segment accurate.
    const waypoints = thin(coords, 25).map(([lng, lat]) => ({ lat, lng }));
    waypoints.push({ lat: place.coord.lat, lng: place.coord.lng, label: place.name });

    return {
      tier: 'dynamic',
      origin,
      waypoints,
      destination: place.coord,
      corridorM: 30,
      distanceM: route.distance,
      etaMin: Math.max(2, Math.round(route.duration / 60)),
    };
  } catch {
    return null; // offline, timeout, CORS hiccup, whatever — Tier 0 catches this
  } finally {
    clearTimeout(timer);
  }
}

function thin(coords, maxPoints) {
  if (coords.length <= maxPoints) return coords;
  const step = coords.length / maxPoints;
  const out = [];
  for (let i = 0; i < maxPoints; i++) out.push(coords[Math.floor(i * step)]);
  out.push(coords[coords.length - 1]);
  return out;
}

/**
 * The single entry point a screen should call. Tries live routing first when
 * online and asked for it; always falls back to the caregiver's recorded
 * route. Returns null only if NEITHER exists — nothing to walk at all, which
 * the caller should treat like "add this place properly first."
 */
export async function getRoute({ place, origin, online }) {
  if (online) {
    const dyn = await dynamicRoute(origin, place);
    if (dyn) return dyn;
  }
  return fixedRoute(place);
}

/** Can this place be walked at all right now? */
export function canWalkTo(place, online) {
  if (!place?.coord) return false;
  if ((place.waypoints || []).length > 0) return true; // Tier 0 always works
  return !!online; // no recorded path yet -> only Tier 1 can help
}
