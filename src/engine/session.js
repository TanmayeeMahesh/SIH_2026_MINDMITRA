// Session builder — turns the caregiver-verified corpus + a difficulty vector
// into concrete game items.
//
//     buildSession(gameId, { state, ability }) -> { settings, items, kind }
//
// Nothing here invents a personal fact (docs/07 guardrail 1). Every item is
// assembled from records a caregiver entered and approved. There is no
// generative path over personal data — the "AI" chooses how hard and which
// items, never what is true.
//
// The engines are deliberately CORPUS-AGNOSTIC: buildMemoryMatch does not know
// what a "person" is. It takes a pool of { id, name, photoId, group } and makes
// a recognition task. Feed it people and it asks "which one is Bhaskar?"; feed
// it objects and it asks "which one is the dao?" — same code, three times the
// content. That is what makes adding content cheap.

import { GAMES, settingsFor } from './ladder.js';
import {
  KINDS, availableKinds, getPool, lastKindPlayed, pickDistractors, pickTargets,
  recentTargetIds, shuffle,
} from './corpus.js';
import { T3_ROUTINES } from '../content/packs/t3-routines.js';
import { makeMoneyTray, jitterAmount } from '../content/currency.js';

/**
 * Every builder below now takes `source`: 'personal' (T1 — the caregiver's
 * own corpus, default) or 'general' (T3 — the always-available regional pack).
 * The two are never mixed within one session — see engine/corpus.js for why.
 * This is what makes "General Games" playable from first launch, with zero
 * onboarding, while "Personal Games" stays genuinely hers.
 */

/* ------------------------------------------------------------------ E3 */

/**
 * Recognition / association over ANY pool.
 * @param pool  [{id,name,photoId,group}]
 * @param kind  a KINDS entry, used only to phrase the prompt
 */
export function buildMemoryMatch({ state, ability, count = 6, kindId = null, source = 'personal', exclude = [] }) {
  const settings = settingsFor('memorymatch', ability);

  // Pick which kind of thing this session is about. Rotating the subject is
  // itself a source of variety — the same engine feels like a different game.
  const avail = availableKinds(state, source);
  if (!avail.length) return { settings, items: [], kind: null };

  // Prefer a kind with enough distinct entries to fill the whole session
  // without repeating, and avoid opening with the same kind as last time when
  // there is a real choice. Picking purely at random meant the same subject
  // came up session after session, which read as "the same questions again".
  const lastKind = lastKindPlayed(state, 'memorymatch');
  const roomy = avail.filter((a) => a.pool.length >= count);
  const candidates = roomy.length ? roomy : avail;
  const notLast = candidates.filter((a) => a.kind.id !== lastKind);
  const chosen = kindId
    ? avail.find((a) => a.kind.id === kindId) || candidates[0]
    : shuffle(notLast.length ? notLast : candidates)[0];
  const { kind, pool } = chosen;

  // Never ask the same question twice in one session just to hit a target
  // length — a shorter session of fresh items beats six items with repeats.
  const n = Math.min(count, pool.length);
  const nOptions = Math.min(settings.options.value, pool.length);
  // `exclude` carries the items ALREADY shown earlier in this same session.
  // Difficulty is re-applied mid-session by rebuilding the remaining items, and
  // without this the rebuild happily re-drew something she had just answered —
  // which is how a repeat survived even after the pool was made big enough.
  const targets = pickTargets(pool, n, [...recentTargetIds(state, 'memorymatch'), ...exclude]);

  const items = targets.map((target, i) => ({
    id: `mm-${i}`,
    target,
    options: shuffle([target, ...pickDistractors(target, pool, nOptions - 1, settings.distractor.value)]),
    direction: settings.direction.value,          // name2photo | photo2name
    prompt: settings.direction.value === 'photo2name'
      ? kind.promptName()
      : kind.promptFind(target.name),
  }));

  return { settings, items, kind };
}

/* ------------------------------------------------------------------ E1 */

/** Sequencing over a routine — the caregiver's own (T1) or a generic default
 *  (T3, `content/packs/t3-routines.js`) when source is 'general'. Pure
 *  configuration of the same pattern: take ordered data, scramble it, ask for
 *  the order back. */
export function buildSequence({ state, ability, count = 1, source = 'personal' }) {
  const settings = settingsFor('sequence', ability);
  const routines = source === 'general'
    ? T3_ROUTINES
    : (state.routines || []).filter((r) => (r.steps || []).length >= 3);
  if (!routines.length) return { settings, items: [], kind: null };

  const chosen = shuffle(routines).slice(0, count);
  const items = chosen.map((r, i) => {
    const steps = r.steps.slice(0, settings.length.value);
    return {
      id: `sq-${i}`,
      routine: r,
      steps,                                   // correct order
      scrambled: shuffle(steps),
      showReference: settings.reference.value, // whether the finished picture is shown
      prompt: `Put ${r.name} in order`,
    };
  });
  return { settings, items, kind: null };
}

/* ------------------------------------------------------------------ E3b */

// Relationship placement is inherently personal — there is no generic
// "family" — so this builder has no `source` parameter. It only ever reads T1.
export function buildFamilyTree({ state, ability }) {
  const settings = settingsFor('familytree', ability);
  const pool = getPool(state, 'person', 'personal');
  if (pool.length < 3) return { settings, items: [], kind: KINDS.person };

  const nMissing = Math.min(settings.missing.value, pool.length - 1);
  const blanks = shuffle(pool).slice(0, nMissing);
  const blankIds = new Set(blanks.map((b) => b.id));
  const trayExtras = shuffle(pool.filter((p) => !blankIds.has(p.id)))
    .slice(0, Math.max(0, settings.trayOptions.value - nMissing));

  return {
    settings,
    kind: KINDS.person,
    items: [{
      id: 'ft-0',
      nodes: pool,
      blanks: blanks.map((b) => b.id),
      tray: shuffle([...blanks, ...trayExtras]),
      piece: settings.piece.value,             // photo | name
    }],
  };
}

/* ------------------------------------------------------------------ E2 */

/** "Find It" — a bigger visual field than E3's card grid, several different
 *  named items to find per round rather than one. Same corpus-agnostic shape:
 *  feed it objects and it says "find her cup"; nothing here is object-specific. */
export function buildFindSelect({ state, ability, count, source = 'personal', exclude = [] }) {
  const settings = settingsFor('findit', ability);
  const pool = getPool(state, 'object', source);
  if (pool.length < 2) return { settings, items: [], kind: KINDS.object };

  const n = Math.min(count ?? settings.targets.value, pool.length);
  const targets = pickTargets(pool, n, [...recentTargetIds(state, 'findit'), ...exclude]);
  const fieldSize = Math.min(settings.field.value, pool.length);

  const items = targets.map((target, i) => ({
    id: `fi-${i}`,
    target,
    options: shuffle([target, ...pickDistractors(target, pool, fieldSize - 1, settings.similarity.value)]),
    prompt: `Find ${target.name}`,
  }));
  return { settings, items, kind: KINDS.object };
}

/** "Market Day" — the numeracy variant of the same "pick from a field to
 *  reach a target" shape: the target is an amount instead of a name. Always
 *  available — currency is a fixed system pack, not corpus-dependent. */
export function buildMarketMoney({ state, ability, count = 3 }) {
  const settings = settingsFor('marketmoney', ability);
  const items = Array.from({ length: count }, (_, i) => {
    const amount = i === 0 ? settings.amount.value : jitterAmount(settings.amount.value);
    return { id: `mm-${i}`, amount, tray: makeMoneyTray(amount, settings.tray.value) };
  });
  return { settings, items, kind: null };
}

/* ---------------------------------------------------------------- entry */

const BUILDERS = {
  memorymatch: buildMemoryMatch,
  familytree: buildFamilyTree,
  sequence: buildSequence,
  findit: buildFindSelect,
  marketmoney: buildMarketMoney,
};

export function buildSession(gameId, ctx) {
  const fn = BUILDERS[gameId];
  return fn ? fn(ctx) : { settings: {}, items: [], kind: null };
}

/** Is there enough content to play this game at all, for this source? */
export function canPlay(state, gameId, source = 'personal') {
  if (gameId === 'memorymatch') return availableKinds(state, source).length > 0;
  if (gameId === 'familytree') return source === 'personal' && getPool(state, 'person', 'personal').length >= 3;
  if (gameId === 'sequence') return source === 'general'
    ? T3_ROUTINES.length > 0
    : (state.routines || []).some((r) => (r.steps || []).length >= 3);
  if (gameId === 'findit') return getPool(state, 'object', source).length >= 2;
  if (gameId === 'marketmoney') return true; // a fixed system pack — always playable
  return false;
}

/** Exactly what is still missing before a game unlocks, in plain words and with
 *  the current count. "Add a few more photos in Caregiver mode" is not
 *  actionable; "needs 2 of any one kind — most so far: 1" is. */
export function needsHint(state, gameId) {
  const people = getPool(state, 'person', 'personal').length;
  const objects = getPool(state, 'object', 'personal').length;
  const places = getPool(state, 'place', 'personal').length;
  const routines = (state.routines || []).filter((r) => (r.steps || []).length >= 3).length;
  if (gameId === 'memorymatch') {
    return `Needs 2 of any one kind — people, things or places. Most so far: ${Math.max(people, objects, places)}.`;
  }
  if (gameId === 'familytree') return `Needs 3 people. Added so far: ${people}.`;
  if (gameId === 'findit') return `Needs 2 everyday things. Added so far: ${objects}.`;
  if (gameId === 'sequence') return routines ? 'Ready' : 'Needs one daily routine with at least 3 steps.';
  return 'Add more in Caregiver mode.';
}

/** Floor mode — the bad day (scenario S6). Nothing to get right. Only ever
 *  drawn from her real, personal corpus — a stranger's stock photo is not a
 *  comforting "shared moment." If she has none yet, there is no floor content
 *  and the caller should fall back to ending the session plainly. */
export function floorContent(state) {
  const p = shuffle(getPool(state, 'person', 'personal'))[0];
  return p ? { entry: p, kind: 'story' } : null;
}

export const GAME_LIST = Object.values(GAMES);
