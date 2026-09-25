# 07 — Safety, Privacy and Ethics

Owner: Product lead (with everyone) · Status: draft

This is not a compliance appendix. Working with people who have impaired capacity, in their own homes, using their own family photographs, is genuinely ethically loaded — and it is also the area where a well-prepared team visibly outclasses the rest of the field. Most SIH decks have a slide saying "data is encrypted." Almost none can talk about consent when the user cannot consent.

---

## 1. The consent problem, which is real

A person with moderate dementia may not have the capacity to give informed consent to data processing. Our primary user is, by definition, in that grey zone. This is not hypothetical — it is the first thing an ethics reviewer would ask.

### What Indian law says

Under the **Digital Personal Data Protection Act, 2023**, a Data Fiduciary must obtain **verifiable consent from the lawful guardian before processing the personal data of a person with a disability who has a lawful guardian**. Consent generally must be *free, specific, informed, unconditional and unambiguous, given by clear affirmative action.* The Act also imposes purpose limitation, data minimisation and erasure obligations.

Sources: [DPDP Act 2023 §9](https://www.dpdpa.com/dpdpa2023/chapter-2/section9.html) · [DPDP Rules 2025](https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025) · [EY India DPDP overview](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/insights/cybersecurity/documents/ey-india-dpdp-act-2023.pdf)

> NOT LEGAL ADVICE. This is our engineering-level reading. For deployment, this needs an actual lawyer and an institutional ethics review. Say that in the deck; it reads as maturity, not weakness.

### Our consent architecture

Three layers, because one is not enough:

**1. Guardian consent (legal).** The caregiver consents at onboarding, on the elder's behalf, in her own language, in plain words — not a wall of legal text. She is told, specifically: what is stored, that it stays on this phone, what a report contains and who might see it, and that everything can be deleted with one button. She confirms she is the person responsible for this elder's care.

**2. Ongoing assent (ethical).** Legal consent from a guardian does not entitle us to override the elder in the moment. **If she does not want to play, the app stops.** Every session is refusable, in one tap, with no consequence and no nagging. If she refuses three sessions in a row the app tells the caregiver and reduces its prompting rather than escalating it.

This distinction — *consent from the guardian, assent from the person* — is standard in dementia research ethics and almost no consumer app implements it. It costs us very little and it is exactly right.

**3. Purpose-scoped sharing.** Report generation is a separate, explicit action. Nothing goes to an ASHA, a clinician or anyone else without the caregiver actively choosing to share it, each time. Consent to use the app is not consent to disclose.

---

## 2. Ten guardrails

These are implementation requirements, testable, not values statements.

| # | Guardrail | Implementation |
|---|---|---|
| 1 | **No fabricated personal facts.** The system never states something about the elder's life that a caregiver did not enter. | Every personal fact carries provenance (`approved_by`, `approved_at`). Content generation templates over approved facts only; there is no free-text generation path over personal data. |
| 2 | **No model-generated medical data.** Medication names, doses and times are caregiver-entered, full stop. | `Medication` records are flagged `caregiver_set: true` and the assistant can only read them, never compose them. |
| 3 | **No diagnosis, no score, no stage.** | No output anywhere renders a cognitive score, a stage label, or a normative comparison. Enforced by review of every string in the app. |
| 4 | **No failure states.** No "wrong," no red X, no losing, no score shown to the elder, no timer. | Cue ladder level 4 always exists ([06 §3.4](06-technical-approach.md)). Circuit breaker at three consecutive misses. |
| 5 | **No unverified faces.** Only caregiver-uploaded, caregiver-labelled photos of real people known to the elder. | No face recognition, no image search, no stock faces in personal activities. |
| 6 | **Distress stops everything.** | Repeated failure, rapid abandonment or an explicit distress signal ends the session, drops to floor mode and notifies the caregiver quietly. |
| 7 | **Data minimisation.** Collect only what an activity actually needs. | Onboarding asks for a small fixed set. No contacts, no location, no microphone unless voice input is switched on, no analytics SDKs, no ad IDs. |
| 8 | **On-device by default.** No personal data reaches a server in the MVP because there is no server. | Architecturally enforced, not policy-enforced ([06 §4](06-technical-approach.md)). |
| 9 | **One-tap erasure.** | A single "delete everything" that removes the household record including all media blobs, with a plain confirmation. |
| 10 | **Sharing is always an explicit act.** | Report export is a deliberate per-instance action with a preview of exactly what is being shared. |

---

## 3. Harms specific to dementia that generic privacy thinking misses

These are the ones that show we have actually thought about this population. Each is a real, documented risk.

**The deceased-relative problem.** A reminiscence app that shows a photograph of the elder's late husband and asks "who is this?" can trigger a fresh experience of bereavement — for some people with dementia, repeatedly, as if for the first time. This is a well-known hazard in reminiscence practice.
*Our handling:* every person in the corpus is tagged living/deceased at entry. Deceased people appear only in **story mode** (a warm narration: *"your husband Naren, who taught at the school"*), never in a quiz that asks the elder to identify them, and never with any framing that could imply they are present. The caregiver can exclude any person entirely.

**Distressing content.** Some memories are not good ones. A caregiver may add content without anticipating the reaction.
*Our handling:* a one-tap "don't show this again" available on every item, on both the elder and caregiver sides, that takes effect immediately and permanently.

**Confabulation reinforcement.** If the elder answers with something false and the app is warm and affirming about everything, we may reinforce a false belief.
*Our handling:* affirm the *effort*, never the false content. Never contradict either — contradiction is known to cause distress. Present the true fact positively and move on. This is standard validation-therapy practice and the app's response strings must be reviewed against it.

**Surveillance framing.** A monitoring dashboard on a family member can slide from care into control, especially for an elderly woman in a household where she already has little autonomy.
*Our handling:* the elder is told, in her language, that her family can see how she is doing. Nothing is covert. No location, no audio recording, no photos of her. The report contains activity and function, never behaviour reports about the person.

**Displacing human contact.** Social isolation is one of the fourteen Lancet Commission risk factors. An app that becomes a substitute for a family member talking to her makes the underlying problem worse.
*Our handling:* co-play is encouraged in the product's language; the app suggests activities the caregiver can do *with* her; and we should be honest in the pitch that this is a supplement to human contact, not a replacement. If asked "isn't this just parking granny with a tablet?" — that is a good question and we should have a real answer.

**Raising expectations we cannot meet.** A family that believes an app will restore memory will be hurt when it does not.
*Our handling:* onboarding says plainly what this does and does not do. No "improve memory" copy anywhere in the product or the deck. See §4.

---

## 4. The clinical-claim boundary — exact wording

Standardise this. Use these forms and no others.

### We may say

- "Cognitive stimulation activities" / "cognitive engagement"
- "Memory *support*" — external scaffolding: reminders, cues, recognition aids
- "Tracks engagement and activity over time"
- "Supports caregivers with structure and information"
- "Informed by Cochrane-reviewed evidence on cognitive stimulation in mild-to-moderate dementia"

### We may not say

| Do not say | Because |
|---|---|
| "Improves memory" | The [best meta-analysis of serious games in MCI](https://academic.oup.com/ageing/article/54/4/afaf080/8107654) found **no** significant memory improvement. Saying this is contradicted by our own citation. |
| "Detects / screens for / diagnoses dementia" | We do none of these, and claiming it may bring us into medical-device territory |
| "Slows the progression of dementia" | Cochrane describes a small cognitive benefit *equivalent to* about a six-month delay in decline, in trial conditions. That is not a claim we can make for our app, which has no trial. |
| "Cognitive score" / "MindMitra score" | Implies validated measurement we have not done |
| "Clinically validated" / "clinically proven" | We have validated nothing. Our *approach* is evidence-informed; our *product* is untested. |
| "AI-powered dementia detection" | Tempting for a deck, and squarely false |

### The disclaimer, verbatim, everywhere it is needed

> MindMitra provides cognitive-stimulation activities and caregiver support. It is not a medical device, a diagnostic test or a screening tool, and it does not replace assessment by a qualified clinician. Activity data reflects engagement with the app and is not a clinical measure of cognition.

Put it in the app at onboarding, on every exported report, and on the deck. Being the team that volunteers its own limitations before being asked is worth more than one extra feature.

---

## 5. What deployment would need that a hackathon does not

Saying this out loud is a strength. It is also true, and it distinguishes a team that has thought about the real world.

- Institutional ethics committee approval (an IEC, as the [CARE study](https://doi.org/10.1186/s12877-025-06929-y) obtained)
- Legal review against the DPDP Act and its 2025 Rules
- A named Data Fiduciary and a grievance mechanism
- Formal usability testing with older adults and caregivers, in the field, in the target language
- Native-speaker cultural review per content pack, with a named validator
- Accessibility audit against WCAG 2.2 AA/AAA
- Clinical advisory input — a geriatrician, neurologist or psychiatrist on the team
- A safety-monitoring plan: what happens if a user is distressed by the app
- CTRI registration if we ever run an efficacy study

We should put a short version of this on the feasibility slide as *"what a real deployment requires"* — it shows we know the difference between a prototype and a product.

---

## Open questions

- [ ] Do we ask the caregiver to record the elder's own *assent* at onboarding (a checkbox: "I have explained this to her and she is willing")? Slightly awkward, ethically stronger. Recommendation: yes.
- [ ] Who on the team owns reviewing **every user-facing string** against the guardrails in §2 and §3? This needs one named owner. It is a two-hour job and it is the difference between a thoughtful product and an accidentally cruel one.
- [ ] Can we get a clinician — anyone with geriatric, neurology or psychiatry experience — to look at the content for 30 minutes before the presentation? Even an informal review we can cite as "reviewed by" is worth a great deal.
