// THE CORPUS — the caregiver-verified data that games are generated FROM.
//
// This is the single most important idea in the codebase, so it gets its own file.
//
// A game is not content. A game is a function:
//
//     game(corpus, difficulty, history) -> items
//
// Hardcoding "Boil water / Add tea / Add milk" gives every household on earth
// the same five cards forever. Generating from the corpus gives Aideu in
// Nalbari her own son's face and her own kitchen, and gives the household in
// Ri-Bhoi theirs, from the same code.
//
// Widening the corpus is therefore the cheapest way to add content. One new
// KIND here produces new questions in EVERY engine, with no new game code.

/** Every corpus entry has this shape, whatever kind it is:
 *    { id, name, photoId, group, kind }
 *  `group` drives distractor similarity — same group means harder to tell apart. */

export const KINDS = {
  person: {
    id: 'person',
    label: 'People',
    source: 'people',
    minForGame: 2,
    // "Which one is Bhaskar?"  /  "What is this person called?"
    promptFind: (name) => `Which one is ${name}?`,
    promptName: () => 'What is this person called?',
    addHint: 'Family and people she sees often',
  },
  object: {
    id: 'object',
    label: 'Everyday things',
    source: 'things',
    minForGame: 2,
    // No article is prepended. The caregiver wrote "her brass cup" or "the dao";
    // her wording is authoritative and inserting "the" produced "the the dao".
    promptFind: (name) => `Which one is ${name}?`,
    promptName: () => 'What is this called?',
    addHint: 'Things she uses — her cup, her shawl, the dao, the grinding stone',
  },
  place: {
    id: 'place',
    label: 'Places',
    source: 'things',
    minForGame: 2,
    promptFind: (name) => `Which one is ${name}?`,
    promptName: () => 'What is this place called?',
    addHint: 'Her kitchen, the market, the temple, the road to the field',
  },
};

export const KIND_LIST = Object.values(KINDS);

// ---------------------------------------------------------------- T3 pool
//
// T3 — regional default content (docs/05 §4). Deliberately generic: common
// vegetables, everyday kitchen objects, generic places. Real photographs,
// openly licensed (see public/content/t3/ATTRIBUTION.md), never people —
// fabricating a "family" from stock photos would break guardrail 5 (docs/07).
//
// The tier rule ("never present T3 when T1 exists for that slot") is
// implemented structurally rather than by merging: T1 and T3 live on two
// separate SURFACES. Personal Games always asks for source:'personal' (T1
// only — it stays genuinely hers, never padded with stock photos). General
// Games always asks for source:'general' (T3 only — always available, no
// onboarding required, which is what makes the app demoable and useful from
// the very first launch). The two pools are never mixed in the same session.
import t3manifest from '../content/packs/t3-manifest.json';

function buildT3Pool() {
  const out = { object: [], place: [] };
  for (const e of t3manifest.objects || []) {
    out.object.push({ id: e.id, name: e.name, kind: 'object', group: e.group || 'object', tier: 't3', imageSrc: `/content/t3/${e.file}` });
  }
  for (const e of t3manifest.places || []) {
    out.place.push({ id: e.id, name: e.name, kind: 'place', group: 'place', tier: 't3', imageSrc: `/content/t3/${e.file}` });
  }
  return out;
}
const T3_POOL = buildT3Pool();

/** All entries of one kind, normalised and filtered for safety.
 *  Deceased people are excluded from every quiz — they appear only in story
 *  mode, because asking someone with dementia to identify a late spouse can
 *  re-trigger the bereavement, sometimes as if for the first time.
 *
 *  source: 'personal' (default) -> T1 only, from the caregiver's own corpus.
 *          'general'            -> T3 only, the regional-default pack. */
export function getPool(state, kind, source = 'personal') {
  if (source === 'general') return T3_POOL[kind] ? T3_POOL[kind] : [];
  if (kind === 'person') {
    return (state.people || [])
      .filter((p) => p.name && p.living !== false && !p.hidden)
      .map((p) => ({ ...p, kind: 'person', tier: 't1' }));
  }
  return (state.things || [])
    .filter((t) => t.name && t.kind === kind && !t.hidden)
    .map((t) => ({ ...t, group: t.group || t.kind, tier: 't1' }));
}

/** Which kinds have enough entries to build a game from, for a given source. */
export function availableKinds(state, source = 'personal', min = 2) {
  return KIND_LIST
    .map((k) => ({ kind: k, pool: getPool(state, k.id, source) }))
    .filter(({ kind, pool }) => pool.length >= Math.max(min, kind.minForGame));
}

/** Everything, for engines that mix kinds (sorting, categorising). */
export function getAllEntries(state, source = 'personal') {
  return KIND_LIST.flatMap((k) => getPool(state, k.id, source));
}

/** Does the caregiver have ANY of her own content for this kind yet? Used to
 *  drive the "adding a photo would make this better" nudge in Personal Games. */
export function hasPersonalContent(state, kind) {
  return getPool(state, kind, 'personal').length > 0;
}

export const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

/**
 * Choose targets for a session, preferring ones she has not just seen.
 *
 * Without this the same face comes up every session and the activity goes
 * stale — which matters, because the only thing that produces benefit is her
 * still playing in week twelve.
 */
export function pickTargets(pool, count, recentIds = []) {
  if (!pool.length) return [];
  const recent = new Set(recentIds);
  const fresh = shuffle(pool.filter((x) => !recent.has(x.id)));
  const seen = shuffle(pool.filter((x) => recent.has(x.id)));
  const out = [...fresh, ...seen].slice(0, count);

  // Only go round again if the pool genuinely cannot fill the session — and
  // reshuffle each lap, because the old version walked the SAME fixed order
  // every lap, so a 4-item pool in a 6-item session produced 1,2,3,4,1,2 every
  // single time and the whole thing felt like the same questions on repeat.
  // Callers should prefer capping the session length to the pool size instead.
  while (out.length < count) {
    for (const x of shuffle(pool)) {
      if (out.length >= count) break;
      out.push(x);
    }
  }
  return out;
}

/** Which subject kind the last real session of this game used, so the next one
 *  can pick a different one when there's a genuine choice. */
export function lastKindPlayed(state, gameId) {
  const rows = (state.sessions || []).filter((s) => s.game === gameId && !s.demo);
  return rows.length ? rows[rows.length - 1].kind : null;
}

/** Target ids from the last few sessions, so pickTargets can avoid them. */
export function recentTargetIds(state, gameId, sessions = 2) {
  return (state.sessions || [])
    .filter((s) => s.game === gameId && !s.demo)
    .slice(-sessions)
    .flatMap((s) => (s.targetIds || []));
}

/**
 * Distractors matched to the difficulty setting.
 *   low    — obviously different (different group)
 *   medium — anything
 *   high   — same group, so the discrimination is genuinely hard
 * This is the dimension that makes "6 options" mean different things to
 * different people, and it is why difficulty has to be a vector, not a level.
 */
export function pickDistractors(target, pool, count, similarity) {
  const others = pool.filter((p) => p.id !== target.id);
  const same = others.filter((p) => p.group === target.group);
  const diff = others.filter((p) => p.group !== target.group);
  const ordered =
    similarity === 'high' ? [...shuffle(same), ...shuffle(diff)]
      : similarity === 'low' ? [...shuffle(diff), ...shuffle(same)]
        : shuffle(others);
  return ordered.slice(0, count);
}
