# 17 — How to Make a Game Dynamic

Owner: Cognitive/content lead · Status: implemented · Code: `mindmitra/src/engine/corpus.js`, `session.js`

---

## The idea

**A game is not content. A game is a function.**

```
game(corpus, difficulty, history) → items
```

The old prototype had this:

```js
const items = ['Boil water', 'Add tea', 'Add milk', 'Add sugar', 'Serve'];
```

Every household on earth gets the same five cards, forever. That is a *script*, not a game.

The engine now has this:

```js
buildMemoryMatch({ state, ability, count: 6 })
```

Aideu in Nalbari sees her own son's face and her own kitchen. A household in Ri-Bhoi sees theirs. Same code.

---

## The three levers

Everything that makes a session different from the last one comes from one of these.

| Lever | Where it lives | What it changes |
|---|---|---|
| **1. Corpus** | `state.people`, `state.things`, `state.routines` | *What* the questions are about |
| **2. Difficulty vector** | `engine/ladder.js` + the Elo/Q-learning stack | *How hard* they are |
| **3. Sampling** | `engine/corpus.js` — `pickTargets`, `pickDistractors`, subject rotation | *Which* ones, and in what order |

Lever 1 was the bottleneck: the corpus held only `people`, so every question was "who is this?". It now holds three kinds, and adding a fourth is a config block, not a feature.

---

## What changed

### Engines are now corpus-agnostic

`buildMemoryMatch` does not know what a "person" is. It takes a pool of `{ id, name, photoId, group }` and makes a recognition task from it. Feed it people and it asks *"Which one is Bhaskar?"*; feed it objects and it asks *"Which one is the dao?"*.

**One change, three times the content, no new game code.** That is the whole "five engines, not twelve games" argument made concrete — and it is what you say when a jury asks why you only built two games.

### The subject rotates on its own

Each session picks a kind it has enough data for. The same engine feels like three activities.

### Repeats are avoided

`pickTargets` prefers entries not seen in the last two sessions. Without it the same face comes up every time and the activity goes stale — which matters, because the only thing that produces benefit is her still playing in week twelve.

### Guardrails moved into the corpus layer

Deceased people are filtered out at `getPool`, so **no engine can ever** put a late spouse in a "who is this?" question. Asserted, not assumed — `scripts/demo-generation.mjs` checks it over 200 generated sessions.

---

## Prove it

```bash
node scripts/demo-generation.mjs
```

```
Five sessions, same code, same data — nothing hardcoded:

  [Everyday things ] "Which one is her brass cup?"   "Which one is the dao?"   ...
  [Places          ] "Which one is the kitchen?"     "Which one is the temple?" ...
  [People          ] "Which one is Nabin?"           "Which one is Bhaskar?"    ...

Guardrail — deceased person appeared in a quiz over 200 sessions: no
```

Worth running in front of a jury right after the live demo. It shows the engine is a function of the caregiver's data, not a script.

---

## Recipe: adding a new game

Four steps. `sequence` in the codebase is a worked example with steps 1–3 done and step 4 left as the template.

**1. Difficulty dimensions** — `engine/ladder.js`

```js
sortbins: {
  id: 'sortbins',
  title: 'Sort It Out',
  dims: {
    items:    { label: 'Things to sort', levels: [4,4,6,6,8], describe: (v) => `${v} items` },
    bins:     { label: 'Groups',         levels: [2,2,3,3,4], describe: (v) => `${v} groups` },
  },
},
```

Each dimension needs an **ordered** ladder, easiest first. That ordering is the only thing the Elo estimator needs to work.

**2. A builder** — `engine/session.js`

```js
export function buildSortBins({ state, ability }) {
  const settings = settingsFor('sortbins', ability);
  const pool = getAllEntries(state);                  // reuse the corpus
  const items = shuffle(pool).slice(0, settings.items.value);
  return { settings, items: [{ id: 'sb-0', items, bins: settings.bins.value }] };
}
```

Register it in `BUILDERS` and add a `canPlay` clause.

**3. Content** — usually nothing. If the corpus already has what you need, you are done. A genuinely new kind (songs, festivals) means one block in `corpus.js`.

**4. A screen** — copy `MemoryMatch.jsx` and change the middle. The adaptive wiring is ~25 lines and identical in every game:

```js
const nextAbility = updateAbility(ability, settings, result, K);   // L1 Elo
const obs        = observeState({ items: nextResults, ... }, history);
const decision   = chooseAction(obs);                              // L3 policy
const bounded    = applyBounds(nextAbility[dimKey], proposed, {...}); // L0 rails
```

Copy that block verbatim, change `dimKey` to your dominant dimension, and the new game is adaptive, bounded and explainable for free.

---

## The line for the pitch

> "We didn't write questions. We wrote engines. The caregiver spends fifteen minutes putting her mother's life into the app — faces, her cup, her kitchen, how she makes tea — and the games generate themselves from that, at a difficulty the engine is still learning. Add one more photo and every activity in the app changes."

---

## Next

- [ ] Build the `sequence` screen from the template (~60 lines) — the builder and ladder are already written
- [ ] Add a `song` kind to the corpus for Music Memory — config only
- [ ] `getAllEntries` already returns a mixed pool, so the Categorise engine needs no new corpus work
