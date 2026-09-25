// FUZZY LOGIC — a second, independent advisor that runs alongside the L3
// Q-table, not a replacement for it.
//
// Why this exists and why it is shaped this way: the DDA literature review we
// build on (Information 17(1):96, 2026, doi:10.3390/info17010096) surveyed 75
// papers and found pure rule-based/fuzzy systems adapt slightly WORSE than
// reinforcement learning ("ML-based approaches still yield slightly better
// results... due to the limited adaptability of predefined rules and
// heuristics"). So fuzzy logic does not get to make the decision alone here.
//
// But the same review flags one place fuzzy logic earns its keep: Damastuti et
// al. combined fuzzy logic with RL specifically "to control the inherent
// uncertainty and unpredictability in player behavior" and calls it a
// "successful combination." A person with dementia is exactly that kind of
// noisy signal — 61% correct one day, 59% the next, is not a real change, but
// the Q-table's hard bucket cutoffs (policy.js bucketAccuracy etc.) treat a
// 1-point difference across a boundary as a different state. Fuzzy membership
// functions have no hard boundary, so they do not manufacture false swings
// out of noise.
//
// So the division of labour is: Q-table proposes the primary action (it is
// the better learner). Fuzzy logic proposes a second, independent action from
// the same raw numbers using soft boundaries. Where they agree, we act with
// confidence. Where they disagree, L0's own ethos applies one level up: take
// whichever action is SAFER, never the more aggressive one. See reconcile()
// in policy.js.

/* ---------------------------------------------------- membership functions */

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Trapezoid: 0 below a, ramps to 1 between a-b, flat 1 between b-c, ramps to 0 c-d.
 *
 *  The endpoint handling matters more than it looks. An earlier version used
 *  `x <= a || x >= d -> 0`, which meant a SHOULDER set evaluated to zero at
 *  exactly its own plateau edge: "cue dependency none" was 0 at avgCue === 0,
 *  and "accuracy high" was 0 at accuracy === 1.0. Those are the two most
 *  common values in a good session, so no rule fired and the fuzzy advisor
 *  silently abstained exactly when the answer was most obvious. Vertical edges
 *  (a === b, or c === d) are now handled explicitly. */
function trap(x, a, b, c, d) {
  if (x < a || x > d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return b === a ? 1 : (x - a) / (b - a);
  return d === c ? 1 : (d - x) / (d - c);
}
/** Triangle: 0 below a, peak 1 at b, 0 above c. */
function tri(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
}

/** Accuracy is on 0..1. Same three linguistic bands the Q-table's rule
 *  fallback uses (docs/06 FLOW_BAND = 0.75-0.90), but soft-edged. */
export function accuracyMemberships(a) {
  return { low: trap(a, 0, 0, 0.3, 0.55), medium: tri(a, 0.42, 0.65, 0.85), high: trap(a, 0.75, 0.9, 1, 1) };
}
/** Latency ratio: 1.0 == her own baseline. */
export function latencyMemberships(r) {
  return { fast: trap(r, 0, 0, 0.7, 1.0), normal: tri(r, 0.8, 1.0, 1.4), slow: trap(r, 1.2, 1.6, 3, 3) };
}
/** Average cue level used this session, 0..4. */
export function cueMemberships(c) {
  return { none: trap(c, 0, 0, 0.2, 0.6), occasional: tri(c, 0.3, 1.0, 2.0), heavy: trap(c, 1.2, 2.2, 4, 4) };
}

/* -------------------------------------------------------------- rule base */
// Sugeno-style: each rule's consequent is a singleton (down=-1, hold=0, up=1).
// Firing strength = min of the antecedent memberships (fuzzy AND) x a hand-set
// importance weight. Output is the weighted average of firing x singleton —
// the same defuzzification a small embedded fuzzy controller would use.

const DOWN = -1, HOLD = 0, UP = 1;

function rules(acc, lat, cue) {
  return [
    // Safety first: heavy cueing means the current level is already too hard,
    // regardless of what the raw accuracy number says.
    { fire: cue.heavy, out: DOWN, w: 1.0 },
    { fire: acc.low, out: DOWN, w: 1.0 },
    { fire: Math.min(acc.low, lat.slow), out: DOWN, w: 0.6 },
    // Comfortable, unaided, quick — room to try a little more.
    { fire: Math.min(acc.high, cue.none, lat.fast), out: UP, w: 1.0 },
    { fire: Math.min(acc.high, cue.none, lat.normal), out: UP, w: 0.8 },
    // Middling performance, or high accuracy bought slowly or with occasional
    // cues: this is the flow band. Leave it alone.
    { fire: acc.medium, out: HOLD, w: 0.9 },
    { fire: Math.min(acc.high, lat.slow), out: HOLD, w: 0.7 },
    { fire: Math.min(acc.high, cue.occasional), out: HOLD, w: 0.6 },
  ];
}

/**
 * @param raw {accuracy, latRatio, avgCue} — the same _raw signal policy.js's
 *   observeState() already computes from a live session.
 * @returns { action, value, confidence, memberships } — value is the
 *   defuzzified score in [-1,1]; action is the thresholded label.
 */
export function fuzzyAction({ accuracy = 0.7, latRatio = 1, avgCue = 0 }) {
  const acc = accuracyMemberships(accuracy);
  const lat = latencyMemberships(latRatio);
  const cue = cueMemberships(avgCue);
  const fired = rules(acc, lat, cue).filter((r) => r.fire > 0);

  let num = 0, den = 0, maxFire = 0;
  for (const r of fired) {
    const strength = r.fire * r.w;
    num += strength * r.out;
    den += strength;
    maxFire = Math.max(maxFire, r.fire);
  }
  const value = den > 0 ? clamp01((num / den + 1) / 2) * 2 - 1 : 0; // keep in [-1,1]

  const action = value <= -0.25 ? 'down' : value >= 0.25 ? 'up' : 'hold';
  return {
    action,
    value: Number(value.toFixed(2)),
    confidence: Number(maxFire.toFixed(2)),
    memberships: { accuracy: acc, latency: lat, cue },
    source: 'fuzzy',
  };
}

/** Plain-language line for the transparency screen — mirrors policy.js explain(). */
export function explainFuzzy(f) {
  const dominant = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
  const accWord = dominant(f.memberships.accuracy);
  const cueWord = dominant(f.memberships.cue);
  const latWord = dominant(f.memberships.latency);
  return `Fuzzy read: accuracy mostly “${accWord}”, cueing mostly “${cueWord}”, pace mostly “${latWord}” → ${f.action} (score ${f.value >= 0 ? '+' : ''}${f.value}).`;
}
