# 19 — SIH 2026 Idea Submission: Deck Content

Owner: Product lead · Status: draft content for the official 6-slide SIH template (docs 21, current-PPT PDF, superseded by this)

This is the **content source of truth** for the government SIH Idea Submission PPT. It follows the official template's mandatory section headers exactly (`SIH2026-IDEA-Presentation-Format.pdf`) — those headers and the 6-slide cap are not optional, per the template's own instruction slide. Everything here is either already cited in docs/01–18 or drawn directly from the shipped codebase (`mindmitra/src/`). Nothing here describes anything that wasn't actually built.

**Format rules baked in throughout:** no paragraphs, points/diagrams over prose, ≤6 slides including title, template headings unmodified, exported to PDF only.

---

## Slide 1 — Title Page

| Field | Content |
|---|---|
| Problem Statement ID | **26003** |
| Problem Statement Title | AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region |
| Theme | **MedTech** |
| PS Category | **Software** |
| Team ID | *(fill in — from SPOC)* |
| Team Name | **MindMitra** |
| College | Vidyashilp University |

---

## Slide 2 — Idea Title / Proposed Solution

**This slide was almost entirely problem-statistics in the current draft. The template scores THIS slide on the solution — detailed explanation, how it addresses the PS, innovation/uniqueness. Problem gets 2–3 lines, solution gets the rest.**

### Idea title (large, top of slide)
> **MindMitra — offline, voice-first cognitive care built around one elder's own life.**

### The problem, compressed to 3 numbers (not a table, not a chart — just three lines)
- **1 in 10** people with dementia in India ever get diagnosed
- **89%** of psychiatrist posts vacant in Assam (Arunachal 90%)
- **12.2%** prevalence among those with no formal schooling vs **1.7%** with tertiary education — the modal patient is a rural, non-literate woman, not an edge case

### The solution — detailed explanation
A caregiver spends **15 minutes** building a verified corpus of the elder's own life — faces, places, routines, medicines — entirely on-device. From that corpus, **three interaction engines** (not scripted games) generate unlimited activity instances, delivered as **picture + speech only, zero reading required**:

- **E1 Sequence — "In Order"**: reorder the real steps of her own daily routine (tap-to-select, no drag gestures — tremor-safe)
- **E2 Find & Select — "Find It" / "Market Day"**: locate named items in a field of distractors; a numeracy variant for everyday currency handling, using RBI's own openly-licensed note imagery
- **E3 Associate & Match — "Who Is This?" / "Our Family"**: face–name and relationship recognition from her own photos

An **on-device adaptive engine** (see Slide 3) keeps every session inside the 75–90% success band — the band the evidence says produces enjoyment and adherence, not an arbitrary target. A **Safe Walk** module extends the same safety philosophy to physical wandering: GPS + real compass tracking a caregiver-verified route, with a gentle 12-second grace window before any alert, escalating to the caregiver only past 35 seconds or 75 metres off-path.

Every fortnight, one honest, non-diagnostic page — engagement, function, caregiver strain — goes to the ASHA worker. **Nothing leaves the phone unless the family chooses to send it.**

### How it addresses the PS — direct mapping (one line each)
- Games for memory/attention/routine recall/object recognition → **E1/E2/E3 engines**, generated from her own life, not stock content
- AI/ML to adapt difficulty → **4-layer adaptive engine**, safety-bounded
- Multilingual, voice-assisted, culturally familiar → **picture+speech primary channel**; kinship model is a **data file per community**, not hardcoded (Khasi/Garo matrilineal households are structurally different from Assamese ones — the app doesn't assume one culture for all of NER)
- Reminders, caregiver/health-worker monitoring, offline operation, simple UI → **all shipped**, detailed on Slides 3–4

### Innovation & uniqueness — what's actually novel here
1. **Personal-corpus content, not a regional theme pack.** The closest real competitor (Memory Lane Games, SAP/EY-backed) personalises from a persona profile in the cloud. MindMitra generates from a caregiver-**verified**, on-device corpus — her actual photographs, not a matched stock image.
2. **Three-tier content model (T1 personal → T2 community → T3 regional default)**, so the same code serves an Assamese household and a Khasi one without a rewrite — and the app **actively nudges** the caregiver to replace generic content with her own as she goes.
3. **Difficulty is a vector, not a level.** Each engine tracks 2–3 independent difficulty dimensions (e.g. field size vs distractor similarity) — a person can be fine with 6 choices but collapse on semantic similarity, and a single "level 3" would hide exactly that.
4. **A hybrid Q-learning + fuzzy-logic policy**, not either alone — see Slide 3 for why, and the measured result.
5. **Genuinely offline-first**, verified by literally turning on airplane mode mid-demo — because the clinical requirement (≥2 sessions/week for benefit, in a low-connectivity village) and the privacy requirement point the same direction.

**Simple flow diagram** (5 boxes, matches existing MindMitra visual style):
```
Caregiver builds verified          3 engines generate personal
life corpus (15 min)      ─────►   activities, picture + voice
                                              │
                                              ▼
                                  Adaptive engine (L0-L3 + fuzzy)
                                  holds every session in flow band
                                              │
                      ┌───────────────────────┴──────────────────┐
                      ▼                                          ▼
          Reminders + on-device assistant              One honest page to
          + Safe Walk (fully offline)                  the ASHA worker
```

---

## Slide 3 — Technical Approach

**This is the slide that must not overclaim. Everything below is in the shipped repo — no RAG, no knowledge graph, no cloud LLM, no ARCore.**

### Stack actually built (7 items, not 14)
React + Vite PWA (Capacitor-ready) · IndexedDB (Dexie-pattern, zero-backend) · plain TypeScript adaptive engine · Python offline learner-simulator (stdlib only, no GPU) · Sarvam/AI4Bharat/Bhashini — pre-rendered Indic audio, not runtime API calls · client-side HTML→PDF report · Leaflet + live OpenStreetMap tiles, the **one** genuinely online-only piece (Safe Walk's optional live map)

> One line under it: *"Deliberately small. Nothing in the daily loop needs a network or a server."*

### The adaptive engine — 4 layers + a fuzzy-logic advisor (the centrepiece)
```
L3  Q-LEARNING POLICY        trained offline in simulation, greedy on-device
     + FUZZY-LOGIC ADVISOR   soft-boundary second opinion; disagreement → safer wins
L2  CONTEXTUAL BANDIT        which activity, how long              (roadmap)
L1  ELO / IRT ABILITY        per-dimension estimate; converges in tens of items
L0  BOUNDED LADDER           deterministic safety rails — nothing above can override
```

- **Why not pure Q-learning:** a real user generates ~540 state transitions in 3 months — nowhere near enough to learn from, and exploration on a live dementia patient means deliberately causing bad experiences to learn. **So exploration happens only against thousands of simulated learners; the on-device policy is greedy, ε=0 — a real person never meets an untested policy.**
- **Why add fuzzy logic:** the literature review this is built on (*Information* 17(1):96, 2026, 75-paper survey) found pure fuzzy/rule-based systems adapt slightly worse than RL alone — but a fuzzy+RL **hybrid** was rated a "successful combination" specifically for smoothing noisy, day-to-day performance swings. That's exactly what this does: soft membership functions replace hard bucket cutoffs, and when the Q-table and the fuzzy advisor disagree, **the safer action always wins.**
- **Measured result** (60,000 simulated episodes): session abandonment fell from **21.3% (rule-based) → 7.7% (Q-learning policy)** — a 2.8× reduction. Since abandonment is what destroys the ≥2-sessions/week adherence the whole clinical benefit depends on, that's the number that matters.

### What runs offline — a tick column
Games ✅ · content generation ✅ · adaptive engine (incl. fuzzy layer) ✅ · reminders ✅ · on-device assistant ✅ · reports ✅ · speech output ✅ · **Safe Walk corridor tracking & alerts ✅** (GPS + real device compass, caregiver-recorded routes) · speech input ⚠️ optional · live street map / dynamic routing = the one online-only enhancement

### Safe Walk, briefly — the honest version
GPS + compass (not ARCore — researched and deliberately rejected: native-SDK-only, needs Street-View-density visual positioning that doesn't exist in rural NER, and real Google Cloud billing). A caregiver walks the actual route once; the app checks live position against that verified corridor with a **12-second grace window** before any prompt, escalating to the caregiver only past 35s or 75m off-path. Online mode adds real turn-by-turn routing (OSRM) as an enhancement — the safety-critical part never depends on a connection.

---

## Slide 4 — Feasibility and Viability

**Lead with cost — this criterion is explicitly weighted "(In terms of Cost)" and the current draft has zero rupee figures.**

### Cost — three numbers
- **₹0** — technology licences, cloud infrastructure, hardware (open-source stack, runs on the caregiver's own phone, no server in the daily loop)
- **₹0** — marginal cost per additional household
- **₹4–6 lakh** — to a deployable v1: 6 students × 6 months, exactly what the SIH deployment framework already funds at ₹10–15k/month/student

> *"The architecture chosen for clinical reasons (offline-first, no server) is also the cheapest thing we could have built."*

### Feasible because the hard parts are already solved elsewhere
- **Intervention**: Cochrane evidence — cognitive stimulation, 37 RCTs, 2,766 participants, benefit ≈ 6-month delay in decline at ≥2 sessions/week
- **Delivery model**: Goa RCT (Dias et al. 2008) — lay health workers delivering home dementia care in India, since scaled state-wide
- **Rails**: ASHA network, AB-HWCs, NPHCE, Bhashini — all pre-existing
- **Technology**: Indic TTS available today (Assamese confirmed working end-to-end); zero GPU anywhere in the pipeline

### Challenges named first, honestly — 3-column table

| Risk | Mitigation |
|---|---|
| **Adherence — will they keep using it?** *(named as our own biggest risk)* | Calibration is the core mechanism, not a feature; sessions capped 5–10 min; caregiver burden budget <15 min setup, <30s/day; retention at week 12 is the primary pilot outcome |
| We are not our user (6 engineering students, not a 74-year-old non-literate woman) | Accessibility spec tested, not just written; low-end device (Android 9, 2GB RAM) target; real user testing before any claim ships |
| Low-resource ASR will fail | Voice input always additive — tapping always works; all output audio pre-rendered so TTS failure can't break a live session |
| NER is not one culture | T1 personal → T2 community → T3 regional tiering; kinship model is a **content-pack data file**, not code (Khasi/Garo matrilineal households need a genuinely different default, not a translated string) |
| Capacity to consent | DPDP Act 2023 §9 guardian consent **+** ongoing assent from the elder herself — two layers, because one alone isn't ethically sufficient |

---

## Slide 5 — Impact and Benefits

### Four beneficiaries, one measurable claim each

| Beneficiary | Benefit | The number |
|---|---|---|
| **The elder** | Structured cognitive engagement in her own language | Cochrane: benefit ≈ **6-month delay** in expected decline, at ≥2 sessions/week |
| **The caregiver** | Reduced repetition load, structure, less isolation | Zarit burden **47.8 → 38.0** in the Goa lay-worker RCT |
| **The household** | Avoided crisis cost | Dementia costs a household **~US$571/yr ≈ 20%** of annual health spend |
| **The health system** | First longitudinal record this patient has ever had | Starts closing a **~90%** treatment gap |

### Prevention hook
Lancet Commission 2024: **45%** of dementia is potentially preventable across 14 risk factors. This touches exactly **two** — low education and social isolation — and claims no more than that.

### The line that will be remembered
> *"MindMitra is a cognitive-stimulation and caregiver-support tool. It is not a diagnostic test or a medical device. We do not claim to improve memory — the best available meta-analysis of serious games found no memory benefit — and we do not claim to slow disease."*

---

## Slide 6 — Research and References

*(Trim to whichever 10–12 fit; every one already vetted against docs/02 Part E — no press releases, no Studocu, no protocol described as a result.)*

**Burden & epidemiology**
1. Jin Y, Crimmins E, Langa K, Dey A, Lee J. Prevalence of dementia in India: national and state estimates. *Neuroepidemiology*, 2023. [PMC10038923](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/)
2. Lee J et al. Prevalence of dementia in India: national and state estimates from a nationwide study. *Alzheimer's & Dementia*, 2023. doi:10.1002/alz.12928

**Care gap & delivery**
3. Dias A, Patel V. Closing the treatment gap for dementia in India. *Indian J Psychiatry*, 2009. [PMC3038542](https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/)
4. Dias A et al. Effectiveness of a home care program for caregivers of persons with dementia in developing countries: an RCT from Goa, India. *PLoS ONE* 3(6):e2333, 2008.
5. Caregivers' experiences, challenges and needs in India: a scoping review. *BMC Health Services Research*, 2024. doi:10.1186/s12913-024-12146-x

**Intervention evidence**
6. Woods B et al. Cognitive stimulation to improve cognitive functioning in people with dementia. *Cochrane Database Syst Rev*, 2023. CD005562.pub3
7. Digital technology-based serious games for older adults with MCI: meta-analysis of RCTs. *Age and Ageing* 54(4), 2025. doi:10.1093/ageing/afaf080
8. Livingston G et al. Dementia prevention, intervention and care: 2024 report of the Lancet Commission. *The Lancet*, 2024.

**Design & methods**
9. Mantell R et al. User experience and usability of game-based cognitive assessments for older people. *JMIR Aging* 8:e65252, 2025.
10. Yu TKC et al. Usability of the coach-supported dementia prevention app ENHANCE. *JMIR Aging* 9:e92800, 2026.
11. Dynamic difficulty adjustment in serious games: a literature review. *Information* 17(1):96, 2026. doi:10.3390/info17010096
12. Bhargava Y et al. The CARE study protocol: game-based cognitive assessment in MCI in India *(ongoing protocol, not a completed result)*. *BMC Geriatrics* 26:188, 2026.

---

## What changed from the current draft, and why

| Slide | Current draft problem | Fixed to |
|---|---|---|
| 1 | Team ID blank | Flag to fill — only actual blocking gap |
| 2 | ~90% problem stats/table/chart, ~10% actual solution — wrong slide for that content, and two full paragraphs | Solution-forward, 3-line problem hook, innovation explicitly named, no paragraphs |
| 3 | Describes Agentic RAG, Knowledge Graph, pgvector, cloud LLMs, "AR core" — **none of this was built** | Real 4-layer engine + fuzzy logic, real measured result, honest ARCore rejection reasoning |
| 4 | Generic bullet labels, zero cost figures despite "(In terms of Cost)" being explicit in most rubrics | ₹0/₹0/₹4–6L lead, risks named first-person, cost-effectiveness argument |
| 5 | "Spatial Navigation (AR/VR)" contradicts the explicit WON'T-build-VR decision (Indian evidence: 57.89% VR completion vs 100% tablet); no disclaimer line | Removed AR/VR framing, added the four beneficiary numbers + the honesty disclaimer |
| 6 | Reasonable already | Trimmed/kept, unlabelled "sih_git_hub" link removed |
| (extra 7th slide) | An 8th "Caregiver Onboarding" appendix slide exists beyond the hard 6-slide cap | Cut for submission — template says "up to six (6)," no exceptions, no appendices |
