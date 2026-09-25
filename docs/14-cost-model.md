# 14 — Cost Model and Sustainability

Owner: Team lead · Status: draft — **new, in response to the jury rubric**

The Vidyashilp rubric scores *"Technical Feasibility & Practicability **(In terms of Cost)**"* at **15%**, and lists **Sustainability — "can the solution be maintained and run at reasonable cost/effort?"** as a separate qualitative pillar. Our plan had no cost analysis at all. This fixes that.

It turns out to be one of our strongest arguments, because the architecture we chose for clinical reasons (offline-first, no server) happens to be the cheapest thing you can build.

> All figures below are **order-of-magnitude estimates with stated assumptions**, not quotes. Label them that way on the slide. A defensible estimate with visible assumptions beats a precise-looking number you cannot source. USD conversions at ~₹85/USD.

---

## 1. The headline

> **Marginal cost per additional household: effectively ₹0.**
> No server in the daily loop. No new hardware — it runs on the caregiver's existing Android phone. No new workforce — it rides the ASHA network that already visits the house. Adding a household costs a content pack that is already downloaded.

Everything below is the arithmetic behind that sentence.

---

## 2. Build cost

| Item | Cost | Note |
|---|---|---|
| Software licences | **₹0** | React, Vite, Capacitor, idb-keyval — all permissive open source |
| Indic speech models | **₹0** | [AI4Bharat Indic-TTS](https://github.com/AI4Bharat/Indic-TTS) open source; [Bhashini](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage) is a government platform |
| ML training compute | **₹0** | Tabular Q-learning over 324 states trains on a laptop. No GPU, ever. |
| Cloud infrastructure (MVP) | **₹0** | There is no backend |
| Development, post-SIH | **₹3.6–5.4 lakh** | Per the [SIH deployment guidelines](https://www.sih.gov.in/): ₹10,000–15,000/month stipend × 6 students × 6 months. This is the official, published figure — use it, it is not our estimate. |
| Test devices | **₹15–25k** | Two low-end Android handsets (₹8–12k each) |
| **Total to a deployable v1** | **≈ ₹4–6 lakh** | Dominated entirely by student stipends the SIH framework already provides for |

The point to make: **the entire technology cost of this project is zero.** What it costs is six students for six months, which is precisely what the SIH deployment framework is designed to fund.

---

## 3. Per-language content pack — the only real recurring cost

This is the honest one, and naming it makes the rest credible.

| Item | Volunteer / community route | Paid route |
|---|---|---|
| Script translation (~200 strings) | ₹0 | ~₹8–12k |
| Voice recording (~2 hrs studio-equivalent) | ₹0 — community-recorded on a phone | ~₹10–15k |
| Cultural review by a named validator | ₹0 | ~₹10k |
| Image sourcing / local object photography | ₹0 | ~₹10k |
| **Per language pack** | **≈ ₹0–5k** | **≈ ₹40–50k** |

For eight NER languages: **₹0.4–4 lakh, one time.** After that a pack is a static file that costs nothing to distribute.

And for genuinely low-resource languages — Khasi, Garo, Mizo, Nagamese — the **community-recorded route is not the cheap compromise, it is the better product.** Synthesised speech in those languages is poor or absent; a real local voice is both cheaper and more legible. That is worth saying out loud.

---

## 4. Running cost at scale

| Scale | Infrastructure | Est. monthly | Per household / year |
|---|---|---|---|
| 100 households (pilot) | None — fully offline | **₹0** | **₹0** |
| 10,000 households | Static pack hosting (CDN/object storage), a few GB | **≈ ₹1–2k** | **≈ ₹2** |
| 1,000,000 households | Pack hosting + optional report sync API | **≈ ₹1.5–3 lakh** | **≈ ₹2–4** |

> ASSUMPTION: at the million-household tier, only *derived report data* syncs — never photos, never personal facts ([07](07-safety-privacy-ethics.md)). That is a privacy decision that happens to keep bandwidth and storage costs near-linear and tiny.

Compare that to any conventional digital-health deployment, where per-user cloud cost is the dominant line item. Ours is a rounding error **because the offline architecture we chose for adherence reasons removed it.** The clinical requirement and the cost requirement pointed the same way.

---

## 5. Cost-effectiveness — the argument that actually matters

| | Cost |
|---|---|
| Current household spend attributable to dementia | **~US$571/yr ≈ ₹48,000/yr**, roughly **20% of annual household health spending** ([AEA P&P](https://www.aeaweb.org/articles?id=10.1257%2Fpandp.20241061)) |
| Out-of-pocket share of India's total health expenditure | **48.8%** ([STRiDE](https://stride-dementia.org/india-situation-report/)) |
| One specialist consultation from a rural NER district | fare + a day's lost wages for two people + fee — realistically **₹2,000–5,000**, often over two days, in a state with an **89% psychiatrist vacancy** |
| **MindMitra, per household, per year** | **≈ ₹0 marginal**, on a phone the household already owns |
| National societal cost of dementia | **US$3.4bn (2010) → 0.5% of GDP by 2050** (ARDSI) |

**The line for the slide:**

> A single specialist visit from a rural NER district costs a household more than a lifetime of using MindMitra. The intervention has Cochrane evidence, the delivery model has Indian RCT evidence, and the marginal cost of the next household is a phone that is already in the house.

---

## 6. Sustainability

The rubric asks this separately, so answer it separately.

| Dimension | Why it sustains |
|---|---|
| **Technical** | No server to keep running, patch or pay for. An abandoned MindMitra install keeps working. |
| **Financial** | Zero marginal cost; funded through NPHCE / AB-HWC budgets or CSR rather than household payment — our users cannot pay a subscription and we should not pretend otherwise |
| **Human** | Rides the existing ASHA network. **We add no new cadre and demand no data entry from anyone.** |
| **Content** | Community-owned packs. A Khasi-speaking group can produce a Khasi pack without us. |
| **Legal / IP** | Only verified open-source components, with an attribution manifest maintained in-repo — as the [SIH deployment guidelines](https://www.sih.gov.in/) explicitly require, making the team responsible for plagiarism/IP conflicts. Under those guidelines IP rests with the students and the ministry gets free lifetime access. |
| **Institutional** | Designed for the 6–12 month post-SIH development window the guidelines describe, with a named mentor and quarterly reporting |

---

## 7. The slide

Slide 4 (Feasibility & Viability) should carry three numbers and one sentence. Not a spreadsheet.

- **₹0** — technology licence, cloud, and hardware cost
- **₹0** — marginal cost per additional household
- **₹4–6 lakh** — to a deployable v1, entirely student stipends already provided for by the SIH framework

> *"The architecture we chose because adherence requires offline operation is also the cheapest thing we could have built. There is no server in the daily loop, so there is nothing to pay for per user."*

---

## Open questions

- [ ] Confirm the current USD–INR rate before the presentation and restate the ₹48,000 figure
- [ ] Get one real quote for professional Assamese voice recording, so the paid-route column is sourced rather than estimated
- [ ] Check whether NPHCE or AB-HWC has an existing budget head that digital elderly-care tools could sit under — that turns "who pays?" from a hope into a route
