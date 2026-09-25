# 11 — Deck Storyboard

Owner: Product lead · Status: **revised against the Vidyashilp jury rubric**

Six slides, including the title. The SIH template's section headings and bullet pointers **may not be changed** — instruction 5 in the template is explicit. So we work inside those headings. Export to PDF; no PPT or DOC is accepted.

---

## Budget your effort against the rubric

The jury scores out of 100 across seven weighted criteria. Effort should follow the weights, not our enthusiasm.

| Criterion | Weight | Where it is earned | Our state |
|---|---|---|---|
| **Understanding of the Problem Statement** | **25%** | Slide 2 traceability matrix ([13](13-ps-traceability-matrix.md)) + the evidence in [01](01-problem-and-evidence.md) | **Strong** — this is where the research pays off |
| **Innovation & Originality** | **20%** | Slide 2 differentiators + slide 3 adaptive engine; the gap analysis in [03](03-gap-and-thesis.md) | **Strong**, if we say what is *new* rather than what is *good* |
| **Relevance & Clarity of Solution** | 15% | Slide 2 headline and diagram | Good |
| **Technical Feasibility (in terms of COST)** | **15%** | Slide 4 — the cost model in [14](14-cost-model.md) | **Was missing entirely.** Now our second-strongest slide. |
| **Implementation Approach & Methodology** | 10% | Slide 3 stack + build order | Good — and "we shipped one engine properly" is the right answer here |
| **Potential Impact & Scalability** | 10% | Slide 5 | Good |
| **Clarity & Quality of Presentation** | 5% | Format adherence, ≤6 slides, PDF | Cheap marks — do not lose them |

**Two conclusions.** First, *Understanding* (25) + *Innovation* (20) = **45% of the total**, and both are won by the research work rather than by the prototype. Second, the parenthetical *"(In terms of Cost)"* on criterion 4 is a specific instruction we would have missed. Slide 4 now leads with three rupee figures.

Note also the qualitative pillar **"Complexity — depth of problem, addressed with an elegant (not bloated) approach."** That is an explicit warning against the fourteen-box stack diagram. Five engines absorbing twelve games, and six modules covering eight requirements, is exactly the elegance being asked for. Show the compression.

### Jury note

There is **a professor from Meghalaya** on the panel. Read [15](15-ner-cultural-adaptation.md) before finalising any slide that says "culturally relevant." Meghalaya sits at 8.43% prevalence — the national average — so any "NER has the worst burden" phrasing is wrong specifically about their state, and Khasi/Garo matrilineal kinship breaks our default caregiver assumption. Handled properly this is a scoring opportunity on both *Understanding* and *Innovation*.

---

## What is wrong with the current deck

Fix these before adding anything new.

| Slide | Problem | Fix |
|---|---|---|
| 1 · Title | **Team ID is missing** — the template requires it | Add it |
| 3 · Idea | Four dense lines of prose above the fold. The template says avoid paragraphs. | Cut to one sentence plus a diagram |
| 3 · Idea | Two charts with the literal text **"link the graphs"** left in, and no source captions | Caption both with full citations, or remove them |
| 3 · Idea | The architecture diagram is doing the work of the solution slide, and is too dense to read projected | Simplify to five boxes; move detail to slide 4 |
| 4 · Technical | Fourteen technologies, several of which we will not build (Neo4j, TimescaleDB, pgvector, S3, GNSS, satellite) | Show what we are building. A judge who ships software will spot the padding. |
| 5 · Feasibility | NFHS-5 internet use among **15–49-year-olds** used to argue elderly feasibility — wrong denominator | Replace with the workforce-deficit and treatment-gap numbers, which are far stronger |
| 5 · Feasibility | BharatNet/PMGDISHA used to argue connectivity, which quietly contradicts our offline-first thesis | Reframe as the **scale-up** path, not the operating assumption |
| 6 · Impact | "Supports regular cognitive engagement…" — true but unquantified | Attach the Cochrane figure and the two Lancet risk factors |
| 7 · References | A **Studocu** link; a press release; items [5][7][8] with no authors or DOIs; the CARE **protocol** described as a result | Purge and rebuild. See [02 Part E](02-reading-list.md). |

One more: the old deck has a **blank slide 2**. Remove it.

---

## Slide 1 — Title page

Template fields, filled:

- Problem Statement ID — **26003**
- Problem Statement Title — AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region
- Theme — **MedTech**
- PS Category — **Software**
- Team ID — **____ (fill this in)**
- Team Name — **MindMitra**

Keep the logo and the university mark. Nothing else.

---

## Slide 2 — Proposed Solution · **now carries the mandatory traceability table**

Template pointers: detailed explanation of the solution · how it addresses the problem · innovation and uniqueness.

> **FORMAT CHANGE.** The Vidyashilp guidance requires slide 2 to show **Problem Statement → Solution mapping** in a five-column table: *Requirement / Challenge / Proposed Solution / Feature-Module / Expected Outcome.* This is the 25%-weighted criterion. The full 19-row matrix covering every PS requirement is in [13](13-ps-traceability-matrix.md); put the **collapsed 8-row version** (one row per lettered requirement a–h) on the slide and keep the full one as a backup slide.

Layout: the table takes the lower two-thirds. The headline, the three problem numbers and the innovation bullets compress into the top third. Do not also try to fit the flow diagram here — move it to slide 3.

**Headline (one line, large):**
> Offline, voice-first cognitive care built around one elder's own life — for the person most likely to have dementia in India, and least likely to be diagnosed.

**Left third — the problem, three numbers only:**

- **~1 in 10** people with dementia in India ever get a diagnosis
- **89%** of psychiatrist posts vacant in Assam (Arunachal 90%)
- **12.2%** prevalence among those with no formal schooling, vs **1.7%** with tertiary education

That third statistic is the one that reframes everything, and no other team will have it. It is what justifies a voice-and-picture-only interface.

**Centre — a single clean flow diagram (five boxes, readable when projected):**

```
Caregiver builds a verified            Engines generate personal
life corpus (15 min)        ─────►     activities in her language
  faces · places · routines            picture + voice, no reading
  medicines · songs                            │
                                               ▼
                                    Adaptive engine keeps every
                                    session in the flow band
                                               │
                        ┌──────────────────────┴──────────────────┐
                        ▼                                         ▼
              Reminders + on-device                    One honest page
              assistant (fully offline)                to the ASHA worker
```

**Right third — innovation, four bullets:**

- **Personal-corpus content** — her photographs and her routines, not a regional theme pack
- **Difficulty calibration as the intervention** — the evidence says wrong difficulty is why people stop
- **Genuinely offline** — no server in the daily loop, because that is also the privacy architecture
- **Closes the system loop** — the first longitudinal record this patient has ever had

---

## Slide 3 — Technical Approach

Template pointers: technologies to be used · methodology and process for implementation.

**Left — the stack we are actually building.** Seven items, not fourteen:

React + Capacitor (Android) · IndexedDB/Dexie (local-first) · TypeScript adaptive engine · Python learner simulator · Sarvam / AI4Bharat / Bhashini for pre-rendered Indic audio · client-side PDF reports · **no backend in the core loop**

Add one line under it: *"Deliberately small. Nothing in the daily loop needs a network or a server."*

**Centre — the adaptive engine, four layers.** This is the slide's centrepiece and our strongest technical claim:

```
L3  Q-learning policy  ── pre-trained in simulation, greedy on device
L2  Contextual bandit  ── which activity, how long, when to rest
L1  Elo / IRT ability  ── per-dimension estimate; converges in tens of items
L0  Bounded ladder     ── deterministic safety rails the policy cannot override
```

With the line that wins the technical argument:

> **Exploration happens against thousands of simulated learners. A real person with dementia never meets an unvetted policy.**

**Right — what runs offline.** A tick-column: games ✅ · content generation ✅ · adaptive engine ✅ · reminders ✅ · assistant ✅ · reports ✅ · speech output ✅ · speech input ⚠️ optional.

**Bottom strip — difficulty is a vector, not a level:** set size · distractor similarity · retention delay · cue level · modality · familiarity tier. One line: *"a person may handle six items but fail on semantic distractors — those are different cognitive stories, and a single 'level' throws that away."*

---

## Slide 4 — Feasibility and Viability

Template pointers: feasibility analysis · potential challenges and risks · strategies for overcoming them.

> **This slide is scored on cost (15%).** Lead with the three rupee figures from [14](14-cost-model.md), then feasibility, then risks. Do not bury the cost story below the fold.

**Cost — three numbers, large, at the top:**

- **₹0** — technology licences, cloud infrastructure and hardware. Open-source stack, no server in the daily loop, runs on the caregiver's existing phone.
- **₹0** — marginal cost per additional household.
- **₹4–6 lakh** — to a deployable v1: six students for six months, exactly what the SIH deployment framework already funds at ₹10–15k/month per student.

One line under them: *"The architecture we chose because adherence requires offline operation is also the cheapest thing we could have built."* Then the comparison: a single specialist consultation from a rural NER district costs a household **₹2,000–5,000** in fare, fees and lost wages — more than a lifetime of using MindMitra.

**Feasible because the hard parts are already solved by someone else:**

- The **intervention** has Cochrane evidence — cognitive stimulation, 37 RCTs, 2,766 participants, benefit roughly equivalent to a **six-month delay** in decline at ≥2 sessions/week
- The **delivery model** has Indian RCT evidence — [Goa 2008](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333): lay health workers delivering home-based dementia care, since scaled state-wide
- The **rails exist** — ASHA network, AB-HWCs, NPHCE, Bhashini
- The **technology is off the shelf** — Assamese TTS available today; nothing needs a GPU

**Challenges, and what we do — say these as a three-column table.** Naming our own biggest risk is a strength:

| Risk | Our response |
|---|---|
| **Adherence — will they keep using it?** *(our biggest risk, and we name it first)* | Calibration as the core; 5–10 min sessions; caregiver effort budget of <15 min setup, <30 s daily; retention at week 12 is our primary pilot outcome |
| We are not our user | Testing with older adults before we finish; low-end device development; the ENHANCE barrier list adopted as a defect list |
| Low-resource-language ASR will fail | Voice input is always additive; tapping always works; all output audio pre-rendered |
| NER is not one culture | Personal content first, community-validated second, regional default last |
| Capacity to consent | Guardian consent under DPDP §9 **plus** ongoing assent from the person |

**Scale-up path, one line:** works offline today; as BharatNet reaches more gram panchayats, sync and district-level reporting layer on top.

---

## Slide 5 — Impact and Benefits

Template pointers: potential impact on the target audience · social, economic, environmental benefits.

**Centre — who benefits, four rings, each with one measurable claim:**

| Beneficiary | Benefit | The number |
|---|---|---|
| **The elder** | Structured daily cognitive engagement in her own language | Cochrane: small cognitive benefit ≈ **6-month delay** in expected decline, at ≥2 sessions/week |
| **The caregiver** | Reduced repetition load, structure, and being told what to do | Zarit burden fell from **47.8 → 38.0** in the Goa lay-worker RCT |
| **The household** | Lower avoidable cost, later crisis presentation | Dementia costs a household **~US$571/yr ≈ 20% of its annual health spending** |
| **The health system** | Longitudinal observation on a population it currently has no data on | Closing a **~90%** treatment gap starts with knowing who these patients are |

**Bottom — the prevention hook, two lines:** the [Lancet Commission 2024](https://www.thelancet.com/commissions-do/dementia-prevention-intervention-and-care) identifies **45%** of dementia as potentially preventable across 14 risk factors. We touch exactly two of them — **low education** and **social isolation** — and we claim no more than that.

**And one line of honesty, which will be remembered:**

> MindMitra is a cognitive-stimulation and caregiver-support tool. It is not a diagnostic test or a medical device. We do not claim to improve memory — the best available meta-analysis of serious games found no memory benefit — and we do not claim to slow disease.

---

## Slide 6 — Research and References

Rebuilt from scratch. Full citations, DOIs, no blogs, no coursework sites. Ten to twelve items, grouped:

**Burden and epidemiology**
1. Jin Y, Crimmins E, Langa K, Dey A, Lee J. Prevalence of dementia in India: national and state estimates. *Neuroepidemiology*, 2023. [PMC10038923](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/)
2. Lee J et al. Prevalence of dementia in India: national and state estimates from a nationwide study. *Alzheimer's & Dementia*, 2023. doi:10.1002/alz.12928
3. STRiDE India situation report. [stride-dementia.org](https://stride-dementia.org/india-situation-report/)

**Care gap and delivery**
4. Dias A, Patel V. Closing the treatment gap for dementia in India. *Indian J Psychiatry*, 2009. [PMC3038542](https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/)
5. Dias A et al. Effectiveness of a home care program for caregivers of persons with dementia in developing countries: an RCT from Goa, India. *PLoS ONE* 3(6):e2333, 2008.
6. Caregivers' experiences, challenges and needs in India: a scoping review. *BMC Health Services Research*, 2024. doi:10.1186/s12913-024-12146-x

**Intervention evidence**
7. Woods B et al. Cognitive stimulation to improve cognitive functioning in people with dementia. *Cochrane Database Syst Rev*, 2023. CD005562.pub3
8. Woods B et al. Reminiscence therapy for dementia. *Cochrane Database Syst Rev*, 2018. CD001120.pub3
9. Digital technology-based serious games for older adults with MCI: meta-analysis of RCTs. *Age and Ageing* 54(4), 2025. doi:10.1093/ageing/afaf080
10. Livingston G et al. Dementia prevention, intervention and care: 2024 report of the Lancet standing Commission. *The Lancet*, 2024.

**Design, usability and methods**
11. Mantell R et al. User experience and usability of game-based cognitive assessments for older people: systematic review. *JMIR Aging* 8:e65252, 2025.
12. Yu TKC et al. Usability of the coach-supported dementia prevention app ENHANCE. *JMIR Aging* 9:e92800, 2026.
13. Bhargava Y, Sharma AR, Sarma GRK, Baths V. The CARE study protocol: game-based cognitive assessment in MCI in India *(ongoing study protocol)*. *BMC Geriatrics* 26:188, 2026.
14. Dynamic difficulty adjustment in serious games: a literature review. *Information* 17(1):96, 2026. doi:10.3390/info17010096

Note how item 13 is labelled. That parenthesis is the difference between accurate and not.

---

## Design notes

- **Font ≥ 18pt for body, ≥ 28pt for headings.** These get projected in a room, and dense slides read as unclear thinking.
- **One idea per slide, one number per idea.** If a slide has more than five numbers, it has none.
- Diagrams over prose everywhere — the template says so explicitly, and it is right.
- Keep the "MindMitra" oval and the SIH mark as the template places them.
- **Every figure gets a source caption.** If we reproduce a figure from the CARE study, note that it is CC BY-NC-ND, which permits reproduction with credit but **prohibits sharing adapted versions** — so use it unmodified or not at all.
- Colour: keep the existing warm palette; check contrast when projected, which is usually much worse than on a laptop.

---

## The three sentences to have memorised

1. *"Nine in ten Indians with dementia never get diagnosed, and in Assam nearly nine in ten psychiatrist posts are vacant — so the care has to happen at home, in the local language, without a specialist and without a network."*
2. *"The evidence says cognitive stimulation buys about six months of delay, but only at two-plus sessions a week — and the reason people stop is that the difficulty is wrong. So we made calibration the product, not the games."*
3. *"Everyone else builds for someone who can read, pay and get online. We build for the person actually most likely to have dementia in India: a rural woman with no schooling, on her daughter-in-law's phone, offline."*
