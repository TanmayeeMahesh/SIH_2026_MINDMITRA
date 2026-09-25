// Currency for the "Market Day" game (E2, numeracy variant).
//
// These are PHOTOGRAPHS of real Indian notes and coins, because she has to
// recognise the money actually in her hand — a stylised token teaches nothing
// useful about the ₹50 note she is holding at the market.
//
// LICENSING, honestly stated (full table in public/content/currency/ATTRIBUTION.md):
// the note images and the ₹1 coin are RBI's own published images under the
// Government Open Data License – India; the ₹2/₹5/₹10 coin photographs are
// CC BY-SA 4.0 and carry share-alike obligations. In every case the licence
// covers the PHOTOGRAPH — the underlying note and coin designs remain Reserve
// Bank of India / Government of India copyright. Several note images carry an
// RBI "SPECIMEN" overprint, which is if anything the safer form to display.
// Anyone shipping this commercially should clear their own imagery or simply
// photograph their own notes.

import manifest from './packs/currency-manifest.json';

// Placeholder tint shown behind a photo while it loads, and the fallback if a
// file is ever missing. Roughly keyed to each denomination's real colour.
const TINTS = { 1: '#B0B0AE', 2: '#A8A8A6', 5: '#B79A6B', 10: '#B77952', 20: '#C9A34F', 50: '#8FA17A', 100: '#6F6FA1', 500: '#8A8F98' };

/** One entry per VALUE. The pack contains both a ₹10 coin and a ₹10 note;
 *  the counting logic keys on value, so exactly one representation per value
 *  is kept (the note, being the one she is far more likely to be handed). */
export const DENOMINATIONS = (() => {
  const byValue = new Map();
  for (const d of manifest.denominations || []) {
    const existing = byValue.get(d.value);
    if (existing && existing.kind === 'note') continue; // note already wins
    byValue.set(d.value, d);
  }
  return [...byValue.values()]
    .sort((a, b) => a.value - b.value)
    .map((d) => ({
      value: d.value,
      kind: d.kind,
      src: `/content/currency/${d.file}`,
      bg: TINTS[d.value] || '#6F3D35',
    }));
})();

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

/** Greedy breakdown of `amount` into our denomination set. Always solvable —
 *  the set includes a ₹1 coin, so there is never an unreachable target. */
export function greedyBreakdown(amount) {
  let remaining = amount;
  const counts = {};
  for (const d of [...DENOMINATIONS].sort((a, b) => b.value - a.value)) {
    const c = Math.floor(remaining / d.value);
    if (c > 0) { counts[d.value] = c; remaining -= c * d.value; }
  }
  return counts;
}

/**
 * Build a tray for one round: the denominations actually needed to make
 * `amount` (the reference solution), padded with a few plausible extras up to
 * `trayCount` distinct kinds so it isn't simply "tap everything you see."
 */
export function makeMoneyTray(amount, trayCount) {
  const solution = greedyBreakdown(amount);
  const solutionValues = Object.keys(solution).map(Number);
  const candidates = DENOMINATIONS.filter((d) => d.value <= amount && !solutionValues.includes(d.value)).map((d) => d.value);
  const extra = shuffle(candidates).slice(0, Math.max(0, trayCount - solutionValues.length));
  const trayValues = shuffle([...solutionValues, ...extra]);
  return trayValues.map((v) => DENOMINATIONS.find((d) => d.value === v)).filter(Boolean);
}

/** Small random jitter on a base amount, always non-negative and always
 *  exactly representable (every value is). Keeps repeated rounds fresh. */
export function jitterAmount(base) {
  const bumps = [0, 5, 10, -5, 15].filter((b) => base + b > 0);
  return base + bumps[Math.floor(Math.random() * bumps.length)];
}
