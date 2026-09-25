# 15 — NER Is Not One Culture: The Kinship Problem

Owner: Content lead · Status: draft — **written in response to a Meghalaya academic on the jury**

There is a professor from Meghalaya on the panel. That is not a reason to flatter Meghalaya; it is a reason to check whether our design quietly assumes an Assamese household. It does. Fixing that turns a vulnerability into one of the sharpest points in the pitch.

---

## 1. The bug in our own design

Our caregiver persona is **"Rima, the daughter-in-law"** ([04](04-users-and-scenarios.md)). Our Relationship Reasoning game asks *"who is this and how are they related to you?"* Both encode a **patrilineal, virilocal joint family**: the daughter-in-law marries in, moves to her husband's home, and takes on elder care.

In Meghalaya that model is structurally wrong.

The Khasi, Jaintia and Garo are [matrilineal societies](https://en.wikipedia.org/wiki/Matrilineal_society_of_Meghalaya). Specifically:

- **Lineage and inheritance pass through the mother.** Children take the mother's clan name.
- **Residence is matrilocal** — the husband moves into his mother-in-law's home, not the reverse.
- **The youngest daughter, *Ka Khadduh*, inherits the ancestral property** — and with it the explicit, customary duty of **caring for the elderly parents** and supporting unmarried siblings.
- **The maternal uncle, *U Kñi*, is a formal figure** — adviser, mediator, protector — whose consent is required for major decisions about the ancestral estate.

Sources: [Matrilineal societies of Meghalaya](https://polsci.institute/democracy-and-development-northeast-india/matrilineal-societies-meghalaya-khasis-garos-jaintias/) · [The role of women and the maternal uncle in Khasi society, IJFMR 2024](https://www.ijfmr.com/papers/2024/5/28765.pdf) · [Customary inheritance practices of the Khasi community, IJCRT](https://ijcrt.org/papers/IJCRT2403727.pdf)

### What that means for the product, concretely

| Our assumption | Khasi reality | Fix |
|---|---|---|
| Caregiver = daughter-in-law | Caregiver = **Ka Khadduh, the youngest daughter**, by custom and by inheritance duty | Caregiver role is a **selected relationship**, never inferred |
| Elder lives in her son's home | Elder lives in **her own** home; the son-in-law moved in | No residence assumption anywhere in copy or content |
| Kinship terms follow a patrilineal tree | Distinct terms, maternal-line reckoning; the maternal uncle is a named role with no patrilineal equivalent | **Kinship model is a data file per community, not code** |
| Family surname is shared paternally | Clan name follows the mother | Never auto-generate or infer a name |
| Consent = the male head of household | The maternal uncle has formal standing in family decisions | Consent flow records *"who in this family is responsible"* rather than assuming |

**The design change is small and the payoff is large: make the kinship model a content-pack file.** A pack ships its own relationship vocabulary, its own default caregiver role, and its own set of kin terms for the matching game. The engine never hardcodes "daughter-in-law."

That is a fifteen-minute change to a JSON schema. It is also, genuinely, the difference between a product that works in Shillong and one that doesn't.

---

## 2. The wider point, which is the actual argument

"Northeast India" is eight states, more than two hundred distinct communities, and several unrelated language families. Treating it as one culture — Bihu, Assamese, jaapi — is the same flattening that made every global dementia app unusable here, performed at a smaller scale.

Our own data says so. Dementia prevalence across NER ranges from **Assam 10.41%** down to **Nagaland 4.54%** ([Jin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/)) — a more-than-twofold spread inside the region we are treating as a unit. **Meghalaya sits at 8.43%, essentially at the national average**, so any claim that "NER has India's worst dementia burden" is not just wrong in general, it is wrong specifically about the state our juror is from.

This is exactly why [03](03-gap-and-thesis.md) Bet 2 puts **personal content ahead of cultural content**. It is not only a personalisation argument. It is the only honest way to serve a region this heterogeneous without picking one community and calling it the region.

### The three-tier model, restated for this

| Tier | Content | Who defines it | Handles heterogeneity by |
|---|---|---|---|
| **T1 Personal** | Her photos, her family, her routine, her route | The caregiver | Sidestepping culture entirely — it is *her* life |
| **T2 Community** | Khasi household objects, Garo festival foods, Bodo weaving terms, kinship vocabulary | A **named validator from that community** | Being explicitly per-community, not per-region |
| **T3 Regional default** | Currency, common vegetables, generic kitchen items | Us | Being deliberately thin, and only ever a cold-start fallback |

Note that T2 is where the kinship file lives. Communities own their own pack.

---

## 3. Language reality — we tested it, and it is worse than the marketing suggests

**On 10 Sep 2026 we ran our own audio generator against the live Sarvam TTS API.** Results, verbatim:

| Language | Result |
|---|---|
| **English (en-IN)** | **22/22 clips generated.** Pipeline works end to end. |
| **Assamese (as-IN)** | **Blocked.** `"Please request beta access to as-IN by contacting our support team."` Also rejected outright by `bulbul:v2` — Assamese needs `bulbul:v3` or `v4`. |

Sit with that for a second. **Assamese is one of India's 22 scheduled languages, spoken by roughly 15 million people, and it is still behind a beta waitlist on a leading Indic TTS vendor.** That is the low-resource-language problem expressed as an HTTP 400.

If Assamese is gated, the outlook for Meghalaya is plainly worse:

| Language | Speakers | Support status |
|---|---|---|
| **Khasi** | ~1.4M | [Bhashini lists Khasi for some services](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage). Not a scheduled language. TTS quality unverified by us. |
| **Garo** | ~1.1M | Weaker coverage still |
| **Pnar / Jaintia** | ~0.4M | Essentially none |

So for Meghalaya, synthesised speech is not a solved problem — and pretending otherwise in front of a Khasi-speaking academic would be the worst possible move. **We now have a screenshot proving we didn't just assume it.** Put that error message on the slide.

**This is where our pre-rendered-audio decision ([06 §5](06-technical-approach.md)) stops being a hackathon shortcut and becomes the right long-term architecture.** Because all fixed prompts ship as audio *files* rather than runtime TTS calls, the app does not care where a file came from — a vendor API, Bhashini, or a phone recording. So a community can produce a fully working Khasi or Garo pack with **a native speaker and a quiet room** — no model, no API, no vendor, no waitlist.

**A language with no TTS model is not a blocker for us. It is a recording session.** And we can now say that having actually hit the wall ourselves, in Assamese, this week.

Say that out loud. It is the answer to a question a Meghalaya juror is quite likely to ask.

---

## 4. Actions

| # | Action | Owner | When |
|---|---|---|---|
| 1 | Make the kinship model a content-pack file: `relationships[]`, `default_caregiver_role`, `kin_terms{}` | Content + Data | Before Friday build |
| 2 | Remove "daughter-in-law" as a hardcoded default anywhere in copy or seed data | Content | Tonight |
| 3 | Add a second persona to [04](04-users-and-scenarios.md) — a Khasi household in Ri-Bhoi with *Ka Khadduh* as caregiver | UX | Tonight |
| 4 | Add one line to the deck's cultural-adaptation point naming the matrilineal case explicitly | Lead | Deck v1 |
| 5 | In Q&A, if asked about Meghalaya, lead with the kinship point — not with Bihu | Lead | Rehearsal |
| 6 | Name **NEIGRIHMS Shillong** alongside ARDSI Guwahati and Gauhati Medical College as potential pilot partners | Lead | Feasibility slide |

---

## 5. The line to have ready

If the Meghalaya juror asks anything about regional fit, this is the answer:

> "We started by assuming a patrilineal joint family — the daughter-in-law as caregiver — and that assumption is simply wrong for Khasi, Jaintia and Garo households, where lineage runs through the mother, the youngest daughter inherits along with the duty of caring for her parents, and the maternal uncle has formal standing. So we moved the kinship model out of the code and into the content pack. A community defines its own relationship terms and its own default caregiver role. And because all our audio is pre-recorded rather than synthesised, a language like Khasi or Garo — where TTS barely exists — needs a native speaker and a quiet room, not a research project. That is what we mean when we say NER is not one culture: prevalence alone ranges from 10.4% in Assam to 4.5% in Nagaland, and we shouldn't be building as if the region were a single user."

Do not deliver that as a memorised paragraph. Know the four facts inside it and say them in your own words.
