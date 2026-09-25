import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Check, MapPin, MapPinned, Navigation, Plus, Route, Trash2 } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import WalkSchematic from '../components/WalkSchematic.jsx';
import { savePhoto, deletePhoto } from '../store/db.js';
import { uid } from '../store/state.js';
import { distance } from '../engine/geodesic.js';

const PickOnMap = lazy(() => import('../components/PickOnMap.jsx'));

const CATEGORIES = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'temple', label: 'Temple', icon: '🛕' },
  { key: 'mart', label: 'Market', icon: '🛒' },
  { key: 'hospital', label: 'Health centre', icon: '🏥' },
  { key: 'relative', label: "A relative's house", icon: '👨‍👩‍👧' },
  { key: 'park', label: 'Park / lake', icon: '🌳' },
  { key: 'custom', label: 'Somewhere else', icon: '📍' },
];

/** Caregiver console — Safe Walk tab. Add up to a handful of trusted
 *  destinations (name, icon, GPS location), and optionally walk the actual
 *  route to one once so the app has a caregiver-verified path to check her
 *  against offline (engine/routing.js Tier 0). Online mode can route without
 *  this, but the recorded path is what makes the safety net work with zero
 *  signal — which is the case that actually matters most for this app. */
export default function SafeWalkAdmin({ state, update, activeWalk, online }) {
  const places = state.safePlaces || [];
  return (
    <>
      {activeWalk?.active && <LiveStatus walk={activeWalk} />}
      <AddPlace update={update} online={online} />
      <div className="panel">
        <h2>{places.length} safe {places.length === 1 ? 'place' : 'places'}</h2>
        {!places.length && <p className="small">Nothing added yet.</p>}
        <div className="plist">
          {places.map((p) => <PlaceRow key={p.id} place={p} update={update} />)}
        </div>
      </div>
    </>
  );
}

/** A live, read-only window onto the SAME walk session that's driving the
 *  elder's screen — not a separate tracker, not a poll, not a second GPS
 *  watch. Whichever screen you look at reflects one shared state, because
 *  useSafeWalk() lives above both (App.jsx), not inside the elder screen. */
function LiveStatus({ walk }) {
  const s = walk.status;
  const tone = s?.status === 'CRITICAL_DEVIATION' ? 'CRITICAL — she has wandered off the path'
    : s?.status === 'GENTLE_REORIENT' ? 'Off the path — she is being gently guided back'
      : 'On the path';
  return (
    <div className="panel" style={{ borderColor: s?.status === 'CRITICAL_DEVIATION' ? 'var(--negative)' : undefined }}>
      <h2>🚶 Walking now — {walk.place?.name}</h2>
      <p className="small">{tone}</p>
      {s
        ? (
          <WalkSchematic
            headingDeg={s.headingDeg ?? 0}
            targetBearing={s.targetBearing ?? 0}
            distanceM={s.distanceToDestM ?? 0}
            corridorM={30}
            status={s.status}
          />
        )
        : <p className="small">Waiting for the first GPS reading…</p>}
    </div>
  );
}

function AddPlace({ update, online }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('home');
  const [coord, setCoord] = useState(null);
  const [coordSource, setCoordSource] = useState(null); // 'gps' | 'map' — shown back to the caregiver, since accuracy differs
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [radius, setRadius] = useState(30);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) { setError('This device has no location service.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setCoordSource('gps'); setLocating(false); },
      (err) => { setError(`Could not get a location fix: ${err.message}`); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function add() {
    if (!name.trim() || !coord) return;
    const cat = CATEGORIES.find((c) => c.key === category);
    let photoId = null;
    if (file) { photoId = uid(); await savePhoto(photoId, file); }
    update((s) => ({
      ...s,
      safePlaces: [...(s.safePlaces || []), {
        id: uid(), name: name.trim(), category, icon: cat.icon, coord,
        safeRadiusM: radius, photoId, waypoints: [], origin: null, recordedDistanceM: null,
      }],
    }));
    setName(''); setCoord(null); setCoordSource(null); setFile(null);
  }

  return (
    <div className="panel">
      <h2><MapPin size={22} /> Add a safe place</h2>
      <p className="small">
        A place she actually goes — home, the temple, the market. Either stand there and use "my current
        location" for the most accurate spot, or mark it on a map if you're not there right now.
      </p>
      <label htmlFor="swn">What is it called?</label>
      <input id="swn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home" />
      <label htmlFor="swc">What kind of place?</label>
      <select id="swc" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
      </select>
      <label htmlFor="swp">A photo of it (helps her recognise she's arrived)</label>
      <input id="swp" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <label>Location</label>
      {picking ? (
        <Suspense fallback={<p className="small">Loading the map…</p>}>
          <PickOnMap
            onConfirm={(c) => { setCoord(c); setCoordSource('map'); setPicking(false); }}
            onCancel={() => setPicking(false)}
          />
        </Suspense>
      ) : (
        <div className="row" style={{ gap: 10 }}>
          <button className={`btn ${coordSource === 'gps' ? 'ghost' : 'secondary'}`} style={{ flex: 1 }}
            onClick={useCurrentLocation} disabled={locating}>
            <Navigation size={20} /> {locating ? 'Finding you…' : 'Use my current location'}
          </button>
          <button className={`btn ${coordSource === 'map' ? 'ghost' : 'secondary'}`} style={{ flex: 1 }}
            onClick={() => online && setPicking(true)} disabled={!online}
            title={online ? undefined : 'Needs a connection, to load the map'}>
            <MapPinned size={20} /> Pick it on a map
          </button>
        </div>
      )}
      {coord && !picking && (
        <p className="small" style={{ marginTop: 6 }}>
          {coordSource === 'map' ? 'Marked on the map' : 'Location set'} — ({coord.lat.toFixed(5)}, {coord.lng.toFixed(5)})
          {coordSource === 'map' && ' — less exact than standing there, but good enough to get started.'}
        </p>
      )}
      {error && <p className="note" style={{ borderLeftColor: 'var(--negative)' }}>{error}</p>}
      <label htmlFor="swr">How wide is "safely there"? (metres)</label>
      <input id="swr" type="number" min={10} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value) || 30)} />
      <button className="btn primary" style={{ marginTop: 14 }} onClick={add} disabled={!name.trim() || !coord}>
        <Plus size={22} /> Add place
      </button>
    </div>
  );
}

function PlaceRow({ place, update }) {
  const [recording, setRecording] = useState(false);
  const ready = (place.waypoints || []).length > 0;

  function remove() {
    if (place.photoId) deletePhoto(place.photoId);
    update((s) => ({ ...s, safePlaces: s.safePlaces.filter((x) => x.id !== place.id) }));
  }

  return (
    <div>
      <div className="prow">
        <Photo id={place.photoId} name={place.name} className="" alt={place.icon} />
        <div>
          <b>{place.icon} {place.name}</b>
          <div className="small">
            {ready
              ? `Path recorded — ${(place.waypoints || []).length} waypoints, works with no signal`
              : 'No path recorded yet — only works when online'}
          </div>
        </div>
        <button className="iconbtn" onClick={remove} aria-label={`Remove ${place.name}`}><Trash2 size={20} /></button>
      </div>
      {!recording
        ? <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setRecording(true)}>
            <Route size={20} /> {ready ? 'Re-record the path' : 'Record the path there (works offline once saved)'}
          </button>
        : <RecordRoute place={place} update={update} onDone={() => setRecording(false)} />}
    </div>
  );
}

/** Walk it once, tapping "drop a pin" at each turn or landmark. This is the
 *  entire offline-routing story — no OSRM, no downloaded map, just a real
 *  person's real walk, recorded once. */
function RecordRoute({ place, update, onDone }) {
  const [points, setPoints] = useState([]); // {lat,lng,label}
  const [watching, setWatching] = useState(false);
  const [last, setLast] = useState(null);
  const watchId = useRef(null);

  // If the caregiver switches tabs mid-recording without tapping Cancel or
  // Finished, this stops the GPS watch on unmount instead of leaving it
  // running silently in the background.
  useEffect(() => () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); }, []);

  function start() {
    if (!('geolocation' in navigator)) return;
    setWatching(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setLast({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, { enableHighAccuracy: true, maximumAge: 2000 },
    );
  }
  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setWatching(false);
  }
  function dropPin(label) {
    if (!last) return;
    setPoints((p) => [...p, { id: uid(), lat: last.lat, lng: last.lng, label: label || `Point ${p.length + 1}` }]);
  }
  function finish() {
    stop();
    const origin = points[0] || last;
    let dist = 0;
    const all = [origin, ...points, place.coord].filter(Boolean);
    for (let i = 1; i < all.length; i++) dist += distance(all[i - 1], all[i]);
    update((s) => ({
      ...s,
      safePlaces: s.safePlaces.map((p) => p.id !== place.id ? p : {
        ...p, waypoints: points, origin, recordedDistanceM: Math.round(dist),
      }),
    }));
    onDone();
  }

  return (
    <div className="panel" style={{ marginTop: 8, background: 'var(--card)' }}>
      <p className="small">
        Start at home (or wherever the walk begins), and tap "drop a pin" at each turn or clear landmark
        along the way to {place.name}. Finish once you arrive.
      </p>
      {!watching
        ? <button className="btn secondary" onClick={start}><Navigation size={20} /> Start walking</button>
        : (
          <>
            <p className="small">{last ? `Tracking — (${last.lat.toFixed(5)}, ${last.lng.toFixed(5)})` : 'Waiting for a GPS fix…'}</p>
            <button className="btn secondary" onClick={() => dropPin()} disabled={!last}>
              <MapPin size={20} /> Drop a pin here ({points.length} so far)
            </button>
            <button className="btn primary" style={{ marginTop: 10 }} onClick={finish} disabled={!points.length}>
              <Check size={20} /> Finished — arrived at {place.name}
            </button>
          </>
        )}
      <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { stop(); onDone(); }}>Cancel</button>
    </div>
  );
}
