import { useCallback, useEffect, useRef, useState } from 'react';
import * as db from './db.js';
import { coldStart } from '../engine/elo.js';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const EMPTY = {
  version: 1,
  onboarded: false,
  profile: {
    preferredName: '', language: 'en', community: 'generic',
    education: 'none', independence: 'partial', usedTouchscreen: false,
    caregiverName: '', caregiverRole: '', consentAt: null, assentConfirmed: false,
    dailyMinutesLimit: 20, // 0 = no limit. Soft cap only — never a visible timer (docs/04 §5).
    textScale: 1,          // 1 | 1.15 | 1.3 — set by the elder on her own Profile screen
    // 'online' | 'offline'. One app, one build; this switches whether the
    // online-only extras (sync, pack updates) are available at all. Being
    // "online" still requires an actual connection — the switch can only ever
    // turn features OFF, never pretend a network exists.
    mode: 'online',
  },
  // ---- THE CORPUS: everything games are generated from. See engine/corpus.js.
  // Widening this is the cheapest way to add content — one new entry here
  // produces new questions in every engine, with no new game code.
  people: [],    // { id, name, relationKey, photoId, living, group }
  things: [],    // { id, name, kind:'object'|'place', photoId, group }
  routines: [],  // { id, name, steps:[{ id, label, photoId? }] }
  medicines: [], // { id, label, time:'HH:MM', log:{ [dateKey]: true } }

  ability: {},   // { [gameId]: { [dim]: theta } }
  sessions: [],
  chat: [],
  sync: { lastSyncedAt: null }, // simulated cloud push — see sync/mockCloud.js

  // Safe Walk — see engine/geodesic.js, engine/garden.js, engine/walkSession.js
  safePlaces: [], // { id, name, category, icon, coord:{lat,lng}, safeRadiusM, waypoints:[{id,lat,lng,label}], landmarkCue }
  garden: { points: 40 }, // "a seed already sown" — never starts at zero (docs-style positive default)
  walks: [],      // completed/abandoned walk log: { id, ts, placeId, placeName, status, durationMs, pointsEarned, deviations, demo? }
};

const KEY = 'state';

export function useStore() {
  const [state, setState] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const saving = useRef(null);

  useEffect(() => {
    db.get(KEY).then((s) => { if (s) setState({ ...EMPTY, ...s }); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    clearTimeout(saving.current);
    saving.current = setTimeout(() => { db.set(KEY, state).catch(() => {}); }, 250);
  }, [state, ready]);

  const update = useCallback((fn) => setState((s) => fn(s)), []);

  return { state, setState, update, ready };
}

/* ---------- derived helpers ---------- */

export function abilityFor(state, gameId, dims) {
  const stored = state.ability?.[gameId] || {};
  const base = coldStart(state.profile || {});
  const out = {};
  for (const k of Object.keys(dims)) out[k] = stored[k] ?? base;
  return out;
}

export function recentSessions(state, gameId, n = 5) {
  return (state.sessions || []).filter((s) => s.game === gameId).slice(-n);
}

export function bestRecentLevel(state, gameId, dim, days = 14) {
  const since = Date.now() - days * 864e5;
  const levels = (state.sessions || [])
    .filter((s) => s.game === gameId && s.ts >= since && s.settings?.[dim])
    .filter((s) => (s.accuracy ?? 0) >= 0.6)
    .map((s) => s.settings[dim].level);
  return levels.length ? Math.max(...levels) : null;
}

export function sessionCountToday(state) {
  const d = new Date().toDateString();
  return (state.sessions || []).filter((s) => new Date(s.ts).toDateString() === d).length;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

/** Total minutes played today, real sessions only — used by the soft
 *  screen-time cap. Never shown to the elder as a countdown (docs/04 §5). */
export function minutesPlayedToday(state) {
  const d = new Date().toDateString();
  const ms = (state.sessions || [])
    .filter((s) => !s.demo && new Date(s.ts).toDateString() === d)
    .reduce((a, s) => a + (s.durationMs || 0), 0);
  return Math.round(ms / 60000);
}

/** true once today's caregiver-set daily budget has been used up. limit 0 = off. */
export function screenTimeReached(state) {
  const limit = state.profile?.dailyMinutesLimit || 0;
  return limit > 0 && minutesPlayedToday(state) >= limit;
}

export function medicineDoneToday(m) {
  return !!m.log?.[todayKey()];
}

export function markMedicineDone(update, id) {
  update((s) => ({
    ...s,
    medicines: s.medicines.map((m) => m.id === id
      ? { ...m, log: { ...m.log, [todayKey()]: Date.now() } }
      : m),
  }));
}

/** Medicines due (time has passed) and not yet marked done today. */
export function dueMedicines(state) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (state.medicines || []).filter((m) => {
    if (medicineDoneToday(m)) return false;
    const [h, min] = (m.time || '00:00').split(':').map(Number);
    return h * 60 + min <= nowMinutes;
  });
}

export function totals(state) {
  const s = state.sessions || [];
  const items = s.reduce((a, x) => a + (x.items?.length || 0), 0);
  const mins = Math.round(s.reduce((a, x) => a + (x.durationMs || 0), 0) / 60000);
  const acc = s.length ? s.reduce((a, x) => a + (x.accuracy || 0), 0) / s.length : 0;
  return { sessions: s.length, items, mins, accuracy: acc };
}

/** Seed a fortnight of plausible history so the report and trends have something
 *  to show in a demo. Explicitly labelled so it can never be mistaken for real data. */
export function seedHistory(state) {
  const out = [];
  for (let d = 13; d >= 0; d--) {
    if (d % 3 === 2) continue; // some missed days — honest, not a perfect streak
    const ts = Date.now() - d * 864e5;
    const drift = (13 - d) / 13;
    const accuracy = Math.max(0.45, Math.min(0.95, 0.86 - drift * 0.18 + (Math.random() - 0.5) * 0.1));
    out.push({
      id: uid(), ts, game: d % 2 ? 'memorymatch' : 'familytree',
      accuracy, durationMs: 240000 + Math.random() * 180000, demo: true,
      items: Array.from({ length: 6 }, () => ({ correct: Math.random() < accuracy, cueLevel: 0, latencyMs: 5000 })),
      settings: { options: { level: 1, value: 4, label: 'Choices on screen', text: '4 cards' } },
      actions: [],
    });
  }
  return { ...state, sessions: [...out, ...(state.sessions || [])] };
}

export async function wipeEverything(people) {
  for (const p of people || []) if (p.photoId) await db.deletePhoto(p.photoId).catch(() => {});
  await db.clearAll();
}
