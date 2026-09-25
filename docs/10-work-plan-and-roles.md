# 10 — Roles, Work Plan and Gates

Owner: You (team lead) · Status: draft, needs dates

> **BLOCKING INPUT NEEDED: the actual submission dates.** The plan below is phase-based so it maps onto whatever your real deadlines are. Fill in the dates in §3 before circulating this to the team, because a plan without dates is a wish.

---

## 1. Roles

Six people. One owner per area — **shared ownership means nobody owns it.** Everyone contributes across boundaries; the owner is accountable for the deliverable and is the person who says "done."

| # | Role | Person | Owns | Primary deliverables |
|---|---|---|---|---|
| 1 | **Team & product lead** | You (4th yr) | The narrative, the deck, scope discipline, external comms | Deck; [01](01-problem-and-evidence.md), [03](03-gap-and-thesis.md), [08](08-feasibility-market-scale.md); every number verified; the pitch |
| 2 | **Cognitive design & content** | 4th yr | Game engine specs, content packs, claim boundary | Five engine specs; Assamese content pack; the may-say/may-not-say list ([07 §4](07-safety-privacy-ethics.md)) |
| 3 | **Frontend & UX** | 4th yr | Elder app, caregiver console, accessibility | Screen flows; accessibility spec **met not listed**; the three engines' UI; **veto power on UI** |
| 4 | **ML / adaptive engine** | Gajendra | L0–L3 adaptive stack, learner simulator, transparency screen | Adaptive design doc; Elo + bandit in TS; Python simulator + Q-table; the "where's the AI" answer |
| 5 | **Backend, data & offline** | 3rd yr | Dexie schema, content-pack format, report generator, offline guarantee | IndexedDB migration; pack loader; one-page report; CBAC/NPHCE verification |
| 6 | **Voice, i18n & QA** | 3rd yr | Language matrix, audio assets, test discipline | Sarvam/Bhashini evaluation; all pre-rendered Assamese audio; accessibility test pass; **runs the user testing sessions** |

**Two cross-cutting jobs that must be assigned to a named person, not to "the team":**

- **String reviewer** — reads every user-facing string against the [07](07-safety-privacy-ethics.md) guardrails. Two hours of work; prevents an accidentally cruel product.
- **Citation warden** — owns the references slide; purges the Studocu link and the unlabelled figures; every claim traceable.

Suggest role 2 takes the string review and role 1 takes the citations.

---

## 2. What each person does first

Before any code, everyone does these three things. Budget one working day.

1. Read [README](README.md), [01](01-problem-and-evidence.md), [03](03-gap-and-thesis.md), [04](04-users-and-scenarios.md)
2. Read the four Tier 0 papers in [02](02-reading-list.md) — roughly three hours; use the Cochrane plain-language summaries
3. Write one paragraph in the team channel: *what surprised me, and what I think we have wrong.* Genuinely — the point is to surface disagreement now, not in week three.

Then, in parallel, the six first tasks:

| Role | First task |
|---|---|
| 1 · Product | Verify every number in [01](01-problem-and-evidence.md) against source. Compute the NER 60+ dementia figure. Fill in dates below. |
| 2 · Cognitive | Write the E1, E2, E3 engine specs against the [05](05-solution-and-mvp.md) template |
| 3 · Frontend | Screen inventory + accessibility spec; get a low-end Android test device |
| 4 · ML | Adaptive design doc; then Elo in TypeScript (it is ~50 lines and unblocks everything) |
| 5 · Backend | Replace `localStorage` with Dexie and implement the [06 §6](06-technical-approach.md) schema. **Everything depends on this — do it first.** |
| 6 · Voice/QA | Sarvam Edge / Bhashini evaluation → the language support matrix. Recruit three older adults for testing. |

---

## 3. Phases and gates

Fill in real dates. A gate is not passed until the named artefact exists and someone other than its author has seen it.

### Phase A — Evidence and narrative → the idea deck

| Gate | Artefact | Owner | Date |
|---|---|---|---|
| A1 | All Tier 0 papers read; Tier 1 one-pagers in `docs/summaries/` | All | ____ |
| A2 | Every number in [01](01-problem-and-evidence.md) verified; NER figure computed | 1 | ____ |
| A3 | References slide rebuilt; Studocu and press-release citations purged | 1 | ____ |
| A4 | Deck v1 against the [11](11-ppt-storyboard.md) storyboard | 1 + 3 | ____ |
| A5 | **Red-team review** — two people attack the deck with the [09](09-risks-and-mitigations.md) questions | All | ____ |
| A6 | Deck final, exported to PDF, 6 slides, template unmodified | 1 | ____ |

**A6 is a hard external deadline. Everything in Phase A is subordinate to it.**

### Phase B — Foundation

| Gate | Artefact | Owner | Date |
|---|---|---|---|
| B1 | Dexie schema live; localStorage gone; survives restart | 5 | ____ |
| B2 | Content-pack format defined; one Assamese pack with audio | 2 + 6 | ____ |
| B3 | E1 Sequence end to end: cue ladder, floor mode, telemetry | 3 + 2 | ____ |
| B4 | L0 + L1 working; difficulty visibly adapting | 4 | ____ |
| B5 | Transparency screen showing the difficulty vector and reasons | 4 + 3 | ____ |
| B6 | **Demo gate: full offline session on the low-end device** | All | ____ |

### Phase C — Depth

| Gate | Artefact | Owner | Date |
|---|---|---|---|
| C1 | E2 and E3 shipped to the [05 §7](05-solution-and-mvp.md) definition of done | 3 + 2 | ____ |
| C2 | Caregiver onboarding complete in under 15 min, measured | 3 | ____ |
| C3 | Reminders firing locally; assistant answering from local data | 5 | ____ |
| C4 | Learner simulator running; Q-table trained and shipped | 4 | ____ |
| C5 | One-page report generating and printing | 5 | ____ |
| C6 | **First real user test — three people 65+.** Confusion log written. | 6 | ____ |

**C6 is the most important gate in the whole plan.** Do not let it slip. Everything we believe about this product is a guess until it happens.

### Phase D — Harden and rehearse

| Gate | Artefact | Owner | Date |
|---|---|---|---|
| D1 | Fixes from the C6 confusion log applied | All | ____ |
| D2 | Accessibility checklist ([04 §5](04-users-and-scenarios.md)) fully passed | 3 + 6 | ____ |
| D3 | Every string reviewed against the guardrails | 2 | ____ |
| D4 | Demo script rehearsed to 7 min, three times, on the real device | All | ____ |
| D5 | S6 (the bad day) demoable | 3 + 4 | ____ |
| D6 | README corrected to describe what actually exists | 5 | ____ |
| D7 | Q&A rehearsal — the four questions in [09](09-risks-and-mitigations.md), assigned and answered | All | ____ |

---

## 4. Cadence

- **Monday, 15 min:** what I finished, what I am doing, what is blocking me. Update the risk register.
- **Friday, 30 min — demo gate:** everyone shows their thing running on the phone. **A commit is not progress; a running build is progress.** If it does not run on Friday, it does not exist, and we say so out loud rather than quietly carrying it.
- **Async:** decisions get written into these docs, not left in chat. Chat is not memory.

---

## 5. Working rules

1. **One owner per file and per feature.** Anyone can raise a problem; the owner decides and is accountable.
2. **The cut line is real.** MUST/SHOULD/WON'T in [05 §5](05-solution-and-mvp.md). Adding to MUST requires removing something from it.
3. **No claim without a citation.** If it goes in the deck it goes in [01](01-problem-and-evidence.md) with a link first.
4. **Weekly running build, on the low-end device.** Non-negotiable.
5. **Write down every observed user confusion.** Our confusion log is both a design input and a slide.
6. **Disagree early and in writing.** The A5 red-team gate exists so that the hardest questions get asked by us before they get asked by a judge.
7. **Anything ambiguous becomes an `## Open questions` item** in the relevant doc, with an owner.

---

## 6. If we fall behind, cut in this order

Agree this now, while nobody is panicking. This ordering is chosen so that what survives is always a coherent, demoable product.

1. E4 and E5 engines → keep three
2. Q-learning layer (L3) → ship L0+L1+L2 and describe L3 as designed-and-simulated
3. ASR / voice input → keep pre-rendered TTS output, which is the part that matters
4. Contextual bandit (L2)
5. Second language pack
6. Co-play mode

**Never cut:** offline operation · the accessibility spec · personal content in the games · the report · the claim boundary · the C6 user test.

Those six are the product. Everything else is a feature.
