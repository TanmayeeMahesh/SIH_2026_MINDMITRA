// L1 — ABILITY ESTIMATION (Elo / 1-parameter IRT). The workhorse.
//
// Why this and not a neural net: it converges in TENS of items rather than
// thousands, it is robust to noise, a fixed K gives graceful adaptation to
// genuine decline for free, and it is fully interpretable — we can show a
// caregiver the curve and say what it means. (docs/06 §3.2)
//
// No training data. No model file. No GPU. Just this formula.

/** Probability that ability `theta` succeeds at item difficulty `delta`. */
export function expected(theta, delta) {
  return 1 / (1 + Math.exp(-(theta - delta)));
}

/**
 * One Rasch/Elo update after a single item.
 * outcome is graded, not binary: using cues counts as partial success, so a
 * correct answer that needed heavy scaffolding does not inflate the estimate.
 */
export function gradeOutcome({ correct, cueLevel = 0 }) {
  if (!correct) return 0;
  return Math.max(0.2, 1 - 0.2 * cueLevel); // cue 0 -> 1.0, cue 4 -> 0.2
}

export function update(theta, delta, outcome, K = 0.35) {
  return theta + K * (outcome - expected(theta, delta));
}

/**
 * Update every dimension of a game's ability vector from one item's result.
 * Each dimension is credited against the level that dimension was actually set to.
 */
export function updateAbility(ability, settings, result, K) {
  const next = { ...ability };
  const outcome = gradeOutcome(result);
  for (const [key, s] of Object.entries(settings)) {
    next[key] = update(next[key] ?? 0.6, s.level, outcome, K);
  }
  return next;
}

/** Cold start: three coarse caregiver inputs -> a deliberately EASY starting vector.
 *  Never guess high. First sessions are calibration, weighted with a larger K. */
export function coldStart({ education = 'none', independence = 'partial', usedTouchscreen = false }) {
  let base = 0.4;
  if (education === 'primary') base += 0.3;
  if (education === 'secondary_plus') base += 0.6;
  if (independence === 'high') base += 0.4;
  if (independence === 'low') base -= 0.2;
  if (usedTouchscreen) base += 0.3;
  return Math.max(0, Math.min(2, base));
}

export const CALIBRATION_K = 0.7; // first two sessions
export const STEADY_K = 0.35;
