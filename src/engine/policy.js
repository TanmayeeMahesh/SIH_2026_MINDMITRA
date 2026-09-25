// L3 — THE Q-LEARNING POLICY.
//
// Read this before asking "where is the AI".
//
// The Q-table is a lookup table of 324 states x 3 actions = 972 numbers. It is
// NOT a neural network. There is no dataset, no GPU and no training run on your
// machine. It is produced by sim/train_qtable.py, which plays millions of games
// against SIMULATED learners in about a minute of laptop CPU, and writes a JSON
// file. We ship that file.
//
// On device the policy is GREEDY (epsilon = 0). It never explores on a real
// person, because exploring means deliberately inflicting a bad experience on
// someone with dementia. Exploration happens against simulated learners only.
// (docs/06 §3.2, docs/16)
//
// If qtable.json is absent or a state is unseen, we fall back to a transparent
// rule. The product is fully adaptive with or without the Q-table.

import qtable from './qtable.json';
import { fuzzyAction } from './fuzzy.js';

export const ACTIONS = ['down', 'hold', 'up'];

/** Target success band. Desirable-difficulty work puts the sweet spot around
 *  70–85%; we bias HIGHER because for this population the cost of failure is
 *  emotional, not merely motivational. (docs/06 §3.5) */
export const FLOW_BAND = [0.75, 0.90];

/* ---------- state discretisation (small on purpose, so the table stays dense) ---------- */

export function bucketAccuracy(a) { return a < 0.4 ? 0 : a < 0.6 ? 1 : a < 0.85 ? 2 : 3; }
export function bucketLatency(ratio) { return ratio < 0.8 ? 0 : ratio <= 1.3 ? 1 : 2; }
export function bucketCue(avgCue) { return avgCue < 0.3 ? 0 : avgCue < 1.2 ? 1 : 2; }
export function bucketPosition(i, n) { const f = n ? i / n : 0; return f < 0.34 ? 0 : f < 0.67 ? 1 : 2; }
export function bucketTrend(d) { return d > 0.05 ? 0 : d < -0.05 ? 2 : 1; }

export function stateKey(s) {
  return `${s.acc}${s.lat}${s.cue}${s.pos}${s.trend}${s.lvl ?? 0}`;
}

/** Build the discrete state from a live session.
 *
 *  `session.level` — the ladder position of the dominant dimension right now —
 *  is part of the state, and has to be. Without it "she is getting everything
 *  right" is ambiguous between "at the easiest setting, so raise it" and "at
 *  the hardest setting, so leave it", and the learned values for those two
 *  situations average into noise. That aliasing is why the first trained table
 *  produced an essentially arbitrary policy. */
export function observeState(session, history) {
  const items = session.items || [];
  const n = items.length || 1;
  const acc = items.filter((i) => i.correct).length / n;
  const baseline = session.baselineLatency || 6000;
  const latRatio = items.length ? items.reduce((s, i) => s + i.latencyMs, 0) / items.length / baseline : 1;
  const avgCue = items.length ? items.reduce((s, i) => s + i.cueLevel, 0) / items.length : 0;
  const last3 = (history || []).slice(-3);
  const trend = last3.length >= 2 ? (last3[last3.length - 1].accuracy - last3[0].accuracy) : 0;
  return {
    acc: bucketAccuracy(acc),
    lat: bucketLatency(latRatio),
    cue: bucketCue(avgCue),
    pos: bucketPosition(session.index || 0, session.total || 6),
    trend: bucketTrend(trend),
    lvl: Math.max(0, Math.min(4, session.level ?? 0)),
    _raw: { accuracy: acc, latRatio, avgCue, level: session.level ?? 0 },
  };
}

/* ---------- action selection ---------- */

export function chooseAction(state) {
  const key = stateKey(state);
  const row = qtable?.q?.[key];
  if (row && row.length === 3) {
    let best = 0;
    for (let i = 1; i < 3; i++) if (row[i] > row[best]) best = i;
    return { action: ACTIONS[best], source: 'qtable', q: row, key };
  }
  return { ...ruleFallback(state), source: 'rule', key };
}

/** Transparent fallback. Also what the simulator is trained to beat. */
function ruleFallback(state) {
  const a = state._raw?.accuracy ?? 0.7;
  if (state.cue >= 2) return { action: 'down', q: null };
  if (a < FLOW_BAND[0]) return { action: 'down', q: null };
  if (a > FLOW_BAND[1] && state.lat <= 1) return { action: 'up', q: null };
  return { action: 'hold', q: null };
}

export function applyAction(theta, action) {
  if (action === 'up') return theta + 0.5;
  if (action === 'down') return theta - 0.5;
  return theta;
}

/** Plain-language reason. This is what the caregiver and the jury actually see —
 *  it is our answer to "is your AI a black box?". */
export function explain(state, action, dimLabel) {
  const pct = Math.round((state._raw?.accuracy ?? 0) * 100);
  const cue = ['no cues', 'occasional cues', 'heavy cueing'][state.cue];
  const lat = ['answering quickly', 'answering at a normal pace', 'answering slowly'][state.lat];
  const verb = action === 'up' ? 'Increased' : action === 'down' ? 'Reduced' : 'Held';
  const tail = action === 'hold'
    ? 'this is inside the comfortable range, so nothing changed.'
    : action === 'up'
      ? 'comfortably above the target range, so there is room for a little more.'
      : 'below the target range, so it was made easier.';
  return `${verb} “${dimLabel}”. ${pct}% correct with ${cue}, ${lat} — ${tail}`;
}

export const qtableMeta = qtable?.meta || { trained: false };

/* --------------------------------------------------- L3 + fuzzy reconciled */

/**
 * The combined decision the app should actually act on: the Q-table (or its
 * rule fallback) proposes an action, a small fuzzy-logic controller proposes
 * a second one from the same raw numbers using soft rather than hard
 * thresholds, and where they disagree we take whichever is SAFER — never the
 * more aggressive one. This is the same "the learned policy proposes, the
 * safety layer disposes" principle as L0, one level up. (docs/16 §4; the DDA
 * review this is based on found fuzzy+RL a "successful combination" for
 * exactly this — smoothing over noisy, unpredictable performance.)
 */
export function decide(state) {
  const q = chooseAction(state);
  const f = fuzzyAction(state._raw || {});
  const agree = q.action === f.action;
  const raw = state._raw || {};
  const accuracy = raw.accuracy ?? 0.7;
  const avgCue = raw.avgCue ?? 0;

  // CLEAR-CUT CASES ARE DECIDED DETERMINISTICALLY, not by the learned policy.
  //
  // A tabular Q-function over a coarse state space is a good arbitrator for the
  // ambiguous middle and a bad one for the obvious ends — it is trained against
  // simulated learners, its values carry real sampling noise, and when it is
  // wrong at an end it is wrong in a way a person can feel: answering six in a
  // row correctly, unaided, and watching the game get EASIER.
  //
  // So the ends are rules, and they are the two rules anyone would write down:
  //   - comfortably above the band, no cues, not slow  -> make it harder
  //   - below the band, or leaning on cues             -> make it easier
  // The learned policy governs everything in between, which is where the
  // interesting judgement actually lives and where it measurably beats the
  // rule baseline in simulation.
  const cruising = accuracy >= FLOW_BAND[1] && avgCue < 0.3 && (state.lat ?? 1) <= 1;
  const struggling = accuracy < FLOW_BAND[0] || avgCue > 1.2 || (state.cue ?? 0) >= 2;

  let action, arbiter;
  if (cruising) { action = 'up'; arbiter = 'rule (clear)'; }
  else if (struggling) { action = 'down'; arbiter = 'rule (clear)'; }
  else if (agree) { action = q.action; arbiter = 'agreed'; }
  else {
    // Genuine disagreement inside the ambiguous band: hold. Moving on a split
    // vote is how difficulty ends up oscillating, and churn has its own cost.
    action = 'hold';
    arbiter = 'split — held';
  }

  return { action, agree, arbiter, qtable: q, fuzzy: f };
}

/** Plain-language reason for a decide() result, for a specific dimension label. */
export function explainDecision(state, decision, dimLabel) {
  const base = explain(state, decision.action, dimLabel);
  if (decision.arbiter === 'rule (clear)') return base;
  if (decision.agree) return `${base} (Q-table and fuzzy logic agreed.)`;
  return `Q-table said “${decision.qtable.action}”, fuzzy logic said “${decision.fuzzy.action}” — split, so it was held steady. ${base}`;
}
