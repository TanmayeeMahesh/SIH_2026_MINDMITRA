// L0 — BOUNDED DIFFICULTY LADDER (deterministic safety rails).
//
// Difficulty is a VECTOR, not a level. A person can be fine with six options but
// collapse when distractors become semantically similar — those are different
// cognitive stories and one scalar "level 3" throws that away. (docs/06 §3.3)
//
// Nothing above this layer may violate these rules. This is why we can say
// "our AI cannot harm the user" and mean it.

export const GAMES = {
  memorymatch: {
    id: 'memorymatch',
    title: 'Who Is This?',
    subtitle: 'Match the person to their name',
    skill: 'Recognition · face–name association',
    dims: {
      options: {
        label: 'Choices on screen',
        levels: [4, 4, 6, 6, 9],
        describe: (v) => `${v} cards`,
      },
      direction: {
        label: 'Task direction',
        levels: ['name2photo', 'name2photo', 'name2photo', 'photo2name', 'photo2name'],
        describe: (v) => (v === 'name2photo' ? 'name → find the photo (recognition)' : 'photo → find the name (association)'),
      },
      distractor: {
        label: 'Distractor similarity',
        levels: ['low', 'low', 'medium', 'medium', 'high'],
        describe: (v) => `${v} similarity`,
      },
    },
  },
  sequence: {
    id: 'sequence',
    title: 'In Order',
    subtitle: 'Put the steps of a familiar task in order',
    skill: 'Executive function · functional sequencing',
    dims: {
      length: {
        label: 'Steps to order',
        levels: [3, 3, 4, 5, 6],
        describe: (v) => `${v} steps`,
      },
      reference: {
        label: 'Reference picture',
        levels: [true, true, true, false, false],
        describe: (v) => (v ? 'finished picture shown' : 'from memory'),
      },
    },
  },
  // E2 — Find & Select. "Which one is Bhaskar?" (E3, above) hands her one card
  // per question; this hands her a whole shelf and asks her to find things in
  // it — a bigger visual field, several different items per round, sustained
  // rather than single-shot attention. (docs/06 §3.3)
  findit: {
    id: 'findit',
    title: 'Find It',
    subtitle: 'Find the things she uses, among the others',
    skill: 'Selective attention · everyday recognition',
    dims: {
      targets: {
        label: 'Different things to find',
        levels: [1, 1, 2, 2, 3],
        describe: (v) => `${v} to find`,
      },
      field: {
        label: 'Things on the shelf',
        levels: [4, 6, 6, 8, 10],
        describe: (v) => `${v} on the shelf`,
      },
      similarity: {
        label: 'How similar the others look',
        levels: ['low', 'low', 'medium', 'medium', 'high'],
        describe: (v) => `${v} similarity`,
      },
    },
  },
  // E2 variant — everyday numeracy instead of recognition. Same "pick from a
  // field to reach a target" shape, a numeric target instead of a named one.
  marketmoney: {
    id: 'marketmoney',
    title: 'Market Day',
    subtitle: 'Choose the notes and coins to match the price',
    skill: 'Everyday numeracy · selective attention',
    dims: {
      amount: {
        label: 'Amount to make',
        levels: [10, 20, 50, 80, 120],
        describe: (v) => `₹${v}`,
      },
      tray: {
        label: 'Notes & coins to choose from',
        levels: [3, 4, 4, 5, 6],
        describe: (v) => `${v} kinds`,
      },
    },
  },
  familytree: {
    id: 'familytree',
    title: 'Our Family',
    subtitle: 'Put each person in their place',
    skill: 'Relationship reasoning · social memory',
    dims: {
      missing: {
        label: 'Empty places',
        levels: [1, 1, 2, 2, 3],
        describe: (v) => `${v} to fill`,
      },
      piece: {
        label: 'Piece type',
        levels: ['photo', 'photo', 'photo', 'name', 'name'],
        describe: (v) => (v === 'photo' ? 'place the photo' : 'place the name'),
      },
      trayOptions: {
        label: 'Choices in the tray',
        levels: [2, 3, 3, 4, 5],
        describe: (v) => `${v} options`,
      },
    },
  },
};

export const FLOOR_LEVEL = 0;

/** theta (continuous ability) -> discrete level index, clamped to the ladder. */
export function levelFor(theta, dim) {
  return Math.max(0, Math.min(dim.levels.length - 1, Math.round(theta)));
}

/** Resolve a full difficulty vector (theta per dim) into concrete settings. */
export function settingsFor(gameId, ability) {
  const game = GAMES[gameId];
  const out = {};
  for (const [key, dim] of Object.entries(game.dims)) {
    const lvl = levelFor(ability?.[key] ?? 0.6, dim);
    out[key] = { level: lvl, value: dim.levels[lvl], label: dim.label, text: dim.describe(dim.levels[lvl]) };
  }
  return out;
}

/**
 * The hard rails. Applied AFTER any learned policy has spoken.
 * Returns { theta, reason, floor } — floor:true means end the session gently.
 */
export function applyBounds(prev, proposed, ctx) {
  const { consecutiveMisses = 0, bestRecentLevel = null, sessionStartTheta = prev } = ctx || {};

  // Rule: 3 consecutive misses -> floor mode, end the session (scenario S6).
  if (consecutiveMisses >= 3) {
    return { theta: FLOOR_LEVEL, floor: true, reason: 'Three misses in a row — switching to an easy activity and finishing for today.' };
  }
  // Rule: 2 consecutive misses -> step down now, whatever the policy says.
  if (consecutiveMisses >= 2) {
    return { theta: Math.max(0, prev - 1), floor: false, reason: 'Two misses in a row — made it easier straight away.' };
  }

  let theta = proposed;
  let reason = null;

  // Rule: bounded movement within a single session.
  //
  // This used to clamp BOTH directions to one step from where the session
  // started, which in practice meant a person could answer six in a row
  // correctly and still never see the difficulty move after the first step —
  // the adaptation was real underneath but invisible, which defeats the point.
  //
  // Upward is now allowed two steps per session, downward still only one.
  // The asymmetry is deliberate and is the same asymmetry as the reward
  // function (docs/06 §3.5): being slightly under-challenged costs almost
  // nothing, being over-challenged costs the whole intervention. Runaway
  // escalation is still prevented by the ceiling rule immediately below, and
  // two consecutive misses still step down instantly regardless (above).
  const delta = theta - sessionStartTheta;
  if (delta > 2) { theta = sessionStartTheta + 2; reason = 'Capped at two steps up in one session.'; }
  if (delta < -1) { theta = sessionStartTheta - 1; reason = 'Capped at one step down per session.'; }

  // Rule: ceiling of (best demonstrated in last 14 days) + 1.
  if (bestRecentLevel != null && theta > bestRecentLevel + 1) {
    theta = bestRecentLevel + 1;
    reason = 'Held below the ceiling of recent best performance + 1.';
  }

  return { theta: Math.max(0, theta), floor: false, reason };
}

/** Shared cue ladder — same scaffold in every engine. Level 4 always exists,
 *  so there is never a state with no way forward. (docs/06 §3.4) */
export const CUES = [
  { level: 0, name: 'None' },
  { level: 1, name: 'Category hint' },
  { level: 2, name: 'First sound' },
  { level: 3, name: 'Two choices' },
  { level: 4, name: 'Shown together' },
];
