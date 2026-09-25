# 02 — Reading List, Prioritised, With Assignments

Owner: Research lead · Status: ready to assign

You asked which of the papers on your list are worth reading. Short answer: **two of them are excellent, one is useful for the ML owner, and four should be dropped.** The list is also missing the five sources that actually win this deck. Both problems are fixed below.

---

## Part A — Verdict on our existing list

| Our item | What it actually is | Verdict |
|---|---|---|
| PMID [42492485](https://pubmed.ncbi.nlm.nih.gov/42492485/) | Yu et al. 2026, *JMIR Aging* — usability of the ENHANCE dementia-prevention app in older adults from low-education, low-SES and minority backgrounds | **TIER 0 — everyone reads.** This is almost exactly our user population, studied properly. |
| PMID [40499156](https://pubmed.ncbi.nlm.nih.gov/40499156/) | Mantell et al. 2025, *JMIR Aging* — systematic review of usability and UX of game-based cognitive assessments for older people | **TIER 0 — everyone reads.** Contains the finding that reframes our whole product. |
| [DDA in Serious Games: A Literature Review](https://doi.org/10.3390/info17010096), *Information* 17(1):96, Jan 2026 | 75-paper review of dynamic difficulty adjustment methods — rule-based, player modelling, RL, genetic algorithms, neural nets | **TIER 1 — ML owner reads in full, summarises for the rest.** This is the methods survey behind our adaptive engine. |
| [SAP news — Memory Lane Games](https://news.sap.com/2026/08/memory-lane-games-ai-personalization-dementia-care/) | Corporate press article about a real competitor's AI-personalisation prototype | **TIER 2 — competitor intel, not evidence.** Read for the landscape slide only. Never cite as research. |
| [Applications of AI in Dementia Research](https://www.researchgate.net/publication/366078884_Applications_of_Artificial_Intelligence_in_Dementia_Research) | Broad survey, mostly imaging/biomarker/diagnostic AI | **TIER 2 — skim.** Low ROI. Most of it is diagnostic AI, which we have explicitly ruled out doing. |
| [Cleveland Clinic ConsultQD — AI cognitive assessment, high-IQ Alzheimer case](https://consultqd.clevelandclinic.org/ai-based-cognitive-assessments-help-diagnose-high-iq-patient-with-alzheimer-disease) | Single-patient case narrative on a hospital marketing blog, about **diagnosis** | **DROP.** n=1, non-peer-reviewed, and about the one thing we are not doing. |
| [UAlberta folio — computer games and cognitive function](https://www.ualberta.ca/en/folio/2025/09/computer-games-could-level-up-cognitive-function-in-dementia-patients.html) | University press release | **DROP the press release; find the underlying paper.** Assign someone 15 minutes to locate the actual publication, then cite that. |
| [Studocu — "AI ML Libraries for Gamified Dementia App"](https://www.studocu.com/) | Uploaded student coursework notes on a document-sharing site | **DROP, and do not cite this anywhere.** Studocu is not a source. If a judge clicks that link in our references slide we lose credibility instantly. Whatever library guidance we need, we write ourselves in [06](06-technical-approach.md). |
| [CARE study protocol](https://doi.org/10.1186/s12877-025-06929-y), *BMC Geriatrics* 2026 (we have the PDF) | Indian game-based cognitive assessment protocol, BITS Goa + St. John's Bangalore | **TIER 1 — promoted.** We already had this and under-used it. It is the closest Indian precedent that exists. |

### Also fix the references slide in the old deck

Our current references slide lists items **[5] JMIR Aging 2024**, **[7] "Cultural Dementia Interventions — Systematic Review"** and **[8] Ageing Research Reviews 2022** without authors, titles or DOIs. **[6] "CARE Study — India (2026)"** is described as if it reported results — it is a *protocol* for an ongoing study with no outcome data yet. Every one of these needs a full citation or it comes off the slide. Judges do check.

---

## Part B — What we are adding (and why each one earns its place)

### Tier 0 — the whole team reads these four. Non-negotiable.

**1. Woods et al. 2023 — Cognitive stimulation to improve cognitive functioning in people with dementia.** Cochrane CD005562.
[Full review](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub3/full) · [Plain-language summary](https://www.cochrane.org/evidence/CD005562_can-cognitive-stimulation-benefit-people-dementia)
*Why:* This is the evidence base our entire product stands on. 37 RCTs, 2,766 participants. Gives us the "roughly six-month delay in decline" line, and the dosing instruction (≥2 sessions/week, mild-to-moderate dementia). If you read one thing, read the plain-language summary at minimum.

**2. Mantell et al. 2025 — Evaluating the user experience and usability of game-based cognitive assessments for older people.** *JMIR Aging* 8:e65252. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40499156/)
*Why:* Contains the most uncomfortable and most useful finding available to us — older and cognitively impaired adults find these games **less usable even when the games were purpose-built for them and the tasks were simple and everyday.** It also identifies difficulty calibration as the mediator of enjoyment. This is simultaneously our warning and our justification for the adaptive engine.

**3. Yu et al. 2026 — Usability of the coach-supported dementia prevention app ENHANCE.** *JMIR Aging* 9:e92800. [PubMed](https://pubmed.ncbi.nlm.nih.gov/42492485/)
*Why:* Studies our demographic on purpose. Names our accessibility bugs before we ship them (unclear visual cues, no accommodation for motor/sensory impairment, visual discomfort) and validates human coaching as an engagement driver.

**4. Dias et al. 2008 — Home care programme for caregivers of persons with dementia in developing countries: an RCT from Goa, India.** *PLoS ONE* 3(6):e2333. [Open access](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333)
*Why:* The delivery-model precedent. Lay health workers, supervised, delivering dementia care in India, in an RCT, subsequently scaled state-wide. Our ASHA layer is this model with software attached. Pair with [Dias & Patel 2009, *Indian J Psychiatry*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/) for the 90% treatment-gap figure.

### Tier 1 — one owner reads in full and writes a one-pager for the team

| # | Source | Owner role | What we need out of it |
|---|---|---|---|
| 5 | [Jin et al. 2023, *Neuroepidemiology* — Prevalence of dementia in India](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/) | Research | State-level table, all gradients, method caveats. Already extracted in [01](01-problem-and-evidence.md) — owner verifies. |
| 6 | [Lee et al. 2023, *Alzheimer's & Dementia*](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12928) | Research | The 7.4% / 8.8M alternative estimate and why it differs |
| 7 | [Digital serious games for MCI meta-analysis, *Age and Ageing* 2025](https://academic.oup.com/ageing/article/54/4/afaf080/8107654) | Cognitive/content | Which outcomes actually move, which do not, and tablet-vs-VR comparison |
| 8 | [Woods et al. 2018 — Reminiscence therapy for dementia, Cochrane CD001120](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/full) | Cognitive/content | Individual-vs-group split; how strongly we may phrase reminiscence claims |
| 9 | [DDA in Serious Games literature review, *Information* 2026](https://doi.org/10.3390/info17010096) | ML | Method taxonomy, where RL is appropriate, cold-start handling |
| 10 | [CARE study protocol, *BMC Geriatrics* 2026](https://doi.org/10.1186/s12877-025-06929-y) | ML + Cognitive | Their scoring formulas (F-beta precision/recall composites, QWES), Indian validation design, what their preliminary data says about drop-out |
| 11 | [STRiDE India situation report](https://stride-dementia.org/india-situation-report/) | Product | Service landscape, cost, policy gaps for the feasibility slide |
| 12 | [Lancet Commission on dementia 2024](https://www.thelancet.com/commissions-do/dementia-prevention-intervention-and-care) | Product | The 45% / 14-risk-factor framing for the impact slide |
| 13 | [Caregivers' experiences in India — scoping review, *BMC HSR* 2024](https://link.springer.com/article/10.1186/s12913-024-12146-x) | UX | Caregiver needs, knowledge gaps — feeds personas in [04](04-users-and-scenarios.md) |
| 14 | [Digital literacy among older adults in India — systematic review](https://www.tandfonline.com/doi/full/10.1080/03601277.2024.2397428) + [DAHLIA rural telehealth readiness](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8938771/) | UX | Access and literacy constraints; hard numbers for the design brief |
| 15 | [Sarvam Edge on-device Indic AI](https://www.sarvam.ai/products/edge) · [Bhashini model availability](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage) · [AI4Bharat Indic-TTS](https://github.com/AI4Bharat/Indic-TTS) | Voice/i18n | Which NER languages are genuinely supported, ASR quality, on-device feasibility, licensing |

### Tier 2 — reference only, no summary required

- [Bridging policy gaps: Mental Healthcare Act 2017 and NPHCE](https://pmc.ncbi.nlm.nih.gov/articles/PMC12798878/) — policy hooks
- [Dementia home care in urban and rural India, qualitative](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12740581/) — texture for scenarios
- [Memory Lane Games SAP article](https://news.sap.com/2026/08/memory-lane-games-ai-personalization-dementia-care/) — competitor
- [Saragih et al. 2022, *Ageing Research Reviews*](https://www.sciencedirect.com/science/article/abs/pii/S1568163722001829) — serious games in dementia; already cited in our deck, keep with a proper citation
- [CBAC form — NHSRC](https://nhsrcindia.org/node/741) — the actual government form, for the report-template work

---

## Part C — Assignments

Six people. Everyone reads Tier 0 (budget ~3 hours total — the two JMIR papers are short, and use the Cochrane plain-language summaries). Then each person owns their Tier 1 items.

| Person | Role | Tier 1 items owned | Deliverable |
|---|---|---|---|
| **You** | Product / research lead | 5, 6, 11, 12 | Problem section of the deck + verify every number in [01](01-problem-and-evidence.md) |
| **4th-yr #2** | Cognitive design & content | 7, 8, + CARE study game descriptions | Game-engine specs in [05](05-solution-and-mvp.md); the claims-we-may-make list |
| **4th-yr #3** | Frontend / UX | 13, 14, + ENHANCE barriers list | Accessibility spec; elder-app screen flows |
| **Gajendra** | ML / adaptive engine | 9, 10 | Adaptive-difficulty design doc; reward function; the honest RL critique |
| **3rd-yr #1** | Backend / offline / data | (support 10 for scoring), CBAC form | Data model, sync design, report generator spec |
| **3rd-yr #2** | Voice / i18n / QA | 15 | Language support matrix: which NER language works for ASR, TTS, offline, and at what quality |

Reassign freely — but **one owner per item**, and the owner produces the one-pager. Unowned papers do not get read.

---

## Part D — Summary template

Every Tier 1 one-pager uses exactly this. Keep it to one page. If it is longer than one page you have transcribed rather than summarised.

```markdown
# [Short title] — [Author, Year, Venue]
Link: 
Read by: 
Date: 

## What they did
2–3 sentences. Design, n, population, setting.

## The three findings that matter to MindMitra
1.
2.
3.

## One number I can put on a slide
[figure] — [exactly what it measures, and its caveat]

## What this changes about our product
Be concrete. "Nothing" is a legitimate answer — say so.

## What this forbids us from claiming
The most valuable line in the summary. What can we NOT say now?

## Quality check
Peer-reviewed? Sample size? Population like ours or not? Conflicts of interest?
Would I defend citing this to a hostile judge? Y/N
```

Store completed summaries in `docs/summaries/<nn>-<slug>.md`.

---

## Part E — A rule about how we cite

Three failure modes have already appeared in our old deck. Do not repeat them.

1. **Citing press releases and blogs as evidence.** A university news item is not a study. Find the paper it describes.
2. **Citing a protocol as if it reported results.** The CARE study is an ongoing protocol. Correct phrasing: *"an ongoing Indian clinical study is validating game-based cognitive assessment against ACE-III in older adults with MCI."* Not: *"the CARE study shows…"*
3. **Unlabelled figures.** Our old slide 3 contains the literal text *"link the graphs"* next to two uncredited charts. Every figure needs its source in the caption. Reproducing a journal figure also needs a licence check — the CARE study is CC BY-NC-ND, which **prohibits sharing adapted material**, so we may reproduce their figures unchanged with credit, but we may not modify them.

---

## Open questions

- [ ] Locate the actual paper behind the UAlberta press release
- [ ] Find at least one Indian or South-East-Asian study on culturally-adapted cognitive stimulation — our "cultural adaptation" claim currently rests on a Western systematic review
- [ ] Is there any published work on dementia specifically in NER populations? Try NEIGRIHMS, Gauhati Medical College, ARDSI Guwahati
