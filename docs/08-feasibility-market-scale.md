# 08 — Feasibility, Market and Scale

Owner: Product lead · Status: draft

---

## 1. Is it technically feasible? Yes, and here is the boring proof

Nothing in the MVP requires a research breakthrough. That is a feature of the plan, not a weakness of the idea. Every component either exists off the shelf or is a few hundred lines of ordinary code.

| Component | Feasibility | Evidence |
|---|---|---|
| Offline PWA / Android app with local storage | Routine | Standard IndexedDB + Capacitor |
| Assamese TTS | Available now | [Sarvam TTS](https://www.sarvam.ai/text-to-speech) (11 languages incl. Assamese); [AI4Bharat Indic-TTS](https://github.com/AI4Bharat/Indic-TTS) (13 incl. Assamese, Bodo, Manipuri), open-source |
| On-device Indic speech | Emerging, plausible | [Sarvam Edge](https://www.sarvam.ai/products/edge) claims on-device ASR/TTS for 22+ languages — needs our own evaluation |
| Government language platform | Available, and politically useful | [Bhashini](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage); Assam has signed an MoU to add Assamese and Bodo |
| Adaptive difficulty (Elo + bandit + tabular Q) | Ordinary engineering | No GPU, no ML runtime, a few KB of model |
| Local rule-based assistant | Ordinary engineering | Reads structured local data; strictly more reliable than an LLM here |
| Client-side PDF report | Routine | HTML + browser print |

**The genuinely hard parts are not technical.** They are: getting the content culturally right, getting the accessibility right for a user unlike anyone on our team, and getting anyone to actually keep using it. Say this in the room. It is true, and it demonstrates a different level of thinking than a stack diagram.

---

## 2. Is it deliverable? The precedent already exists

The strongest feasibility argument we have is not about software.

[Dias et al. 2008, PLoS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333) trained **lay health workers** in Goa to deliver home-based dementia care under a counsellor and psychiatrist's supervision — information, behaviour-management guidance, assessment. The RCT (81 families) showed benefit on caregiver mental health and burden, and the programme **was subsequently scaled to state-wide delivery.**

So the delivery model we depend on — a community-level worker, supervised remotely, supporting a family at home — is not a hopeful assumption. **It has RCT evidence and a scale-up precedent, in India.** We are adding software to a model that already works.

### The delivery infrastructure that already exists

| Asset | Relevance |
|---|---|
| **ASHA network** | Nearly a million community workers with existing household relationships and an incentive framework |
| **AB-HWCs / Ayushman Arogya Mandirs** | Existing primary-care touchpoints with Community Health Officers, already running household NCD screening via [CBAC](https://nhsrcindia.org/node/741) |
| **NPHCE** | The National Programme for Health Care of the Elderly — the policy home this belongs in |
| **Anganwadi centres, CSCs** | Additional community touchpoints for onboarding and digital-literacy support |
| **BharatNet** | Rural connectivity backbone — relevant to *sync and scale*, not to daily operation |
| **PMGDISHA** | Digital-literacy programme with reach across all eight NE states |

> Note the change in argument from our old deck. We previously used BharatNet and PMGDISHA numbers to argue that people can get online. **That argument slightly undermines our own offline-first thesis.** Use them instead to argue the *scale-up* path: the app works today with no connectivity, and as BharatNet reaches more gram panchayats, sync, remote supervision and aggregate district reporting become possible on top. That is a stronger, non-contradictory story.

---

## 3. Market — the honest version

The instinct at a hackathon is to quote the biggest available market number. Resist it, because our own user analysis destroys the consumer-market story, and a judge will notice.

### The numbers that exist

| Market | Size | Source |
|---|---|---|
| India dementia treatment market | **US$465.4M (2023) → US$904.6M (2030)**, ~10% CAGR | [Grand View Research](https://www.grandviewresearch.com/horizon/outlook/dementia-treatment-market/india) |
| India elderly care market | ~**13.9–15.5% CAGR** | [Data Bridge](https://www.databridgemarketresearch.com/nucleus/india-elderly-care-market) |
| India care services market | **US$29.62B (2023)**, ~13.8% CAGR | [Grand View Research](https://www.grandviewresearch.com/industry-analysis/india-care-services-market-report) |
| Telehealth/remote monitoring share of eldercare tech | ~41.2% (2026) | Market reports |

### Why we should not lead with those

Almost all of that market is **pharmaceuticals, urban senior living and paid care services** sold to households that can pay. Per [01](01-problem-and-evidence.md), our user is rural, in a household spending 20% of its annual health budget on dementia already, in a country where 48.8% of health spending is out-of-pocket. **She is not a subscription customer.** Presenting a consumer TAM for a product aimed at a household that cannot buy it is exactly the kind of thing that unravels under a follow-up question.

### The value argument we should lead with instead

**Cost avoidance and system efficiency, not revenue.**

- Household cost attributable to dementia: **~US$571/year ≈ 20% of annual household health spending** ([AEA P&P](https://www.aeaweb.org/articles?id=10.1257%2Fpandp.20241061))
- Total societal cost: **US$3.4B (2010)**, projected to **0.5% of GDP by 2050** (ARDSI)
- Out-of-pocket share of total health expenditure: **48.8%** (STRiDE)
- 10.1% of the population is 60+ (2021), rising to ~15% by 2036

Against a per-household software cost that is, realistically, **a few hundred rupees a year at scale** — content packs, distribution, occasional support — with no hardware requirement beyond a phone the household already owns.

The pitch line: *"the intervention has Cochrane evidence, the delivery model has RCT evidence, and the marginal cost of adding a household is a content pack and a phone that is already in the house."*

### Realistic business models, in order of likelihood

1. **B2G — state health departments under NPHCE / AB-HWC.** The natural home. Licensed per district or per HWC, deployed through ASHAs. This is what SIH is actually for.
2. **CSR and philanthropic funding.** Dementia is an under-funded, high-sympathy cause; corporate CSR budgets in India are mandated and actively looking for health programmes.
3. **B2B2C via eldercare providers** — Emoha, Khyaal, Samarth and hospital geriatric departments, as a cognitive-care module in an existing paid service. This is the urban revenue that could cross-subsidise rural deployment.
4. **Direct consumer subscription for urban families.** Real, but small, and explicitly *not* our primary user. Useful as a cross-subsidy, never as the headline.

> Recommended framing for the deck: **"free at the point of use for the households who need it most, funded by the state or by CSR; a paid urban tier cross-subsidises it."** That is honest, socially coherent, and it fits the SIH context far better than a TAM slide.

### Bottom-up sizing (to be completed properly)

| Layer | Figure | Status |
|---|---|---|
| India, 60+ with dementia | 8.8–10.1M | Sourced |
| Mild-to-moderate (our evidence base) | ~60% → 5.3–6.1M | **ASSUMPTION — needs a citation** |
| In a household with a smartphone-capable caregiver | ? | **Open** |
| NER, 60+ with dementia | ~0.35–0.45M | **Arithmetic to be shown** |
| Pilot target (one district) | ? | Compute from a real district's 60+ population |

**Do the arithmetic and show it on the slide.** A worked bottom-up number with visible assumptions beats a borrowed top-down number every time.

---

## 4. Scale path

| Stage | Scope | What must be true | Proves |
|---|---|---|---|
| **0 — Prototype** | Demo, our own devices | It works offline, adaptively, in Assamese | The concept |
| **1 — Field pilot** | 15–25 dyads, one block, via one HWC | Ethics approval, an Assamese content pack, a partner institution | Usability and retention — *the real unknown* |
| **2 — District** | 1 district, ASHA-delivered | Incentive alignment for ASHAs, CHO training, a supervision loop | Delivery through the public system |
| **3 — State** | Assam, multi-language | Bodo pack, district reporting, state health department buy-in | Institutional viability |
| **4 — Region / national** | NER + other low-resource states | Community-recorded audio for low-resource languages, ABDM linkage | Generalisability |

**The critical measurement at Stage 1 is retention, not accuracy.** Cochrane's benefit requires two-plus sessions a week sustained. The question that decides whether this product is real is: *what fraction of households are still using it at week 12?* Nothing else matters as much. We should say in the pitch that this is the number we would measure first — it shows we know what our actual risk is.

---

## 5. Why this scales when other health software does not

Three structural properties worth naming:

1. **Zero marginal infrastructure.** No server in the daily loop, no clinician in the loop, no hardware. Adding a household costs a content pack.
2. **The engine/content split.** New language or community = a new content pack, not new software ([05 §4](05-solution-and-mvp.md)). This is what makes "22 languages" a plausible roadmap rather than a fantasy.
3. **It rides existing rails.** ASHA network, AB-HWCs, NPHCE, Bhashini. We are not building a distribution channel; we are attaching to four that exist.

---

## Open questions

- [ ] Find the mild/moderate/severe stage distribution for India and replace the assumption in §3
- [ ] Compute the NER 60+ dementia population properly from Census/LASI state 60+ figures. Owner: research lead.
- [ ] What does an ASHA actually get paid per incentivised activity, and is there any existing head that an elderly cognitive-care visit could sit under? This determines whether Stage 2 is real.
- [ ] Identify one potential pilot partner: a medical college, NGO or district health office in Assam. Even a named intent-to-collaborate transforms the feasibility slide. Try ARDSI Guwahati, Gauhati Medical College, NEIGRIHMS Shillong.
