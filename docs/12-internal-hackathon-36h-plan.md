# 12 — The 36-Hour Plan (Internal Hackathon, Fri 11 – Sat 12 Sept 2026)

Owner: Team lead · Status: **ACTIVE — this supersedes the phase plan in [10](10-work-plan-and-roles.md) until Saturday**

> **CHECK FIRST, TODAY:** confirm with the organisers whether pre-built code is permitted. Most internal events allow you to arrive with an existing repo (you have one) and expect assets, research and design to be done beforehand. If pre-built code is *not* allowed, the plan still works — everything in the PRE block is research, content and design, which is always allowed — but tell the team now, not at 11pm on Friday.

---

## The only thing that matters

You cannot build the product in 36 hours. You can build **one vertical slice that proves every claim in your pitch.** Those are different goals and confusing them is how teams lose.

The demo spine, five beats, nothing else:

```
1. Airplane mode ON, visible, for the entire demo
2. Caregiver adds a REAL photo of a REAL person + taps a relationship   (60s)
3. That photo appears in the activity, instruction spoken in Assamese   (60s)
4. Answer wrong → cue fades in → nothing says "wrong"                   (30s)
5. Judge view: difficulty vector changed, with the reason in words      (90s)
6. Report generates and prints, with the disclaimer read aloud          (45s)
```

**If a task does not appear in those six lines, it is not being built this weekend.** Print this and put it on the table.

---

## Scope, cut to the bone

| Build | Don't build |
|---|---|
| **ONE engine: E3 Associate & Match** (photo → who is this?) | E2, E4, E5 |
| **E1 Sequence** only if E3 is completely done by Saturday 2am | Anything else |
| L0 bounded ladder + **L1 Elo** ability estimate | Q-learning *in the app* |
| Q-learning as an **offline simulator + a chart** | On-device RL, bandits |
| Pre-**recorded** Assamese audio (see below) | TTS API integration |
| Photo capture from gallery, downscaled | In-app camera, cropping UI |
| Caregiver onboarding: name, language, 5 people, 3 medicines | Places, routines, songs, memories |
| Judge/transparency view | Caregiver charts, trends |
| One-page report → `window.print()` | PDF library, export formats |
| Airplane-mode-safe everything | Any sync, any backend |

**The single highest-leverage cut:** do not integrate a TTS API. **Record a native Assamese speaker on a phone tonight.** Thirty-odd clips, ten minutes of recording, better quality than synthesis, zero integration risk, works offline by definition. If nobody on the team speaks Assamese, find one person on campus today — this is a 20-minute favour to ask.

---

## Storage decision — make it now, don't debate it Friday night

Use **`idb-keyval`** (~600 bytes, one-line API, stores Blobs natively). Not full Dexie — that's an hour of schema work you don't have. Not `localStorage` — it will hit quota the moment photos go in, and it will fail *during your demo*.

```bash
npm i idb-keyval
```

Downscale every imported photo to **≤512px on the long edge** before storing. Cap the corpus at 10 people.

---

## Who does what

Six people, split by file so nobody blocks anybody. Agree these boundaries before you start.

| # | Role | Owns these files | Deliverable |
|---|---|---|---|
| 1 | **You — lead** | `docs/*`, the deck | Deck v1 by Friday evening; runs the demo; answers Q&A |
| 2 | **Content** | `src/content/*.json`, audio manifest | Assamese script (~35 lines), records the speaker, writes the traceability table with #1 |
| 3 | **Frontend A** | `src/screens/Elder*.jsx` | Elder shell + E3 game screen + cue ladder |
| 4 | **Frontend B** | `src/screens/Caregiver*.jsx` | Onboarding, photo import, judge view, report |
| 5 | **ML** | `src/engine/*.ts`, `sim/*.py` | Elo + bounded ladder; then the Python simulator and its chart |
| 6 | **Data + QA** | `src/store.js`, test device | idb-keyval store, the data model, and **owns the airplane-mode test** |

Rule: **one person merges.** Person 6 is integration owner. Everyone else opens small changes against the files they own.

---

## Timeline

### TODAY — Thursday 10 Sept (evening, ~4 hours)

Nothing here is code you couldn't justify. It is research, content and design.

| Who | Task | Done when |
|---|---|---|
| All | Read [01](01-problem-and-evidence.md) §3 and §5, and [13](13-ps-traceability-matrix.md) | Everyone can state who the user is |
| 1 | Fill the traceability matrix ([13](13-ps-traceability-matrix.md)) against all 15 PS requirements | Table complete |
| 2 | **Find an Assamese speaker. Book them for tomorrow morning.** Write the 35-line script tonight. | Speaker confirmed |
| 2 | Collect 8–10 real photos of real people you can use (team members' families, with permission) | Photos in a folder |
| 3+4 | Agree the component boundary and the props contract between elder screen and engine | Written in a file |
| 5 | Write the Elo update function and the ladder spec on paper. It is ~40 lines. | Spec exists |
| 6 | `npm i idb-keyval`, write the store module, commit | Store reads/writes a Blob |
| All | **Sleep.** You are working overnight on Friday. | — |

### FRIDAY DAYTIME — before the hackathon starts

| Who | Task |
|---|---|
| 2 | **Record the audio.** 35 clips, name them by key, drop into `public/audio/as/`. |
| 1 | Deck slides 1, 2, 6 (title, traceability, references). These don't depend on the build. |
| 5 | Python simulator running; produce the Q-learning convergence chart as a PNG |
| 3, 4, 6 | Scaffold your screens with dummy data so Friday night is logic, not layout |

### FRIDAY NIGHT → SATURDAY — the build

Hour markers are from whenever you actually start. Adjust, but keep the gates.

| Block | Target | Gate |
|---|---|---|
| **H+0 → H+3** | Store working. Onboarding saves a photo + relationship. Elder shell renders. | **A photo added in caregiver mode appears on the elder screen.** Nothing else matters until this works. |
| **H+3 → H+7** | E3 playable end to end. Audio plays. Cue ladder levels 0–4. No failure states. | Play 6 items start to finish without touching the keyboard |
| **H+7 → H+9** | Elo + bounded ladder wired in. Difficulty actually changes. | Difficulty visibly steps down after two misses |
| **H+9 → H+11** | Judge view: difficulty vector, current state, action, **reason in plain words** | Screenshot-able |
| **H+11 → H+13** | Report page + print. Disclaimer present. Seed two weeks of fake history. | Prints to PDF |
| **H+13 → H+14** | **FEATURE FREEZE.** Airplane mode test, cold start, on the low-end phone. | Person 6 signs it off |
| **H+14 → H+16** | Bug fix only. Deck slides 3, 4, 5. | Deck done |
| **H+16 → H+18** | **Rehearse the demo three times.** Q&A drill. Sleep if there's any left. | Demo runs in 6 min, twice, no fumbles |

**H+13 feature freeze is the most important line in this document.** Teams lose internal hackathons by adding a feature at 6am and breaking the demo. Nothing new after freeze. Nothing.

---

## Rehearsal and fallbacks

Rehearse on the **actual device, in airplane mode, from a cold app start** — not on a dev server that's already warm.

Have these ready:

- **A screen recording of the working demo**, made at H+14. If anything breaks live, you play the video and keep talking. This has saved more hackathon teams than any amount of debugging.
- **Seeded state**, loadable in one tap, so you never depend on live data entry working under pressure.
- **The bad-day path (S6)** demoable. Being able to show your own safety circuit-breaker is worth more than a seventh feature.

---

## What you say about what isn't built

Do not hide it. Say it first, in one line, and it becomes a strength:

> "This weekend we built one engine end to end, offline, to prove the architecture. The other four are configurations of the same engine — that's the point of the design. The Q-learning layer is trained and validated in simulation; here's the convergence curve. We chose to ship one thing that genuinely works over five that demo."

A jury scoring **Implementation Approach & Methodology** rewards that answer. It reads as engineering judgement, which is what that criterion is measuring.

---

## Cut order if you fall behind

Agree now, while nobody is panicking.

1. E1 Sequence (already optional)
2. The report → show a static mockup instead
3. Seeded two-week history → show one session
4. Judge view polish → a plain table is fine

**Never cut:** airplane mode · the personal photo appearing in the game · difficulty visibly adapting with a stated reason · no-failure-state design.

Those four *are* the pitch.
