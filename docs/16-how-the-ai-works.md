# 16 — How the AI Actually Works (and why you don't need to train a model)

Owner: ML lead · Status: **implemented and measured** · Code: `mindmitra/src/engine/`, `mindmitra/sim/`

You said "training a model is not possible." You are right, and you don't have to. Nothing in MindMitra requires a dataset, a GPU, PyTorch, or a training run on your laptop that takes longer than a coffee.

This document explains exactly what runs, in the order you should explain it to a jury.

---

## 1. The one-sentence answer

> MindMitra's AI decides **how hard the next question should be**, separately for each person and separately for each dimension of difficulty, so that she succeeds about 80% of the time — because the evidence says that band is what keeps her playing, and playing is the only thing that produces benefit.

That is it. It is not a chatbot, not a classifier, not a diagnostic model. It is a **controller**.

---

## 2. Why difficulty is the AI problem worth solving

The causal chain, and every link has a citation:

```
correct difficulty → enjoyment → adherence (2+ sessions/week) → cognitive benefit
```

- [Mantell et al. 2025](https://pubmed.ncbi.nlm.nih.gov/40499156/): older and cognitively impaired adults find these games *less usable even when purpose-built and simple*, and **"generating the appropriate level of difficulty for each user is important for positive user experiences, specifically enjoyment."**
- [Cochrane CST 2023](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub3/full): the benefit — roughly a six-month delay in decline — appears at **two or more sessions per week**.

So the difficulty controller is not decoration bolted on to satisfy the words "AI/ML" in the problem statement. **It is the mechanism by which the intervention works at all.** Say exactly that.

---

## 3. The four layers

Each layer is real code in `src/engine/`. Each does a different job, and the ones underneath constrain the ones above.

```
L3  Q-LEARNING POLICY      policy.js + qtable.json    ← trained in simulation
L2  CONTEXTUAL BANDIT      (roadmap)
L1  ELO ABILITY ESTIMATE   elo.js                     ← the workhorse
L0  BOUNDED LADDER         ladder.js                  ← deterministic safety
```

### L0 — Bounded ladder (`ladder.js`). No learning at all.

Hard rules that nothing above may override:

- never move more than **one step per session**
- ceiling of *(best demonstrated level in the last 14 days) + 1*
- **two consecutive misses → step down immediately**, whatever the policy says
- **three consecutive misses → floor mode, end the session gently**
- session one always starts at a conservative default

This is why we can say *"our AI cannot harm the user"* and mean it literally. The learned policy proposes; L0 disposes.

### L1 — Elo / IRT ability estimate (`elo.js`). The workhorse.

Treat every question as having a difficulty and the person as having an ability, per dimension. After each answer:

```
expected = 1 / (1 + e^-(θ − δ))
θ ← θ + K · (outcome − expected)
```

That's the whole thing. Four lines of code.

- **Converges in tens of items, not thousands.** This is the crucial property.
- **No training data.** It learns from the person, live, from item one.
- **Handles decline for free** — a fixed K weights recent evidence more, so as she declines θ follows her down automatically.
- **Fully interpretable** — we can show a caregiver the number and say what it means.

The outcome is graded, not binary: `gradeOutcome()` gives 1.0 for an unaided correct answer and 0.2 for one that needed the heaviest cue — so a correct answer propped up by scaffolding doesn't inflate the estimate.

**Most of the real adaptation quality comes from this layer.** If you built nothing else, the product would still be genuinely adaptive.

### L2 — Contextual bandit. Roadmap, honestly labelled.

For choices where the reward is engagement rather than correctness — which activity today, how long a session. Small action set, fast feedback. Not built; say so.

### L3 — Q-learning (`policy.js` + `qtable.json`). Now built and measured.

---

## 4. Q-learning, concretely — and why no "model training" is involved

### What the model actually is

A **lookup table**. 324 possible states × 3 actions = 972 numbers. That's it. `qtable.json` is a few KB of JSON that gets `import`ed like any config file.

- No neural network
- No PyTorch, TensorFlow, or any ML library — `sim/train_qtable.py` uses **only the Python standard library**
- No GPU
- No dataset

### The state (5 things we can observe)

| Feature | Buckets |
|---|---|
| Recent accuracy | 4 — <40%, 40–60%, 60–85%, >85% |
| Response speed vs her own baseline | 3 — fast, normal, slow |
| Cue dependency this session | 3 — none, occasional, heavy |
| Position in the session (fatigue) | 3 — early, mid, late |
| Trend over the last 3 sessions | 3 — improving, stable, declining |

`4 × 3 × 3 × 3 × 3 = 324`. Deliberately small so the table stays dense.

### The actions

`down` · `hold` · `up` — one step on the dominant difficulty dimension.

### The reward

```python
r  = +1.0  if the predicted success probability lands in the 75–90% band
   + 0.3   if she got it right
   − 0.6   if she got it wrong
   − 0.4 × cues used
   − 6.0   if she abandoned the session      ← dominates everything
   − 0.05  for churn (changing level too often)
```

Note the asymmetry, and defend it if asked: **a slightly-too-easy session costs almost nothing; a humiliating one costs the whole intervention.** So failure and abandonment are weighted far more heavily than under-challenge.

### Where the data comes from — this is the key idea

A real user produces about **540 state transitions in three months**. Tabular Q-learning needs orders of magnitude more. Per-user learning from scratch is arithmetically impossible, and any team claiming otherwise hasn't done the sum.

So we don't learn from users. **We build a simulator of a person with dementia** (`sim/train_qtable.py`) — ability, within-session fatigue, a frustration threshold at which she puts the phone down, day-to-day variance, and a slow decline term — sample thousands of them with different parameters, and let the agent explore against those.

```python
class SimulatedLearner:
    self.ability            # true ability on the ladder
    self.fatigue_rate       # rises within a session
    self.frustration_thresh # consecutive misses before she quits
    self.noise              # day-to-day variance
    self.decline            # slow drift across sessions
```

**And this is the safety argument, which is the best line in the whole technical pitch:**

> Exploration means deliberately choosing bad actions to find out what happens. We may never do that to a person with dementia. So it happens against simulated learners. On the real device the policy runs **greedy — epsilon zero.** A real user never meets an untested policy.

### Run it

```bash
python sim/train_qtable.py     # ~40 seconds, standard library only
```

### What it produced (actual output, 60,000 episodes)

| Policy | Items in the 75–90% flow band | **Sessions abandoned** |
|---|---|---|
| Rule-based baseline | 26.8% | **21.3%** |
| **Q-learning policy** | **32.7%** | **7.7%** |

**Abandonment falls from 21.3% to 7.7% — a 2.8× reduction.** Since abandonment is the thing that destroys adherence, and adherence is the only route to benefit, that is the number to put on the slide.

Two honest caveats to state before anyone asks:
- **115 of 324 states were visited.** The rest are unreachable in practice. Unseen states fall through to the transparent rule in `policy.js`.
- **This is simulation, not a clinical result.** It shows the policy is sound against a modelled learner. It says nothing yet about a real person. Say that plainly.

---

## 5. Difficulty is a vector, not a level

The design point most teams miss, and it is worth 30 seconds in the pitch.

One "level 3" hides the interesting information. Someone may be entirely fine with six options but collapse when the distractors become *semantically* similar rather than just visually different. Those are two different cognitive stories, and they call for different adjustments.

So each game tracks a separate θ per dimension (`src/engine/ladder.js`):

| Who Is This? | Our Family |
|---|---|
| Choices on screen (4 → 9) | Empty places (1 → 3) |
| Task direction (name→photo → photo→name) | Piece type (photo → name) |
| Distractor similarity (low → high) | Choices in the tray (2 → 5) |

The **How it adapts** screen in caregiver mode shows all of them, live, with the reason for the last change in plain words.

---

## 6. Where else AI appears — and where we refused to use it

**Earns its place**
1. Adaptive difficulty (above)
2. Indic speech — Sarvam / Bhashini TTS, pre-rendered at build time (§7)
3. Deterministic personalisation — assembling activities from a caregiver-verified corpus
4. Trend detection on engagement, for deciding *when to tell the caregiver something changed*

**Deliberately not doing — and saying so is worth more than a fifth model**
- Diagnosis, screening or staging of dementia
- Face recognition on family photographs
- Emotion detection from face or voice — unreliable and ethically fraught
- A cloud LLM with access to personal health data
- Any generation of personal facts, medication times or medical advice

---

## 7. On Sarvam and Bhashini — you were right, with one correction

You're right that the APIs handle Assamese well and there's no need to record a human. I over-corrected. The real architectural point was never *human vs API* — it is **when the API gets called.**

`scripts/generate-audio.mjs` calls Sarvam or Bhashini **once, on your laptop, at build time**, and writes mp3 files into the content pack. The phone plays files. It never calls an API.

That buys:
- works in airplane mode, which is the entire product thesis
- instant playback on a 2GB phone; no inference latency mid-session
- one Assamese speaker listens to all ~22 clips once and signs off
- no API key, quota, rate limit or outage can break a live demo

```powershell
$env:SARVAM_API_KEY='xxx'; node scripts/generate-audio.mjs en
```

The manifest is written straight to `src/content/audio-manifest.json` — no copy-paste step — and the mp3s are precached by the service worker, so audio works in airplane mode.

### What happened when we actually ran it (10 Sep 2026)

| Language | Result |
|---|---|
| **English** | **22/22 clips generated.** Pipeline proven end to end, precached, offline. |
| **Assamese** | **Blocked:** `"Please request beta access to as-IN by contacting our support team."` (and `bulbul:v2` rejects `as-IN` outright — Assamese needs v3+) |

**Keep that error. It is a better argument than anything we could have written.** Assamese is a scheduled language with ~15 million speakers and it is still behind a beta waitlist at a leading Indic TTS vendor. That is precisely why the architecture pre-renders files instead of calling an API at runtime: the app does not care whether an mp3 came from a vendor, from Bhashini, or from a phone recording in a quiet room. A language no vendor supports is a recording session, not a research project.

Three routes to Assamese audio, in order of speed: **(1) record a native speaker** — ~10 minutes, works today; (2) Bhashini, free but needs registration; (3) request Sarvam beta access, free but not before Friday.

Until one lands, the app falls back to Web Speech — not a blocker for the build.

**The one place human recording is still the right answer** is Khasi, Garo and Mizo, where TTS coverage is poor to non-existent ([docs/15](15-ner-cultural-adaptation.md)). Because we pre-render rather than synthesise at runtime, a community can produce a working pack with a native speaker and a quiet room. A language with no TTS model is a recording session, not a research project.

---

## 8. Answering "where is the AI?" in 90 seconds

Open **Caregiver → How it adapts** and talk over it:

1. *"Difficulty isn't one number. Here are three independent dimensions, each with its own learned ability estimate."*
2. *"This is the last decision it made, and this is why —"* read the plain-English reason aloud.
3. *"Underneath it there's a deterministic safety rail. Two misses in a row and it steps down regardless of what the policy wants. Three and it stops the session. The learned policy proposes; the rail disposes."*
4. *"The Q-table was trained on 60,000 simulated episodes because a real user only generates about 540 transitions in three months — nowhere near enough to learn from. In simulation it cuts session abandonment from 21% to 8%."*
5. *"And exploration only ever happens against simulated learners. A real person with dementia never meets an untested policy."*

If they push on rigour, the honest close: *"That's a simulation result, not a clinical one. The number we'd actually need to measure in a pilot is retention at week 12."*
