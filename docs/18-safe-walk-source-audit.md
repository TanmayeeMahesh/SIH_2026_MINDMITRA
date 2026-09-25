# 18 — Safe Walk: Line-by-Line Audit of `silly-raman/`

Owner: ML/Eng · Status: reference document, not a pitch doc

A teammate built a full offline-navigation-and-garden prototype (`mindmitra/silly-raman/`) independently — Python/FastAPI backend, vanilla-JS frontend, Leaflet map, Three.js AR. This document is the line-by-line read of it: what's genuinely good, what's copy-paste-portable, and what doesn't fit this app's architecture and why. Read this before writing any Safe Walk code, so nothing good gets reinvented and nothing broken gets ported by accident.

Total: ~1,200 lines backend (Python) + ~4,900 lines frontend (vanilla JS/CSS/HTML) + `three.min.js` vendored.

---

## 1. The verdict, up front

**Port faithfully:** the geodesic math, the garden points/stage engine, the temporal hysteresis concept, GPS EMA smoothing, the two-stage turn-warning pattern, the Web-Audio chime synthesis, the camera-permission handling, the canvas garden renderer's animation techniques (sparkles, butterflies, sine bounce).

**Do not port:** FastAPI/SQLite/WebSocket (a real backend — reversed by the single-device decision), OSRM live routing (external network call, and its "offline fallback" is hard-coded to one Bangalore neighbourhood), Leaflet + hotlinked Google/OSM tiles (a real map is a real dependency, and the Google tile URL used here isn't an authorised access path — see §5), the full Three.js AR spatial engine (real code, real effort, but it is not doing what it looks like it's doing — see §4).

---

## 2. Backend — `backend/*.py` (already fully read in an earlier pass, summarised here for completeness)

| File | Lines | What it is | Verdict |
|---|---|---|---|
| `models.py` | 115 | Pydantic data shapes: `Coordinates`, `SafeLocation`, `Waypoint`, `Route`, `PatientTelemetry`, `GardenState`, `DeviationAlert`, `LandmarkStamp`, `JourneyPostcard`, `NavigationUpdateResponse` | **Port the shapes as JS object conventions.** Clean, no framework logic. |
| `geodesic_engine.py` | 114 | Haversine distance, initial bearing, bearing difference, cross-track distance, corridor check | **Ported verbatim** → `mindmitra/src/engine/geodesic.js` (done). Standard great-circle nav math. |
| `garden_engine.py` | 119 | Points table, stage thresholds (0/100/300/600), 3×3 grid-of-tile-types generator, event text per action | **Ported** → `mindmitra/src/engine/garden.js` (done), with emoji stripped per this project's own no-emoji convention for anything meant to carry information — see `docs/17` and the Sequence-engine rework. |
| `routing_service.py` | 297 | Calls OSRM (`router.project-osrm.org`) for real street polylines; falls back to **hand-typed lat/lngs for one specific walk near a specific PG in Hunasamaranahalli, Bangalore** | **Do not port.** The OSRM call is a live external dependency; the "offline fallback" is not general-purpose offline routing, it's one team member's commute. Superseded by the caregiver-places-waypoints decision. |
| `database.py` | 250 | SQLite schema + CRUD for safe locations/routes/alerts; seeds the four Bangalore demo locations on first run | **Do not port** (no backend at all now) — but the seeded-demo-data *pattern* (ship four named example places so the app isn't empty on first launch) is worth keeping, reworked as NER-appropriate examples if we want a cold-start demo. |
| `navigation_state.py` | 277 | The actual state machine: per-waypoint arrival check (≤15m), corridor + bearing deviation check, **temporal hysteresis** (12s → soft voice reorient, 35s or 75m → critical caregiver escalation), stamp unlocking, postcard generation | **Rewrite as a JS class**, same thresholds, reacting to `watchPosition` instead of an HTTP request/response cycle. This is the best-designed file in the repo — see §3. |
| `main.py` | 300 | FastAPI routes + WebSocket broadcast to caregiver dashboards | **Do not port at all.** This is the whole "two devices, real backend" architecture we've already decided against. |

---

## 3. The hysteresis design — why it's worth keeping exactly

```
0–12s off-corridor   → ignored (GPS jitter, she stopped to look at something)
12–35s off-corridor  → ONE gentle voice prompt to her, nothing to the caregiver
35s+ OR 75m+         → critical: caregiver notified, she gets a "let's pause" prompt
```

This is the same principle as this app's own cue ladder (don't react to the first miss, escalate gradually, never alarm on noise) applied to a GPS stream instead of a quiz answer. It deserved to be designed once and it was designed well. Keep the numbers as-is unless field testing says otherwise.

**One addition worth taking from the *frontend's own* parallel implementation** (`navigation.js`, `UserRouteGeofenceMonitor` — a second, simpler hysteresis the frontend runs independently of the backend's time-based one): the corridor tolerance there is **dynamic**, not fixed:

```js
const maxAllowedDeviation = Math.max(35.0, gpsAccuracy + 18.0);
```

i.e. when the phone's own GPS accuracy is poor, the corridor widens so bad GPS doesn't get mistaken for wandering. The backend engine uses a fixed `corridor_radius_m` and doesn't do this. **Worth adding to our port** — cheap, and it's a real robustness improvement over what the backend alone does.

Also worth taking: **GPS smoothing.**
```js
this.currentCoord = {
  latitude:  this.currentCoord.latitude  * 0.65 + rawLat * 0.35,
  longitude: this.currentCoord.longitude * 0.65 + rawLng * 0.35
};
```
A simple exponential moving average on raw `watchPosition` readings before they ever reach the corridor check. Neither engine file has this; it's implicit in `navigation.js`. Cheap, real, worth keeping.

And the **two-stage turn announcement** pattern, with a de-dupe flag so it doesn't repeat every GPS tick:
```
distance ≤ 25m, not yet warned  → "In 25 metres, turn right." (once)
distance ≤ 10m, was warned      → "Turn right now." (once)
```

---

## 4. The "AR" — what it actually is, precisely

This matters because of the ARCore question. Read `ar_spatial_engine.js` (654 lines) and `navigation.js` line 585 (`// 5. INITIALIZATION OF ARCORE / THREE.JS 3D ENGINE`) closely: **there is no ARCore anywhere in this codebase.** The comment name is aspirational/misleading. What's actually built:

1. Three.js WebGL scene, transparent background, `<video>` camera feed sitting *behind* the canvas in plain HTML/CSS (not composited by WebGL — it's a z-index trick).
2. `DeviceOrientationEvent` → compass heading → rotates the Three.js **camera** (not the arrows) to match which way the phone is pointing.
3. GPS coordinates ahead on the route are converted to local flat "East-North-Up" metres via `gpsToENU()` — a tangent-plane approximation (`Δlon·cos(lat₀)·R`, `Δlat·R`) — and placed as billboard sprites in 3D space at fixed walking distances (3.5m, 8.5m, 16m, 26m, 38m ahead).
4. The arrow sprite images themselves are drawn procedurally on a `<canvas>` (a glossy blue arrow, hand-coded bezier path + gradient) or loaded from a reference PNG.

**What this is NOT doing:** any visual SLAM, feature tracking, plane detection, or camera-image analysis of any kind. The camera feed is pure decoration — arrows are positioned by GPS + compass math alone, with zero connection to what the camera actually sees. This means arrow position accuracy is bounded by **raw phone GPS (±5–15m typical) and raw magnetometer heading (can drift 10–30° near metal or indoors)** — exactly the same accuracy a flat 2D arrow drawn on top of the camera feed would have. The 3D rendering is real visual polish; it is not real positional accuracy.

**This directly answers the ARCore question.** Google's ARCore *Geospatial API* is the technology that would actually improve on this — it localizes the phone against Google's Visual Positioning Service (Street View imagery) to get building-level accuracy instead of raw-GPS accuracy. But:
- It requires **VPS coverage of the specific location**, which is essentially certain not to exist for a rural Assamese/NER village (VPS coverage tracks Street View coverage, which is a dense-urban product).
- It is a **native Android/iOS SDK, not a web API** — using it means leaving the PWA for a Capacitor plugin, a materially bigger architecture change than anything else in this feature.
- It has **Google Cloud billing** attached beyond a free tier, a recurring external cost this project's whole cost pitch (docs/14, "marginal cost ≈ ₹0") argues against taking on.

**Recommendation: don't build against ARCore.** Where there's no VPS coverage, it silently falls back to the same GPS+compass accuracy this teammate's code already gets for free, offline, with no API key and no native build step. Building the simplified 2D arrow (our earlier decision) gives up *rendering polish*, not *positional accuracy* — there was no extra accuracy to give up.

**What's genuinely worth reusing from this file regardless:** the `gpsToENU()` tangent-plane projection is a clean, tiny, dependency-free technique — 5 lines — and the `DeviceOrientationEvent.requestPermission()` gate for iOS 13+ is required boilerplate either way.

---

## 5. Maps — Leaflet + hotlinked tiles

Both `navigation.js` (elder-side satellite view) and `caregiver.js` (caregiver dashboard) initialise Leaflet against:
```
https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}   ← Google's internal tile endpoint, not the Maps JS API
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png   ← OSM's public tile server
```
Directly hotlinking Google's `mt1.google.com` tile pattern (rather than going through the billed Google Maps JavaScript API) is a common hobbyist technique but isn't an authorised access path — Google can and does block it without notice, and it isn't something to build a real feature on. **OpenStreetMap's own tile server has an explicit [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) that prohibits bulk/automated downloading for offline caching** — which is directly relevant to the "download the map for offline use" idea, since that's exactly the bulk-download pattern their policy exists to stop. A live map fetched tile-by-tile as a caregiver pans around (normal browsing) is fine under their policy; pre-fetching and storing a whole region for offline reuse is not, on the free public server.

This doesn't kill the offline-map idea — it means the free public tile server isn't the way to do it. Options if a real map (not the SVG schematic) is wanted:
1. A tile provider whose terms explicitly allow offline caching for an app (e.g. MapTiler, Stadia Maps — both have a free tier designed for exactly this, with an API key and attribution).
2. Skip real map imagery entirely; use the SVG schematic (dot + bearing line + safe-zone circle + metres) for both online and offline caregiver views. Zero dependency, zero ToS question, less visually rich.

I'd raised the schematic as my working assumption before reading this in detail; now that I've confirmed the free-tile-server route is specifically against policy, I lean more strongly toward it. Your call — I can pursue MapTiler's free tier if you'd rather have a real map.

---

## 6. Frontend modules — the rest

| File | Lines | What it is | Verdict |
|---|---|---|---|
| `camera.js` | 241 | `getUserMedia` with a 3-tier fallback (ideal rear cam → any rear cam → any cam), mobile-autoplay-policy handling (gesture-triggered resume, a 1.2s health-check interval that quietly restarts a paused stream) | **Genuinely solid, reusable if we build the simplified AR mode.** This is the boring, correct way to handle mobile camera permissions and autoplay quirks — no reason to rewrite it from scratch. |
| `voice.js` | 350 | TTS via `speechSynthesis` with a persona (rate/pitch presets), **continuous hands-free STT** via `webkitSpeechRecognition` with auto-restart, keyword-based command parsing, and a **Web Audio oscillator chime** (no audio file — a synthesised ascending arpeggio for success, descending tone for alert) | Mixed. The **chime-via-oscillator technique is worth extracting outright** — zero-asset, offline, a nice complement to this app's pre-rendered-speech-clip philosophy. The always-on hands-free mic is a real design choice this app should make deliberately, not inherit by accident (privacy: an always-listening mic is a bigger claim than anything in docs/07). The "multilingual" voice **input** claim is thinner than it sounds — `processVoiceCommand()`'s keyword lists are English + Hindi-transliteration only (`"ghar"`, `"kaha hu"`, `"rok do"`); the 5-language `translations` object only covers fixed **output** phrases. Consistent with this project's own honesty about ASR limits (docs/06 §5: "voice input is always additive, tap always works") — don't let this feature's marketing outrun what it does. |
| `caregiver.js` | 364 | Leaflet dashboard: live patient marker (colour-coded by alert status), safe-place markers + geofence circles, click-map-to-set-coordinates for adding a place, alert feed, WebSocket handler with 3s auto-reconnect | **UX patterns worth keeping** (click-to-set-coordinates, colour-coded live status, an alert feed list) even though the transport (WebSocket) and the map (Leaflet+hotlinked tiles) aren't being ported. Rebuild these interactions against the SVG schematic and the single-device state. |
| `garden.js` (frontend) | 223 | **Pure Canvas2D renderer**, no Three.js — sky-gradient background keyed to stage level, isometric soil-mound ellipses, emoji-rendered flora with a per-tile sine-wave bounce, physically-simulated bouncing butterflies (level 3+), and a radial sparkle-particle burst fired whenever points increase | **The best single file to reuse the *technique* from**, not the emoji. Sparkle-on-reward, gentle idle bounce, and the bounded-random butterfly physics are all cheap, charming, and dependency-free. Reimplement with the same animation math, illustrated tiles instead of `ctx.fillText('🌱', …)`. |
| `stamps.js` | 151 | A "landmark passport" — one collectible stamp per waypoint, locked/unlocked grid, single-fire-guaranteed unlock popup (`Set` of already-unlocked IDs), a one-time "journey postcard" summary modal at the end of a walk | **Not in current scope, but genuinely good and cheap to add later.** The single-fire guarantee pattern (a `Set`, checked before ever celebrating) is the right way to avoid a popup re-firing on a stray re-render — worth copying if/when stamps get built. Flagging as an option, not building it now. |
| `api.js` | 115 | Fetch wrappers + WebSocket-with-reconnect | **Not portable** — this is the two-device/backend architecture in miniature. No equivalent needed once there's no backend. |

---

## 7. Net list of what to actually carry into the JS port

- [x] `engine/geodesic.js` — done
- [x] `engine/garden.js` — done (tile types instead of emoji)
- [ ] `engine/walkSession.js` — hysteresis state machine, **plus** the dynamic corridor-by-GPS-accuracy formula and the GPS EMA smoothing pulled in from `navigation.js` (neither is in the Python engine alone)
- [ ] Two-stage turn-warning voice cue (25m / 10m, de-duped) — small, goes in the elder screen
- [ ] Web Audio chime synthesis (success/alert tones, no asset) — small utility, useful beyond Safe Walk too
- [ ] Camera permission/autoplay handling from `camera.js` — only if/when the simplified AR mode is built
- [ ] `gpsToENU()` tangent-plane projection — only if the simplified AR mode ends up wanting any spatial placement math (a flat 2D compass-rotated arrow may not even need it)
- [ ] Garden Canvas animation techniques (sparkle burst, butterfly physics, idle bounce) — illustrated, not emoji
- [ ] Caregiver UX patterns (click-to-set-coordinates, colour-coded status, alert feed) — rebuilt against the SVG schematic, no Leaflet

---

## Open questions for the caregiver/product call

1. ~~Offline map tiles~~ — **decided.** No third-party tile provider (MapTiler etc.) was brought in. The elder's own screen never needed a map at all — it's one big arrow (`components/BigArrow.jsx`), not a map view. The SVG schematic (`components/WalkSchematic.jsx`) is used only for the caregiver's live-status view, in both online and offline modes, with zero tile dependency. Online mode's actual difference is routing (OSRM gets a real street path when connected), not map imagery.
2. ~~Always-on hands-free voice~~ — **decided by omission.** Nothing resembling `voice.js`'s continuous `webkitSpeechRecognition` loop was built. Safe Walk is voice-**out** only (spoken prompts via the existing `audio/speak.js`), same one-directional pattern as the rest of the app. No always-listening mic anywhere in this feature.
3. **Cross-device caregiver dashboard** — **decided: out of this milestone, named as a roadmap item in the deck instead.** What's built is same-device: a `useSafeWalk()` hook lives at the app root (`src/hooks/useSafeWalk.js`) so Caregiver mode and the elder's screen are two views onto one live session on the same phone — switching screens doesn't kill the GPS watch. A *second, separate* device (e.g. a caregiver's own phone/laptop watching a walk on the elder's phone from elsewhere) would need a real backend syncing between devices, which was deliberately not built for the reasons already on record against a backend generally (docs/06 §4, docs/07). Worth a slide, not a sprint.
4. **Stamps/postcard** — genuinely good, cheap, single-fire-safe gamification layer from `stamps.js`. Not built. Worth a yes/no once the core walk has had real device testing.
