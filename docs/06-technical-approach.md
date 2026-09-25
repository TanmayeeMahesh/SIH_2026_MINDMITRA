# 06 — Technical Approach

Owner: ML lead + Backend lead · Status: draft, decisions marked

---

## 1. Principle: the stack must be smaller than the ambition

Our old technical slide lists Flutter, React, FastAPI, PostgreSQL, pgvector, TimescaleDB, Neo4j, ONNX, TFLite, S3, Docker, CI/CD, GNSS and satellite connectivity. We will build approximately none of it, and a judge who ships software will know that on sight.

A judge is far more impressed by **three components that visibly work offline on a cheap phone** than by a diagram with fourteen boxes. Every component below has to justify itself against the question: *does the demo break without it?*

### Things we are cutting, and the reason

| Cut | Why |
|---|---|
| **Neo4j** | The "personal world model" is 5–30 people and a handful of places. That is a JSON object, not a graph database. Using Neo4j for 20 nodes signals that we have not thought about it. |
| **TimescaleDB** | A table with a timestamp column handles a few thousand events per user. |
| **pgvector / RAG** | No retrieval problem exists in the MVP. The assistant reads structured local data, which is *more* reliable than RAG, not less. |
| **S3, Docker, CI/CD** | Not scored, not demoed, real time cost. |
| **GNSS / satellite** | Not in scope and not credible. |
| **Any cloud LLM in the runtime path** | Violates our own privacy claim ([07](07-safety-privacy-ethics.md)) and our offline requirement. |

---

## 2. The stack we are actually building

| Layer | Choice | Why this one |
|---|---|---|
| **Elder + caregiver app** | **React + Vite PWA → Capacitor for Android** | Code already exists; web tooling gives us the fastest iteration and the easiest demo (browser + phone). Capacitor gets us real Android notifications and filesystem access when we need them. |
| **Local storage** | **IndexedDB via Dexie** | The current prototype uses `localStorage`, which is synchronous, string-only and capped around 5–10 MB. It will die the moment a caregiver adds photos. **This is the first thing to change.** |
| **Media** | Blobs in IndexedDB, downscaled to ≤1024px on import | Keeps a full content corpus in the tens of MB |
| **Adaptive engine** | **Plain TypeScript** — Elo/IRT update, contextual bandit, Q-table lookup | None of these need an ML runtime. All are a few hundred lines and run instantly on any device. |
| **Q-table training** | **Python, offline**, exports JSON | Training happens on our laptops, never on the user's phone |
| **Speech out (TTS)** | **Pre-rendered audio assets** in the content pack + Web Speech API fallback | See §5 — this is the single most important practical decision in the voice layer |
| **Speech in (ASR)** | Sarvam / Bhashini when online; **always optional** | See §5 |
| **Reports** | Client-side HTML → browser print-to-PDF | Zero server, works offline, prints on the HWC printer |
| **Backend** | **None in the MVP.** FastAPI + Postgres only if/when sync is built | Not having a backend *is* the privacy architecture |

> DECISION NEEDED: React/Capacitor (recommended — code exists, faster iteration) vs Flutter (our old deck's claim). Switching to Flutter now costs roughly a week of the timeline and buys us little for a demo. **Recommendation: stay React, and update the deck.** Owner: frontend lead, decide by end of week 1.

---

## 3. The adaptive difficulty engine — the technical centrepiece

This is the part that has to be genuinely good. Read this section properly before writing any code.

### 3.1 First, the honest critique of "we'll use Q-learning RL"

Q-learning is the right instinct and the wrong plan as usually stated. Four problems, all fatal if ignored:

1. **Data starvation.** A user does roughly one session a day, six items per session — about 540 state transitions in three months. A modest tabular state space of a few hundred states × three actions gives you **one or two visits per state-action pair.** Tabular Q-learning needs orders of magnitude more to converge. Learning from scratch per user cannot work.
2. **The reward is delayed and noisy.** What we actually care about — did she keep playing for three months — is a signal that arrives far too late to credit any individual difficulty decision.
3. **The environment is non-stationary by definition.** The user is declining. Standard Q-learning assumes a stationary MDP; here the optimal policy drifts under us.
4. **Exploration is unsafe.** An ε-greedy agent deliberately takes bad actions to learn. For this population, a bad action means a humiliating failure experience for a person with dementia. **We may not explore on users.**

If a judge with an ML background asks "how many episodes does your Q-learning need to converge, and where do they come from?" — that question ends a lot of SIH projects. We should have the answer ready and, better, an architecture that never needed it.

### 3.2 What we build instead — four layers

The trick is to keep the reinforcement-learning framing (it is genuinely the right formalism) but move the exploration into simulation and put a deterministic safety layer underneath.

```
┌──────────────────────────────────────────────────────────────┐
│ L3  Q-LEARNING POLICY  (pre-trained offline, greedy on-device)│
│     Chooses: step up / hold / step down, per dimension        │
├──────────────────────────────────────────────────────────────┤
│ L2  CONTEXTUAL BANDIT  (on-device, Thompson sampling)         │
│     Chooses: which engine today, session length, break timing │
├──────────────────────────────────────────────────────────────┤
│ L1  ABILITY ESTIMATOR  (Elo / 1-parameter IRT, per dimension) │
│     The workhorse. Where the difficulty number actually       │
│     comes from. Converges in tens of items.                   │
├──────────────────────────────────────────────────────────────┤
│ L0  BOUNDED LADDER  (deterministic, non-overridable)          │
│     Hard safety rails. Nothing above can violate these.       │
└──────────────────────────────────────────────────────────────┘
```

**L0 — Bounded ladder (deterministic).** Every difficulty dimension is a monotone ordered ladder with hard rules that no learned policy may override:

- Never move more than **one step per session** on any dimension
- Never exceed a ceiling of *(best demonstrated level in the last 14 days) + 1*
- After **two consecutive misses**, step down immediately regardless of what the policy says
- After **three consecutive misses**, drop to floor mode and end the session (scenario S6 in [04](04-users-and-scenarios.md))
- Session one is always at a conservative default, never at a predicted level

This layer is why we can honestly say "our AI cannot harm the user." That is a strong sentence to be able to say.

**L1 — Ability estimation (the workhorse).** Treat each generated item as having a difficulty and each user an ability, **per dimension**, and update after every item with an Elo/Rasch-style rule:

```
θ_user ← θ_user + K · (outcome − expected)
expected = 1 / (1 + exp(−(θ_user − δ_item)))
```

Why this and not something fancier: it converges in **tens** of items rather than thousands, it is robust to noise, a fixed K-factor gives us graceful adaptation to genuine decline for free, and it is completely interpretable — we can show a caregiver a curve and say what it means. Most of our actual adaptation quality will come from this layer.

**L2 — Contextual bandit.** For the decisions where the reward really is about engagement rather than correctness — *which engine today, how long a session, insert a reminiscence break or not* — the action set is small and the reward (did she finish the session?) arrives within minutes. Thompson sampling over a handful of arms converges in tens of sessions. Appropriate tool, appropriate scale.

**L3 — Q-learning, trained where it is safe to explore.** This is how we keep the RL claim and make it true:

1. Build a **learner simulator** — a parameterised model of a person with dementia: per-dimension ability, within-session fatigue curve, frustration threshold, day-to-day variance, and a slow decline term. Sample a population of thousands of simulated learners with varied parameters.
2. Run millions of simulated episodes and learn a tabular Q-function over a small discrete state space.
3. **Ship the Q-table** (a few KB of JSON) as a warm start.
4. On device, act **greedily — ε = 0, no exploration on real people** — and fine-tune with a small learning rate as real data arrives.

Exploration happens against simulated users. Real users only ever see a policy that has already been vetted, bounded by L0. Say that sentence in the pitch.

**Proposed state space** (deliberately small so the table is dense):

| Feature | Buckets |
|---|---|
| Recent accuracy | 4 — <40%, 40–60%, 60–85%, >85% |
| Response latency vs personal baseline | 3 — fast, normal, slow |
| Cue dependency this session | 3 — none, occasional, heavy |
| Position in session (fatigue proxy) | 3 — early, mid, late |
| Trend over last 3 sessions | 3 — improving, stable, declining |

324 states × 5 actions = **1,620 Q-values.** Trivial to train in simulation, trivial to ship, trivial to visualise for the judge view.

### 3.3 Difficulty is a vector, not a level

This is the design point most teams miss, and it is worth making explicitly in the pitch.

A single "level 3" throws away the most clinically interesting information. A person may be entirely fine with six items but collapse when the distractors become *semantically* similar rather than merely visually different. Those are different cognitive stories. Tracking difficulty per dimension both adapts better and produces a far more useful report.

| Engine | Independent difficulty dimensions |
|---|---|
| **E1 Sequence** | set size (3–7) · semantic distance between adjacent steps · reference image shown/hidden · cue level · familiarity tier (T1/T2/T3) |
| **E2 Find & Select** | target count (1–4) · distractor count (2–12) · distractor similarity (perceptual → semantic) · list visible vs held in memory · numeric target on/off |
| **E3 Associate & Match** | pair count · option count · delay before response · cue level · familiarity tier |
| **E4 Categorise** | item count · bin count (2–4) · category abstractness · boundary ambiguity |
| **E5 Cued Recall** | cue level (0–4) · retention interval · retrieval type (recognition → cued → free) · spacing schedule |

### 3.4 The cue ladder

Shared across all engines, so the scaffold behaves consistently. This is also our error-handling mechanism — we scaffold rather than fail.

| Level | What the user gets |
|---|---|
| 0 | Nothing. Free response. |
| 1 | Category or context hint, spoken |
| 2 | First phoneme / first letter sound |
| 3 | Two-alternative forced choice |
| 4 | The answer, presented warmly as a shared moment, not a correction |

**Nobody ever reaches a state with no way forward.** Level 4 always exists. There is no losing.

### 3.5 The reward function

Get this wrong and everything above is worthless. Proposed:

```
R = w1·in_flow_band
  + w2·item_completed
  + w3·session_completed
  − w4·consecutive_failures
  − w5·cue_escalations
  − w6·session_abandoned
  − w7·distress_signal
```

`in_flow_band` is the key term. The general DDA and desirable-difficulty literature places the engagement sweet spot around a **70–85% success rate**. For this population we should bias it **higher — target 75–90%** — because the cost of failure is emotional rather than merely motivational. Set this as an explicit, named, tunable design parameter and be prepared to defend the choice; cite the [DDA literature review](https://doi.org/10.3390/info17010096).

Note the asymmetry in the weights: **failure should be penalised more heavily than under-challenge is.** A slightly-too-easy session for a person with dementia costs almost nothing. A humiliating one costs the whole intervention.

### 3.6 Cold start

Session 1 has no data. Do not guess.

1. Caregiver supplies three coarse inputs during onboarding: education level, current independence in daily tasks, and whether the elder has used a touchscreen before.
2. Map to one of three conservative starting profiles — deliberately biased **easy**.
3. The first two sessions are treated as calibration: wider difficulty exploration than normal *within* the L0 bounds, and results weighted more heavily in the Elo update (higher K).
4. Never show a calibration label to the elder. She is playing, not being tested.

### 3.7 Making it visible

Build the **"How MindMitra is adapting" screen** behind the caregiver PIN. Show the difficulty vector per dimension over time, the current state, the action the policy chose, and a plain-language reason: *"Sequencing set size reduced from 5 to 4 because the last two sessions needed more cues than usual."*

This screen serves three purposes at once: it is our answer to "where is the AI," it is a genuine transparency feature against the black-box objection, and it is the most useful thing in the caregiver console.

---

## 4. Offline architecture

### The rule

**Local is the source of truth. There is no sync in the MVP.** The network is used for exactly two optional things: downloading a content pack, and (later) sending a report. Neither is in the daily loop.

Not having a backend is not a shortcut we are apologising for. It *is* the privacy architecture, and it is what makes the offline claim true in code rather than only on a slide.

### What runs where

| Capability | On device, offline | Needs network |
|---|---|---|
| All five game engines | ✅ | — |
| Content generation from personal corpus | ✅ (deterministic templating) | — |
| Adaptive engine (Elo, bandit, Q-table) | ✅ | — |
| Reminders and notifications | ✅ (local scheduling) | — |
| Conversational assistant | ✅ (rule-based, local data) | — |
| Progress tracking, report generation | ✅ | — |
| Speech **out** | ✅ (pre-rendered assets) | only to generate new assets |
| Speech **in** | ⚠️ degraded / off | ✅ for good Indic ASR |
| Downloading a new language pack | — | ✅ |
| Sending a report to the HWC | — | ✅ (or print) |

### When sync arrives (v2)

Outbox pattern, last-write-wins with **caregiver device as authority**. Only derived report data syncs — **raw photos and personal facts never leave the device.** Sync is opt-in per household, with a visible switch.

---

## 5. Voice and language — where the real risk is

### What is actually available

| Component | Coverage | Notes |
|---|---|---|
| [Sarvam TTS](https://www.sarvam.ai/text-to-speech) | 11 Indian languages **including Assamese** | Multiple voices per language |
| [Sarvam Edge](https://www.sarvam.ai/products/edge) | **On-device** ASR + TTS + translation, 22+ languages | The most promising path to genuinely offline voice — needs evaluation for licensing and device requirements |
| Sarvam Saaras v3 | Streaming ASR, 22 languages, code-mixed | Cloud |
| [AI4Bharat Indic-TTS](https://github.com/AI4Bharat/Indic-TTS) | 13 languages incl. **Assamese, Bodo, Manipuri** | Open-source, self-hostable |
| [Bhashini](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage) | 22+ scheduled languages; **Khasi and Mizo** for some services | Government platform. Assam signed an MoU to bring **Assamese and Bodo** onto it. Strong for a government-facing deck. |
| Web Speech API | Browser-dependent | Usually **no Assamese voice**. Fallback only. |

### The decision that matters: pre-render the audio

**Do not call a TTS engine at runtime for fixed prompts.** Instead, generate every fixed instruction, feedback line and prompt as an audio file at *build* time using Sarvam or AI4Bharat, and ship those files inside the content pack.

Why this is the right call:

- Works perfectly offline, with zero on-device model
- Instant playback on a cheap phone; no inference latency
- Consistent, reviewable pronunciation — an Assamese speaker can listen to all of it once and approve it
- Costs a few MB per language pack

Runtime TTS is then only needed for genuinely dynamic strings (a person's name), where Web Speech or an on-device fallback is acceptable — and where, if it fails, the picture and the pre-rendered carrier phrase still carry the meaning.

### The honesty rule for speech input

ASR for a low-resource language, spoken by an elderly person, possibly with dysarthria, in a noisy village room, is going to fail — often. Any design where voice input is *required* will break in the field and, worse, will break in the demo.

> **Rule: voice input is always additive. Tapping always works. No task may be completable only by speaking.**

This is a limitation we should state proudly rather than hide. It shows we have thought about deployment reality.

### Language rollout

- **MVP:** Assamese + English. One pack, fully reviewed by an Assamese speaker outside the team.
- **v2:** Bodo or Meitei (both have AI4Bharat TTS).
- **Roadmap:** Khasi, Mizo, Nagamese — and be explicit that these are **genuinely low-resource** and will need community-recorded audio rather than synthesis. Saying so is a strength: it shows we know what "22 languages supported" does and does not mean in practice.

---

## 6. Data model (sketch)

```
Household
 └─ Elder(profile, language, prefs, accessibility settings)
     ├─ Person[]        {id, name, relationship, photo:Blob, pronunciation, verified:true}
     ├─ Place[]         {id, name, photo, significance}
     ├─ Routine[]       {id, name, ordered steps[], photos[]}
     ├─ Medication[]    {id, name, times[], caregiver_set:true}   ← never model-generated
     ├─ Memory[]        {id, title, text, media, approved_by, approved_at}
     ├─ AbilityState    {per engine: {per dimension: {theta, k, updated_at}}}
     ├─ PolicyState     {q_table_version, local_deltas, bandit_posteriors}
     ├─ SessionLog[]    {id, ts, engine, items[], outcomes, latencies, cues_used,
     │                   difficulty_vector, policy_action, policy_reason, abandoned}
     └─ CaregiverLog[]  {ts, strain_rating, notes, reminder_completions}
```

Three properties worth designing in from the start:

- **Provenance on everything.** Every personal fact carries who approved it and when. This is what lets us guarantee nothing is fabricated ([07](07-safety-privacy-ethics.md)).
- **`policy_reason` is stored, not derived.** We log *why* the engine changed difficulty at the moment it did. That is what powers the transparency screen and what will make debugging tractable.
- **One-button erase.** A single delete that removes the whole household record, including blobs. Required by DPDP and by decency.

---

## 7. The report

### What it contains

One page, three blocks, all engagement- and function-shaped, never score-shaped:

1. **Engagement** — sessions completed vs offered, streak, total minutes, trend arrow
2. **Function** — per cognitive domain, direction of travel in plain language: *"needed more cueing in sequencing tasks this fortnight than last"*
3. **Care context** — medication reminder completion, caregiver-reported strain, any flags

Plus, in a box that cannot be missed:

> This summarises app activity and is not a medical or diagnostic assessment.

### On the "government template" idea

Our original idea was to output the report in a government-recommended template. Worth doing, but **let us not claim more than we can verify.**

What we know: the **Community Based Assessment Checklist (CBAC)** is the form ASHAs already use for household NCD screening under Ayushman Bharat, covering people 30+ for hypertension, diabetes, cancers and TB ([NHSRC](https://nhsrcindia.org/node/741)). It is the reporting *idiom* an ASHA is fluent in. It is **not** a dementia instrument, and we have not yet been able to verify whether it carries any memory or elderly-cognition items.

**So the claim we make is:** *"the report is structured to the checklist idiom ASHAs already use under AB-HWC, prints on one page, requires no data entry from the worker, and is designed for future linkage to the ABDM/ABHA record."*

**The claim we do not make:** *"we generate the CBAC form."*

> BLOCKING TASK: someone reads the actual CBAC PDF and the NPHCE elderly service formats and reports back on whether any cognition item exists. Owner: backend lead. This determines how strongly we can phrase the alignment claim. Until then the deck says "designed to align with," not "aligned with."

---

## 8. First engineering actions (in order)

1. Replace `localStorage` with **Dexie/IndexedDB** and define the schema in §6. Everything else depends on this.
2. Build the **content-pack format** and one Assamese pack with pre-rendered audio.
3. Build **E1 Sequence** end to end against the engine spec, including the cue ladder and floor mode.
4. Build **L0 + L1** (bounded ladder + Elo). Ship a working adaptive product with no RL at all.
5. Build the **transparency screen** — as soon as L1 exists there is something to show.
6. Build the **simulator** in Python and train the Q-table. This runs in parallel and does not block the app.
7. Add **L2 and L3** on top of a system that already works without them.

The ordering matters: at every point after step 4 we have a demoable, working, adaptive product. If we run out of time, we ship a good product without Q-learning rather than a broken one with it.

---

## Open questions

- [ ] Evaluate **Sarvam Edge** properly: licensing, model size, minimum device spec, Assamese quality. If genuinely on-device, it changes the voice story substantially. Owner: voice lead, week 1.
- [ ] What is the minimum target device? Proposal: **Android 9, 2GB RAM, 720p.** Buy or borrow one and test on it weekly — not on a flagship.
- [ ] Do we need Capacitor for the demo, or is the PWA enough? PWA is faster to iterate; Capacitor is needed for reliable background notifications. Suggestion: demo the PWA, have Capacitor as a stretch.
- [ ] Fine-tuning the shipped Q-table on-device: worth the complexity for a hackathon, or ship the frozen table and describe fine-tuning as roadmap? Recommendation: **ship frozen, describe the fine-tuning design.** Honest and lower-risk.
