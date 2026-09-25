// Minimal IndexedDB wrapper. No npm dependency on purpose — nothing to install
// before a hackathon, nothing to break. Stores JSON state and photo Blobs.
// Replaces localStorage, which is synchronous, string-only and caps around 5MB;
// it would fail the moment a caregiver adds photos. (docs/06 §2)

const DB = 'mindmitra';
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

export const get = (k) => tx('readonly', (s) => s.get(k));
export const set = (k, v) => tx('readwrite', (s) => s.put(v, k));
export const del = (k) => tx('readwrite', (s) => s.delete(k));
export const clearAll = () => tx('readwrite', (s) => s.clear());

/* ---------- photos ---------- */

const urls = new Map();

/** Downscale to <=512px long edge before storing. Keeps a 10-person corpus in a few MB. */
export async function savePhoto(id, file) {
  const blob = await downscale(file, 512);
  await set('photo:' + id, blob);
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
  return id;
}

export async function photoURL(id) {
  if (!id) return null;
  if (urls.has(id)) return urls.get(id);
  const blob = await get('photo:' + id);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urls.set(id, u);
  return u;
}

export async function deletePhoto(id) {
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
  await del('photo:' + id);
}

function downscale(file, max) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => res(b || file), 'image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => res(file);
    img.src = URL.createObjectURL(file);
  });
}
