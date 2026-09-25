# 13 — Problem Statement → Solution Traceability Matrix

Owner: Team lead + Content · Status: draft, verify against the PS text before printing

This is now **mandatory slide-2 content** under the Vidyashilp jury format, and it maps directly onto the highest-weighted criterion in the rubric — *Understanding of the Problem Statement, 25%*, scored on whether we "correctly address **every** aspect of the stated problem."

So the test is coverage, not eloquence. PS 26003 contains **eight lettered requirements (a–h)** plus **seven expected-solution bullets**. Every one appears below. Nothing is left out, and nothing is invented that the PS didn't ask for.

---

## The matrix (slide version — 5 columns)

Put this on the slide. Keep the evidence column (below) in your speaker notes.

| # | PS Requirement | Identified Challenge | Proposed Solution | Feature / Module | Expected Outcome |
|---|---|---|---|---|---|
| **a1** | Games for **memory improvement** | Best evidence shows serious games do *not* improve memory; over-claiming is a trap | Target memory *support* — recognition, cueing, spaced retrieval — not memory repair | **E3 Associate & Match**, **E5 Cued Recall** | Elder recognises family and everyday items with progressively less cueing |
| **a2** | Games for **attention & concentration** | Abstract drills disengage low-literacy elders | Everyday selection tasks with tunable distractor load | **E2 Find & Select** | Sustained attention practice in a familiar market/household context |
| **a3** | **Daily routine recall** | Loss of functional sequencing precedes loss of independence | Order the real steps of her own routine, from caregiver-entered tasks | **E1 Sequence** | Practice of the sequences she actually performs daily |
| **a4** | **Pattern & object recognition** using *native objects, toys, crops, clothes* | Generic stock imagery is not recognisable to a rural NER elder | Three-tier content: personal photos → community-validated local items → regional default | **E4 Categorise** + **Content Pack system** | Recognition practice using objects she owns and uses |
| **b** | **AI/ML to adapt difficulty** to performance and cognitive condition | Naive per-user RL is data-starved, non-stationary and unsafe to explore on people with dementia | Four-layer engine: bounded ladder → Elo/IRT ability estimate → contextual bandit → Q-policy pre-trained in simulation | **Adaptive Engine (L0–L3)** | Every session held in the 75–90% success band; policy can never harm the user |
| **c1** | **Multilingual + voice-assisted** interaction | 95% of older rural women are digitally illiterate; reading cannot be assumed | Picture-and-speech primary channel; **pre-rendered** Indic audio so it works offline | **Voice Layer**, **Content Pack audio** | Fully operable by a non-literate user in her own language |
| **c2** | **Culturally familiar** themes, visuals, sounds, regional language | NER is not one culture — Assamese, Bodo, Khasi, Garo, Mizo, Meitei differ, including in **kinship structure** | Personal content first; community-validated packs second; **kinship model is configurable, not hardcoded** | **Content Pack system**, **Kinship model** | Content legible to a Khasi household and an Assamese one without code changes |
| **d** | **Better engagement** — visual, accessibility | Older/cognitively impaired adults find such games *less* usable even when purpose-built | Formal accessibility spec: ≥24pt, 7:1 contrast, ≥64dp targets, tap-only, one task per screen, no timers, no failure states | **Accessibility Spec** (see [04 §5](04-users-and-scenarios.md)) | Usable by a 74-year-old with presbyopia and tremor |
| **e** | Reminders — **medicines, hydration, daily activities, appointments** | Wrong medication information is a safety hazard | Caregiver-configured schedules only; local scheduling; the AI may **read** but never **compose** medication data | **Reminder Engine**, **Local Assistant** | Reliable prompts offline; zero risk of model-generated dosing |
| **f** | **Caregiver / health-worker monitoring** via dashboards and activity levels | An ASHA has ~6 minutes and no instrument for cognition; she will not fill a form | One printable page, zero data entry, structured to the checklist idiom she already uses under AB-HWC | **Report Generator**, **Caregiver Console** | First longitudinal record this patient has ever had |
| **g** | Works in **low connectivity / offline** | Adherence needs 2+ sessions/week for months; a network dependency is a clinical failure mode | No server in the daily loop; all content, audio, games, engine and reports local | **Offline-first architecture** | Full function in airplane mode; sync optional and additive |
| **h** | **Mobile/tablet, simple elderly-friendly interface** | The elder does not own or operate the phone | Caregiver-mediated dyad design: setup <15 min, daily upkeep <30 s | **Dyad UX model** | Runs on the caregiver's existing Android phone — no new hardware |
| **E1** | *Expected:* adaptive gaming & memory training modules | Twelve separate games = twelve half-built things | Five reusable engines × content packs = unbounded personalised instances | **Engine architecture** | Content never repeats identically; new activity = new data, not new code |
| **E2** | *Expected:* voice-enabled multilingual interface | Low-resource ASR fails on elderly speech in noisy rooms | Voice output always; voice **input** strictly additive — tapping always works | **Voice Layer** | Never blocked by ASR failure |
| **E3** | *Expected:* performance tracking & analytics dashboard | A "cognitive score" implies validated measurement we have not done | Engagement- and function-shaped reporting, per cognitive dimension, never a score | **Analytics / Transparency view** | Honest trend data a CHO can act on |
| **E4** | *Expected:* caregiver monitoring & **alert** system | Alerts that read as "deterioration detected" are a clinical claim | Change-point detection on engagement; phrased as *"worth mentioning to the CHO"* | **Trend & Flag module** | Timely escalation without diagnostic overreach |
| **E5** | *Expected:* offline **synchronisation** support | Sync of personal data conflicts with our privacy guarantee | Outbox pattern, opt-in, **derived report data only — raw photos and personal facts never leave the device** | **Sync module** (v2) | Scale-up path as BharatNet reaches more GPs |
| **E6** | *Expected:* **secure patient data management** | A person with moderate dementia may lack capacity to consent | Guardian consent under **DPDP Act 2023 §9** + ongoing **assent** from the elder + purpose-scoped sharing + one-tap erase | **Consent & Privacy architecture** | Lawful, ethical, and on-device by default |
| **E7** | *Expected:* simple accessible UI/UX for elderly | Our team is nothing like our user | Design to the measured user profile; test with real 65+ users before shipping | **Accessibility Spec + user testing** | Validated, not assumed |

---

## Evidence column (speaker notes — do not put on the slide)

Have these ready. If a juror probes any row, you have a citation.

| Row | Evidence |
|---|---|
| a1 | [Serious games meta-analysis, *Age and Ageing* 2025](https://academic.oup.com/ageing/article/54/4/afaf080/8107654) — no significant memory benefit; gains in global cognition, EF, attention, ADL |
| a1–a4 overall | [Cochrane CST 2023](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub3/full) — small cognitive benefit ≈ 6-month delay, at ≥2 sessions/week, mild-to-moderate |
| b | [DDA literature review, *Information* 2026](https://doi.org/10.3390/info17010096); [Mantell et al. 2025](https://pubmed.ncbi.nlm.nih.gov/40499156/) — challenge calibration mediates enjoyment |
| c1 | [Jin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/) — 12.23% prevalence with no formal education vs 1.65% tertiary; [digital literacy review](https://www.tandfonline.com/doi/full/10.1080/03601277.2024.2397428) — 11% rural elderly digital literacy |
| c2 | [Matrilineal societies of Meghalaya](https://en.wikipedia.org/wiki/Matrilineal_society_of_Meghalaya) — Khasi/Garo/Jaintia kinship differs structurally from patrilineal models |
| d | [Mantell et al. 2025](https://pubmed.ncbi.nlm.nih.gov/40499156/); [Yu et al. 2026 ENHANCE](https://pubmed.ncbi.nlm.nih.gov/42492485/) — named usability barriers |
| f | [Dias et al. 2008 Goa RCT](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333) — lay-worker delivery works in India, scaled state-wide |
| g | Assam psychiatrist deficit 89.1%, Arunachal 90%; [treatment gap ~90%](https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/) |
| E6 | [DPDP Act 2023 §9](https://www.dpdpa.com/dpdpa2023/chapter-2/section9.html) — verifiable guardian consent for persons with disability |

---

## How to present it

Nineteen rows will not fit on one readable slide. Do this instead:

- **On the slide:** collapse to **8 rows** — one per lettered requirement a–h — with the expected-solution items folded into the relevant row. Use the five template columns. Font ≥14pt.
- **Colour-code the Feature/Module column** so the jury can see at a glance that eight requirements map onto six modules — that *is* the elegance argument the rubric's "Complexity: elegant, not bloated" pillar is looking for.
- **Keep the full 19-row version as a backup slide** after slide 6, or as a printed handout. If a juror asks "did you cover the sync requirement?", you turn to it.
- Say out loud: *"Every requirement in the problem statement maps to a module, and every module maps to evidence. Where the evidence contradicts the problem statement — it asks for memory improvement, and the literature says serious games don't deliver that — we've said so rather than claimed it."*

That last sentence is worth more than any feature. It is a direct hit on the 25% criterion.
