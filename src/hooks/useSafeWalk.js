import { useEffect, useRef, useState } from 'react';
import { getRoute, canWalkTo as canWalkToPlace } from '../engine/routing.js';
import { WalkSession } from '../engine/walkSession.js';
import { awardPoints } from '../engine/garden.js';
import { uid } from '../store/state.js';
import { play, synth } from '../audio/speak.js';
import { chimeSuccess, chimeAlert } from '../audio/chime.js';
import { useCompassHeading } from './useCompassHeading.js';

/**
 * Owns the entire live-walk lifecycle at the APP root — NOT inside the Safe
 * Walk screen itself.
 *
 * Why this matters: Caregiver mode and the elder-facing screens are mutually
 * exclusive in App.jsx (switching to one unmounts the other). If the walk's
 * GPS watch lived inside the Safe Walk screen component, tapping into
 * Caregiver mode mid-walk would unmount it and silently kill the tracking —
 * "checking on her while she's walking" wouldn't actually work, even on the
 * same phone. Calling this hook once at the App root means the walk keeps
 * running no matter which screen is currently being looked at; Caregiver
 * mode just gets a read-only window onto the same live session.
 *
 * (This is a same-device guarantee, not a two-device one — see docs/18 open
 * question 1 / the online-mode conversation. A second physical device
 * checking in from elsewhere still needs a real backend, which was
 * deliberately not built.)
 */
export function useSafeWalk(update, online) {
  const [phase, setPhase] = useState('pick'); // pick | locating | walking | arrived | blocked
  const [place, setPlace] = useState(null);
  const [route, setRoute] = useState(null); // exposed so a map view can draw the actual path
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const sessionRef = useRef(null);
  const watchId = useRef(null);
  const warnedSoftRef = useRef(false);
  const warnedCritRef = useRef(false);
  const startedAtRef = useRef(0);
  // Long-lived callbacks (watchPosition) keep whatever closure they captured
  // at registration time, from BEFORE a setState of the same tick has taken
  // effect — reading `place` state directly in here would read stale/null.
  // Refs sidestep that; see docs/18 audit note on this exact bug.
  const placeRef = useRef(null);
  const cancelledRef = useRef(false);

  // Real compass heading (magnetometer), not GPS "course over ground" — see
  // useCompassHeading.js for exactly why that distinction is the whole bug.
  const compass = useCompassHeading();
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current = compass.heading; }, [compass.heading]);

  function stopWatch() {
    if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
  }

  useEffect(() => () => stopWatch(), []);

  async function choose(p) {
    cancelledRef.current = false;
    placeRef.current = p;
    setPlace(p); setError(''); setPhase('locating');
    play('walk.locating', 'Finding where you are.');
    compass.requestPermission(); // must fire inside this tap's call stack for iOS

    if (!('geolocation' in navigator)) { setError('This phone has no location service.'); setPhase('blocked'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelledRef.current) return;
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const r = await getRoute({ place: p, origin, online });
        if (cancelledRef.current) return;
        if (!r) {
          setError('There is no saved path to this place yet, and no connection to find one live.');
          setPhase('blocked');
          return;
        }
        sessionRef.current = new WalkSession(r);
        setRoute(r);
        startedAtRef.current = Date.now();
        warnedSoftRef.current = false; warnedCritRef.current = false;
        setPhase('walking');
        update((s) => ({ ...s, garden: { points: awardPoints(s.garden?.points ?? 40, 'START_JOURNEY') } }));
        play('walk.start', `Let's walk to ${p.name}. Follow the arrow.`);
        watchId.current = navigator.geolocation.watchPosition(onPosition, () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
      },
      () => { setError('Could not get your location. Please check location permission is on.'); setPhase('blocked'); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function onPosition(pos) {
    if (!sessionRef.current) return;
    // Prefer the live compass reading; GPS course is the fallback for a
    // device with no magnetometer, and only meaningful once actually moving.
    const headingDeg = headingRef.current ?? pos.coords.heading;
    const s = sessionRef.current.update({
      lat: pos.coords.latitude, lng: pos.coords.longitude,
      headingDeg, accuracyM: pos.coords.accuracy || 15,
    });
    setStatus(s);

    if (s.gardenAction) {
      update((st) => ({ ...st, garden: { points: awardPoints(st.garden?.points ?? 40, s.gardenAction) } }));
    }
    if (s.justReachedCheckpoint) chimeSuccess();
    if (s.turnCue === 'approaching') synth('Soon, follow the arrow to turn.');
    if (s.status === 'GENTLE_REORIENT' && !warnedSoftRef.current) {
      warnedSoftRef.current = true;
      play('walk.reorient', "Let's turn gently and find the path again.");
    }
    if (s.status === 'NAVIGATING_NORMAL') { warnedSoftRef.current = false; }
    if (s.status === 'CRITICAL_DEVIATION' && !warnedCritRef.current) {
      warnedCritRef.current = true;
      chimeAlert();
      play('walk.pause', "Let's stop here for a moment and rest. Someone will help you.");
      logAlert('CRITICAL', s);
    }
    if (s.status === 'ARRIVED') {
      stopWatch();
      chimeSuccess();
      finishWalk(true);
    }
  }

  function logAlert(level, s) {
    const p = placeRef.current;
    update((st) => ({
      ...st,
      walks: [...(st.walks || []), {
        id: uid(), ts: Date.now(), placeId: p?.id, placeName: p?.name,
        status: level, durationMs: Date.now() - startedAtRef.current,
        pointsEarned: 0, deviatedForSec: s.deviatedForSec, alertOnly: true,
      }],
    }));
  }

  function finishWalk(arrived) {
    const s = sessionRef.current;
    const p = placeRef.current;
    update((st) => ({
      ...st,
      walks: [...(st.walks || []), {
        id: uid(), ts: Date.now(), placeId: p?.id, placeName: p?.name,
        status: arrived ? 'ARRIVED' : 'ENDED', durationMs: Date.now() - startedAtRef.current,
        distanceWalkedM: s?.distanceWalkedM || 0,
      }],
    }));
    sessionRef.current = null;
    setPhase('arrived');
    play('walk.arrived', `Wonderful. You are safely at ${p?.name}.`);
  }

  function sos() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    chimeAlert();
    play('walk.sos', 'Help is on the way. Please stay right where you are.');
    if (sessionRef.current) logAlert('SOS', sessionRef.current._status('SOS', {}));
  }

  function cancel() {
    cancelledRef.current = true;
    stopWatch();
    if (sessionRef.current) finishWalk(false);
    else { setPhase('pick'); setPlace(null); setRoute(null); }
  }

  /** Back to the destination list — used after "arrived"/"blocked", and when
   *  re-entering the Safe Walk screen fresh after a previous walk finished. */
  function reset() {
    setPhase('pick'); setPlace(null); setRoute(null); setStatus(null); setError('');
  }

  return {
    phase, place, route, status, error,
    active: phase === 'walking', // true whenever a real walk is in progress, on ANY screen
    compassSupported: compass.supported,
    choose, cancel, sos, reset,
    canWalkTo: (p) => canWalkToPlace(p, online),
  };
}
