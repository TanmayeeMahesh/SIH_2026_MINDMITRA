# MindMitra — Team Working Docs

SIH 2026 · PS 26003 · AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region · Theme: MedTech · Category: Software

## Why these documents exist

We built a deck and a UI shell before we did the research. That is backwards, and it showed: the old deck asserted things we could not defend, and the prototype was 126 lines of hardcoded demo. This folder is the reset. Everything here is either sourced or explicitly labelled as an assumption.

The prototype has since been rebuilt on this evidence — two working game engines, a four-layer adaptive difficulty stack, offline IndexedDB storage and a caregiver transparency view. See [`../mindmitra/README.md`](../mindmitra/README.md).

**Rule for this project: if a number appears in the deck, it has a citation in [01-problem-and-evidence.md](01-problem-and-evidence.md). If it does not, it comes out of the deck.**

## Read in this order

| # | Doc | What it settles | Read by |
|---|-----|-----------------|---------|
| 01 | [Problem & evidence](01-problem-and-evidence.md) | Who actually has this problem, how many, and what their day looks like | Everyone |
| 02 | [Reading list & assignments](02-reading-list.md) | Which papers matter, who reads what, summary format | Everyone |
| 03 | [Gap analysis & our thesis](03-gap-and-thesis.md) | What already exists, why it fails here, our five bets | Everyone |
| 04 | [Users, eligibility & scenarios](04-users-and-scenarios.md) | Exactly who this is for and who it is not for | Everyone |
| 05 | [Solution & MVP scope](05-solution-and-mvp.md) | What we build, what we cut, the demo script | Everyone |
| 06 | [Technical approach](06-technical-approach.md) | Stack, adaptive engine, offline, voice, data model | Eng |
| 07 | [Safety, privacy & ethics](07-safety-privacy-ethics.md) | Guardrails, DPDP consent, clinical-claim boundary | Everyone |
| 08 | [Feasibility, market & scale](08-feasibility-market-scale.md) | Deployment path and the honest business model | Product |
| 09 | [Risk register](09-risks-and-mitigations.md) | What kills us and what we do about it | Everyone |
| 10 | [Work plan & roles](10-work-plan-and-roles.md) | Who owns what, phase gates | Everyone |
| 11 | [Deck storyboard](11-ppt-storyboard.md) | Slide-by-slide, mapped to the SIH template **and the jury rubric** | Product |
| 12 | **[36-hour hackathon plan](12-internal-hackathon-36h-plan.md)** | **The Fri 11 – Sat 12 Sept sprint. Read this first this week.** | **Everyone** |
| 13 | [PS traceability matrix](13-ps-traceability-matrix.md) | Mandatory slide-2 table; every PS requirement → module → outcome | Lead + Content |
| 14 | [Cost model](14-cost-model.md) | The 15%-weighted cost argument | Product |
| 15 | [NER cultural adaptation](15-ner-cultural-adaptation.md) | Why NER isn't one culture — the kinship fix, and the Meghalaya juror | Content + Lead |
| 16 | **[How the AI works](16-how-the-ai-works.md)** | **The adaptive engine, explained. No dataset, no GPU. Built and measured.** | Everyone |
| 17 | [Making games dynamic](17-making-games-dynamic.md) | Corpus-agnostic engine design — one engine, many households | Eng |
| 18 | [Safe Walk source audit](18-safe-walk-source-audit.md) | Line-by-line audit of the teammate prototype Safe Walk was ported from | Eng |
| 19 | [SIH submission deck content](19-sih-submission-deck-content.md) | Corrected 6-slide deck content, matched to what's actually built | Everyone |
| 20 | **[Technical report (as-built)](20-technical-report.md)** | **The whole prototype, as it actually exists in source — architecture, adaptive engine internals, Safe Walk, bugs found & fixed** | **Everyone** |

## ⏱ Right now: internal hackathon, Fri 11 – Sat 12 Sept 2026

Functional prototype required. Pre-built code is allowed, and the base is now built and building clean — so [doc 12](12-internal-hackathon-36h-plan.md)'s PRE block is largely done. What remains for the sprint: Assamese audio (`SARVAM_API_KEY=xxx node scripts/generate-audio.mjs as`), real photos in the corpus, reminders UI, and three full demo rehearsals in airplane mode on a low-end phone. **Feature freeze at H+13 still applies.**

## Three things every team member must be able to say from memory

1. **Who our user is.** A rural woman in her seventies with little or no formal schooling, who does not read English, may not read at all, does not own the phone, and is cared for by a family member. Every design decision traces back to her. (Evidence: dementia prevalence is 12.29% in women vs 5.37% in men, 10.19% rural vs 6.07% urban, and 12.23% among those with no formal education vs 1.65% with tertiary education.)
2. **What we are and are not.** We are a cognitive-stimulation and caregiver-support tool. We are not a diagnostic, screening or medical device. Say this before a judge asks.
3. **Why the region matters.** Not because NER has the worst prevalence — it does not, uniformly. Because it has the country's thinnest specialist workforce (Assam has an 89.1% psychiatrist deficit, Arunachal 90%) layered on top of the lowest digital-literacy and connectivity conditions. The gap is between need and supply, not need alone.

## How we work

- One owner per document. The owner keeps it current; anyone can raise an issue, only the owner edits.
- Every claim carries a source link inline. No source, no claim.
- Assumptions are written as `> ASSUMPTION:` blocks so we can find and kill them later.
- Open questions live at the bottom of each doc under `## Open questions`.
