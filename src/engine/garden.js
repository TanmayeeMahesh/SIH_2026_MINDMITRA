// "MY JOURNEY GARDEN" — the positive-reinforcement layer for Safe Walk.
// Ported from a teammate's Python prototype (silly-raman/backend/garden_engine.py).
//
// Same design principle as the cue ladder elsewhere in this codebase: never a
// penalty, only ever a slower or faster reward. A missed turn pauses growth
// with a gentle "let's find the sunshine again" moment — it never takes points
// away. That is not a simplification for this port; it was already exactly
// right, so it stays exactly as designed.
//
// Note on visuals: the original renders tile emoji directly. This build's
// screens draw the tiles as small illustrated icons instead (GardenTile.jsx),
// consistent with not using emoji as the carrier of meaning elsewhere in the
// app (docs/01 §3 — the same reasoning that ruled emoji out of the Sequence
// engine's step pictures). This module only returns tile TYPE strings.

export const POINTS = {
  START_JOURNEY: 10,
  STAY_ON_PATH: 2,
  CORRECT_TURN: 15,
  CHECKPOINT_REACHED: 25,
  DESTINATION_SAFE: 100,
  DEVIATION_RESTORE: 0, // no penalty, ever — see module note above
  STREAK_BONUS: 50,
};

const EVENTS = {
  START_JOURNEY: 'A seed has been sown for today’s walk.',
  STAY_ON_PATH: 'Gentle sunlight is warming the sprouts.',
  CORRECT_TURN: 'New green leaves unfolded with that turn.',
  CHECKPOINT_REACHED: 'A marigold has blossomed at this landmark.',
  DESTINATION_SAFE: 'The garden is a blooming sanctuary today.',
  DEVIATION_RESTORE: 'Stepping back into the sunshine to water the seedlings.',
};

/** Award points for an action. Returns the new total — never subtracts. */
export function awardPoints(points, actionKey, customBonus = 0) {
  const pts = (POINTS[actionKey] ?? 0) + customBonus;
  return Math.max(0, points + pts);
}

export function eventText(actionKey) {
  return EVENTS[actionKey] || '';
}

/** Level 1-4 and its plain-language name, from total points. */
export function gardenStage(points) {
  if (points < 100) return { level: 1, name: 'Moist soil, small sprouts' };
  if (points < 300) return { level: 2, name: 'Tulsi and green herbs' };
  if (points < 600) return { level: 3, name: 'Blooming marigolds and orchids' };
  return { level: 4, name: 'Full sanctuary — birds and butterflies' };
}

/** A 3x3 grid of tile TYPE strings for GardenTile.jsx to illustrate. */
export function gardenGrid(points) {
  const { level } = gardenStage(points);
  if (level === 1) {
    return [
      ['soil', 'soil', 'soil'],
      ['soil', 'sprout', 'soil'],
      ['seed', 'soil', 'soil'],
    ];
  }
  if (level === 2) {
    return [
      ['sprout', 'tulsi', 'sprout'],
      ['soil', 'fern', 'soil'],
      ['tulsi', 'sprout', 'water_pot'],
    ];
  }
  if (level === 3) {
    return [
      ['marigold', 'tulsi', 'marigold'],
      ['orchid', 'bench', 'orchid'],
      ['marigold', 'tulsi', 'marigold'],
    ];
  }
  return [
    ['butterfly', 'marigold', 'butterfly'],
    ['orchid', 'banyan', 'orchid'],
    ['bird', 'pond', 'sunflower'],
  ];
}

export function gardenState(points) {
  const { level, name } = gardenStage(points);
  return { points, level, name, grid: gardenGrid(points) };
}
