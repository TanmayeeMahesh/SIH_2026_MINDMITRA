# 03 — What Already Exists, Why It Fails Here, and What We Are Betting On

Owner: Product lead · Status: draft for team challenge

The judge's real question is never "is dementia a problem?" It is **"why hasn't someone already built this, and what do you know that they don't?"** This document is our answer.

---

## 1. The landscape, honestly

### Global brain-training apps — Lumosity, Elevate, CogniFit, Peak

Abstract puzzle batteries with adaptive difficulty and streaks. Designed for a literate, self-directed, English-speaking, connected adult who chose to download them and can pay a subscription.

**Why they fail for our user:** every single one of those assumptions is false for a rural NER elder. Beyond that, abstract puzzles are exactly the wrong content type — [Cochrane's cognitive stimulation evidence](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub3/full) is built on *meaningful, discussion-based, everyday-themed activity*, not on abstract drill. Lumosity is not a dementia intervention and has never claimed to be one under scrutiny.

### Dementia-specific consumer apps — MindMate, Greymatters, Constant Therapy

Closer. MindMate targets four cognitive domains with games. Greymatters is a reminiscence app you fill with family photos and familiar music.

**Why they fail here:** English-only, cloud-dependent, subscription-priced, and they assume a family member who will populate content in a smartphone-native workflow. There is no health-worker layer, no offline mode, no report anyone in the Indian public system can use.

### Memory Lane Games — our closest real competitor

Quiz-style reminiscence games with **2,800+ dementia-friendly memory games** and regional content packs that **already include India**. Recently built an [AI-personalisation prototype with SAP and EY](https://news.sap.com/2026/08/memory-lane-games-ai-personalization-dementia-care/) that turns a persona profile (places lived, career, hobbies, pets, cultural background) into generated multiple-choice questions with matched open-source images. Won a Mayo Clinic / ASU MedTech Accelerator and was a Longitude Prize finalist. Six-person team, Isle of Man.

**Take them seriously.** They have credibility, distribution and a head start on AI personalisation.

**Where they still leave the field open:**

- Content is **regionally generic**, not personally verified — an "India pack," not *this woman's* photographs
- Generation runs in the cloud, on personal life details
- **No offline mode** — a network assumption our users cannot meet
- No community-health-worker loop, no report a CHO or ASHA can file
- No Indic-language voice interface, let alone Assamese, Bodo, Khasi, Mizo or Meitei
- Quiz format only — no functional sequencing, no daily-living tasks, no reminders

### Indian eldercare platforms — Emoha, Khyaal, Samarth

Real, well-funded, growing. But they are **eldercare *services*** — emergency response, home visits, community, concierge — sold to urban middle-class families at subscription prices. They are not cognitive interventions and their unit economics do not reach a rural NER household.

### Indian clinical research tools — the CARE study games

The [CARE study protocol (BMC Geriatrics 2026)](https://doi.org/10.1186/s12877-025-06929-y) is the most sophisticated Indian work in this space: three purpose-built games (shopping, memory, VR hand-eye coordination), being validated against ACE-III, TMT, DSST and IADL-E in older adults with MCI at St. John's Bangalore.

**But look closely at their operating conditions, because they are instructive:**

- A **neuropsychologist is physically present for every session** and the protocol explicitly calls itself an "assisted-use condition"
- Participants required help with *where to tap*, *why a note cannot be selected twice*, *what a Unity asset was meant to represent*, and **requests for native-language translation of instructions**
- Session length ~2 hours, single-centre, **urban Bangalore**, with acknowledged selection bias excluding semi-urban and rural participants
- **Basic smartphone ability was an inclusion criterion** — which, per [01](01-problem-and-evidence.md), excludes roughly 89% of rural older adults
- VR completion collapsed to 57.89% across three trials; **tablet games held 100% completion**

Two lessons, and they are gifts:

1. **Their own data says tablet works and VR does not, for this population.** We can cite an Indian source for our platform choice.
2. **Their confusion log is our design spec.** Every one of those five confusion categories is a defect we can design out — and none of them is about cognition. They are about interface legibility and language.

### What the whole field has in common

Every product above assumes at least two of: **literacy, English or a major language, self-directed use, network connectivity, a clinician in the loop, or ability to pay.**

---

## 2. The gap, stated precisely

> **There is no cognitive-care tool built for a non-literate, non-English-speaking rural elder who does not own or operate a smartphone, whose care is mediated by an unpaid family member and an over-stretched ASHA worker, in a district with no neurologist and intermittent connectivity.**

That is not a niche. Per [01](01-problem-and-evidence.md), stacking the prevalence gradients — 12.23% with no formal education, 12.29% female, 10.19% rural — that description covers the **modal Indian person with dementia**. The global market has built for the tail and called it the market.

Three sub-gaps sit inside it, and each is a feature:

| Gap | Everyone else | Us |
|---|---|---|
| **The literacy gap** | Text instructions, translated at best | Picture + voice is the primary channel; text is optional decoration |
| **The connectivity gap** | Cloud AI, cloud content, cloud sync | Full offline core; cloud is an optional accelerator, never a dependency |
| **The system gap** | Data dies inside a consumer app | One structured page out to the ASHA/CHO — the first longitudinal record this patient has ever had |

---

## 3. Our five bets

These are falsifiable positions, not slogans. If one turns out wrong we change the product.

### Bet 1 — The unit of design is the dyad, not the elder

We are not building an app an elderly person uses alone. We are building a **two-sided instrument**: a caregiver configures, supervises and interprets; the elder plays. 95% of older rural women are digitally illiterate, so elder-solo onboarding is designing for nobody. The [ENHANCE study](https://pubmed.ncbi.nlm.nih.gov/42492485/) found coach support to be a primary engagement driver, and the [Goa RCT](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333) proved lay-worker-mediated dementia care works in India.

*Consequence:* every feature has a caregiver-side and an elder-side design. Sessions can be co-played. The caregiver is a first-class user with her own screens, not an afterthought admin panel.

### Bet 2 — Personal content beats cultural content

"Culturally relevant NER games" is a weak claim: NER contains hundreds of distinct communities, and assuming an Assamese Bihu theme fits a Mizo grandmother is exactly the flattening we say we are fixing. The strong claim is **content grounded in this specific person's verified life** — her photographs, her family, her route to the market, her occupation, her songs.

Priority order for content, always: **(1) personal and family-verified → (2) community-validated local content → (3) regional default.** Regional content is the fallback, not the feature.

*Consequence:* the caregiver onboarding flow that builds this personal corpus is not a settings page — it is the most important screen in the product.

### Bet 3 — Difficulty calibration *is* the intervention

[Mantell et al. 2025](https://pubmed.ncbi.nlm.nih.gov/40499156/) found older and cognitively impaired adults find these games less usable *even when purpose-built and simple*, and identified appropriate challenge as the mediator of enjoyment. Cochrane found benefit requires **≥2 sessions per week** — that is an adherence requirement. Adherence comes from enjoyment; enjoyment comes from correct difficulty.

So the chain is: **calibration → enjoyment → adherence → the only clinical benefit that exists.** The adaptive engine is not a garnish to satisfy the "AI/ML" line in the problem statement. It is the mechanism.

*Consequence:* difficulty is multi-dimensional and per-person, and the engine gets real engineering effort. See [06](06-technical-approach.md).

### Bet 4 — Offline-first is a clinical requirement

If benefit requires two-plus sessions a week for months, and the network in an Arunachal village is intermittent, then **any cloud dependency in the core loop is a clinical failure mode, not an engineering inconvenience.** Games, reminders, content, progress and the conversational assistant must all work in airplane mode. Cloud does model updates, aggregate analytics and optional sync — never the daily loop.

*Consequence:* content packs ship deterministic and local. The on-device assistant is rule-based or a small local model, not an API call. Sync is a background nicety.

### Bet 5 — We measure honestly and refuse to diagnose

Two forces push every team toward overclaiming: the problem statement says "AI," and a screening claim sounds more impressive than an engagement claim. Resist both.

We produce **structured longitudinal observation** on a population the health system currently has zero data on. That is genuinely valuable and defensible. We do **not** produce a cognitive score, a stage, a diagnosis or a screening result. See [07](07-safety-privacy-ethics.md) for exact language.

*Consequence:* reports are engagement- and function-shaped ("completed 14 of 21 sessions; needed more cueing in sequencing tasks this fortnight; caregiver-reported burden rising") rather than score-shaped. Any trend flag reads *"worth mentioning to the CHO,"* never *"deterioration detected."*

---

## 4. Where the AI actually lives

The problem statement asks for AI/ML. Here is where it genuinely earns its place, and where it would be decoration. Being able to say the second list out loud is what makes the first list credible.

**AI that earns its place**

1. **Adaptive difficulty policy** — per-user, multi-dimensional, on-device, learning across sessions. The core.
2. **Speech in Indic languages** — ASR and TTS for Assamese and other NER languages. Not a wrapper; without it the product does not function for a non-literate user.
3. **Personal-content generation, tightly constrained** — turning a caregiver-verified corpus (photos, relationships, routines, places) into varied game instances, with a hard rule that nothing is generated that is not grounded in an approved fact.
4. **Trend detection on engagement/performance** — change-point detection on longitudinal signals to decide *when the caregiver should be told something changed*. Signal routing, not diagnosis.

**AI we are deliberately not doing, and will say so**

- Diagnostic or screening classification of dementia stage
- Facial recognition on family photographs
- Emotion detection from face or voice — unreliable, ethically fraught, unnecessary
- A general-purpose cloud LLM chatbot with access to personal health data
- Generative creation of personal facts, medication schedules or medical advice

Saying "we chose not to do emotion AI, here is why" is worth more in the room than adding a fifth model.

---

## 5. The three sentences that must land

For pitch practice. Everybody memorises these.

1. **The gap:** *"Nine in ten Indians with dementia never get diagnosed, and in Assam nearly nine in ten psychiatrist posts are vacant — so the care has to happen at home, in the local language, without a specialist and without a network."*
2. **The insight:** *"The evidence says cognitive stimulation buys about six months of delay, but only at two-plus sessions a week — and the reason people stop is that the difficulty is wrong. So we made calibration the product, not the games."*
3. **The differentiator:** *"Everyone else builds for someone who can read, pay, and get online. We build for the person who is actually most likely to have dementia in India: a rural woman with no schooling, on her daughter-in-law's phone, offline."*

---

## Open questions for the team to fight about

- [ ] Is Bet 2 (personal over cultural) right, or does it make the NER angle look thin to a judge who *wants* to see Bihu and Dhopkhel? **Proposed resolution: do both, but frame culture as the fallback tier and personal as the innovation.** Argue it out.
- [ ] Do we position primarily as *cognitive stimulation* (elder-facing benefit) or as *caregiver support* (dyad benefit)? The Goa RCT's measured outcomes were **caregiver** outcomes. That is a hint worth taking seriously.
- [ ] How much do we lean on the "first longitudinal record" system-gap argument? It is our most original point and the least game-like. It may be the strongest thing we have.
