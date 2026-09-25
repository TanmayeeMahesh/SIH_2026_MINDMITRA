# MindMitra — Technical Report (as-built)

SIH 2026 · PS 26003 · AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region · Theme: MedTech · Category: Software

**Scope of this document.** Everything below describes code that exists in `mindmitra/src/` as of 2026-09-24, verified by direct source reading — file paths, line-level behaviour, dependency lists and the trained model's own metadata were all re-read while writing this report, not recalled from memory. It supersedes any architecture described in older planning docs (01–17) or in draft slide decks where the two disagree; where something here is still a plan rather than shipped code, it is labelled **ROADMAP — not built**.

**Verification method.** Local build tooling (`npm install`/`npm run build`/`npm run dev`) is currently unreliable on the dev machine — Quick Heal antivirus has been quarantining `node_modules/@esbuild` and blocking network/install operations mid-session. Per standing instruction, correctness below is established by manual code review (reading the actual source, tracing call paths, checking arithmetic by hand), not by running the app. Where a bug was found and fixed this way, it's recorded in §12.

---

## 1. What this is, in one paragraph

MindMitra is a zero-backend, offline-first Progressive Web App (Capacitor-ready for a native Android wrapper) for cognitive engagement in elderly people with dementia in rural North-East India, plus a PIN-gated caregiver console. It has no server: all state lives in the browser's IndexedDB, on the one device. A caregiver spends ~15 minutes building a small "corpus" of the elder's own family photos, everyday objects and daily routines; five game engines then generate quiz activities from that corpus (never from a hardcoded question bank); a four-layer adaptive-difficulty stack keeps each session inside a measured "flow band" so it's neither frustrating nor boring; a fortnightly one-page report is generated client-side for the family to hand to an ASHA worker; and a GPS+compass "Safe Walk" feature gives the elder a big directional arrow to a caregiver-approved destination with automatic caregiver alerting if she wanders off the path for too long.

## 2. Architecture at a glance

```
                         ┌─────────────────────────────────────────┐
                         │            React 18 + Vite SPA           │
                         │         (single build, two modes)         │
                         └─────────────────────────────────────────┘
   Elder-facing screens                                    Caregiver console (PIN 1234)
   (Elder.jsx, game screens,                                (Caregiver.jsx: onboarding,
    SafeWalk.jsx)                                            corpus builder, Safe Walk admin,
        │                                                     "How it adapts" transparency,
        │                                                     Report, Sync)
        ▼
┌───────────────────┐        ┌────────────────────┐       ┌─────────────────────┐
│  Adaptive engine    │◄──────┤  Corpus (T1/T2/T3)  │       │  IndexedDB (db.js)   │
│  L0 ladder → L1 Elo │       │  corpus.js,         │◄─────►│  one object store,   │
│  → L3 Q-table+fuzzy │       │  kinship.js         │       │  JSON state + photo  │
└───────────────────┘        └────────────────────┘       │  Blobs               │
        │                                                    └─────────────────────┘
        ▼
┌───────────────────┐   ┌─────────────────┐   ┌───────────────────────┐
│ Pre-rendered audio  │   │  Safe Walk       │   │  Mock cloud sync       │
│ (speak.js + mp3s),  │   │  geodesic.js,    │   │  (mockCloud.js — a     │
│ Web Speech fallback │   │  routing.js,     │   │  SECOND IndexedDB DB   │
│                      │   │  walkSession.js, │   │  on the same device,   │
│                      │   │  useSafeWalk.js  │   │  no network call ever)│
└───────────────────┘   └─────────────────┘   └───────────────────────┘
```

There is no backend anywhere in this diagram. That is a deliberate architectural decision (docs/06 §4, docs/07), not a shortcut: the household's photographs and personal facts never leave the phone unless a human being explicitly chooses to share the printed report.

### 2.1 Tech stack (verified against `package.json`)

| Package | Version pin | Why |
|---|---|---|
| `react`, `react-dom` | latest | Component model for two very different UIs (elder-facing vs caregiver console) sharing one state tree |
| `vite`, `@vitejs/plugin-react` | latest | Dev server + build; fast HMR during a hackathon sprint |
| `vite-plugin-pwa` | latest | Service worker + manifest — installable, offline-launchable PWA |
| `typescript` | latest | Present in the toolchain; the engine files are plain `.js` with JSDoc-style comments rather than `.ts`, by choice — see §12 for why nothing here reaches for heavier tooling than it needs |
| `lucide-react` | latest | Icon set — used everywhere *instead of* emoji, per explicit product decision (§9) |
| `leaflet` | latest | **The one online-only, non-essential dependency.** Loaded via `React.lazy` so its ~150KB JS/CSS only downloads if a caregiver or elder actually opens the Safe Walk map view |

No state-management library (Redux/Zustand/etc), no ORM, no CSS framework, no backend framework, no cloud SDK. `devDependencies` is empty. This is intentional: every dependency in the table above is pulling real, non-reimplementable weight (a rendering framework, a build tool, a mapping library) rather than being a convenience wrapper around something 50 lines of plain JS could do — see `db.js` (§4) and `mockCloud.js` (§10.4), both hand-written specifically to avoid taking on a dependency (Dexie, a state library) for what the prototype actually needed.

## 3. Directory map

```
mindmitra/src/
├── App.jsx                    entry component: screen router, online/offline switch, PIN gate
├── audio/
│   ├── speak.js                pre-rendered-audio player + Web Speech fallback
│   └── chime.js                success/alert tones
├── components/                 shared presentational pieces (Photo, Currency, BigArrow,
│                                LiveMap, ArrowCameraView, PickOnMap, WalkSchematic)
├── content/                    THE CORPUS DATA — kinship.js, currency.js, stepIcons.js,
│   └── packs/t3-manifest.json  strings.js, audio-manifest.js, t3-routines.js
├── engine/                     ALL THE ADAPTIVE-DIFFICULTY + SAFE-WALK MATH
│   ├── ladder.js                L0 — bounded difficulty ladder, per-game dimension tables
│   ├── elo.js                   L1 — Elo/IRT ability estimation
│   ├── policy.js                L3 — Q-table lookup + decide()/reconcile with fuzzy
│   ├── fuzzy.js                 the fuzzy-logic advisor (Mamdani/Sugeno-style)
│   ├── corpus.js                T1/T3 pool building, distractor selection
│   ├── session.js               session lifecycle glue
│   ├── qtable.json              the SHIPPED, pre-trained Q-table (see §7.5)
│   ├── geodesic.js              Safe Walk: distance/bearing/cross-track math
│   ├── routing.js               Safe Walk: Tier 0 fixed route / Tier 1 OSRM dynamic route
│   ├── walkSession.js           Safe Walk: corridor/hysteresis state machine
│   └── garden.js                gamification points/stages (emoji-free by design)
├── hooks/
│   ├── useSafeWalk.js           entire walk lifecycle, owned at the App root (see §9.4)
│   └── useCompassHeading.js     real magnetometer heading via DeviceOrientationEvent
├── screens/                     Elder.jsx, Caregiver.jsx, SafeWalk(Admin).jsx,
│                                MemoryMatch/FamilyTree/Sequence/FindSelect/MarketMoney.jsx
├── store/
│   ├── db.js                    hand-written IndexedDB wrapper (no npm dependency)
│   └── state.js                 the single state shape + useStore() hook
└── sync/
    └── mockCloud.js              simulated cloud — a second on-device IndexedDB, zero network
```

Supporting, outside `src/`:

- `sim/train_qtable.py` (269 lines, Python stdlib only) — trains `qtable.json` offline against simulated learners. Never runs on-device.
- `scripts/generate-audio.mjs` — build-time TTS generation (Sarvam/Bhashini) that produces the mp3s `audio/audio-manifest.js` points at.
- `public/content/t3/` — 38 openly-licensed photographs (30 objects/places + 8 step-by-step routine photos), `public/content/currency/` — 9 real currency photographs (5 notes, 4 coins), each with its own `ATTRIBUTION.md`.
- `silly-raman/` — a teammate's separate Python/FastAPI + Leaflet/Three.js prototype. Its geodesic math and navigation-state logic were read, audited (`docs/18-safe-walk-source-audit.md`) and **ported into this app's own engine** (§9); its backend, database and 3D-garden rendering were not — this app took the ideas, not the server.

## 4. Data model & persistence

`store/db.js` is a ~75-line hand-rolled wrapper around the browser's IndexedDB — one database (`mindmitra`), one object store (`kv`), plain `get`/`set`/`del`/`clearAll`. It exists instead of a library (Dexie, idb) because the prototype's actual requirement — "store one JSON blob and a handful of photo Blobs, reliably, offline" — doesn't need one, and it exists instead of `localStorage` because `localStorage` is synchronous, string-only, and caps around 5MB, which would break the moment a caregiver adds a few photos.

Every caregiver photo is downscaled client-side to a 512px long edge and stored as a JPEG Blob (`savePhoto()`, `db.js:41`) before being written — object URLs are created lazily and cached in a `Map`, revoked on delete, so a ten-person corpus stays a few MB.

The entire app state is one object (`store/state.js`, `EMPTY`), auto-saved 250ms after any change via `setTimeout`-debounced `db.set()`:

```
profile      { preferredName, language, community, education, independence,
               dailyMinutesLimit, textScale, mode: 'online'|'offline', ... }
people[]     { id, name, relationKey, photoId, living, group }   — T1 corpus
things[]     { id, name, kind:'object'|'place', photoId, group } — T1 corpus
routines[]   { id, name, steps:[{id,label,photoId?}] }
medicines[]  { id, label, time, log:{ [dateKey]: true } }
ability{}    { [gameId]: { [dim]: theta } }                       — L1 Elo state
sessions[]   completed-game records (accuracy, items, settings, durationMs, ts)
chat[]       assistant conversation log
sync         { lastSyncedAt }
safePlaces[] { id, name, category, coord, safeRadiusM, waypoints[], recordedDistanceM }
garden       { points }                                            — gamification
walks[]      completed/alerted Safe Walk log entries
```

`profile.mode` is the online/offline toggle a caregiver sets. Note what it actually does, precisely, because this is a common source of confusion in the codebase's own comments: it can only ever turn the *optional* online extras off; `App.jsx`'s `effectiveOnline = online && state.profile.mode !== 'offline'` means a real network being absent (`navigator.onLine === false`) always wins regardless of the switch. The switch can never fake a connection that isn't there.

## 5. The corpus & content-tier system (T1/T2/T3)

The single architectural idea the rest of the app is built around, stated in `engine/corpus.js`'s own header comment: **a game is not content, a game is a function** `game(corpus, difficulty, history) → items`. Hardcoding "boil water, add tea, add milk" gives every household on earth the same five cards forever; generating from a corpus gives one household its own son's face and its own kitchen, and another household in a different village theirs, from identical code.

**Tiers, and how they're actually kept separate:**

- **T1 — personal.** The caregiver's own entries (`state.people`, `state.things`). Always wins when present.
- **T2 — community.** Vocabulary and relationship structure that varies by household culture, not by individual — implemented as `content/kinship.js` (§5.1), a pure data table, never branched-on in game logic.
- **T3 — regional default.** 38 openly-licensed stock photographs (`public/content/packs/t3-manifest.json` → `public/content/t3/*.jpg`), generic enough to be useful to anyone (banana, brinjal, market, temple, a comb, a shawl — see the file list in `t3-manifest.json`), never people (fabricating a "family" from stock photos would violate the app's own safety guardrails, docs/07).

The tier rule ("never show T3 when T1 exists for that slot") is **not** implemented as a merge-with-fallback. It's a structural split by *surface*: `getPool(state, kind, source)` takes `source: 'personal' | 'general'` and the two never mix within one session. "Personal Games" in the elder UI always calls with `source: 'personal'` (T1 only — content stays genuinely hers, never padded with anonymous stock photos she won't recognise). "General Games" always calls with `source: 'general'` (T3 only — works from first launch, zero onboarding required, which is what makes the app demoable and immediately useful before a caregiver has entered anything). This is simpler than a threshold-based merge and matches how the two are actually presented to the elder as separate, named sections of the app.

One safety rule lives in the same file: deceased people (`living: false`) are filtered out of **every quiz** pool — they appear only in a separate, non-quiz "story mode" — because asking a person with dementia to identify a late spouse in a test format can re-trigger grief, sometimes as if for the first time.

### 5.1 Kinship as data, not code

`content/kinship.js` exists because an early draft hardcoded "daughter-in-law" as the default caregiver relationship — which correctly describes a patrilineal, virilocal Assamese household and is **structurally wrong** for Khasi, Jaintia or Garo households in Meghalaya, where descent runs through the mother, a husband moves into his mother-in-law's home, the youngest daughter (*Ka Khadduh*) inherits along with the customary duty of caring for her parents, and the maternal uncle (*U Kni*) has formal standing.

The fix: three community relationship tables (`assamese`, `khasi`, `generic`), each defining its own relation vocabulary (with native-script labels — Assamese `বোৱাৰী`, Khasi `Ka Khadduh`), its own `descent` field, and its own `defaultCaregiverRole`. The game engines call `relationsFor(communityId)` and never branch on culture directly — switching a household's `profile.community` from `'assamese'` to `'khasi'` changes vocabulary and defaults everywhere with zero code changes. This is the concrete mechanism behind the claim "one codebase serves an Assamese household and a matrilineal Khasi one."

### 5.2 Currency content

`content/currency.js` + `public/content/currency/*.jpg` — 9 real photographs of Indian currency (₹10/20/50/100/500 notes, ₹1/2/5/10 coins), RBI-licensed under GODL-India, replacing an earlier version that used abstract/illustrated currency icons after direct user feedback that real notes are what an elder actually recognises.

## 6. The five game engines

`engine/ladder.js` defines every game as an entry in `GAMES{}` — an id, a title/subtitle pair, a `skill` label, and 2–3 **difficulty dimensions**, each a `levels[]` array (concrete values at levels 0–4) plus a `describe()` formatter. This is the literal implementation of "difficulty is a vector, not a scalar": a game can be easy on one dimension and hard on another simultaneously, because a person can be fine with six options on screen but collapse the moment distractors become visually similar — two different cognitive failure modes that one scalar "level 3" would conflate.

| Game id | Title | Skill | Dimensions (level 0 → level 4) |
|---|---|---|---|
| `memorymatch` | Who Is This? | Recognition · face–name association | **options**: 4→4→6→6→9 cards · **direction**: name→photo (recognition) then flips to photo→name (association) at level 3 · **distractor**: low→medium→high visual similarity |
| `sequence` | In Order | Executive function · functional sequencing | **length**: 3→3→4→5→6 steps · **reference**: finished-picture shown, withdrawn from level 3 onward (working from memory) |
| `findit` | Find It | Selective attention · everyday recognition | **targets**: 1→1→2→2→3 things to find · **field**: 4→6→6→8→10 things on the shelf · **similarity**: low→medium→high |
| `marketmoney` | Market Day | Everyday numeracy · selective attention | **amount**: ₹10→20→50→80→120 to make · **tray**: 3→4→4→5→6 notes/coins to choose from |
| `familytree` | Our Family | Relationship reasoning · social memory | **missing**: 1→1→2→2→3 empty places to fill · **piece**: place-the-photo, then place-the-name from level 3 · **trayOptions**: 2→3→3→4→5 |

These map onto the three engine *families* from the original design brief: **E1 (Sequence)** = `sequence`; **E2 (Find & Select)** = `findit` **and** `marketmoney` — built as two separate concrete games after the user's explicit decision ("i want both, since both address different areas of impairment": object-recognition attention vs. everyday numeracy); **E3 (Associate & Match)** = `memorymatch` and `familytree`, two applications of the same "match an identity to a slot" shape (person↔name, person↔relationship-slot).

Every game is picture/voice-first: options render as photographs (from the T1/T3 pool) with a spoken prompt, never as unlabelled text-only choices — the explicit fix for the "illiterate user, text-only options are unreadable" feedback round. A shared **cue ladder** (`ladder.js` `CUES`, 5 levels: none → category hint → first sound → two choices → shown together) exists identically across every engine, so a struggling player is never left with literally no way forward, and `chosenCue` feeds directly into both the Elo grading (§7.2) and the Q-learning state (§7.5) as a partial-success signal.

`corpus.js`'s `pickDistractors(target, pool, count, similarity)` is what makes the `similarity`/`distractor` dimension mean something concrete: at `'high'` it prefers same-`group` items first (harder — genuinely similar things), at `'low'` it prefers different-`group` items first (obviously different, easy), shuffled within each bucket so repeat plays don't get the same distractor set. `pickTargets()` actively avoids the last 2 sessions' target ids (`recentTargetIds`) before falling back to reshuffled repeats — the direct fix for the "same quiz questions every time" bug report.

## 7. The adaptive difficulty engine

Four layers, described bottom-up (safety-critical to exploratory), plus a fifth advisory system (fuzzy logic) that sits alongside the top layer rather than being a fifth layer in its own right.

### 7.1 L0 — Bounded ladder (`engine/ladder.js`)

Deterministic safety rails. **Nothing above this layer may violate these rules** — this is the literal basis for the claim "our AI cannot harm the user." `applyBounds(prev, proposed, ctx)` enforces, in order:

1. **3 consecutive misses → floor mode.** Difficulty snaps to level 0 and the session is flagged to end gently (`floor: true`).
2. **2 consecutive misses → immediate step down**, overriding whatever the learned policy proposed.
3. **Bounded movement per session**: at most **+2** levels up, **−1** level down, measured from the level the session *started* at. This asymmetry is deliberate and mirrors the reward shaping in §7.5 — being mildly under-challenged costs almost nothing, being over-challenged can cost the whole session emotionally, so the ladder is stingier about letting things get harder than about letting them get easier. (An earlier version clamped both directions to ±1 from session start, which in practice meant six consecutive correct answers still never visibly increased difficulty after the first step — real underneath, invisible in practice. Fixed to the current +2/−1 asymmetry.)
4. **Ceiling of (best level demonstrated in the last 14 days) + 1** — prevents a single lucky streak from anchoring difficulty somewhere the person can't sustain.

### 7.2 L1 — Elo / 1-parameter IRT (`engine/elo.js`)

A per-dimension continuous ability estimate (`theta`), updated by a single Rasch/Elo-style formula after every item:

```js
expected(theta, delta) = 1 / (1 + e^-(theta - delta))     // P(success at item difficulty delta)
update(theta, delta, outcome, K=0.35) = theta + K * (outcome - expected(theta, delta))
```

Chosen over a neural approach specifically because it converges in **tens** of items rather than thousands (there is no population-scale dataset to pretrain on — each household starts cold), is robust to noisy day-to-day performance, and is fully interpretable: the caregiver's "How it adapts" screen can show the literal curve and explain what it means, rather than a black box. `gradeOutcome({correct, cueLevel})` grades **gradedly, not binarily** — a correct answer reached only with heavy cueing scores as low as 0.2 rather than 1.0 (`max(0.2, 1 - 0.2*cueLevel)`), so a scaffolded win doesn't inflate the ability estimate the way a truly independent one does.

Cold start (`coldStart()`) turns three caregiver-provided onboarding inputs (education level, independence level, prior touchscreen use) into a deliberately **easy** starting `theta` (never guessed high) — the first two real sessions run at a higher learning rate (`CALIBRATION_K = 0.7` vs steady-state `0.35`) so the estimate calibrates fast without over-committing to a bad first guess.

### 7.3 L2 — Contextual bandit — **ROADMAP, not built**

Intended to decide *which activity* to offer and *how long* a session should run, contextualised on time-of-day, recent mood signals, etc. No code exists for this layer. It is represented in the caregiver-facing "How it adapts" explanation screen as a labelled roadmap item, not claimed as shipped.

### 7.4 L3 — Q-learning policy (`engine/policy.js`)

**What this is, precisely, because "AI" invites assumptions:** a lookup table, `482` discrete states × 3 actions (`down`/`hold`/`up`) = 1,446 numbers, shipped as `engine/qtable.json`. Not a neural network. No training happens on-device, no GPU is ever touched by this codebase, and there is no user dataset behind it at all — it's trained entirely against simulated learners (§7.6).

**State discretisation** (`observeState()`) turns a live session into a small, dense key from five bucketed signals plus the current ladder level itself:

- `acc` — accuracy, bucketed to 4 bands (<40%, 40–60%, 60–85%, 85%+)
- `lat` — latency ratio vs. that person's own baseline, 3 bands (fast/normal/slow)
- `cue` — average cue level used this session, 3 bands
- `pos` — position within the session (early/mid/late thirds)
- `trend` — accuracy trend over the last 3 sessions (improving/flat/declining)
- `lvl` — the ladder level the dominant dimension is *currently at* (0–4)

That last field is not decorative. The code comment on it is worth reproducing exactly because it documents a real early failure mode: without knowing the current level, "she's getting everything right" is ambiguous between "she's at the easiest setting, raise it" and "she's already at the hardest setting, leave it" — those two situations produce opposite correct actions from the same accuracy signal, and averaging them together during training produced an essentially arbitrary first policy. Adding `lvl` to the state key fixed it.

On device the policy is strictly **greedy (ε = 0)** — it never explores against a real person, because exploration means deliberately choosing a worse action to learn from, and doing that to someone with dementia is not acceptable. All exploration happens only in simulation (§7.6). If a state is unseen or `qtable.json` is absent, `chooseAction()` falls back to a transparent, hand-written rule (`ruleFallback()`) — the same rule the simulator is trained to beat — so the product remains fully adaptive with or without the trained table present.

### 7.5 The fuzzy-logic advisor (`engine/fuzzy.js`) and reconciliation (`decide()`)

A second, independent controller that runs **alongside** the Q-table, not instead of it — grounded directly in a literature review the team conducted (*Information* 17(1):96, 2026, doi:10.3390/info17010096, a 75-paper survey of dynamic difficulty adjustment). That review found pure rule/fuzzy systems adapt slightly *worse* than reinforcement learning on their own, but flagged one specific pattern — fuzzy logic combined with RL specifically to smooth "the inherent uncertainty and unpredictability in player behavior" — as a documented "successful combination." A person with dementia performing at 61% one day and 59% the next is exactly that kind of noisy signal, and the Q-table's hard bucket boundaries (`bucketAccuracy()`'s `< 0.6` cutoff, etc.) treat a 1-point difference across that boundary as a different state. Fuzzy membership functions have no hard edge, so they don't manufacture a false difficulty swing out of measurement noise.

Implementation is Sugeno-style: trapezoidal/triangular membership functions over accuracy, latency ratio and average cue level (`accuracyMemberships`, `latencyMemberships`, `cueMemberships`), an 8-rule base with fuzzy-AND (min) firing strength × a hand-set importance weight, and weighted-average defuzzification into a `[-1, 1]` score, thresholded at ±0.25 into `down`/`hold`/`up`. One real bug is worth recording here because it's the kind of thing that's invisible until you check the boundary arithmetic by hand: an earlier version of `trap()` returned 0 at its own plateau edges (`x <= a || x >= d → 0`), so a shoulder-shaped set like "cue dependency: none" evaluated to exactly 0 at `avgCue === 0` — the single most common value in a good session — meaning the fuzzy advisor silently abstained precisely when the read should have been most confident. Fixed by handling vertical edges (`a === b` or `c === d`) explicitly.

**Reconciliation (`decide()`, `policy.js`):** the two advisors' outputs are combined by a rule that is itself deliberately simple and auditable, not learned. First, two *clear-cut* cases are decided by hand-written rule rather than by either learner at all — "comfortably above the flow band, no cues, not slow → harder" and "below the flow band, or leaning on cues → easier" — on the reasoning that a coarse tabular Q-function is a poor arbitrator exactly at the obvious ends of the distribution (it carries real sampling noise from simulation, and being wrong there is the kind of wrong a person can feel — answering six in a row correctly and watching the game get *easier*). Inside the genuinely ambiguous middle, if Q-table and fuzzy agree, that action is taken; if they disagree, the result is `hold` — moving on a split vote is judged to invite oscillation, not resolve it. This whole scheme is the concrete, code-level meaning behind "the learned policy proposes, the safety layer disposes, one level up" — the same philosophy as L0's hard rails, applied to reconciling two different learners instead of bounding one.

Every decision has a plain-language explanation generator (`explain()`, `explainFuzzy()`, `explainDecision()`) wired to the caregiver's "How it adapts" screen — e.g. *"Q-table said 'up', fuzzy logic said 'hold' — split, so it was held steady. Increased 'Choices on screen'. 88% correct with occasional cues, answering quickly — comfortably above the target range, so there is room for a little more."* This is the app's direct answer to "is your AI a black box."

### 7.6 Offline training & measured results (`sim/train_qtable.py`, 269 lines, Python stdlib only)

The shipped `qtable.json`'s own metadata (re-read directly from the file, not from any deck):

```
episodes: 60,000        states: 482        actions: [down, hold, up]
flowBand: [0.75, 0.90]
                     in-flow-band rate    session-abandonment rate
  Q-learning policy         33.25%                  8.5%
  rule baseline             28.34%                 21.3%
note: "Trained against simulated learners only. Deployed greedily
       (epsilon=0). A real user never meets an exploring policy."
```

Read carefully: this is a simulation result, evaluated against the same class of synthetic learners the policy was trained against, not a clinical outcome — it demonstrates the learned policy measurably beats the transparent rule baseline **at the one thing this layer is responsible for** (keeping simulated sessions in the target accuracy band, reducing simulated abandonment), not that it improves memory or cognition. That distinction is stated explicitly on the Impact slide's disclaimer (docs/19) and should be kept explicit anywhere these numbers are quoted.

### 7.7 Why no heavier ML stack

Documented directly in the source comments, and worth stating plainly because it's a defensible engineering choice, not a missing feature: a 482-state Q-table trains in about a minute of laptop CPU with zero GPU and zero external dataset; Elo/IRT converges in tens of items where a neural approach would need thousands; both are fully interpretable to a non-technical caregiver. Given the actual constraints (cold-start per household, no population dataset, needs to run and explain itself on a low-end offline phone), a heavier model would add training cost, inference latency and opacity without a well-defined problem it would solve better.

## 8. Audio / voice pipeline (`audio/speak.js`)

**Architecture rule, stated in the file header: no runtime TTS API calls, ever, for fixed prompts.** Every fixed string used in the app is synthesized **once, at build time** (`scripts/generate-audio.mjs`, Sarvam/AI4Bharat/Bhashini) and shipped as an mp3 referenced by `content/audio-manifest.js`. `play(key, fallbackText)` looks the key up in a manifest, plays the cached `Audio` element, and only falls back to `synth()` (the Web Speech API, `SpeechSynthesisUtterance`, rate 0.82 for mild hearing-loss/processing-speed accommodation) if the pre-rendered clip is genuinely missing. Runtime synthesis is reserved for the one class of string that can't be pre-rendered — a person's own name (`playThen(key, fallbackText, tail)` speaks a fixed carrier phrase then synthesizes the dynamic tail).

The reasoning, again from the source comments: this works fully offline (the whole product thesis), plays back instantly on a cheap phone with no per-utterance inference latency, lets one native speaker approve a fixed set of ~40 clips once rather than trusting live synthesis quality every session, and means no API key, quota, rate limit or network failure can ever break a session mid-play.

## 9. Safe Walk

### 9.1 Origin and scope decision

Safe Walk's geodesic math and navigation-state logic were **ported from a teammate's separate, working Python prototype** (`silly-raman/backend/geodesic_engine.py`, `navigation_state.py`), after a full line-by-line audit (`docs/18-safe-walk-source-audit.md`) rather than being reinvented — the formulas are standard great-circle navigation, so the value of that audit was confirming correctness and finding what the Python version's own frontend (`navigation.js`) did that its backend engine didn't: GPS exponential-moving-average smoothing and GPS-accuracy-adaptive corridor widening, both of which were pulled into this app's `walkSession.js` as well.

Two feasibility questions were researched (not assumed) before building anything: **Google ARCore Geospatial API** was explicitly rejected — native-SDK-only with no web/JS binding, requires Street-View-density visual-positioning coverage that rural NER doesn't have, and needs Google Cloud billing; **bulk offline map-tile caching** was also rejected — both OpenStreetMap's Tile Usage Policy and the Google Maps Platform Terms of Service explicitly prohibit bulk pre-caching of tiles (live/interactive browsing is fine, downloading a region for offline use is not). This is why the design below has exactly the shape it has: two *tiers* of routing rather than one universal one, and a live map view that is strictly online-only rather than an offline map.

**Scope, confirmed by the user explicitly:** single-device only. A caregiver on a second phone checking in on a walk in progress remotely is out of scope for this build (it would need a real backend, which was deliberately not built) — the "live status" the caregiver console shows is a same-device, read-only window onto the same walk session, not a remote tracker.

### 9.2 Geodesic math (`engine/geodesic.js`)

Pure, synchronous, no I/O — standard great-circle formulas: `distance()` (Haversine), `bearing()` (initial compass bearing between two points), `crossTrack()` (perpendicular distance from a point to a great-circle segment — how far off-path someone actually is, as opposed to distance-to-next-waypoint, which stays large even while perfectly on-course on a long straight stretch), `withinCorridor()` (cross-track check plus a along-track margin check), and `signedBearingDeg()` (signed heading-to-target difference, used directly as the arrow's rotation angle).

### 9.3 Two-tier routing (`engine/routing.js`)

The corridor/hysteresis safety engine (§9.4) is deliberately indifferent to where its route came from — it just walks an ordered `{lat,lng}` list. That's what lets both tiers share one safety engine:

- **Tier 0 — fixed route.** The caregiver physically walks the route once, dropping pins at turns/landmarks (`RecordRoute` in `SafeWalkAdmin.jsx`); those waypoints are saved with the place. Zero network, works anywhere, always — but only from wherever it was actually recorded starting. This is the real safety net for a village with no signal.
- **Tier 1 — dynamic route.** A live call to the public OSRM foot-routing API (`router.project-osrm.org`), computing an actual turn-by-turn street path from the elder's **current** GPS position to the destination — real "from anywhere" routing, same as a commercial navigation app, but only available online. `getRoute({place, origin, online})` tries Tier 1 first when online, silently falls back to Tier 0 on any failure (timeout via `AbortController` at 6s, CORS hiccup, no route found, offline) — never a hard error, because Tier 0 is there.

One bug worth recording precisely because it's a subtle logic error, not a typo: an earlier version of `fixedRoute()` fell back to `origin = place.coord` when no waypoints existed yet — i.e. origin and destination at the same point, a zero-length "corridor." That collapses `withinCorridor()` to effectively a single point sitting *at* the destination, so the elder would read as "off corridor" for the entire walk from wherever she actually started, right up until she got close to arriving — a false alarm that would only ever fire in exactly the situation that matters most (a recorded route not existing yet). Fixed: `fixedRoute()` now returns `null` outright when there are no waypoints, and the UI honestly reports "no route found" rather than guiding with a route that doesn't reflect a real, caregiver-verified path.

The public OSRM demo server is explicitly documented (by OSRM itself) as rate-limited and not meant for production load — fine for a prototype/pilot; a real deployment should self-host OSRM against an OpenStreetMap extract for the districts actually served. This is flagged in the source as a known, scoped-out production task, not a silently-assumed detail.

### 9.4 The corridor/hysteresis state machine (`engine/walkSession.js`)

A `WalkSession` instance (held in a `useRef`, one per active walk) processes each GPS tick through `update({lat, lng, headingDeg, accuracyM, timestampMs})`:

1. **EMA smoothing**: `smoothed = smoothed*0.65 + raw*0.35` — a single noisy GPS fix doesn't read as a lurch.
2. **Arrival check** (15m radius) short-circuits everything else.
3. **Waypoint advance**: reaching within 12m of the current target waypoint advances to the next one (awarding a `CHECKPOINT_REACHED` garden bonus).
4. **Corridor check**: `corridorM = max(route.corridorM ?? 30, accuracyM + 18)` — the tolerance **widens automatically** when the phone's own GPS accuracy is currently poor, rather than staying fixed and generating false off-path alerts on a bad GPS day.
5. **Hysteresis timers**: staying outside the corridor for **12s** triggers one gentle voice prompt to the elder only (`GENTLE_REORIENT`); **35s**, or **75m** of cross-track distance (whichever comes first), escalates to `CRITICAL_DEVIATION` — a caregiver-visible alert plus a calming voice prompt asking her to stop and wait. The 12s/35s/75m numbers exist specifically so a brief GPS glitch or a moment's pause never triggers anything.

One bug here is a good example of catching a *wrong variable*, not a wrong formula: the critical-escalation check originally compared `distToTarget` (distance to the next waypoint) against the 75m extreme-distance threshold, when the actually-relevant quantity is `crossTrackM` (perpendicular off-path distance) from `withinCorridor()`. Someone walking correctly along a long straight segment can have a large `distToTarget` while being perfectly on-path — using it for the escalation check would have produced false criticals on long segments. Fixed by destructuring `{inside, crossTrackM}` and checking the right one.

### 9.5 Real compass heading (`hooks/useCompassHeading.js`)

The arrow's rotation needs the direction the *phone* is physically pointing, which is **not** the same thing as `Geolocation.coords.heading` — that's GPS "course over ground," which is `null` when stationary and meaningless on a device with a compass but no recent movement. This was an actual real-device bug caught by the user directly ("it not just 2d arrow which didnt change") — a Safe Walk build using `coords.heading` will show an arrow that never rotates for anyone standing still, which is most of the time someone is checking a direction. The fix uses the real magnetometer via the `deviceorientation` browser event: `e.webkitCompassHeading` on iOS Safari, `(360 - e.alpha) % 360` on Android/standard browsers, with `requestPermission()` for the iOS 13+ permission gate (which must be invoked synchronously inside a tap handler — `useSafeWalk.js`'s `choose()` calls it first, before anything async, specifically for this reason).

### 9.6 Architecture: the walk lives at the App root (`hooks/useSafeWalk.js`)

The single largest architecture fix in this feature, also caught by direct user testing: `App.jsx` mutually excludes the elder-facing screens and Caregiver mode — switching to Caregiver mode fully unmounts the Elder screen tree. If the GPS `watchPosition` lived inside the Safe Walk *screen* component (the natural first place to put it), switching to Caregiver mode mid-walk to "check on her" would silently unmount that component and kill the tracking — so checking on her would not actually work, even on the same phone. Fixed by lifting the entire walk lifecycle into `useSafeWalk(update, online)`, a hook called **once**, unconditionally, at the top of `App.jsx` (before the `ready` early-return, to satisfy React's rules-of-hooks), and passed down as a prop both to `<SafeWalk>` (the elder's active view) and to `<Caregiver activeWalk={safeWalk}>` (a **read-only window onto the same live session**, via `SafeWalkAdmin.jsx`'s `LiveStatus` component) — not a second tracker, not a poll, one shared state above both.

A related bug the same fix surfaced: `onPosition`/`logAlert`/`finishWalk`/`sos` are registered once as the long-lived `watchPosition` callback, so they close over `place` React state **as of registration time** — reading `place` directly inside them would read stale/null data from before a `setPlace()` call had taken effect on a later render. Fixed with a `placeRef` (the same pattern already used for `sessionRef`/`watchId`), consistent with how the codebase already handles this class of bug elsewhere.

### 9.7 Three view modes (`screens/SafeWalk.jsx`)

A single `WalkSession` status feeds three interchangeable, switchable views:

- **Arrow (default)** — a single big rotating arrow (`components/BigArrow.jsx`), `rotateDeg = status.arrowDiff` (the signed heading-to-target difference from §9.2). The simplest, lowest-cognitive-load option, and the one always available regardless of connectivity.
- **Map** — `components/LiveMap.jsx`, Leaflet + live OpenStreetMap tiles, `React.lazy`-loaded so its JS/CSS only downloads when this view is actually opened. Draws the route polyline, the destination marker, and a live "me" marker updated from `status.here`. **Online-only** (both because live OSM tiles need a connection, and per the researched decision against any offline tile caching, §9.1).
- **Camera** — `components/ArrowCameraView.jsx`, overlays the same `<BigArrow>` on a live `getUserMedia` camera feed (3-tier fallback for camera constraints, adapted from `silly-raman`'s `camera.js`). The source carries an explicit comment that this is **not** true spatial AR — no feature tracking, no depth sensing, the exact same GPS+compass math as the plain arrow view, just visually composited over a camera feed. Offered as an optional view, never the default, specifically so it's never mistaken for more than it is.

### 9.8 Caregiver-side admin (`screens/SafeWalkAdmin.jsx`)

`AddPlace` offers two ways to set a destination's coordinates — **"Use my current location"** (accurate, but requires physically standing there) or **"Pick it on a map"** (`components/PickOnMap.jsx`, tap/drag-to-place-pin on a Leaflet map, Guwahati fallback center, online-gated) — added after recognising that requiring a caregiver to physically visit all four destinations before they could be added at all was an unreasonable onboarding bar. `coordSource` (`'gps' | 'map'`) is tracked and surfaced back honestly in the UI ("Marked on the map — less exact than standing there, but good enough to get started."), rather than presenting both as equally precise.

`RecordRoute` walks the caregiver through recording a Tier-0 path once: start a GPS watch, drop pins at turns/landmarks, finish — computing and storing the total distance via repeated `distance()` calls across the recorded points plus the destination. It correctly tears down its `watchPosition` on unmount (a caregiver switching tabs mid-recording without an explicit Cancel/Finish would otherwise leave a GPS watch running silently in the background) — verified present in the current source.

## 10. Caregiver console (`screens/Caregiver.jsx`)

PIN-gated (prototype PIN `1234`, `App.jsx`'s `Pin` component), tabbed: onboarding/corpus, Safe Walk admin, "How it adapts" (the transparency screen described in §7.5), Report, Sync.

### 10.1 Onboarding & corpus building
Caregiver enters the elder's preferred name, language, community (drives §5.1's kinship table), education/independence/touchscreen-use (drives §7.2's cold-start), and consent fields (`consentAt`, `assentConfirmed` — a DPDP §9 guardian-consent field distinct from the elder's own ongoing assent). The corpus builder adds people/things/routines with photos, each downscaled and stored per §4.

### 10.2 Screen-time limit
`profile.dailyMinutesLimit` (default 20, `0` = off) is enforced softly: `screenTimeReached(state)` (`store/state.js`) sums real (non-demo) session durations for the current calendar day and compares against the limit; `App.jsx`'s `go()` re-checks it defensively before switching into any game screen. Deliberately **invisible to the elder** — no countdown, no lock screen, per the explicit product decision that a visible timer would itself be a source of anxiety/confusion for this population; the cap simply stops offering new game screens once reached.

### 10.3 Report (ASHA hand-off)
`Report` (`Caregiver.jsx`, `Report()` component) renders a one-page, printer-friendly summary and calls the browser's native `window.print()` — there is no PDF-generation library in the dependency tree; "print to PDF" is done via the OS/browser's own print dialog against print-specific CSS (`noprint` class hides caregiver-only chrome). Explicitly a deliberate act: nothing syncs or shares automatically — the report only leaves the device when a person chooses to print or show it.

### 10.4 Sync
`sync/mockCloud.js` — and its own header comment is worth quoting directly, because it states the architectural decision precisely: *"the hybrid online/offline UX is real, but the backend behind it is not."* `pushToCloud()`/`pullFromCloud()` write to a **second IndexedDB database on the same device** (`mindmitra-cloud-mock`), with a simulated 400–1100ms delay standing in for network latency. No network call is ever made. This is a demonstration of the intended architecture (a real backend, if built later, should sync only de-identified engagement/report data — never photographs, never personal facts, per docs/06 §4's v2 spec) rather than a claim that any data currently leaves the phone — and the caregiver UI states this explicitly in the Sync tab, not just in code comments.

## 11. Gamification (`engine/garden.js`)

A points system (`awardPoints()`, keyed to specific in-app events — `START_JOURNEY`, `CHECKPOINT_REACHED`, `DESTINATION_SAFE`, `DEVIATION_RESTORE`, plus per-game completion), a 4-stage "garden" visualization keyed off cumulative points, and a starting balance of 40 points rather than zero (a small, deliberate "a seed already sown" default so a brand-new install doesn't present as empty). Built emoji-free by design (plain-word/illustrated-tile stages, not emoji plant icons) — consistent with the app-wide no-emoji decision in §12.

## 12. Design & accessibility principles actually enforced in code

These aren't aspirational — each is a concrete, checkable property of the current source:

- **No text-only options, anywhere in a quiz.** Every game option renders through `components/Photo.jsx` (a real photograph) with a spoken prompt; this was a direct fix for real-device feedback that an illiterate user cannot use unlabelled text buttons.
- **No emojis.** Category icons in `SafeWalkAdmin.jsx`'s `CATEGORIES` list are the one remaining exception (visible in the source, §"Files" above) — everywhere else (garden stages, step icons, currency) emoji were explicitly replaced with real photographs or `lucide-react` line icons after direct user feedback ("I dont want emojis here, add action picture here also").
- **Real photographs over icons for concrete objects** — currency (§5.2), step-sequence routine photos (`step-ready-*.jpg`, `step-tea-*.jpg`), T3 objects — all real, licensed photographs rather than illustrations, again per direct feedback that abstract icons (the original umbrella icon, abstract currency icons) weren't recognisable.
- **Pre-rendered, not live-synthesized, voice for anything fixed** (§8), addressing "voice is not native even in online version."
- **Text scaling** (`profile.textScale`, 1 / 1.15 / 1.3) settable by the elder on her own Profile screen, applied via a CSS class on the app shell.

## 13. Content licensing

- `public/content/t3/ATTRIBUTION.md` — the 38 T3 object/place photographs are sourced under CC0/CC-BY-SA-compatible licenses (Wikimedia Commons and equivalent openly-licensed sources), attributed per-image.
- `public/content/currency/ATTRIBUTION.md` — the 9 currency photographs use RBI's own imagery, licensed under GODL-India (Government Open Data License – India).

Both attribution files exist and are populated (verified present in `public/content/`); no T3 or currency asset in the shipped build is unlicensed stock art.

## 14. Engineering log — real bugs found and fixed this session

Recorded here rather than left implicit, because it's evidence of the review process, not just its output. Each was found either from real-device testing feedback or from a direct manual re-read of the source (no build/test run was used, consistent with §"Verification method" above):

| # | Bug | Root cause | Fix |
|---|---|---|---|
| 1 | Safe Walk arrow never rotated for a stationary user | Used `Geolocation.coords.heading` (GPS course-over-ground: `null` at rest) instead of the real magnetometer | New `useCompassHeading.js` using `DeviceOrientationEvent`, with an `iOS requestPermission()` gate called synchronously from the tap handler |
| 2 | Caregiver mode silently killed live GPS tracking | The walk's `watchPosition` lived inside the Safe Walk *screen*, which `App.jsx` unmounts when entering Caregiver mode | Entire walk lifecycle lifted into `useSafeWalk()`, called once at the `App.jsx` root; Caregiver mode now gets a read-only view of the same session |
| 3 | `onPosition`/`logAlert`/etc. read stale `place` state | Long-lived `watchPosition` callback closed over `place` from its registration render, not the current one | `placeRef` (useRef), same pattern as the pre-existing `sessionRef` |
| 4 | Critical-deviation check could false-fire on a long straight segment | Compared `distToTarget` (distance to next waypoint) instead of `crossTrackM` (actual perpendicular off-path distance) against the 75m threshold | Destructure `{inside, crossTrackM}` from `withinCorridor()` and check the correct value |
| 5 | Newly-added place with no recorded route produced false immediate "off path" alerts | `fixedRoute()` fell back to `origin = destination`, a zero-length corridor | Return `null` when no waypoints exist; UI reports "no route found" honestly instead |
| 6 | Fuzzy advisor silently abstained on the two most common session values | `trap()` membership function returned 0 at its own plateau edges (`avgCue===0`, `accuracy===1.0`) | Explicit handling of vertical edges (`a===b`, `c===d`) |
| 7 | Difficulty appeared to never rise even after long correct streaks | L0 ladder capped movement to ±1 from session start in *both* directions | Changed to +2 up / −1 down, asymmetric on purpose (§7.1) |
| 8 | Same quiz questions repeated across sessions | `pickTargets()` walked a fixed, unshuffled order on every "extra lap" needed to fill a session from a small pool | Reshuffle on every lap; prefer capping session length to pool size |
| 9 | Missing checkpoint reward | `walkSession.js`'s final `NAVIGATING_NORMAL` branch always returned `gardenAction: 'STAY_ON_PATH'`, even on the tick a checkpoint was just reached | Now returns `'CHECKPOINT_REACHED'` when `justReachedCheckpoint` is true |
| 10 | Potential GPS-watch leak while recording a route | `RecordRoute` had no cleanup if the caregiver navigated away mid-recording without Cancel/Finish | `useEffect` cleanup calling `clearWatch()` on unmount (verified present in current source) |

## 15. Known gaps & explicitly out-of-scope items

- **L2 contextual bandit** (§7.3) — not built; roadmap only.
- **Cross-device Safe Walk** (a caregiver on a separate phone remotely tracking a walk in real time) — explicitly deferred by the user's own decision; would require a real backend, which the zero-backend privacy architecture (docs/06 §4) deliberately doesn't have.
- **Full offline routing engine** (turn-by-turn navigation computed on-device from a downloaded map, rather than Tier 0's fixed recorded routes) — explicitly researched and declined as its own, much larger engineering effort; Tier 0 (caregiver-recorded fixed routes) is the offline answer this build ships instead.
- **Self-hosted OSRM** — Tier 1 currently calls the public OSRM demo server, which OSRM's own documentation says is not meant for production load; a real deployment needs its own OSRM instance against an OpenStreetMap extract for the districts served.
- **Automated build/test verification** — blocked locally by antivirus interference with `npm`/network operations (see header); all correctness claims in this report come from direct source reading, not a passing build or test suite.

## 16. Where to look next

- `docs/16-how-the-ai-works.md` — the original design-time explanation of the adaptive engine (pre-dates the fuzzy-logic addition and the `decide()`/reconcile mechanism in §7.5, which is newer than that doc).
- `docs/18-safe-walk-source-audit.md` — the full line-by-line audit of the teammate's Python prototype that Safe Walk's geodesic/navigation logic was ported from.
- `docs/19-sih-submission-deck-content.md` — the corrected SIH submission deck content, written to match what's actually described in this report (as opposed to an earlier draft deck that described a different, unbuilt architecture).
