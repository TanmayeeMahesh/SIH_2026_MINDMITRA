# 04 — Who This Is For, Who It Is Not For, and What Using It Looks Like

Owner: UX lead · Status: draft

Most hackathon teams say "elderly dementia patients" and stop. Being able to state precisely who is in scope, who is out, and why, is one of the cheapest ways to look like we have thought harder than everyone else.

---

## 1. The four users

We have four, and only the second one is optional-ish. Design for all four or the product does not function.

### U1 — The person living with dementia (primary)

**Composite profile, built from the prevalence gradients in [01](01-problem-and-evidence.md), not invented:**

> **Aideu, 74.** Village in Nalbari district, Assam. Widowed, lives with her son, daughter-in-law and two grandchildren. Never attended school; signs with a thumb impression. Speaks Assamese and some Bodo; no English. Diagnosed with nothing — the family took her to the district hospital once after she got lost walking back from a neighbour's, and were told it was "age." Mild-to-moderate impairment: she manages dressing and eating, needs prompting for medicines, repeats questions, has trouble with sequences (she started tea, forgot the leaves), and no longer goes to the market alone. Vision: uncorrected presbyopia and early cataract in one eye. Hearing: mild loss, no aid. Hands: some tremor, dry skin — capacitive touch is unreliable for her. She has never operated a smartphone. She has watched her granddaughter do it a thousand times.

**What this profile forces:**

| Attribute | Design consequence |
|---|---|
| Cannot read | Every instruction is picture + audio. Text is caregiver-facing only. |
| No English | Assamese voice from day one; UI carries no untranslated strings |
| Presbyopia + cataract | Minimum 24pt equivalent, WCAG AAA contrast (7:1), no thin fonts, no low-contrast greys, **no pure white backgrounds** (glare) |
| Mild hearing loss | Audio at low frequencies, adjustable rate, always replayable, never the *only* channel |
| Tremor, dry fingers | Touch targets ≥ 64×64 dp (well above the 44px baseline), generous spacing, no swipe/drag/long-press/pinch, debounce double-taps, tolerate imprecise taps |
| Never used a phone | Zero-affordance-discovery design. If it isn't obviously tappable it doesn't exist. No hamburger menus, no gestures, no hidden state. |
| Prompting-dependent | The app initiates. It never waits silently for her to figure out what to do. |
| No diagnosis | We must never be the thing that tells her she has dementia |

### U2 — The family caregiver (co-primary)

> **Rima, 41.** Aideu's daughter-in-law. Runs the household, has a part-time tailoring income, two children in school. Owns the phone — a 3-year-old Android with 3GB RAM, 32GB storage half-full, on a 2GB/day prepaid plan with patchy 4G. Educated to class 10, reads Assamese fluently and some English. She is the one who noticed the changes. She has no idea what she is supposed to do about them, and no one has told her. She is tired in a way that has a name in the literature (Zarit moderate-to-severe) and no name in her house.

She is our real customer. She installs it, sets it up, keeps it going or abandons it. **If it adds work to her day, she stops within a week.** Her needs: *tell me what to do, tell me whether it's getting worse, take something off my plate, and don't make me feel judged.*

*Design consequence:* onboarding must be completable in **under 15 minutes** and deliver visible value the same day. Every ongoing caregiver action must be under 30 seconds.

### U3 — The ASHA worker / CHO at the Health & Wellness Centre

> **Junmoni, 33.** ASHA covering ~1,000 population. Already carries NCD screening, maternal health, immunisation, TB follow-up. Paid per incentivised activity. Has a phone. Visits households irregularly; when she visits Aideu she has maybe **six minutes** and no instrument for cognition.

She is the bridge to the health system, and she is the reason the [Goa lay-worker RCT](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0002333) matters to us. But she is *already overloaded*, so:

*Design consequence:* we may ask her for **almost nothing**. She receives a one-page summary; she does not enter data. Anything requiring her to fill a form in our app will not happen. If she needs to see it on paper, it prints.

### U4 — The clinician at the CHC/district hospital (future)

Sees the patient rarely, if ever. Would benefit from a longitudinal engagement/function record at the point of a first consultation. **Out of MVP scope**, but the data model should not preclude it. Design the report so it could one day be an ABDM/ABHA-linked record.

---

## 2. Eligibility — who this is for

Stating this explicitly is a credibility move. Cochrane's evidence is for **mild-to-moderate** dementia; claiming benefit for severe dementia would be unsupported.

### Inclusion

- Age **60+** (the app also works for younger-onset, but our evidence and content are age-60+ calibrated)
- **Subjective memory complaints, MCI, or mild-to-moderate dementia** — diagnosed *or* undiagnosed. Undiagnosed inclusion is deliberate: in a 90%-treatment-gap setting, requiring a diagnosis would exclude almost everyone who needs this.
- Has a **consistent caregiver** able to complete onboarding and supervise
- Functional vision and hearing **sufficient with usual aids** to see a large picture and hear a spoken prompt
- Can perform a **single-finger tap** on a tablet or phone
- Household has access to **one Android device** (owned by anyone, not necessarily the elder)

### Exclusion / not designed for

Say these out loud in the pitch. They cost nothing and buy a lot.

- **Severe / late-stage dementia** — outside the CST evidence base, and the interaction model breaks down
- **Acute delirium or unstable medical illness** — needs clinical care, not an app
- **Severe uncorrected visual or hearing impairment** — we cannot deliver either channel
- **No available caregiver** — the dyad model fails; a solo elderly user with dementia cannot safely self-manage
- **Active severe psychiatric disturbance** — needs a clinician
- **Anyone seeking a diagnosis** — we do not provide one, and we say so at onboarding

### The honesty line for the deck

> MindMitra is a cognitive-stimulation and caregiver-support tool for people with mild-to-moderate cognitive impairment. It is not a diagnostic test, a screening instrument or a medical device, and it does not replace clinical assessment.

---

## 3. Market sizing from the personas up

Bottom-up, so the numbers in [08](08-feasibility-market-scale.md) tie to real people.

| Layer | Estimate | Basis |
|---|---|---|
| India, 60+ with dementia | **8.8–10.1 million** | LASI-DAD [(Lee 2023)](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12928) / [(Jin 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038923/) |
| Of whom mild-to-moderate (our evidence base) | **~60%**, so ~5.3–6.1M | Standard stage distribution — *needs a citation, flagged* |
| Of whom in a household with a smartphone-capable caregiver | needs a real figure | **Open question** |
| NER, 60+ with dementia | **~0.35–0.45M** | Applying state rates to NER 60+ population — *arithmetic to be done and shown* |

> ASSUMPTION: the mild-to-moderate proportion and the NER absolute count are currently estimates. Both must be computed properly from Census/LASI 60+ state populations before they appear on a slide. Owner: research lead.

---

## 4. Use scenarios

Written as narratives with real timing, because that is how you find design bugs. Each names the features it exercises.

### S1 — Onboarding, Sunday afternoon, 14 minutes

Rima downloads MindMitra at the HWC after Junmoni mentions it. Offline install from a preloaded APK on Junmoni's phone via direct transfer — no data spent.

She opens it. Assamese, chosen once. The app asks *her*, not Aideu, in plain Assamese: **what does she like to be called? what work did she do? where did she grow up? who are the people she sees most?**

For each of five family members Rima adds a photo from her gallery and taps a relationship: *son, daughter-in-law, grandson, grandson, younger sister.* Two minutes. Then three places (home, the Nalbari market, the temple). Then medicines: three entries, times set by Rima with a big clock picker. Then a consent screen written for her, not for a lawyer, explaining that everything stays on this phone, that she is consenting on Aideu's behalf as her carer, and that she can delete all of it at any time with one button.

The app generates a first session and says: *"Sit with her for the first one."*

*Exercises: caregiver onboarding, personal corpus capture, guardian consent, offline install, on-device content generation.*

### S2 — The first session, together, 8 minutes

Rima hands the phone to Aideu and sits beside her. The screen shows one large photograph of her son and says aloud, in Assamese: **"Who is this?"** Three large picture-and-word options underneath, each with a face.

Aideu taps the right one. A warm chime, a green tick, and the app says her son's name aloud and adds one true sentence Rima wrote: *"Your son Bhaskar, who drives the school bus."*

Second question: a photo of her sister. Aideu hesitates for eleven seconds. Before it becomes uncomfortable the app **fades in a cue** — the first sound of the name, spoken. She gets it. No mention is made of the hesitation to her. It is recorded.

Six items. No timer visible anywhere. No score shown to Aideu. At the end: *"That was lovely. Shall we do this again tomorrow?"*

Rima's side, later, shows: 6 items, 5 unaided, 1 with cue, median 4.2s response, no distress signals.

*Exercises: E3 Associate & Match engine, cue fading, no-failure design, dual-view reporting.*

### S3 — Tuesday, 4pm, alone, 6 minutes

Rima is at her machine. The phone chimes gently on the table and speaks: *"Aideu, shall we do today's small thing?"* Aideu taps the one large button.

Today: **Let's make tea.** Five photo cards, scrambled. She places three correctly, then puts *serve* before *add milk*. The app does not say wrong. It says, in Assamese: *"Almost — shall we look at these two again?"* and lifts only those two cards back up. She fixes it.

The engine notes: sequencing errors are appearing at set-size 5 where they were not at 4 two weeks ago. It **reduces set size to 4 for the next sequencing session** and logs the change with its reason.

*Exercises: E1 Sequence engine, adaptive step-down, non-punitive error recovery, autonomous session, reminder scheduling.*

### S4 — The repeated question, 9pm

Aideu asks, for the sixth time this evening, whether she has taken her tablet. Rima is putting the children to bed and does not have another answer in her.

Aideu taps the round button on the home screen. The assistant answers on-device, no network, no LLM: *"Yes — you took the evening tablet at seven o'clock. The next one is tomorrow morning at eight."* It is reading the caregiver-configured schedule and the completion log. It has invented nothing.

*Exercises: on-device rule-based assistant, tool boundary, medication data provenance, caregiver-load reduction — arguably the single highest-value feature in the product.*

### S5 — Junmoni's visit, six minutes, three weeks in

Junmoni arrives. Rima opens the caregiver view and hands her the phone, or hands her a printed page.

One page: **14 of 21 sessions completed. Engagement steady. Sequencing tasks needed more cueing in the last fortnight than the two before it. Medication reminders marked complete on 19 of 21 days. Caregiver-reported strain: increased.** At the bottom, unmissable: *This summarises app activity. It is not a medical or diagnostic assessment.*

Junmoni does not enter anything. She reads it, notes the strain flag, and mentions Aideu at the HWC review. For the first time, someone in the health system has a record of this woman over time.

*Exercises: report generation, ASHA-facing brevity, zero-data-entry, clinical-claim boundary, the system-gap thesis from [03](03-gap-and-thesis.md).*

### S6 — The bad day (the scenario nobody designs for, and we will)

Aideu is agitated. She opens the app and cannot do the first item, or the second. Three failures in a row.

The app does **not** offer a fourth. It stops the assessment loop, drops to the easiest possible mode — a familiar song, or a single photograph with a story read aloud, nothing to get right — and after that it ends the session warmly. It flags to Rima, quietly: *"Today was harder than usual. One short, easy session tomorrow is enough."* It does not tell Aideu anything happened.

*Exercises: distress/failure circuit-breaker, floor-mode content, caregiver notification without alarm, dignity guardrail from [07](07-safety-privacy-ethics.md).*

---

## 5. The accessibility spec, extracted

Direct translation of the persona constraints plus the [ENHANCE barrier list](https://pubmed.ncbi.nlm.nih.gov/42492485/). This is a checklist to test against, not aspiration.

| Dimension | Requirement | Fails if |
|---|---|---|
| Text size | ≥ 24pt body equivalent, scalable to 200% without reflow breakage | Anything below 20pt anywhere |
| Contrast | WCAG AAA (7:1) for all text; 3:1 for interactive boundaries | Grey-on-grey, thin type |
| Background | Warm off-white, never #FFFFFF | Glare on a cataract |
| Touch targets | ≥ 64×64 dp with ≥ 16dp spacing | Anything at the 44px minimum |
| Gestures | Tap only | Any swipe, drag, pinch, long-press |
| Navigation | Max 2 levels deep; a persistent, always-visible way home | Hamburger menus, tabs-in-tabs, hidden state |
| Audio | Every instruction speakable; replay always one tap away; adjustable rate | Audio-only information |
| Timing | No timers, no countdowns, no time pressure, no auto-advance | Anything that expires |
| Feedback | Positive or neutral only; never "wrong," never a red X | Any punitive state |
| Colour | Never the sole carrier of meaning | Red/green-only success signalling |
| Motion | Minimal; no parallax, no autoplay video | Anything that could cause visual discomfort — a named ENHANCE barrier |
| Cognitive load | Exactly **one** task per screen | Two decisions visible at once |
| Error recovery | Errors are reversible and unremarked | Anything irreversible without confirmation |

---

## Open questions

- [ ] Do we support **co-play** as an explicit mode (caregiver and elder together, with different prompts) or just tolerate it? Co-play maps to how CST is actually delivered and may be a differentiator.
- [ ] Younger-onset dementia — worth a line, or a distraction?
- [ ] Aideu's device is Rima's phone. Do we need a **profile lock** so the grandchildren don't play the games and pollute the data? Probably yes, and it must be trivially easy.
- [ ] Find the real mild/moderate/severe stage distribution for India and replace the assumption in §3.
