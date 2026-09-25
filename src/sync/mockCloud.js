// A LOCAL STAND-IN FOR "THE CLOUD".
//
// Decision on record: the hybrid online/offline UX is real, but the backend
// behind it is not — a real server contradicts the project's own zero-backend
// privacy architecture (docs/06 §4, docs/07: "nothing leaves the phone unless
// the family chooses to send it") and this build has no hosting to stand one
// up on your behalf. So "the cloud" here is a second IndexedDB database on
// the SAME device. Nothing this module does ever reaches a network. The
// caregiver UI says so explicitly (Caregiver.jsx, Sync tab) — this is a
// demonstration of the architecture, not a claim that data has left the phone.
//
// If a real backend is built later, only derived report data should sync —
// never photos, never personal facts — exactly as docs/06 §4 already specs
// for v2. This mock intentionally keeps that door open rather than closed.

const DB = 'mindmitra-cloud-mock';
const STORE = 'kv';
let _p = null;

function open() {
  if (_p) return _p;
  _p = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return _p;
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Simulate pushing the household record to "the cloud" — a fake network
 *  delay, then a write to the mock store. Returns the timestamp synced. */
export async function pushToCloud(state) {
  await delay(600 + Math.random() * 500);
  const snapshot = { ...state, _syncedAt: Date.now() };
  await tx('readwrite', (s) => s.put(snapshot, 'household'));
  return snapshot._syncedAt;
}

export async function pullFromCloud() {
  await delay(400 + Math.random() * 300);
  return tx('readonly', (s) => s.get('household'));
}
