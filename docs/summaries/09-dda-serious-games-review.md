# Dynamic Difficulty Adjustment in Serious Games: A Literature Review — Víteková, Eichhorn, Pirker & Plecher, 2026, *Information* (MDPI)

Link: <https://doi.org/10.3390/info17010096> · *Information* 2026, 17(1), 96 · Open Access, CC BY 4.0 · [PDF](https://www.mdpi.com/2078-2489/17/1/96/pdf) (MDPI blocks direct fetches from this network — retrieved via reader proxy; landing page: <https://www.mdpi.com/2078-2489/17/1/96>)
Read by: _(fill in — drafted from the full open-access text, all figures below verified against the paper)_
Date: 2026-09-11
Reading-list ID: item **#9**, Tier 1 — ML owner ([../02-reading-list.md](../02-reading-list.md)): "Method taxonomy, where RL is appropriate, cold-start handling"

> Note on length: transcribed, not summarised, per [Part D](../02-reading-list.md). This is a review-of-reviews (a survey of 75 primary studies), so there are fewer quotable narrative passages than ENHANCE or Mantell and more taxonomy/counts — the transcript below is organised around that. The first six sections are the one-pager; everything after `---` is the transcript, including the specific citations we should chase individually.

---

## What they did

A **narrative systematic literature review** (PRISMA-*inspired*, not full PRISMA — see quality check) of dynamic difficulty adjustment (DDA) methods used in serious games (SGs), published 2020–2025. **Single database (Google Scholar only), single author (L. Víteková) did all screening, selection and extraction, no risk-of-bias assessment.** Search string: (`"serious games" OR "serious game" OR "educational games" OR "educational game" OR "serious gaming"`) AND (`"dynamic difficulty" OR "automatic difficulty" OR "difficulty adjustment" OR "DDA" OR "difficulty adaptation" OR "difficulty balancing" OR "dynamic difficulty adjustment"`), run 2025-11-10, returning **~2,180 hits**, of which the **top 350 by relevance** were screened → **75 papers** included. Studies were coded by publication year/source, SG application domain, DDA method category (player modelling / ML / rule-based / PCG / NPC-driven / other), and self-reported effectiveness. **No meta-analysis** was possible or attempted — this is a taxonomy-and-counting exercise plus narrative synthesis, not an effect-size review.

## The three findings that matter to MindMitra

1. **The literature has already built our exact engine, and named it: Q-learning + fuzzy logic, in a serious game, published 2024.** Ref [64] — Annisa Damastuti et al., *"Dynamic Level of Difficulties Using Q-Learning and Fuzzy Logic,"* IEEE Access 2024 — combines fuzzy logic with an RL/Q-learning algorithm specifically to *"control the inherent uncertainty and unpredictability in player behavior."* This is not an analogous precedent, it is the literal architecture in our reading list (item #9's whole justification) already implemented and evaluated. Two more references sharpen this further for our exact content domain: ref [35] Zhang & Goh 2021, *"Personalized task difficulty adaptation based on Reinforcement Learning,"* validated on **n=378** in a **visual memory game platform** (the largest sample cited anywhere in this review), and ref [54] Rahimi et al. 2023, *"Continuous Reinforcement Learning-based Dynamic Difficulty Adjustment in a Visual Working Memory Game."* RL-driven difficulty adaptation in a memory game, at real scale, is not hypothetical — it is published, twice, independently. Pull these three papers directly; they are more directly on-point for our ML owner than this review itself.

2. **RL is the most popular ML-based DDA method for a stated, load-bearing reason — and rule-based/fuzzy is the practical fallback, for an equally stated reason.** Of the 36 papers using player modelling and the ~26 ML-based approaches recorded, **RL appears in 10** — more than any other single ML technique — because, quoting the authors' own reasoning: *"Due to the dynamic learning and adaptation achievable by RL-driven DDA systems, games can adjust to the player in real-time based on various predefined metrics."* Meanwhile rule-based/heuristic approaches (**18 papers**, 7 of them fuzzy logic) persist because they are *"easier as they merely require the definition of suitable adaptability rules"* even though *"these rules can also pose a limit to the DDA system's flexibility."* Direct quote naming the trade-off: *"there is an existing trade-off between the flexibility of DDA systems and the implementation effort required to design them."* One head-to-head comparison exists in the corpus: Aguilar et al. [ref 43] tested heuristic vs. ML-based DDA in the same exergame and found ML "slightly better." This is the strongest available justification for choosing RL over a simpler rule engine, and simultaneously the honest caveat that fuzzy-logic-only would still work and cost less to build in 36 hours.

3. **Rehabilitation and elderly/cognitively-impaired populations are not a gap in this literature — they're already the largest single category, and there are at least three papers about exactly our patient population.** Rehabilitation is the single largest application domain (**n=22 of 75**, 29%), ahead of education (n=19). Within it: ref [89] Li et al. 2025, *"Coordinating Challenge and Engagement: A Cross-Domain Virtual Reality Intervention with Adaptive Difficulty for Cognitive and Physical Enhancement in **Cognitively Impaired Older Adults**,"* uses a Pareto-based algorithm; ref [81] Andersson & Häggblom 2025 is a **comparative experiment with seniors** on adaptive vs. non-adaptive difficulty progression, categorised as a **"Success"**; ref [11] Eun, Kim & Kim 2023, *"AI-based personalized serious game for enhancing the physical and cognitive abilities of the elderly,"* Future Gener. Comput. Syst., also a rule-based **"Success."** We are not the first people to try to adapt difficulty for cognitively impaired elders — we can cite a small existing literature specifically on our population, which is a stronger position than either ENHANCE (prevention-only) or the Mantell review (assessment-only, not adaptive-training) gave us.

## One number I can put on a slide

**77.34% of the 75 reviewed studies reported DDA as "Success" (46.67%) or "Promising" (30.67%); only 4% reported failure.** Measures the proportion of *self-reported, author-stated* positive outcomes across a heterogeneous set of DDA implementations in serious games, 2020–2025 (n=75, single-database review, no meta-analysis, no independent verification). Caveat, in the authors' own words: outcome categories are *"not directly generalizable or comparable due to their differences"* and the figure is *"a qualitative aggregation of reported outcomes, rather than a standardized measure of effectiveness."* This is a **self-report-of-self-reports** number — publication bias and author-optimism are both very plausible, and the review explicitly did not do a risk-of-bias assessment. Cite it as "positively evaluated across most studies", never as "DDA improves outcomes in 77% of cases."

## What this changes about our product

- **Named precedent for our exact architecture.** Cite Annisa Damastuti et al. 2024 [ref 64] by name on the ML slide — Q-learning + fuzzy logic for difficulty adjustment is a published, working combination, not a novel risk. Use it to answer "why not just rules?" (fuzzy alone is less adaptive to unpredictable player/patient behaviour — their own stated reason) and "why not pure deep RL?" (nobody in this corpus needed that much complexity; simple Q-learning combined with a rule layer is the actually-published sweet spot for a game-scale problem, not a research-scale one).
- **Chase the memory-game RL papers directly, not just this review.** Ref [35] (Zhang & Goh, n=378, visual memory game, RL) and ref [54] (Rahimi et al., continuous RL, visual working memory game) are close enough to our memory-training engine that our ML owner should read them in full, not just this review's two-sentence description. Add both to the reading list as new Tier-1/Tier-2 items.
- **Elderly-specific adaptive-difficulty precedent exists — cite it instead of extrapolating from general DDA literature.** Ref [89] (cognitively impaired older adults, Pareto-based), ref [81] (seniors, adaptive vs. non-adaptive, rated "Success"), and ref [11] (elderly, rule-based, "Success") let us say "adaptive difficulty for cognitively impaired older adults has been tried and evaluated positively" with citations, rather than only generalising from ENHANCE (prevention, not impaired) or Mantell (assessment, not adaptive).
- **Performance-based metrics are the field's default for good, practical reasons — don't over-engineer player modelling.** Performance-based modelling is the most-used metric (17/36 player-modelling papers) specifically because it *"can easily be measured... without the need for further intervention"* — accuracy, completion time, error rate. Physiological/emotional signals (EEG, heart rate, facial expression: 8+4 papers) are less common because of **equipment burden and obtrusiveness**, with an explicit failure case: ref [52] Bjørner's EEG-based environmental game had *"issues with the EEG measurement equipment"* and the non-adaptive group actually outperformed the adaptive one on knowledge and attentiveness. **Do not plan on physiological sensing (webcam-based affect, wearables) for our v1 difficulty signal** — build on in-game performance metrics (accuracy, latency, error patterns), which is both what the literature actually validates most and what an offline tablet app can measure without extra hardware.
- **Cold-start is a real, named gap in the field — we cannot borrow a solution off the shelf and must design our own.** Despite being one of the three things the reading list asked this paper to answer, **this review does not discuss cold-start handling at all** — the term appears nowhere in the text. This is worth reporting back to the team as a genuine finding, not an omission on our part: nobody has systematically studied how these systems should behave before they have data on a new player. Our ASHA-entered baseline-assessment approach for cold start is not contradicted by anything here, but it is also not validated by anything here — we're on our own for that design choice, and should say so rather than imply the literature settled it.
- **Pattern/object recognition and vocabulary/memorisation for cognitively-different users has direct precedent, useful for our NER cultural-adaptation game design.** Ref [67] Troussas et al. 2024 — fuzzy-weighted logical reasoning in digital escape rooms; ref [10] Shohieb et al. 2022 — DDA vocabulary-learning game for autism spectrum disorder, explicitly framed as personalization "without requiring manual intervention, which would break the game immersion" (a phrase worth reusing); ref [70]/[76] Freitas et al. — memorisation-focused serious games for children with ASD. None are NER-relevant culturally, but they are useful methodological precedent for adapting difficulty in memory/pattern-recognition games for cognitively atypical users specifically.
- **NPC-driven and PCG-driven difficulty are lower-priority for us but not irrelevant.** NPC-based DDA (n=3) showed a genuinely interesting social/emotional side-effect worth knowing about even though we won't build multiplayer: ref [26] Nebel et al. found socially-adaptive competitor agents produced *"lowered feeling of shame, increased empathy, and behavioral engagement."* If our design ever adds a "virtual companion" difficulty cue (e.g., a friendly character that visibly struggles or succeeds alongside the player), this is the citation for why that framing might reduce shame around failure — potentially relevant for a dementia population where failure-related shame is a known engagement killer (see the Mantell review's discussion of the same tension, [02-mantell-gbca-usability-review.md](02-mantell-gbca-usability-review.md)).
- **Nothing changes** about our offline/connectivity architecture, multilingual/voice plan, or caregiver dashboard — this review contains no evidence on any of those; it is purely a DDA methods survey.

## What this forbids us from claiming

- **This is not a validated methods comparison — it is a count of what people tried and what they said about it.** We cannot say "the literature shows RL is the best DDA method." The correct claim is: *"RL is the most frequently used ML-based DDA method in recent serious-games literature (10 of ~26 ML papers), and authors attribute this to its real-time adaptability"* — a popularity-and-stated-rationale finding, not a comparative efficacy finding. Only one paper in the whole corpus (Aguilar et al., ref 43) actually compared ML vs. rule-based head-to-head, and even that found only a "slightly better" result on one sub-measure (recommendation likelihood), not a general superiority claim.
- **No meta-analysis, no pooled effect size — every number is a count of author-reported outcomes, not a measured effect.** The 77.34% "Success + Promising" figure is not an effectiveness rate; it is *how often authors said something positive happened*, with no independent verification and no risk-of-bias screening. Never present it as "DDA improves cognitive/gaming outcomes in ~77% of cases."
- **Do not cite this for cold-start guidance.** We asked our reading list to get this from the paper; the paper does not address it. Any cold-start design decision needs its own justification, not a citation to this review.
- **We cannot claim this validates *elderly dementia* applications specifically — the closest hits are elderly (general) or cognitively-impaired-older-adult (broader than dementia), not dementia-specific.** Refs 89, 81, 11 are the closest population matches in the whole corpus, and none specify a dementia diagnosis — "cognitively impaired older adults" (ref 89) is the nearest language gets. Don't round this up to "DDA has been validated in dementia patients."
- **The review's own methodology has real limitations that a judge could raise, so don't oversell its authority.** Single database (Google Scholar only, explicit **selection-bias risk** the authors themselves name), last-5-years-only window, **single author did all screening, selection, and data extraction** (self-acknowledged risk of extraction error and selection bias), **no formal risk-of-bias tool used at all** (not even the simple SIGN checklist the Mantell review used), and only the top-350-by-relevance search results were screened out of ~2,180 hits — an arbitrary practical cutoff, not exhaustive coverage. This is a solid orientation/taxonomy piece, not a rigorous evidence synthesis — treat it as "a well-organised map of who's doing what," not "a validated verdict on what works."
- **Internal inconsistency to know about before a hostile judge finds it:** the Methods/Abstract state **75** papers were included and analysed throughout, but Section 3.1's very first sentence says *"the distribution of publication years among the **60** analyzed papers"* — an unexplained discrepancy between 75 and 60 in the paper's own text. Don't build an argument on the publication-year figures without flagging this; quote the 75 figure (used everywhere else, including the PRISMA-style funnel) as the reliable one.
- **Do not cite any of the individual embedded studies' numbers (e.g., the n=378 memory-game trial, or specific SUS-style figures) as if independently verified by this review** — this review reports what those primary papers claimed; go to the primary paper (as we're recommending for refs 35, 54, 64 above) before citing its specific figures on a slide.

## Quality check

**Peer-reviewed?** Yes, nominally — *Information* is a peer-reviewed, DOAJ-indexed, MDPI open-access journal; the article carries submission/revision/acceptance dates (submitted 2025-11-29, accepted 2026-01-08, published 2026-01-17) consistent with an editorial process. **However**, MDPI journals are frequently criticised in the research-integrity literature for fast turnarounds and comparatively lighter review relative to legacy publishers — worth knowing, not necessarily disqualifying. The review process for *this specific paper* is not otherwise unusual for the venue.
**Sample size?** 75 primary studies reviewed (with an unexplained "60" appearing once, see above). No participant-level sample size applies — this is a review of reviews/studies, not a primary study. Underlying primary-study sample sizes it discusses range from **n=4** (Vargas-Bustos et al., a failed result, explicitly flagged by the reviewers themselves as likely underpowered) to **n=378** (Zhang & Goh, RL memory-game trial) to **n=34** (Bjørner, another failed result).
**Population like ours or not?** Not population-based at all — this is a methods review, not a population study. Of the underlying 75 papers, the closest population matches to ours are the ~3 elderly/cognitively-impaired-older-adult papers identified above (refs 11, 81, 89) out of 22 rehabilitation papers and 11 cognitive papers — a small fraction of a small fraction. No NER, South Asian, or low-literacy population appears anywhere; this is entirely a Western/high-income-country + some East Asian research corpus by venue and author affiliation (TUM Munich authors; cited venues are IEEE/Springer conferences, JMIR Serious Games, Entertainment Computing, etc.).
**Conflicts of interest?** None declared (*"The authors declare no conflicts of interest"*). No external funding (*"This research received no external funding"*). All four authors are affiliated with the Department of Informatics, Technical University of Munich — a single-institution author team, which is not a conflict but is worth noting alongside the single-author screening/extraction limitation: this whole review passed through very few hands before publication.
**Would I defend citing this to a hostile judge?** **Y** — for the DDA method taxonomy (player modelling / ML / rule-based / PCG / NPC breakdown with counts), for the specific named precedents most relevant to us (refs 64, 35, 54, 89, 81, 11), and for the stated trade-off between RL's flexibility and rule-based systems' lower implementation cost — all traceable to specific cited primary studies. **N** — for any pooled effectiveness percentage, for any claim this validates a *specific* method as superior, for any dementia-specific claim, and for cold-start guidance, which simply isn't here. Treat this paper as a **bibliography with commentary**, not as evidence in its own right — its real value to us is the reference list, especially refs 64, 35, 54, 89, 81, and 11, all of which we should now go read directly.

---

# Transcript — the numbers, verbatim

## Citation and provenance

| Field | Value |
|---|---|
| Authors | Lucia Víteková, Christian Eichhorn, Johanna Pirker, David A. Plecher |
| Affiliation | Department of Informatics, Technical University of Munich (TUM), Garching bei München, Germany |
| Venue | *Information* 2026, 17(1), 96 — "Open Access Systematic Review" |
| Corresponding author | David A. Plecher (david.plecher@tum.de) |
| Dates | Submitted 2025-11-29 · revision requested 2025-12-30 · revised 2025-12-30 · accepted 2026-01-08 · published 2026-01-17 |
| Author contributions | Investigation, data curation, original draft: L. Víteková. Review/editing: C. Eichhorn, J. Pirker, D. A. Plecher. Supervision: D. A. Plecher. |
| Funding | None ("This research received no external funding") |
| Conflicts | None declared |
| Ethics | Not applicable (no human subjects — this is a literature review) |
| Licence | CC BY 4.0 |
| Research questions | RQ1: publication-year/source/application-area trends. RQ2: which DDA approaches were implemented/evaluated, and how effective. RQ3: limitations and research gaps. |

## Search and screening

- Database: **Google Scholar only**. Search string (Boolean, combining an SG-synonym group and a DDA-synonym group) run **2025-11-10**, restricted to the **last 5 years** (2020–2025).
- **~2,180 results** returned → **top 350 by relevance** taken forward for screening (a practical cutoff; authors state relevance dropped off sharply beyond this point) → duplicates removed → **75 papers** included after applying inclusion/exclusion criteria.
- **Inclusion:** English-language; not itself a review/aggregation; must specifically discuss DDA *in serious games* (entertainment-game-only DDA excluded); authors must explicitly call their game a "serious game" or synonym (educational game, exergame, etc.) and must explicitly use "DDA" or a synonym; must present a specific SG use case for the DDA method (no use case → excluded).
- **Notable near-misses excluded and named:** Orozco-Mora et al. (FPS game — entertainment, not serious), De Oliveira et al. (fighting game — entertainment), Bontchev et al. 2023-vintage work (DDA workflow with no specific SG use case), Daoudi et al. (affective assessment in a crisis-management SG but **no implemented DDA system**).
- **No formal risk-of-bias assessment conducted.** Single author (Víteková) did all screening, selection, and extraction; no automation tools used; no additional information sought beyond what each included paper reported.

## RQ1 — trends (publication year, source, application domain)

- **Publication-year distribution** (Figure 2): lowest **2021 (n=9)**; highest, tied, **2024 and 2025 (n=16 each)** — note 2025 was not yet complete at time of search. *(Note: this subsection's opening sentence says "60 analyzed papers," inconsistent with the 75 used everywhere else in the paper — see quality-check flag above.)*
- **Publication source** (Table 2): **33 journal** papers, **29 conference** papers, **13 other** (7 theses, 3 books, 3 preprints). Most common single venue: **International Conference on Human–Computer Interaction (HCII, Springer), n=4**. Next: **Conference on Games (CoG, IEEE)** and **International Conference on Serious Games and Applications for Health (SeGAH, IEEE)**, **n=3 each**. All other venues held ≤2 papers each — i.e., **no dominant journal/venue**, a fragmented field.
- **Application domain** (Figure 3, n=75 total):

| Domain | n | % | Notes |
|---|---|---|---|
| Rehabilitation | 22 | 29% | Stroke, hand, neuro-rehab, various therapies |
| Education | 19 | 25% | Nautical skills, preschool literacy, numeracy, reading |
| Cognitive | 11 | 15% | Memory, pattern recognition, hand-eye coordination, learning disabilities/autism |
| Exergames | 10 | 13% | 6 general fitness, 3 rehab-framed, 1 explicitly elderly motor+cognitive |
| Management | 6 | 8% | Business, time, crisis management, administration skills |
| Security | 3 | 4% | Cybersecurity, surveillance |
| Environmental | 3 | 4% | Includes the one clearly negative-result paper (Bjørner) |
| Cultural heritage | 1 | 1% | Audio AR game |

  Management domain: 5/6 positive, 1 not evaluated. Security + cultural heritage: all report promising/successful results. Environmental: weakest domain — either unevaluated or (Bjørner) explicitly negative.

## RQ2 — DDA methods and effectiveness

**Method taxonomy** (Figure 4; papers can appear in multiple categories, so counts exceed 75):

- **Player modelling — 36 papers total.**
  - Performance-based: **17** (most common single metric; e.g., accuracy, completion time)
  - Physiological (EEG, heart rate, facial-expression analysis): **8**
  - Emotion-based: **4**
  - Elo-rating systems: **3**
  - Human digital twins: **1**
  - Unspecified/"player modeling" only: **3**
- **Machine learning — ~26 papers across sub-types** (not all mutually exclusive):
  - Reinforcement learning: **10** (most popular ML sub-type)
  - Neural networks: **3**
  - Genetic algorithms: **3**
  - Large language models (LLMs): **3**
  - Clusterization approaches: **2**
  - Pareto-based algorithms: **2**
  - GANs: **1**
  - Bayesian networks: **1**
  - Hidden Markov Models: **1** (implied singular, ref 33)
- **Rule-based / heuristic — 18 papers.** Fuzzy logic: **7**. Heuristic-based (unspecified further): **3**. Remaining **8**: stated as rule-based with no further detail.
- **Procedural content generation (PCG) — 4 papers.** Level generation, challenge generation, rule generation, NPC generation.
- **NPC-driven DDA — 3 papers.** 2 competitive-opponent framings, 1 supportive rehabilitation virtual-assistant framing.
- **Other/specialised — 2 papers.** A "Flow Optimizer Framework" (neurorehabilitation) and an "Activity Theory Model" (no evaluation provided).

**Effectiveness distribution** (Figure 5, n=75):

| Category | n | % | Definition |
|---|---|---|---|
| Success | 35 | 46.67% | Clear stated improvement in experience/engagement/motivation/performance/learning outcome |
| Promising | 23 | 30.67% | Authors call it "promising"/"encouraging" with caveats/future work needed |
| N/E (not evaluated) | 12 | 16% | No DDA-effectiveness evaluation provided at all |
| Fail | 3 | 4% | No improvement shown vs. non-adaptive baseline |
| Unclear | 2 | ~2.67% | Cannot be cleanly classified (ongoing trial, or inconclusive result) |

**The 3 "Fail" studies, named:**
- **Vargas-Bustos et al.** (hand rehabilitation SG) — no significant difference between adaptive/non-adaptive on playtime, rewards, or game-engagement-questionnaire score. Reviewers' own caveat: evaluated on only **n=4** participants.
- **Vanbecelaere et al. 2020** [ref 25] (educational SG) — no difference in motivation/self-concept; authors' own explanation: *"training period was not intensive enough to observe differences between the conditions."*
- **Bjørner** [ref 52] (environmental SG, ocean plastic pollution, **EEG**-based DDA) — non-adaptive group actually showed **better** in-game performance on knowledge/attentiveness; adaptive group only showed "perceived lost track of time" and higher replay willingness. Attributed to small n (**34**) and EEG equipment accuracy/consistency issues.

**The 2 "Unclear" studies, named:**
- **Kostkova et al.** [ref 51] — Cerebral Visual Impairment therapy SG; an **ongoing randomized controlled trial**, so only partial data available, no full evaluation yet.
- **Schlette** [ref 56] — Musical Attention Control Training for Parkinson's Disease patients; inconclusive because *"the current difficulty system was too limited"* — too few difficulty levels to show a representative change.

## Discussion — the mechanisms behind the counts

- **Why performance-based player modelling dominates:** *"can easily be measured through various defined metrics that can easily be monitored throughout the game without the need for further intervention"* — a convenience/engineering-cost argument, not a validity argument. Cross-referenced against Sajjadi et al. [ref 7], an earlier review the authors say shows the same pattern.
- **Why physiological/emotional modelling lags:** higher "maintenance effort" and device "obtrusiveness"; the EEG failure case (Bjørner) is used as the illustrative example. The authors still flag this as "highlighting a research gap that could be expanded upon in the future," i.e., not fully dismissed, just currently under-resourced.
- **Why RL leads ML-based methods:** its real-time, trial-and-error adaptability (citing Kaelbling, Littman & Moore's 1996 RL survey, ref 94, for the definition: *"the problem faced by an agent that learns behavior through trial-and-error interactions with a dynamic environment"*). Cross-referenced against Lopes & Lopes [ref 93], a prior DDA-in-rehabilitation-and-entertainment-games review noting the same RL-popularity trend specifically within rehabilitation.
- **The explicit flexibility-vs-effort trade-off:** rule-based/fuzzy systems are cheaper to build but "pose a limit to the DDA system's flexibility"; the one head-to-head test in the corpus (Aguilar et al. [ref 43], heuristic vs. ML in the same exergame) found the ML version "slightly better," specifically on likelihood-to-recommend-as-a-PA-tool.
- **GenAI/LLMs as a newly emerging, undocumented-until-now trend:** the authors state this explicitly — *"this newly emerging popularity of GenAI in DDA has not previously been documented"* in prior reviews (contrasting with Aydin et al. [ref 15], which covered up to 2021 and lists Bayesian networks, ANNs, fuzzy logic, deep learning but not LLMs/GANs for DDA). Evaluation of these GenAI-based systems is largely **absent** — the authors suspect cost and immaturity, not lack of interest.
- **On comparing this review to prior ones:** performance-based modelling and RL "remain dominant" across reviews (consistent with Sajjadi et al. [ref 7] and Aydin et al. [ref 15]), but this review is the first to systematically document GenAI's emergence, and explicitly extends prior work by naming *why* certain methods are more/less popular (cost, effort, data requirements) rather than just counting them.

## Limitations, in the authors' own words

Single database (Google Scholar) → **acknowledged selection-bias risk**; 5-year window only, so an intentionally "recent and smaller subset." **Narrative synthesis, no risk-of-bias assessment** — reliance on self-reported author claims. **Single author performed all screening, selection, and extraction** — acknowledged risk of extraction error and selection bias. Effectiveness categories aggregate genuinely different outcome types (engagement, learning, flow, motivation) that "are not directly comparable" — explicitly *not* a standardized effectiveness measure. Many primary papers didn't fully disclose their DDA method (rarely stating both the assessment metric *and* the adjustment mechanism), so the method counts are described as *"a rough estimate... rather than a complete representation.""

## Full list of the most-relevant individual citations for MindMitra, extracted from the reference list

| Ref # | Citation | Why it matters to us |
|---|---|---|
| **64** | Annisa Damastuti, F. et al. "Dynamic Level of Difficulties Using Q-Learning and Fuzzy Logic." *IEEE Access* 2024, 12, 137775–137789. | **Our exact planned architecture, already published and evaluated.** Read this one first. |
| **35** | Zhang, Y.; Goh, W.B. "Personalized task difficulty adaptation based on Reinforcement Learning." *User Model. User-Adapt. Interact.* 2021, 31, 753–784. | RL-based DDA in a **visual memory game**, validated on **n=378** — largest and most relevant sample in the whole corpus. |
| **54** | Rahimi, M. et al. "Continuous Reinforcement Learning-based Dynamic Difficulty Adjustment in a Visual Working Memory Game." arXiv 2023, arXiv:2308.12726. | RL DDA in a memory game, open preprint, freely readable. |
| **89** | Li, A. et al. "Coordinating Challenge and Engagement: A Cross-Domain VR Intervention with Adaptive Difficulty for Cognitive and Physical Enhancement in Cognitively Impaired Older Adults." *Int. J. Hum.–Comput. Interact.* 2025. | Closest population match in the entire bibliography — cognitively impaired older adults, Pareto-based adaptive difficulty. |
| **81** | Andersson, H.; Häggblom, J. "Adaptive Versus Non-Adaptive Difficulty Level Progression in a Mixed Reality Game: A Comparative Experiment with Seniors..." Master's thesis, Umeå University, 2025. | Seniors specifically, adaptive-vs-non-adaptive design, rated "Success." |
| **11** | Eun, S.J.; Kim, E.J.; Kim, J. "Artificial intelligence-based personalized serious game for enhancing the physical and cognitive abilities of the elderly." *Future Gener. Comput. Syst.* 2023, 141, 713–722. | Elderly-focused, AI-personalized, rule-based, rated "Success." |
| **9** | Yildirim, O.; Surer, E. "Developing Adaptive Serious Games for Children with Specific Learning Difficulties..." *JMIR Serious Games* 2021, 9, e25997. | Cognitive personalization for a non-typical-learner population; "Promising" — useful methodological analogy even though the population (children) differs. |
| **10** | Shohieb, S.M.; Doenyas, C.; Elhady, A.M. "Dynamic difficulty adjustment technique-based mobile vocabulary learning game for children with autism spectrum disorder." *Entertain. Comput.* 2022, 42, 100495. | DDA for a cognitively-atypical population; the "without requiring manual intervention, which would break the game immersion" framing is directly reusable. |
| **70 / 76** | Freitas, E.V.S. et al. — cognitive/memorization serious games for children with Autism Spectrum Disorder. | Memorisation-focused game design precedent for a cognitively atypical population. |
| **67** | Troussas, C. et al. "Utilizing Fuzzy Weights to Model Logical Reasoning in Digital Escape Rooms: Dynamic Difficulty Adjustment for Enhanced Digital Skill Development." 2024. | Pattern/logical-reasoning game adaptivity — relevant to PS clause (a) pattern/object recognition. |
| **23** | Cardia da Cruz, L. et al. "A Self-adaptive Serious Game for Eye-Hand Coordination Training." HCI-Games 2020. | Hand-eye coordination DDA — relevant if we build a fine-motor/coordination mini-game (though note Mantell's warning on fine-motor mechanics for elders, [02](02-mantell-gbca-usability-review.md)). |
| **40** | Danousis, M.; Goumopoulos, C.; Fakis, A. "Exergames in the GAME2AWE Platform with Dynamic Difficulty Adjustment." ICEC 2022. | Explicitly "aimed at improving the motor and cognitive functionality of the elderly." |
| **26** | Nebel, S. et al. "Competitive Agents and Adaptive Difficulty Within Educational Video Games." *Front. Educ.* 2020, 5, 129. | NPC-driven DDA reduced shame, increased empathy/engagement — relevant if we ever add a companion-character difficulty cue. |
| **52** | Bjørner, T. "Using EEG data as Dynamic Difficulty Adjustment in a serious game about the plastic pollution in the oceans." GoodIT '23. | The cautionary tale against physiological-sensor-based difficulty signals for v1. |

---

# Against our problem statement (PS: AI-based cognitive gaming and memory assistance for elderly dementia patients, NER)

| PS clause | What this paper gives us | What it does not |
|---|---|---|
| **(a) Cognitive games** — memory, attention, routine recall, pattern/object recognition | Direct precedent for memory-game DDA (refs 35, 54), pattern/logical-reasoning DDA (ref 67), and memorisation games for cognitively atypical users (refs 70, 76) — a small but real methods bibliography for exactly our game categories. | Nothing on daily-routine-recall specifically, and nothing NER-culturally-relevant (no native-object/crop/toy/clothing game precedent anywhere in the corpus). |
| **(b) AI/ML adaptive difficulty (our Q-learning RL)** | **This is the paper's entire subject.** Direct named precedent for Q-learning + fuzzy logic (ref 64); RL-in-memory-games precedent (refs 35, 54); the stated flexibility-vs-effort trade-off that justifies choosing RL over pure rule-based; and the honest gap that **cold-start is unaddressed** anywhere in this literature, which we should own as our own design contribution. | No cold-start method; no meta-analytic verdict on RL vs. alternatives — only popularity counts and one small head-to-head comparison. |
| **(c) Multilingual + voice** | Nothing. Out of scope for a DDA methods review. | — |
| **(d) Engagement — visuals, accessibility** | Indirect support: performance-based (not physiological/sensor-based) player modelling is both the field's default *and* the more offline/hardware-friendly choice for us; the EEG failure case (ref 52) is a concrete cautionary citation against wearable/physiological difficulty signals for a first version. | Nothing on visual design, contrast, or motion — this is a difficulty-adaptation methods review, not a UI/accessibility review (see Mantell and ENHANCE summaries for that). |
| **(e) Reminders** | Nothing. Out of scope. | — |
| **(f) Caregiver / health-worker dashboards** | Nothing directly, though several rehabilitation-domain papers (e.g., ref 78, clinical validation of an auto-adaptive game after stroke) imply clinician-facing progress data as a byproduct of DDA logging — worth a look if pursuing that paper directly. | No dashboard usability or reporting-template evidence. |
| **(g) Offline / low connectivity** | Rule-based/fuzzy-logic DDA (18 of 75 papers) is lightweight enough to run fully on-device with no cloud dependency — relevant precedent for keeping our offline-mode difficulty adjustment simple (rules/fuzzy) versus a heavier RL model requiring more compute or connectivity for training/updates. | No explicit offline-deployment or connectivity discussion anywhere in the review. |
| **(h) Mobile/tablet, elderly-friendly UI** | Nothing direct — this is a backend/algorithm review, not a UI review. | — |
| **Security / data** | Nothing. Out of scope. | — |

**Where this paper leaves our biggest gaps unfilled:** no cold-start guidance (a real, admitted gap in the field, not just this paper); no NER or South Asian population anywhere in the 75 studies; no dementia-specific (only "cognitively impaired older adults," broader) precedent; and — because this is a review of reviews — every number here is one more level removed from the primary data than in the ENHANCE or Mantell summaries, so **the concrete next step is to pull refs 64, 35, 54, 89, and 81 directly**, not to keep citing this paper's summary of them.
