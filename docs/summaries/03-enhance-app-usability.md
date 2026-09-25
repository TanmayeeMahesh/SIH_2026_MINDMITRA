 # ENHANCE coach-supported dementia-prevention app, 1-week usability — Yu et al., 2026, *JMIR Aging*

Link: <https://pmc.ncbi.nlm.nih.gov/articles/PMC13395424/> · JMIR Aging 2026;9:e92800 · DOI [10.2196/92800](https://doi.org/10.2196/92800) · PMID [42492485](https://pubmed.ncbi.nlm.nih.gov/42492485/) · CC BY 4.0 (we may quote and adapt with credit)
Read by: _(fill in — drafted from the full open-access text, all figures below verified against the paper)_
Date: 2026-09-10
Reading-list ID: item **#3**, Tier 0 ([../02-reading-list.md](../02-reading-list.md))

> Note on length: [Part D](../02-reading-list.md) says a one-pager longer than a page has been "transcribed rather than summarised". This note is deliberately transcribed — every number and quote we might cite is here so nobody has to reopen the paper mid-deck. The first six sections are the one-pager; everything after `---` is the transcript.

---

## What they did

A 1-week mixed-methods at-home usability test of the ENHANCE app prototype with **10 community-recruited adults aged 60–80 without dementia**, each with ≥1 of 10 modifiable dementia risk factors, recruited in **London between November 2024 and February 2025** through food banks, shopping malls, religious groups and community organisations serving low-income and ethnic-minority communities. Each participant got a 60-minute face-to-face onboarding session with a coach (SMART goal + app setup), a **tablet with the app installed and a SIM card**, 7 days of independent use with a coach phone check-in on days 4–6 and in-app messaging, then a ~60-minute post-test interview and an 8-item satisfaction survey. Backend usage logs + survey (descriptive, SPSS 25) + reflexive thematic analysis of onboarding, interview, coaching-call and in-app-message transcripts (Braun & Clarke, NVivo 14), coded against the **COM-B** model. Participants received **£80** in vouchers. Usability study only — no cognitive outcome, no control group.

## The three findings that matter to MindMitra

1. **Text chat is the feature the least digitally confident users never find; the phone call is the one nobody misses.** All 10 completed the coach phone check-in, but only **7/10 used in-app messaging** — and of the 3 non-users, **2 said they were unaware the feature existed despite having been taught it during onboarding**. The paper's own read: "Nonusers tended to be older, less educated, and less familiar with tablets." Against this, the messaging screen was the *most* praised interface in the app precisely because it copied WhatsApp. Directly threatens our text-chatbot plan (PS clause g) and directly supports the ASHA/voice layer.

2. **Difficulty must fall after failure and rise only slowly — and "too easy" is as disengaging as "too hard".** The single most useful quote in the paper for our adaptive engine, on the What Word game: *"If you got it wrong, the game would give you an easier word to get you more motivated. I like this… Because if it gave me harder ones right after a miss, I'd probably stop and say, 'Forget it.'"* [P3, 60–69, Mixed]. And on the game judged too simple (Night Sorter): *"Bosh, bosh, bosh. It's very straightforward. But no, it's not much fun, is it? … Not much thinking needed."* [P1, 60–69, White] — that game also had the lowest engagement floor (range 2–15 plays/wk, SD 6, the widest spread of any game). This is a two-sided target band, which is the actual justification for our Q-learning layer, plus a hard asymmetry constraint on its reward shaping.

3. **Every engagement number here was bought with scaffolding we have to budget for, and family support was assumed and then simply did not happen.** Free tablet + SIM, 45–60 min in-person onboarding, a proactive phone call mid-week, £80 compensation — the authors list all of this as a limitation ("High engagement occurred under supported conditions… which may not reflect real-world implementation"). And despite being asked at onboarding whether they wanted family involvement, **zero of 10 involved a family member**, "commonly due to living alone or lacking tech-savvy relatives nearby". Their conclusion: *"External coaching may therefore serve as a more feasible alternative, with family involvement supplementary where available."*

## One number I can put on a slide

**10/10 completed the coach's phone check-in; 7/10 used the in-app text chat — and 2 of the 3 non-users did not know the chat existed, despite being shown it in person.** Measures uptake of two support channels over one week in a supported at-home trial (n=10, London, tablets provided). Caveat: n=10 by design (the sample size was chosen because ~10 users surfaces ≈95% of major usability issues, not for statistical inference), so this is a *design signal, not a rate*. Say "in a 10-person usability trial", never "30% of elderly users".

## What this changes about our product

- **Voice/call first, text second.** Keep the offline chatbot, but it must not be the primary caregiver-contact path, and it must not be the only way to reach a human. Every text affordance needs a voice equivalent (PS clause c) and a "call your ASHA" button that is visible on the home screen, not inside a menu.
- **Onboarding is a product surface, not a leaflet.** In-person coaching was described as *"very necessary"*, and participants asked for **hands-on** onboarding over demonstration: *"if the coach showed them how to do it once and then had them do it themselves once"* [P3]. Our ASHA onboarding script should be do-it-yourself-once, per feature — and note that being *shown* a feature once did not stop 2/10 forgetting it exists. Features need in-app re-discovery (a returning nudge on the home screen), not just a good first-run tour.
- **Adaptive engine reward shaping:** drop difficulty immediately on failure, raise it slowly on a streak, never raise it on the step straight after a miss. Add an explicit "too easy" penalty term — boredom cost this study a game. Cold-start from ASHA-entered baseline rather than making the elder fail their way down.
- **Accessibility spec, straight into [../16-how-the-ai-works.md](../16-how-the-ai-works.md)'s sibling UX doc — ban list, sourced:** no flashing text/numbers, no multiple simultaneously moving targets (an epilepsy concern was raised unprompted), no swipe-only interactions (defeated a participant with an arm injury), no fine-motor or reaction-speed mechanics, no small cluttered icon grids, no low-contrast visuals, no hard time limits without an off switch. Provide visually calm alternatives or adjustable display settings. Test with users who have sensory sensitivities.
- **One green-hand rule.** A participant could not play Stump Shuffle because the "press here" prompt out-shouted the actual target: *"the 'hand' is just so overpowering. It was a great big green hand. It's telling you, 'Press here.' But you're not pressing there — you should be focusing on the odd logo."* One salient visual cue on screen at a time, and the cue must point at the goal, not at the mechanism.
- **Copy interfaces our users already know.** WhatsApp-shaped chat, card-matching, word games. For NER this means the familiar-mechanic audit belongs in [../15-ner-cultural-adaptation.md](../15-ner-cultural-adaptation.md): which games are *actually* recognisable to an elder in rural Meghalaya is not answerable from a UK paper — Scrabble and matching-pairs were the UK anchors, ours will differ.
- **Rewards must be transactionally reliable, which is an offline-sync requirement.** A reward-crediting bug produced the study's sharpest negative quote: *"it didn't seem to add the reward to your watering can… This is disappointing. What's the point then?"* [P2]. Our offline queue must credit rewards locally and immediately and never double-credit or drop one on sync (PS clause g). A lost star is worse than no star.
- **Add simple progress visualisation — users asked for it unprompted**, for both game scores and health logs: *"Is there anywhere that accumulates those scores… to see whether you've got better during the week or the month? To give you more incentive to keep trying to beat your score."* [P8]. Note the countervailing evidence they cite: complex progress visualisations confuse older users, and extrinsic rewards can undermine motivation once intrinsic engagement exists. So: one simple trend, tied to the elder's own stated goal — and keep leaderboards and any public/competitive display out (ENHANCE excluded them deliberately, citing evidence they deter older users). Our caregiver dashboard (clause f) can be as detailed as we like; the *elder's* view cannot.
- **Video format for our psychoeducation content: named real clinician + peer story, not diagrams.** *"Dr. Sherman is going to be telling the truth because he was going to be real life doctor. It's not like YouTube people"* [P4]; *"I like that it has someone's personal story because it makes it more relatable… I relate more to seeing that human rather than diagrams"* [P1]. For NER: a local doctor and a local caregiver, in the local language, on screen.
- **Session length target: keep games under ~8 minutes** (ENHANCE's design choice, listed among the features they credit for engagement), positive feedback only, no penalties, new content weekly.
- **Nothing changes** about our diagnosis boundary or our data model — this paper says nothing about either beyond confirming that pseudonymised codes stored separately from consent forms is the norm reviewers expect.

## What this forbids us from claiming

- **We cannot say this evidences anything about dementia patients.** Every participant was screened to *exclude* dementia. ENHANCE is a **prevention** intervention for at-risk 60–80-year-olds. Our PS is about people who already have dementia. Correct phrasing: *"in older adults at risk of dementia, a coach-supported prevention app was usable and acceptable over one week"*. Never: *"apps like this work for dementia patients"*.
- **No efficacy claim of any kind.** No cognitive outcome measured, no control group, no follow-up. Not "improved cognition", not "reduced risk", not "slowed decline". This paper is evidence about *usability and engagement design*, full stop. (Our cognitive-benefit claims rest on Woods et al. Cochrane 2023, item #1 — not this.)
- **No long-term engagement claim.** One week. The authors: "leaving its long-term engagement and feasibility untested". The 91%→41% task-completion decay figure in the discussion is **PRODEMOS's number [ref 36], not ENHANCE's** — if we use it, cite PRODEMOS. Same for the PRODEMOS 69%/71%/77% acceptability figures.
- **We cannot claim this validates our design for low-literacy or low-education users.** **Zero of 10** participants met the <8-years-education risk factor; mean full-time education was **14 years (SD 3, range 10–18)**; 9 of 10 held higher-secondary or bachelor's qualifications. The authors concede: "Despite targeting underserved settings, the sample had relatively high educational attainment; usability barriers may be greater among those with lower literacy." Our low-literacy design decisions are currently **unsupported by evidence** — that gap is real and we should name it on the risks slide rather than paper over it.
- **We cannot cite this for low-connectivity or rural feasibility.** London, urban, tablets and SIM cards issued by the study. Device and connectivity barriers were *removed*, not studied. The authors flag limited generalisability "to rural areas and other countries".
- **We cannot claim unsupervised or self-serve use works.** Engagement was measured under paid, coached, device-provided conditions.
- **We cannot claim multilingual or voice validation.** Eligibility required being "able to read and communicate in basic English"; 7/10 had English as a first language; the app was English and text/video-based. Nothing here validates Sarvam/Bhashini-style regional-language or voice interaction (clause c) — it only shows that text is a barrier for the least digitally confident, which is an *argument for* voice, not evidence about it.
- **We cannot use "no adverse events" as a safety endorsement.** No AEs were reported to the coach or team, **but** participants described visual discomfort with flashing and rapidly moving game elements in the interviews, including an explicit epilepsy concern. If we quote the safety line we must quote the discomfort finding with it.
- **We cannot claim adaptive difficulty was evaluated.** Some games adapted; the adaptation was never tested as a variable. The support for it is one participant's preference, in one interview. Cite it as a *design requirement voiced by a user*, never as evidence that DDA improves outcomes. (For method evidence, use the DDA review, item #9.)
- **We cannot claim family involvement is a feature that works.** It was offered to all 10 and used by 0.
- **Do not quote "6 from ethnic minority backgrounds" and the ethnicity table side by side without checking.** See the inconsistency note in the quality check below.

## Quality check

**Peer-reviewed?** Yes — *JMIR Aging*, an established peer-reviewed journal; received 2026-02-03, revised 2026-06-15, accepted 2026-06-23. Ethics: UCL IRB ID 24235/001, approved 2023-06-19. Reporting is unusually complete (reflexivity statement, appendices with the screening questions, interview guide and survey, COM-B mapping table).
**Sample size?** n=10, and deliberately so — justified by the usability-testing convention that ~10 users surface ≈95% of major usability issues. Adequate for its purpose (finding design defects), useless for prevalence or effect estimation. Every survey figure is out of 10; report them as counts, never percentages.
**Population like ours?** *Partly, and the mismatches are the important part.* **Like ours:** deliberately recruited through food banks, community and religious organisations; wide deprivation range (IMD deciles 1–8, mean 4); ethnically diverse; 5/10 not comfortable-or-better with technology; 4/10 had never used a tablet; purpose-built for elders who are usually excluded from prevention trials. **Not like ours:** no dementia (this is the big one), urban London not rural NER, English-speaking, and higher-educated than the study intended. Treat the *barriers* it found as highly transferable (motor, sensory, visual-cue, text-channel problems are human, not cultural) and the *engagement rates* as not transferable at all.
**Conflicts of interest?** "None declared." Funded by NIHR Programme Grant NIHR203670; the funder had no stated role. **But note the structural bias:** the authors built the app, and the sole interviewer/analyst (TKCY) was a core member of the team that co-designed it and had reviewed each participant's usage data before interviewing them. They address this openly with a reflexivity statement and flag social-desirability bias themselves, arguing backend logs showing above-minimum use suggest genuine engagement. It is a self-evaluation by the developers; the qualitative barriers are credible *because* they are unflattering, the satisfaction scores less so.
**Two internal inconsistencies to know before a hostile judge finds them for us:** (i) the text says "4 were White and 6 were non-White", but Table 1 lists White British 4 + White Irish 2 = 6 White vs 4 non-White; the abstract's "6 from ethnic minority backgrounds" reconciles only if White Irish is counted as an ethnic minority (defensible in UK census terms, but the paper never says so). Quote the table, not the sentence. (ii) Games were capped at "up to 10 times per week after first completion", yet Caterpillar Chase is reported at mean 10 plays/week with a range to **18** — the normalisation formula `(total plays ÷ total days of app use) × 7` and the cap do not obviously reconcile. Don't build an argument on the gameplay-frequency numbers.
**Would I defend citing this to a hostile judge?** **Y** — for our accessibility ban list, the case for human coaching over text chat, the difficulty-band requirement, and as proof that someone has studied elders like ours properly. **N** — for anything about efficacy, dementia patients, long-term engagement, low literacy, rural connectivity, multilingual/voice, or adaptive-difficulty effectiveness.

---

# Transcript — the numbers, verbatim

## Citation and provenance

| Field | Value |
|---|---|
| Authors | Tsz Kiu Clare Yu, Gill Livingston, Richard Boczko, Kealan Forristal, James Jamison, Carl Leckstein, Vrushti Mehta, Hee Kyung Park, Aneesha Singh, Andrew Sommerlad, Sergi G Costafreda |
| Affiliations | Division of Psychiatry UCL; North London NHS Foundation Trust; Univ. of Hull; KCL SGDP Centre; UCL Psychology & Language Sciences; Samsung Medical Center / Sungkyunkwan Univ.; UCL Interaction Centre |
| Venue | *JMIR Aging* 2026;9:e92800 · Editor: Haley LaMonica |
| Funding | NIHR Programme Grant for Applied Research **NIHR203670**; funder had no role in design, collection, analysis, interpretation or writing |
| Conflicts | None declared |
| Licence | CC BY 4.0 — unrestricted reuse with citation |
| Data availability | Qualitative data not public (re-identification risk); redacted extracts on request |
| Part of | The wider ENHANCE programme (NIHR, 2023–2029). Companion paper — co-design and earlier usability: PMID [42523013](https://pubmed.ncbi.nlm.nih.gov/42523013/) / [PMC13469833](https://pmc.ncbi.nlm.nih.gov/articles/PMC13469833/). **Worth reading next; it is the design-process paper for the same app.** |

## Background numbers the paper cites (secondary — cite the original source, not this paper)

- **152 million** people with dementia globally projected by 2050 [ref 1, GBD 2019 / Nichols et al. 2022].
- **45%** of cases potentially preventable by eliminating **14** modifiable risk factors [ref 2, Lancet Commission 2024]. Listed: less education, hypertension, diabetes, physical inactivity, smoking, obesity, depression, hearing loss, excessive alcohol, social isolation.
- Multidomain interventions give cognitive benefit but "effects are typically modest" — network meta-analysis of >100 RCTs found **small** improvements [ref 3]; "Maintain Your Brain" RCT (n>6000) reported **modest gains over 3 years** [refs 4,5].
- Representativeness failures: ACTIVE (n=2832) — **88.6%** with high-school diploma or more vs **67%** of the US population aged 65+ [ref 14]. FINGER (n=1260) — higher education, younger, healthier than non-screened eligibles [ref 15].
- UK context: **81%** of adults 65+ used the internet in 2021–22, **49%** of those via tablet [ref 18]; **67%** of people from lower-SES backgrounds (all ages) owned a smartphone [ref 19].
- PRODEMOS (the only other UK app-based dementia-prevention programme for underserved populations), UK arm **n=600**, at 3-month follow-up: **69%** found the app acceptable, **71%** feasible, **77%** appropriate [ref 36]. Task completion fell from **91%** in the first 2 weeks to **41%** by month 3 [ref 36].

## The intervention as built (our closest reference implementation)

Targets **10** modifiable risk factors: hypertension, diabetes, physical inactivity, obesity, depression, smoking, excessive alcohol, social isolation, hearing loss, low education. Three feature categories:

- **Core content** — **7 cognitive training games**; modules for the other 9 risks, each with educational videos + brief weekly check-in questions. Everyone got the games "as they are rewarding in themselves"; each participant chose **1** risk module for the test week.
- **Engagement tools** — a unifying **"meadow" home screen** and rewards page: virtual **seeds** earned by playing games, watching videos and answering check-ins, spent to **plant flowers** in your meadow; plus a progress tracker showing **weekly stars**.
- **Human support** — **45-min in-person onboarding** + **fortnightly** remote short follow-ups; a **coach-only dashboard** to monitor participant activity; **in-app messaging** with the coach; **optional family involvement**.

Game design choices the authors credit for engagement: light problem-solving tasks; **adaptive difficulty**; **positive feedback only, no penalties**; **brief — under 8 minutes per session**; **new games introduced weekly**; **competitive elements (leaderboards, public performance displays) deliberately excluded**, citing evidence they deter older users.

Games named: **Caterpillar Chase, Hive Finder, What Word, Stump Shuffle, Night Sorter, Mushroom Match, Worm Hunter**. Each participant was randomly assigned **3** games per week, each playable **up to 10 times per week** after first completion.

## Protocol

- **Day 0** — 60-min introductory session (university or participant's home, their choice), led by a coach with an MSc in Psychology, observed by the researcher. Sociodemographic + risk questionnaire → coach reviews risk profile → participant picks the module to target → coach helps write a **SMART goal** → guided app setup and feature tour. Participant leaves with **a tablet with the app installed and a SIM card**, and a reminder to complete ≥1 video, ≥1 check-in and each of the 3 games at least once. Session audio-recorded; researcher noted difficulties and misunderstandings.
- **Days 1–7** — independent home use. Coach reachable via in-app messaging; **proactive phone check-in on days 4–6** (recorded).
- **Days 8–14** — ~60-min semi-structured post-test interview at the same venue, guide co-developed with PPI representatives; the interviewer reviewed usage logs beforehand to probe unused features. Then an **8-item, 1-page satisfaction survey** (~5 min, Qualtrics, completed alone with the researcher withdrawn to reduce social-desirability bias, all items mandatory, review-and-amend screen before submission), adapted from the **CSQ-8** because no existing instrument covered app gameplay + risk modules + one-to-one coaching. Tablet returned; **£80** in vouchers (£25 onboarding + £25 feedback + £30 app use). £1 = US$1.34.
- **Minimum required use** = watch the assigned risk video ≥1×, answer the check-in ≥1×, play each of the 3 assigned games ≥1×.
- **Eligibility** — 60–80 years; ≥1 targeted risk factor (<8y full-time education, diagnosed diabetes, hypertension, BMI>30, current smoker, >21 units alcohol/week, <2.5h exercise/week, depressive symptoms via adapted **PHQ-2**, social isolation via 1 adapted **Lubben Social Network Scale** question, self-perceived hearing impairment); able to read and communicate in **basic English**; capacity to consent. **Excluded:** self-reported dementia diagnosis, or any disability that would significantly impact tablet use — both by self-report, **no formal clinical assessment** (the authors list this as a limitation).
- **Recruitment** — from a database of >100 adults 60+ previously recruited through community settings serving underserved populations (food banks, neighbourhood shopping malls, religious groups, community organisations) who had taken part in ENHANCE co-production and consented to re-contact. **No centres serving people with dementia were included.** Purposive sampling on age, ethnicity and IMD to over-sample deprived areas and non-White backgrounds. Recruiter told candidates that **no prior digital skills and no home tablet were required**.
- **Analysis** — SPSS 25 (quant, descriptive), NVivo 14 (qual), Happy Scribe transcription reviewed for accuracy, 6-step reflexive thematic analysis, themes refined over **5 biweekly meetings** with 4 co-authors, **COM-B** as the guiding framework, quant and qual integrated after separate analysis.

## Sample (n=10) — Table 1 as printed

| Characteristic | Value |
|---|---|
| Age (y), mean (SD; range) | **68 (6; 60–77)** |
| Years of full-time education, mean (SD; range) | **14 (3; 10–18)** |
| IMD decile (1 = most deprived), mean (SD; range) | **4 (2; 1–8)** |
| Sex | Male 3 · Female 7 |
| Ethnicity | White British 4 · White Irish 2 · South Asian (Pakistani/Indian/Bangladeshi) 2 · East Asian (Chinese) 1 · Mixed (White & Black) 1 |
| Highest qualification | Lower secondary (CSE/GCSE) 1 · Higher secondary (A-Levels/BTech) 6 · Bachelor's 3 |
| English as first language | 7 |
| Technology use ("yes" only) | Used a tablet before 6 · smartphone 9 · computer 8 · **owned a tablet with internet access 5** |
| Comfort using technology | Very uncomfortable 0 · Somewhat uncomfortable 3 · Neutral 2 · Somewhat comfortable 4 · Very comfortable 1 |
| Dementia risk factors (multiple possible) | **Less education (<8y): 0** · Diabetes 3 · Hypertension 6 · Obesity 2 · Smoking 1 · Excessive alcohol 1 · Physically inactive 4 · Socially isolated 1 · Subjective hearing impairment 6 · Depression 4 |
| Number of risk factors per person | 1 → 3 people · 2 → 3 · 3 → 0 · 4 → 3 · 5 → 1 |
| Module chosen for the test week | Hypertension 5 · Hearing impairment 2 · Diabetes 2 · Depression 1 |

## Usage results

- All 10 completed onboarding, the test week, the phone follow-up, the interview and the survey. **No dropouts.**
- App used for a mean of **9 days (SD 3, range 7–16)**; the 16-day case was an illness-delayed follow-up.
- **10/10 completed and exceeded** all minimum-use tasks.
- **Video rewatches:** 0 → 5 people · 1 → 3 · 2 → 1 · >3 → 1 (i.e. 5/10 rewatched at least once).
- **In-app messaging: used 7, not used 3.** Of the 3: 1 said he did not need it; **2 said they were unaware of the feature although they had learned how to use it during onboarding**.
- **Blood-pressure daily logging** (only the 5 hypertension-module participants had it): entries on a mean of **5 of 7 days (SD 1, range 4–7)**; **all 5 logged at least 4 times**. Formula: `(total check-in days ÷ total days of app use) × 7`.
- **Weekly gameplay** — Table 3, `(total plays ÷ total days of app use) × 7`, then averaged:

| Game | Assigned (n) | Plays/week/participant, mean (SD) | Range |
|---|---|---|---|
| Caterpillar Chase | 6 | **10 (5)** | 6–18 |
| Hive Finder | 4 | 7 (3) | 4–9 |
| What Word | 5 | 7 (3) | 3–10 |
| Stump Shuffle | 6 | 7 (2) | 3–9 |
| Night Sorter | 4 | 6 (6) | 2–15 |
| Mushroom Match | 4 | 5 (2) | 3–6 |
| Worm Hunter | 1 | 6 (6) | 6–6 |

  (Assignment counts differ because 3 games were randomly allocated per participant per week. The paper warns Worm Hunter is n=1. Note the cap/range tension flagged in the quality check.)

- **Satisfaction survey, original item-specific options (all out of 10):** satisfied or very satisfied with the app **10** · rated it easy or very easy to use **10** · app met or exceeded expectations **10** · likely or very likely to continue using it **9** · likely or very likely to recommend it to others their age for dementia prevention **9** · liked or liked a lot the games **9** · satisfied or very satisfied with coach support **9** · likely or very likely to help lifestyle behaviour change **7** (**3 said unlikely**).
- **Adverse events: none reported** to the coach or research team. But visual discomfort with rapidly moving/flashing visuals in specific games was described in the post-test interviews.

## The six COM-B themes, with the quotes worth reusing

**T1 · Capability — building confidence by trial and error.** Initial uncertainty about the unfamiliar interface resolved through experimentation. *"I found it [the instructions] a little bit unclear… because it didn't explain what you were trying to do. I had to spend some effort figuring it out myself. But I got a hang of it at last."* [P1, 60–69, White]. Competing visual cues broke this: *"Because the 'hand' is just so overpowering. It was a great big green hand. It's telling you, 'Press here.' But you're not pressing there — you should be focusing on the odd logo. I didn't get that… but [the coach] explained."* [P4, 60–69, Asian]. Familiar interfaces made learning intuitive: *"the message one is intuitive, isn't it? It is like WhatsApp. I thought it pop up the keyboard and everything. That's good."* [P1].

**T2 · Motivation — enjoyment, personal goals, virtual rewards.** Games described as "fun", "exciting", "got hooked". Right-level challenge: *"I think [Hive Finder] is at the right level of challenge because it was pretty challenging for me — I didn't always get it. I'd run out of time sometimes. But it was fun."* [P3]. Too easy → disengagement: the "bosh, bosh, bosh" quote [P1]. Adaptive difficulty valued: the "Forget it" quote [P3]. Self-improvement motive: *"I regard it as just a good exercise… as an activity which is helpful because it really focuses me on my concentration. So I continued."* [P7, 70–79, White]. Progress visualisation requested [P8, quoted above]. Rewards worked — *"This is a clever idea. Yeah. It's accomplishment to me."* [P7] — and failed when buggy: *"Sometimes if I played the game twice in a session, it didn't seem to add… didn't seem to add the reward to your watering can…. This is disappointing. What's the point then?"* [P2].

**T3 · Physical capability barriers.** *"I've got a problem in my arm because I've had an accident so I can't do fast for this [Night Sorter]. The swipe thing is kind of like difficult."* [P9, 70–79, Asian]. Low-contrast visuals and time constraints also raised (appendix 5).

**T4 · Discomfort in gameplay.** *"When you had a lot of stumps, and they were moving around… Not just one stump was moving, several of them were moving. I find that… visually quite difficult with flashing numbers, flashing letters, that thing… especially for Epilepsy. That might set you off a bit…"* [P2]. Hive Finder criticised for small, cluttered icons.

**T5 · Opportunity — coaching and hands-on learning.** *"I think it [the introductory session] is very necessary… We can stick to exactly what the coach has shown us. … to have that face-to-face setting up and everything, really."* [P2]. *"if the coach showed them how to do it once and then had them do it themselves once."* [P3]. *"I like it [follow-up calls] because you still feel like, oh, somebody really cares."* [P10, 60–69, White].

**T6 · Motivation for behaviour change — trusted experts + personal stories.** *"Dr. Sherman is going to be telling the truth because he was going to be real life doctor. It's not like YouTube people… It's going to be true. I was ready and willing to listen carefully and attend."* [P4]. *"The video shows me what to do. That's very important… certain foods make the blood sugar go quickly up… Glycemic, they call it."* [P9]. *"I like that it has someone's personal story because it makes it more relatable. Personally, I like to see something. I relate more to seeing that human rather than diagrams."* [P1].

## Table 4 — their design implications, as printed (this is effectively a free UX spec)

**Capability.** Design interfaces that let users try, make mistakes and learn **without penalties**. Use familiar interface elements and game formats (WhatsApp-style chat, card matching, Sudoku, word games). Use **large fonts and high colour contrast**. **Avoid game features requiring fine motor skills or fast reactions.**
**Opportunity.** **In-person human coaching is essential** to support effective app use. Introductory sessions should prioritise **experiential learning over didactic instruction**. **Telephone follow-up coaching is generally preferred over in-app chat, though chat should remain available as an option.** Ensure access to a device and reliable internet connectivity. **Family involvement can be beneficial and should remain an optional form of support.**
**Motivation.** Incorporate fun games to boost overall engagement. Design games with **light problem-solving and adaptive difficulty**. **Keep games short and update content regularly.** Use **consistent** virtual rewards linked to personal goals. Use **simple, easy-to-understand visual progress tracking** linked to users' personal goals. **Avoid flashing visuals, rapid motion, or dense layouts.** Offer visually calm alternatives or adjustable display settings. **Test games with users who have sensory sensitivities.** Combine trusted expert input with relatable peer narratives; use clear, actionable advice; present information in simple multimedia formats.

## Limitations, in the authors' own words

1-week timeframe leaves longer-term usability untested. Small, London-based sample limits generalisability to rural areas and other countries. Social desirability bias may have affected interviews (mitigated, they argue, by backend logs showing above-minimum use). "Despite targeting underserved settings, the sample had relatively high educational attainment; usability barriers may be greater among those with lower literacy." "High engagement occurred under supported conditions — device provision, face-to-face onboarding, coach support, and study compensation — which may not reflect real-world implementation." Eligibility relied on self-reported absence of dementia without formal clinical assessment.

Their own supporting evidence worth chasing separately: human-led in-person or voice coaching is preferred by older adults and "may foster deeper engagement than text-based or **AI-driven approaches, such as chatbots**" [refs 40,41]; text-based interfaces are a direct barrier when reading or digital skills are limited [ref 42]; gamified cognitive training yields greater motivation and engagement than less gamified alternatives (meta-analysis) [ref 55]; visual feedback and virtual rewards out-predicted leaderboards for actual physical activity [ref 60]; virtual currency earned through steps raised activity over 6 months, most in sedentary and high-BMI users [ref 61]; complex progress visualisations are unclear to older users [ref 62]; extrinsic rewards can undermine long-term motivation once an internally rewarding loop exists [ref 63].

---

# Against our problem statement (PS: AI-based cognitive gaming and memory assistance for elderly dementia patients, NER)

| PS clause | What this paper gives us | What it does not |
|---|---|---|
| **(a) Cognitive games** — memory, attention, routine recall, pattern/object recognition, native objects | A working 7-game taxonomy with per-game engagement data, an "under 8 minutes" session target, positive-feedback-only rule, no leaderboards, weekly content rotation, and the "familiar mechanic" principle (their UK anchors: Scrabble, matching pairs). Our NER equivalents — crops, toys, clothes, festivals — are exactly this principle applied locally. | No cognitive outcome data. It cannot tell us any game *works*; only that some are more played than others, in a prevention population. |
| **(b) AI/ML adaptive difficulty (our Q-learning RL)** | A user-voiced requirement with an asymmetry: easier immediately after a miss, and never harder right after one; plus evidence that too-easy is also fatal. That is a two-sided reward band and a shaping constraint we can defend on a slide with a real quote. | No evaluation of adaptive difficulty as an intervention. Zero support for RL specifically — methods evidence must come from the DDA review (item #9). |
| **(c) Multilingual + voice** | The strongest *indirect* argument we have: text chat was invisible to the least digitally confident users, and the authors cite evidence that voice/human channels beat text and chatbots for this group. | Nothing direct. English-only app, English-speaking sample. No ASR/TTS evidence, nothing about Indic languages or Sarvam/Bhashini. |
| **(d) Engagement — visuals, accessibility** | The most transferable content in the paper: the green-hand cue conflict, swipe/fine-motor failure, flashing and multi-target motion discomfort (epilepsy concern), cluttered small icons, low contrast, hard time limits, large fonts, high contrast, adjustable display settings. Take the ban list wholesale. | Nothing measured — these are interview findings from 10 people, some from a single participant each. Cite as design requirements, not prevalence. |
| **(e) Reminders** — medicines, hydration, activities, appointments | Adjacent evidence only: the daily BP-logging check-in was completed on **5 of 7 days** by all 5 who had it, so a lightweight daily health-logging prompt is plausibly sustainable for a week. Weekly check-ins tied to a SMART goal set with a human is the pattern. | ENHANCE has no medication/appointment reminder system. Nothing here about adherence, alarms, or hydration. |
| **(f) Caregiver / health-worker dashboards** | ENHANCE has a **coach-only dashboard** to monitor participant activity, and the coach reviewed usage before conversations — a direct precedent for our ASHA view. The elder-facing view, by contrast, should stay simple and non-comparative. | No evaluation of the dashboard, no coach-side usability data, nothing about government report templates. |
| **(g) Offline / low connectivity** | Only as a warning: this study **removed** the connectivity problem by issuing tablets and SIMs, and lists "ensure access to a device and reliable internet connectivity" as a design implication — i.e. the one constraint we cannot design away, they paid to avoid. Also the reward-bug finding, which makes reliable offline reward crediting a first-class requirement. | No offline functionality, no sync, no rural deployment. Our offline claim gets no support here. Our text-chatbot plan gets actively undermined. |
| **(h) Mobile/tablet, elderly-friendly UI** | Tablet-delivered to elders with low digital confidence (4/10 had never used a tablet), and it worked over a week — with in-person onboarding. Onboarding is part of the product, and being shown a feature once is not enough (2/10 forgot the chat existed). | One week, urban, supported, paid. |
| **Security / data** | The norm this journal's reviewers accepted: pseudonymisation with alphanumeric codes, code list and consent forms stored **separately** from anonymised data, paper in locked cabinets, electronic on password-protected encrypted institutional drives, access limited to the core team, retention 1 year post-analysis, written informed consent with a plain-language information sheet stating time commitment and the right to withdraw. | No technical security architecture, no discussion of health-data regulation. |

**Where this paper leaves our biggest gaps unfilled:** (1) nothing on dementia patients — this is a prevention study, and our whole PS is post-diagnosis; (2) nothing on low literacy, despite that being its stated target; (3) nothing rural, offline, or non-English. Those three are the honest holes in our evidence base, and two of them are still on the open-questions list in [../02-reading-list.md](../02-reading-list.md).
