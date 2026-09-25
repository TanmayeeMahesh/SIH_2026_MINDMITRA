# 01 — The Problem, With Evidence

Owner: Research lead · Status: sourced draft

Everything in this file is citable. Where two credible sources disagree, both are shown — that disagreement is itself useful, and knowing it stops a judge from catching us out.

---

## 1. How big is the problem in India

Two peer-reviewed national estimates exist, both built on the **LASI-DAD** cohort (Longitudinal Ageing Study in India — Diagnostic Assessment of Dementia). They differ because they use different modelling methods. Quote either, but know both.

| Source | Method | Prevalence (60+) | Absolute |
|---|---|---|---|
| [Lee et al. 2023, *Alzheimer's & Dementia*](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12928) | Logistic model on clinical consensus subsample (n=2,528), imputed to n=28,949 | **7.4%** | **~8.8 million** |
| [Jin et al. 2023, *Neuroepidemiology*](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/) | Semi-supervised ML (stochastic gradient boosting) on 4,096 consensus diagnoses | **8.44%** crude, **8.94%** age-standardised | **~10.08 million** |

The older, widely-quoted [STRiDE India situation report](https://stride-dementia.org/india-situation-report/) figure of **3.8 million (2019), rising to 11.4 million by 2050 (+197%)** comes from earlier pooled community studies and is now considered a substantial *under*estimate at baseline. Use the LASI-DAD numbers for prevalence, and STRiDE for the projection trend and service-gap analysis.

**Ageing denominator:** 10.1% of India's population was 60+ in 2021, rising to roughly 15% by 2036 (STRiDE). The problem grows regardless of what we build.

---

## 2. The North East picture — and the honest version of it

Age-standardised dementia prevalence, adults 60+, from [Jin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/):

| State | Prevalence (60+, age-std.) | 95% CI | vs national (8.94%) |
|---|---|---|---|
| **Assam** | **10.41%** | 8.16–12.66 | above |
| **Tripura** | **9.05%** | 6.05–12.06 | above |
| **Mizoram** | **8.89%** | 5.75–12.02 | at par |
| **Arunachal Pradesh** | **8.45%** | 4.85–12.06 | at par |
| **Meghalaya** | **8.43%** | 5.59–11.26 | at par |
| **Manipur** | **5.11%** | 3.33–6.89 | well below |
| **Nagaland** | **4.54%** | 2.91–6.18 | well below |
| Sikkim | not separately reported | — | — |

> **Do not say "NER has India's highest dementia burden."** It is false, and a judge from the region will know it. Assam ranks around 11th nationally; West Bengal is highest at 13.57%. Manipur and Nagaland are among the *lowest* in the country. Note also that confidence intervals for the small NE states are very wide — these are modelled estimates from thin samples, not censuses.

**What to say instead — the defensible framing:**

> Assam and Tripura sit above the national average, and NER as a whole carries an ordinary-to-high burden on top of *the thinnest specialist care supply in India*. The problem here is not that more people have dementia. It is that almost none of them can reach anyone who knows what to do about it.

### The supply side is where the region is genuinely exceptional

Psychiatrist workforce deficit against sanctioned need ([workforce analyses, 2023–2026](https://www.business-standard.com/health/197-million-indians-need-mental-health-support-here-s-what-s-missing-125101000277_1.html)):

- **Arunachal Pradesh — 90%** deficit
- **Assam — 89.1%**
- **Meghalaya — 78.3%**
- **Manipur — 75%**, **Nagaland — 75%**
- India overall: **0.75 psychiatrists per 100,000** against a WHO reference of 1.7; roughly 9,000 practising psychiatrists nationally against a need of ~36,000
- **Over 70% of India's mental-health professionals work in urban areas**, which hold under 40% of the population
- District hospitals frequently have **no** mental-health professional at all

Dementia is diagnosed and managed largely by neurologists, psychiatrists and geriatricians. In most NER districts, none of those three exists within a day's travel.

### The result: a ~90% treatment gap

[Dias & Patel, *Indian Journal of Psychiatry* 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/) — the standard citation:

> "The treatment or service gap for dementia in India is thought to be nearly 90%… only one in 10 people with dementia receive a diagnosis, treatment or care."

And critically for us: the gap **exceeds 90% in most of the country except urban areas and Kerala/Tamil Nadu.** NER is squarely in the >90% bucket.

Root causes they identify — all three are things software can partly attack:

1. Very poor awareness of dementia in society *and among health professionals*
2. Very low trained human-resource capacity
3. No public-health priority for dementia

India's policy instruments — the **Mental Healthcare Act 2017** and the **National Programme for Health Care of the Elderly (NPHCE)** — both touch dementia, but [analysis published in 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12798878/) finds their "fragmented implementation and limited integration create significant gaps in service delivery." There is no national dementia plan.

---

## 3. The single most important finding for our design

The risk gradients are steep, and they all point the same direction:

| Gradient | High-risk group | Low-risk group | Ratio |
|---|---|---|---|
| **Education** | No formal education — **12.23%** | Tertiary — **1.65%** | **7.4×** |
| **Sex** | Female — **12.29%** | Male — **5.37%** | **2.3×** |
| **Residence** | Rural — **10.19%** | Urban — **6.07%** | **1.7×** |

Source: [Jin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/), age-standardised.

**Stack those gradients and the modal Indian person with dementia is a rural woman with no formal schooling.** She is not an edge case we should accommodate. She is the centre of the distribution.

Now overlay the digital reality for exactly that person:

- **71%** of India's older adults live in rural areas
- Rural older-adult mobile-phone ownership: **~50%** — but **very few own or use a *smart*phone**
- **<10%** have used the internet to contact a health professional
- Digital literacy among rural older adults: **~11%**
- An Age Well Foundation survey found **85.8% of older participants digitally illiterate — 76.5% of men and 95% of women**
- Documented barriers: **poor traditional literacy** and age-related **vision loss**
- Sources: [DAHLIA study, rural India](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8938771/); [systematic review of digital literacy among older adults in India](https://www.tandfonline.com/doi/full/10.1080/03601277.2024.2397428)

### Three product consequences that follow directly, and are non-negotiable

1. **Text is not an interface for this user.** Not English text, not Assamese text. Reading ability cannot be assumed at all. Every instruction must work as picture + spoken audio, with text present only as a convenience for the caregiver.
2. **She is not the person who installs, configures or troubleshoots the app.** 95% of older rural women are digitally illiterate. Onboarding is a *caregiver* task, always. Designing an elder-solo onboarding flow is designing for nobody.
3. **The phone is probably not hers.** It is her daughter-in-law's or her son's. Session design must tolerate a shared, borrowed device — which also means the app must be safe to open in front of family and must not assume continuous availability.

> **Our current deck cites NFHS-5 internet use among 15–49-year-olds (42.3% of men, 28.2% of women in Assam). That is the wrong denominator and we should drop it.** Our users are 60+. Quoting working-age internet use to argue elderly feasibility is exactly the kind of thing a sharp judge picks apart. If we want a connectivity argument, make it about the *caregiver's* phone — which is legitimate, and stronger.

---

## 4. What actually goes wrong in these households, day to day

Synthesised from the Indian caregiving literature — [Dias et al. 2008 Goa RCT](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333), [caregivers' experiences scoping review, *BMC Health Services Research* 2024](https://link.springer.com/article/10.1186/s12913-024-12146-x), [dementia home care in urban and rural India, qualitative](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12740581/), STRiDE India.

**It is not recognised as illness.** Forgetting is read as normal ageing, or as stubbornness, or as deliberate difficulty. Behavioural symptoms get read as madness, attracting the stigma the literature describes as "being mad." Families reach a doctor late, often only after a crisis — wandering, a fall, an accusation of theft directed at a family member.

**Nobody tells the family what to do.** The scoping review finds caregivers aware of hospital-based treatment but with little understanding of **home-based care strategies** or what their day-to-day responsibilities even are. There is no discharge plan, because there was rarely a diagnosis.

**The load falls on one unpaid woman.** Usually a daughter-in-law or daughter, often also running the household and sometimes earning. Measured Zarit Burden scores in Indian samples fall in the **moderate-to-severe** band (~47.75 pre-intervention in one study, ~37.95 post-intervention).

**The cost is quietly ruinous.** Annual household cost attributable to dementia is approximately **US$571** — roughly **20% of what an Indian household spends on health in a year** ([AEA Papers & Proceedings](https://www.aeaweb.org/articles?id=10.1257%2Fpandp.20241061)). Out-of-pocket spending is **48.8% of total health expenditure** in India (STRiDE). ARDSI estimated total societal cost at **US$3.4 billion (2010)**, projected to reach **0.5% of GDP by 2050**.

**Days are unstructured, and unstructured days accelerate decline.** No routine, little conversation, television as the default. Social isolation and low cognitive engagement are both on the Lancet Commission's modifiable-risk list.

**Follow-up does not exist.** Even where a diagnosis happened, there is no mechanism by which anyone observes this person again. The health system holds *zero* longitudinal data on them. This is the hole our reports actually fill.

### The specific moments a caregiver would pay to fix

Write these on a wall. They are our feature list, derived rather than invented.

| Moment | What happens now | What we could do |
|---|---|---|
| "Did she take her morning tablet?" | Guesswork, double-dosing risk | Caregiver-set reminder + completion log |
| Repeated question, 20th time today | Caregiver snaps, both feel awful | Answerable on-device without the caregiver |
| Doesn't recognise a grandchild | Distress on both sides | Rehearsal via personal-photo activities |
| Empty 3pm–6pm | Blank TV time | 10-minute structured activity |
| "Is she getting worse?" | Nobody knows | Longitudinal engagement + performance trend |
| ASHA visit, 6 minutes | Nothing structured to report | A one-page summary she can actually carry |
| Caregiver is exhausted | Invisible, unaddressed | Burden is measured and shown to the CHO |

---

## 5. Does the intervention we're proposing actually work?

This is the question that separates a research-backed deck from a hopeful one. The honest answer is "yes, modestly, for some outcomes, in mild-to-moderate dementia" — and we should say exactly that.

**Cognitive stimulation — the strongest evidence, and our foundation.**
[Woods et al. 2023, Cochrane CD005562](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub3/full) — 37 studies, 2,766 participants, mean age 79, mild-to-moderate dementia.

- Moderate-quality evidence of a **small benefit to cognition**, described as roughly equivalent to a **six-month delay** in expected decline
- Also: improvements in communication and social interaction; slight improvements in self-reported quality of life and mood
- **Effects were clearest with two or more sessions per week, and in people with milder dementia** — a direct design instruction about both frequency and eligibility

**Reminiscence — real but weaker, and we must not oversell it.**
[Woods et al. 2018, Cochrane CD001120](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/full) — 22 studies, 1,972 participants.

- "Some evidence" of improvement in quality of life, cognition, communication and possibly mood — **"all the benefits were small"**, and effects are **inconsistent across settings**
- Useful nuance for us: **individual** approaches were associated with improved cognition and mood; **group** approaches with improved communication. Our product is individual — so cognition and mood are the plausible targets, not communication.

**Serious games specifically — this one contains a warning.**
[Meta-analysis of digital serious games in MCI, *Age and Ageing* 2025](https://academic.oup.com/ageing/article/54/4/afaf080/8107654) — 28 trials, 1,698 participants. Significant improvement in **global cognition, executive function, attention, depression and activities of daily living**. **No significant improvement in memory function, anxiety, apathy or quality of life.**

> **This is important and slightly awkward for us: the best evidence says serious games improve executive function and daily-living ability, but do NOT show a memory benefit.** Our problem statement is titled "Memory Assistance." We resolve this honestly — we provide *memory support* (external scaffolding: reminders, cues, recognition aids, personal-context recall) and we target *cognitive engagement and daily function* as the trainable outcomes. We do not claim we improve memory. See [03](03-gap-and-thesis.md).

Also from that meta-analysis, useful for our platform choice: **computer, exergame and iPad/tablet games outperformed immersive VR for global cognition and executive function.** Tablet is not the poor cousin of VR here — for our outcomes it is the better modality, and it is the one that can actually reach an Assam village.

**Usability is the binding constraint, not efficacy.**
[Mantell et al. 2025, *JMIR Aging*, systematic review of game-based cognitive assessments for older people](https://pubmed.ncbi.nlm.nih.gov/40499156/):

> "Older adults and those with cognitive impairment tended to find [these games] less usable. **This trend was observed even when the games were explicitly designed for these populations, and the tasks were simplistic and representative of basic daily activities.**"

and:

> "Generating the appropriate level of difficulty for each user is important for positive user experiences, specifically enjoyment."

Read that twice. Teams like ours consistently overestimate how usable their "simple, familiar" games are. And the review names **difficulty calibration** as the mediator of enjoyment. That is the empirical justification for our adaptive-difficulty engine being the core of the product rather than a garnish.

**Human support drives engagement.**
[Yu et al. 2026, ENHANCE app usability study, *JMIR Aging*](https://pubmed.ncbi.nlm.nih.gov/42492485/) — deliberately recruited older adults from lower-education, lower-socioeconomic and minority-ethnic backgrounds, the groups usually excluded from these trials.

- Engagement facilitators: **coach support**, familiar interfaces, **appropriately challenging gameplay**, consistent rewards, trusted expert information paired with peer stories
- Barriers: **unclear visual cues, insufficient accommodation of motor or sensory impairments, visual discomfort**

Every one of those barriers is an accessibility bug we can pre-empt. And "coach support" is our ASHA/caregiver layer, validated.

**Delivery through lay workers is proven in India.**
[Dias et al. 2008, PLoS ONE — Goa RCT](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333). 81 families; home-care advisors (lay workers) supervised by a counsellor and a psychiatrist delivered information, behaviour-management guidance and assessment. It showed benefit on caregiver mental health and burden, and **was subsequently scaled to state-wide delivery.**

This is the single most important precedent in our whole deck. It establishes that **task-shifting dementia care to lay/community health workers works in the Indian context.** Our ASHA-facing layer is not a hopeful assumption; it is an implementation of a model with RCT evidence behind it.

**Prevention framing, for the impact slide.**
[Livingston et al., Lancet Commission 2024](https://www.thelancet.com/commissions-do/dementia-prevention-intervention-and-care): **45% of dementia is potentially preventable** across 14 modifiable risk factors. Two of the fourteen — **low education** and **social isolation** — are directly touched by a daily, conversational, cognitively-engaging activity. We should claim influence on exactly those two and no others.

---

## 6. The one-paragraph problem statement we will use everywhere

> In the North East, a rural elder with dementia — most often a woman with no formal schooling who does not read and does not own a phone — has roughly a 1-in-10 chance of ever being diagnosed. The nearest psychiatrist may be a district away in a state with an 89% workforce deficit; there is no neurologist, no memory clinic, no follow-up and no home-care guidance. Her family absorbs the cost, about a fifth of the household's annual health spending, and one woman in the family absorbs the labour at measured moderate-to-severe burden. Cognitive stimulation delivered two or more times a week has Cochrane-grade evidence of roughly a six-month delay in decline, and lay health workers have already been shown in a Goa RCT to be able to deliver dementia care in India. What is missing is not the evidence, and not the workforce. **What is missing is a way to put a structured, culturally-legible, spoken-language daily activity into that house without a specialist, without literacy and without a network connection — and to send one honest page back out to the ASHA worker who visits.**

---

## Open questions

- [ ] Sikkim prevalence — Jin et al. do not report it separately. Find a source or state "not available."
- [ ] Is there any NER-specific dementia prevalence *field* study (not modelled)? Check ARDSI Guwahati chapter, Gauhati Medical College, NEIGRIHMS Shillong publications.
- [ ] Confirm the current ASHA incentive structure for elderly/NCD home visits under NPHCE — it determines whether ASHAs would realistically use our report.
- [ ] Verify the CBAC form's elderly/memory items directly from the [NHSRC source PDF](https://nhsrcindia.org/node/741) — the machine-readable fetch failed. Needed before we claim template alignment in [06](06-technical-approach.md).
