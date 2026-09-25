# 05 — The Solution and the MVP

Owner: Product lead · Status: draft, needs team sign-off on the cut line

---

## 1. The product, in one paragraph

> MindMitra is an offline-first Android app for a person living with mild-to-moderate dementia and the family member who cares for them. A caregiver spends fifteen minutes building a small, verified corpus of the elder's own life — faces, places, routines, medicines, songs. From that corpus the app generates short daily activities in the elder's own language, delivered as pictures and speech with no reading required. An on-device adaptive engine learns each person's working difficulty across several independent dimensions and keeps every session inside the narrow band where it is neither humiliating nor trivial. It reminds, it answers the same question patiently as many times as it is asked, and every fortnight it produces one honest page — engagement, function, caregiver strain — that an ASHA worker can carry into the health system. Nothing leaves the phone unless the family chooses to send it.

---

## 2. The four surfaces

| Surface | User | Design centre | Status |
|---|---|---|---|
| **Elder app** | U1 | Picture + voice, one task per screen, no failure states | MVP |
| **Caregiver console** | U2 | Setup in 15 min, daily upkeep under 30s, plain-language insight | MVP |
| **Health-worker view / report** | U3 | One page, zero data entry, printable | MVP (report only) |
| **Clinician / system record** | U4 | Longitudinal, ABDM-shaped | Post-hackathon |

---

## 3. Five engines, not twelve games

Our current 12-game list has good ideas and a fatal structure: twelve games means twelve interaction models, twelve sets of art, twelve QA surfaces, twelve places for the difficulty logic to diverge. With six people and a hackathon timeline it produces twelve half-built things.

Our own Part II notes already said this. Let us actually act on it.

**The reframe: build five interaction engines. Each engine takes a content pack and a difficulty vector and generates unlimited instances.** Twelve "games" then become configurations, most of them free.

### The mapping

| Engine | Interaction | Cognitive target | Our 12 games it absorbs |
|---|---|---|---|
| **E1 — Sequence** | Order N cards into the correct sequence | Executive function, functional sequencing, temporal ordering | Let's Cook, Sequence-a-Task, My Life Timeline, Prepare-For |
| **E2 — Find & Select** | Pick target items from a field of distractors, optionally to a numeric target | Selective attention, working memory, inhibition, everyday numeracy | Market Day, Name & Find, Market Money, Personal Memory Match (recognition mode) |
| **E3 — Associate & Match** | Pair an item from set A with the right item from set B | Semantic + associative memory, face-name binding, social memory | FaceMatch, Relationship Reasoning, Music Memory, Festival & Culture Match |
| **E4 — Categorise** | Sort items into 2–4 labelled bins | Semantic memory, categorisation, executive organisation | Sort & Categorise, Northeast Sorting & Categorisation |
| **E5 — Cued Recall** | Produce/choose an answer with progressively fading cues | Language, semantic memory, spaced retrieval | Complete the Saying, Reminiscence Journey prompts, name recall |

**Deferred to v2 (they need genuinely new interaction code, not configuration):**

- **Route Builder** — needs a map/spatial canvas. Real work, real value, wrong sprint.
- **Dhopkhel Sequence & Prediction** — needs animation and a prediction mechanic. Culturally the most distinctive thing on the list; keep it in the deck as the roadmap item, and if there is slack build it as an E1 variant with motion.
- **Reminiscence Journey as a full journey** — MVP ships it as E5 prompts plus a photo-and-story viewer, not a navigable world.

### Why this is a stronger claim, not a weaker one

*"We built twelve games"* invites the question *"how deep is each one?"*
*"We built five engines that generate personalised activity instances from a verified life corpus, so the content is unbounded and never repeats identically"* is an architecture claim. It is more impressive, more true, and more defensible.

### Engine spec template

Every engine is specified before it is coded. Owner: cognitive/content lead.

```
Engine: E{n} — {name}
Interaction:      one paragraph, unambiguous
Cognitive target: which domain, with the citation
Content contract: what the pack must supply (types, counts, media)
Difficulty vector: the independent knobs and their ranges (see 06)
Scaffold ladder:  cue levels 0-4, what each one shows/says
Success criteria: what counts as a completed item
Telemetry:        exactly which events are logged
Floor mode:       what this engine degrades to on the bad day (S6)
Failure handling: what happens on 1st, 2nd, 3rd consecutive miss
```

---

## 4. Content packs

Content is separated from engines so that the same code serves an Assamese tea-garden household and a Khasi one in Shillong.

| Tier | Source | Trust | Example |
|---|---|---|---|
| **T1 — Personal** | Caregiver-entered and verified | Highest; used first | Photo of her son; her route to Nalbari market; her tailoring work |
| **T2 — Community** | Locally validated pack per language/community | Medium; needs a named validator | Bihu songs, local festival foods, Bodo household objects |
| **T3 — Regional default** | Generic NER/India pack shipped with the app | Fallback only | Common vegetables, currency notes, generic kitchen items |

**Rule: never present T3 content when T1 exists for that slot.** The cold-start problem (a new user with an empty corpus) is solved by T3, and the app actively nudges the caregiver to replace T3 items with T1 ones as she goes — *"Adding a photo of her kitchen would make this activity better."*

**Cultural validation is a real task, not a checkbox.** For the hackathon: one Assamese pack, reviewed by at least one Assamese speaker outside the team. Write down who reviewed it. For deployment: a named community validator per pack, and a way for the community to flag content as wrong.

---

## 5. MVP scope — the cut line

The purpose of this section is to be able to say no later. Get the team to agree to it now, in writing.

### MUST — the prototype is not a prototype without these

1. **Caregiver onboarding** — profile, 5+ people with photos and relationships, 3+ places, medicines with times, language choice, consent
2. **Three engines working end to end** — **E1 Sequence, E2 Find & Select, E3 Associate & Match**. Three is enough to demonstrate the engine architecture; five is enough to look padded.
3. **Personal content actually driving the games** — the demo must show a photo the caregiver added appearing in an activity. This is the moment the whole pitch lands.
4. **The adaptive engine, visibly working** — with a **developer/judge view** that exposes the difficulty vector changing and *why*. If the AI is invisible, we get no credit for it.
5. **Assamese + English voice out (TTS)** for all instructions and feedback
6. **Reminders** — caregiver-set, firing locally, completion logged
7. **On-device assistant** — rule-based, answers the reminder/schedule/memory questions from local data only
8. **Full offline operation** — the demo includes turning airplane mode on and continuing
9. **Fortnightly report** — one page, printable/exportable, with the disclaimer
10. **The accessibility spec from [04](04-users-and-scenarios.md)** — actually met, not aspirationally listed
11. **Local persistence that survives app restart** — IndexedDB, not localStorage

### SHOULD — build if the MUSTs are done and stable

12. E4 Categorise and E5 Cued Recall
13. Assamese **voice in** (ASR) for simple answers
14. Caregiver trend charts
15. Co-play mode
16. Photo capture in-app rather than gallery-only
17. Second language pack (Bodo or Meitei)

### WON'T — explicitly out, and we say so in the deck as roadmap

- Any diagnostic or screening output
- Cloud LLM with access to personal data
- Face recognition
- VR (and we have [Indian evidence](https://doi.org/10.1186/s12877-025-06929-y) for why: 57.89% VR completion vs 100% tablet)
- ABDM/ABHA integration
- Multi-patient / institutional dashboards
- Wearables, GPS, fall detection
- Route Builder, Dhopkhel

> Our old deck's technical slide shows Neo4j, TimescaleDB, PostgreSQL, pgvector, S3, ONNX, Docker, CI/CD, satellite connectivity and GNSS. **We are going to build approximately none of that in this timeframe, and a judge who builds software will know it.** A smaller stack that demonstrably works beats a diagram of a stack that does not. See [06](06-technical-approach.md).

---

## 6. The demo script

Judges score what they see in the room. Rehearse this until it takes 7 minutes with no fumbling.

| # | Beat | Time | The point being made |
|---|---|---|---|
| 0 | **Airplane mode on, in front of them.** Leave it on for the whole demo. | 5s | Offline-first is real, not a slide |
| 1 | Caregiver onboarding — add a real photo from the phone gallery, tag a relationship | 60s | 15-minute setup, personal corpus |
| 2 | Hand over to elder view. First activity uses **that photo**. Instruction spoken in Assamese. | 60s | Personalisation + voice + literacy-free |
| 3 | Deliberately answer wrong. Show the cue fade in. Show that nothing says "wrong." | 45s | Dignity-preserving design |
| 4 | Open the judge view: show the difficulty vector, the state, the action taken and **why** | 90s | The AI, made visible. Do not skip this. |
| 5 | Simulate two weeks of history (preloaded), generate the report | 60s | Longitudinal record, the system gap |
| 6 | Read out the disclaimer line on the report | 15s | Clinical honesty as a feature |
| 7 | Ask the assistant "did I take my medicine?" — correct answer, offline, from caregiver data | 30s | Highest-value everyday feature |
| 8 | Accessibility: show 200% text scale still working, tap targets, contrast | 30s | We actually built for the user |
| | **Total** | **~6 min** | leaves buffer for questions |

**Two things to prepare for:**

- **"Show me it failing."** Have S6 (the bad day) demoable. Teams that can demo their own failure mode look far more serious than teams that can only demo happy paths.
- **"Where's the AI?"** Beat 4 answers this. Have the Q-table/policy visualisation ready and be able to explain the reward function in two sentences.

---

## 7. What "done" means per engine

An engine ships when all of these are true:

- [ ] Spec written and reviewed before coding
- [ ] Generates ≥ 20 distinct instances from a single content pack
- [ ] All difficulty knobs wired to the adaptive engine, none hardcoded
- [ ] Full cue ladder implemented (levels 0–4)
- [ ] Floor mode implemented
- [ ] Consecutive-failure circuit breaker implemented
- [ ] Every instruction has Assamese audio
- [ ] Passes the accessibility checklist in [04](04-users-and-scenarios.md)
- [ ] Telemetry events logged and visible in the judge view
- [ ] Works with airplane mode on, from cold start
- [ ] Tested by someone who did not build it, on a real low-end Android device

---

## Open questions

- [ ] Three engines or four for the MVP? Recommendation: **three, done properly.** Argue if you disagree.
- [ ] Do we ship a **judge/developer view** in the app itself, or a separate debug screen? Recommendation: in-app, behind the caregiver PIN, labelled "How MindMitra is adapting." It doubles as a genuine caregiver transparency feature, which is a nice answer to "is your AI a black box?"
- [ ] Who is our Assamese content reviewer, and by when? **This is a blocking dependency on the content pack. Name a person this week.**
