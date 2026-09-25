# 09 — Risk Register

Owner: Product lead · Status: living document, review weekly

Ordered by expected damage, not by category. The first three are the ones that actually decide whether this project succeeds — the rest are manageable.

---

## Tier 1 — the risks that decide the outcome

### R1 · Nobody keeps using it
**Likelihood: high · Impact: fatal**

This is the real risk and almost every digital health intervention dies here. Cochrane's benefit requires **two-plus sessions per week sustained over months**. [Mantell et al. 2025](https://pubmed.ncbi.nlm.nih.gov/40499156/) found older and cognitively impaired adults find these games *less usable even when purpose-built and simple.* Our caregiver is already exhausted; anything that adds work to her day gets dropped inside a week.

**Mitigations**
- Difficulty calibration as the core of the product, not a feature ([03](03-gap-and-thesis.md) Bet 3)
- Sessions capped at 5–10 minutes; the app initiates rather than waiting
- Caregiver burden budget: onboarding < 15 min, any ongoing action < 30 s. Treat this as a hard spec and test against it.
- Personal content, because generic content gets boring and personal content does not
- Visible value to the caregiver in the first session, not at week four
- **Measure retention at week 12 as the primary pilot outcome and say so publicly**

### R2 · We build for a user we have never met
**Likelihood: high · Impact: severe**

Six engineering students in their twenties designing for a non-literate 74-year-old woman in a village. Our intuitions are wrong in ways we cannot detect from inside the team. The [CARE study's](https://doi.org/10.1186/s12877-025-06929-y) confusion log — participants asking *where to tap*, what a Unity asset was, for native-language translation — happened to a well-funded research team with a neuropsychologist in the room.

**Mitigations**
- **Test with at least three real older adults before the presentation.** Grandparents, neighbours, anyone 65+ with limited smartphone experience. This is the single highest-value hour we can spend, and it is nearly free.
- Adopt the [ENHANCE](https://pubmed.ncbi.nlm.nih.gov/42492485/) barrier list as a pre-emptive defect list: unclear visual cues, unaccommodated motor/sensory impairment, visual discomfort
- Develop on a **low-end device** (Android 9, 2GB RAM), never on a flagship
- One named accessibility owner with veto power over UI
- Write down every observed confusion. Our own confusion log is a slide.

### R3 · Scope collapse
**Likelihood: high · Impact: severe**

Twelve games, five surfaces, a fourteen-box stack, a research programme and a deck, with two third-year students on the team and a deadline. The default outcome is many half-finished things and a demo that breaks.

**Mitigations**
- The MUST/SHOULD/WON'T cut line in [05 §5](05-solution-and-mvp.md), agreed in writing now
- Five engines instead of twelve games; **three** engines in the MVP
- Build order in [06 §8](06-technical-approach.md) is designed so we have a working adaptive product from step 4 onward and never a broken one
- Weekly demoable build, no exceptions. If it does not run on the phone on Friday, it does not exist.
- Anything not in the demo script is not being built this sprint

---

## Tier 2 — serious, manageable

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R4** | **Adaptive engine underperforms or is invisible.** Judges do not see the AI, or it behaves erratically. | Med | High | L0+L1 (bounded ladder + Elo) gives a working adaptive product with zero RL. Q-learning is additive. Build the transparency screen early. Have the simulator plots ready. |
| **R5** | **Cultural content is wrong or flattening.** We ship "NER content" that reads as Assamese-only, or gets a detail wrong in front of a judge from the region. | Med | High | Personal content first, regional as fallback ([03](03-gap-and-thesis.md) Bet 2). One named external Assamese reviewer. Be explicit in the pitch that NER is not one culture — turning the risk into a demonstrated insight. |
| **R6** | **Indic ASR fails in the demo or the field.** Elderly speech + low-resource language + noise. | High | Med | Voice input is always additive, tap always works ([06 §5](06-technical-approach.md)). Pre-rendered audio for all output so TTS cannot fail live. Never demo a voice-input-only path. |
| **R7** | **We overclaim and get caught.** A judge asks whether we improve memory, or whether we can screen for dementia. | Med | High | The claim boundary in [07 §4](07-safety-privacy-ethics.md), memorised by everyone. Volunteer our limitations before being asked. |
| **R8** | **Citation quality.** Our references slide contains a Studocu link, a press release, unlabelled figures and a protocol described as a result. | Currently certain | Med | [02](02-reading-list.md) Part E. Purge and rebuild the references slide. One owner. |
| **R9** | **The prototype is a shell.** 126 lines with hardcoded games, `localStorage`, and a README claiming features that do not exist. | Currently true | High | Rebuild on the [06](06-technical-approach.md) architecture. Fix the README to describe what exists — an inaccurate README is a self-inflicted credibility wound if a judge reads the repo. |
| **R10** | **Privacy/ethics challenge we cannot answer.** "How does a person with dementia consent?" | Med | Med | Answered in [07 §1](07-safety-privacy-ethics.md). Guardian consent plus ongoing assent. This turns a hostile question into our best moment. |
| **R11** | **Judges see it as a game app, not MedTech.** | Med | Med | Lead with the evidence base and the system gap, not the games. The report and the ASHA loop are what make it MedTech. |
| **R12** | **Team capacity and coordination.** Six people, differing experience, exams, other commitments. | Med | Med | Clear single ownership ([10](10-work-plan-and-roles.md)), weekly demo gate, and a documented plan so a blocked person can be unblocked by anyone. |

---

## Tier 3 — watch, do not spend on yet

| ID | Risk | Handling |
|---|---|---|
| R13 | Device fragmentation / low-end performance | Test on the minimum target device weekly |
| R14 | Photo storage exceeds device capacity | Downscale on import; cap corpus size; show usage to caregiver |
| R15 | Background notifications unreliable on Android (OEM battery killers) | Known Android problem. Capacitor + exact alarms; document the limitation honestly. |
| R16 | Shared device — grandchildren playing and polluting data | Profile lock behind the caregiver PIN |
| R17 | Sarvam/Bhashini licensing or pricing changes | AI4Bharat open-source models are the fallback; pre-rendered audio means no runtime dependency |
| R18 | Regulatory reclassification as a medical device | Avoided by the claim boundary in [07](07-safety-privacy-ethics.md); revisit before any deployment |
| R19 | A competitor (e.g. Memory Lane Games) adds Indic languages and offline | Our moat is the ASHA/system loop and personal-corpus depth, not the game format |

---

## The four questions we must not fumble

Rehearse answers out loud. Assign each to a person.

1. **"Where exactly is the AI, and how many episodes does your Q-learning need to converge?"**
   → [06 §3](06-technical-approach.md). Four layers; exploration happens in simulation; Elo does the heavy lifting; the policy is bounded so it cannot harm the user. Show the transparency screen.

2. **"How does someone with dementia consent to this?"**
   → [07 §1](07-safety-privacy-ethics.md). Guardian consent under DPDP §9, plus ongoing assent from the person, plus purpose-scoped sharing. Three layers, because one is not enough.

3. **"Does this actually improve memory?"**
   → No, and we will not claim it does. The best meta-analysis found no memory benefit from serious games. We improve *memory support* and target engagement, executive function and daily function, which is what the evidence supports.

4. **"Why hasn't Memory Lane Games / Lumosity already solved this?"**
   → [03 §1](03-gap-and-thesis.md). Every existing product assumes at least two of literacy, English, self-directed use, connectivity, or ability to pay. Our user has none of them, and she is the *modal* Indian person with dementia, not an edge case.

---

## Weekly review

Every Monday, in five minutes: has any Tier 1 risk changed? Has anything in Tier 2 moved up? What did we learn that should be written down? Update this file.
