# MindMitra — prototype

**Live app: https://sih-2026-mindmitra.vercel.app** — open this on your phone, turn on airplane mode, it still works.

Offline-first cognitive-activity and caregiver-support app for people living with mild-to-moderate dementia. SIH 2026, PS 26003.

Planning, evidence and design decisions are in [`docs/`](docs/). Start with [`docs/README.md`](docs/README.md). For a full, verified-against-source walkthrough of everything below, see [`docs/20-technical-report.md`](docs/20-technical-report.md).

## Run

```bash
npm install      # only if node_modules is missing — no new deps were added
npm run dev
```

Open the Vite URL. **Turn on airplane mode and it keeps working** — that is the point, not a bonus.

Caregiver mode: lock icon, top right. Prototype PIN `1234`.

## What actually exists right now

Honest list. Nothing here is aspirational.

- **All three MVP engines, end to end** (docs/05 §5) — five games total, all corpus-agnostic:
  - **E3 Associate & Match** — *Who Is This?* (recognition, face/object/place–name association) and *Our Family* (relationship placement on a family tree, tap-to-place)
  - **E1 Sequence** — *In Order*: tap the steps of a daily routine into the right order, from a caregiver's own routine or a generic default
  - **E2 Find & Select** — *Find It* (find named things among a larger shelf of distractors) and *Market Day* (tap notes/coins to match a price, using photographs of real Indian currency — RBI's own GODL-India images for the notes, CC BY-SA for most coins; see `public/content/currency/ATTRIBUTION.md`, and note the licences cover the photographs, not the underlying RBI designs)
- **Two content tiers, cleanly separated by surface, not merged** (docs/05 §4) — **Personal Games** is always built from the caregiver's own corpus (T1); **General Games** is always built from a regional-default pack (T3: real, openly-licensed photos of everyday objects, vegetables and places, see `public/content/t3/ATTRIBUTION.md`). General Games works from the very first launch, before any onboarding; Personal Games unlocks as the caregiver adds real content. Nothing is ever silently padded with stock photos.
- **Adaptive difficulty, live** — L0 bounded ladder + L1 Elo ability estimate + L3 Q-learning policy, **plus a fuzzy-logic advisor running alongside the Q-table** (`engine/fuzzy.js`): it reaches the same up/hold/down decision from soft, overlapping boundaries instead of hard cutoffs, so a noisy day doesn't get treated as a real change.
  - **How the three combine** (`engine/policy.js` `decide()`): the clear-cut ends are decided by rule — comfortably above the target band with no cues steps up, below the band or leaning on cues steps down. The Q-table and the fuzzy advisor govern the ambiguous middle, and a split vote holds steady rather than moving. Everything is still subject to the L0 rails.
  - L0 allows **two steps up or one step down within a session** (asymmetric on purpose, same asymmetry as the reward function), never above recent-best + 1, with the instant step-down after two consecutive misses unchanged.
  - The Q-table's state now includes the **current ladder level** (482 states, per `engine/qtable.json`'s own `meta`). Without it "she is getting everything right" was ambiguous between the easiest and hardest setting, and the learned values for the two averaged into noise.
- **Safe Walk** — a big rotating arrow (real device compass, not GPS course-over-ground) guides her to a caregiver-approved destination, with gentle voice re-orienting at 12s off-path and a caregiver-visible alert at 35s / 75m off-path. Two route sources share one safety engine (`engine/walkSession.js`): **Tier 0**, a route the caregiver walks and pins once (`engine/routing.js` `fixedRoute()`), works with zero signal, always; **Tier 1**, a live OSRM turn-by-turn route from wherever she currently is, used when online, falling back to Tier 0 on any failure. Three interchangeable views — Arrow (default), a live Leaflet/OpenStreetMap view (`components/LiveMap.jsx`, online-only, lazy-loaded), and a camera overlay (`components/ArrowCameraView.jsx`, explicitly *not* real spatial AR — same math, just composited on the camera feed). The whole walk session is owned once at the app root (`hooks/useSafeWalk.js`), not inside the screen, specifically so switching into Caregiver mode mid-walk doesn't kill the GPS watch — Caregiver mode gets a live, read-only view of the same session instead. Single-device only by design; see `docs/18` for the source audit this was built from and its open questions.
- **Caregiver mode** — setup (including a soft daily screen-time budget, never a visible timer), people, things & routines with per-step photos, medicines/reminders, consent, "How it adapts" transparency view (now showing all five games and the fuzzy vote), Safe Walk admin (add a place by GPS or by picking it on a map, record its route once), printable report, and a Sync tab
- **Reminders** — caregiver adds a medicine + time; it surfaces as an in-app banner on the Home screen once due, marked done there. No native background notification yet — that needs the Capacitor packaging step in docs/06, and the app says so rather than implying otherwise.
- **One app, one build, with an explicit Online/Offline switch** (Caregiver → Sync). The switch can only turn the online extras *off* — it never claims a connection that isn't there — and the topbar always shows which mode is live. What differs between modes is exactly one thing: sync. Every game, the adaptive engine, reminders, the assistant, progress and the report are identical either way, by design.
- **Simulated hybrid online/offline sync** (`sync/mockCloud.js`) — a real "sync now" flow and UI, but "the cloud" is a second IndexedDB store on the same device: a deliberate choice, since a real backend would contradict the project's own zero-server privacy architecture (docs/06 §4, docs/07) and this build has no hosting to stand one up on. The Sync tab says this explicitly.
- **Cue ladder 0–4** in every game; level 4 always resolves, so there is no losing state
- **No failure states** — no timer, no score shown to the elder, no red X
- **Offline** — IndexedDB storage, no backend, no network call in the daily loop. Verified under an actual network cutoff (not just the UI's Offline pill): the service worker precache glob covers both audio (`mp3`) and the T3 photo pack (`jpg`) — see `vite.config.js`.
- **On-device assistant** — rule-based, reads only caregiver-entered data. Covers medicines, what's next today, the day and time, family and individual people, routine steps, places, today's activity, feelings and greetings, with spoken quick-reply options and a replay button on every answer. Deliberately **not** a cloud LLM: it can report a stored fact or say it doesn't know, and has no path to invent one (docs/07 guardrails 1 & 2).
- **Her own Profile screen** — name, her people (tap any to hear who they are), her things and places, and a text-size control she can use herself. (This used to render the Progress screen verbatim.)
- **Q-learning simulator** — `sim/train_qtable.py`, standard library only

## Not built yet (say so, don't imply otherwise)

Voice input · Bodo/Khasi packs (T2 community content — the pack format is ready, no community pack has been sourced yet) · real cross-device sync (including a second device watching a Safe Walk in progress remotely — needs a real backend, deliberately not built) · L2 contextual bandit · native background reminder delivery (Capacitor) · self-hosted OSRM (Safe Walk's live routing currently calls the public OSRM demo server, which is documented as not meant for production load).

## Layout

```
src/
  engine/     ladder.js  elo.js  policy.js  fuzzy.js  session.js  corpus.js  qtable.json
              geodesic.js  routing.js  walkSession.js  garden.js   (Safe Walk)
  hooks/      useSafeWalk.js  useCompassHeading.js
  store/      db.js (IndexedDB)  state.js
  sync/       mockCloud.js
  screens/    Elder.jsx  MemoryMatch.jsx  FamilyTree.jsx  Sequence.jsx  FindSelect.jsx  MarketMoney.jsx
              Caregiver.jsx  SafeWalk.jsx  SafeWalkAdmin.jsx
  content/    strings.js (en/as)  kinship.js  currency.js  stepIcons.js  packs/t3-manifest.json  packs/t3-routines.js
  components/ Photo.jsx  Currency.jsx  BigArrow.jsx  LiveMap.jsx  ArrowCameraView.jsx  PickOnMap.jsx  WalkSchematic.jsx
  audio/      speak.js  chime.js
public/content/t3/        the T3 photo pack + ATTRIBUTION.md
public/content/currency/  real currency photographs + ATTRIBUTION.md
sim/          train_qtable.py
scripts/      generate-audio.mjs
silly-raman/  teammate's separate Python/FastAPI prototype — Safe Walk's geodesic math and
              corridor/hysteresis logic were audited and ported from here (docs/18); its
              backend, database and 3D-garden rendering were not
```

## The adaptive engine

See [`docs/16-how-the-ai-works.md`](docs/16-how-the-ai-works.md) for the full explanation. Short version: no dataset, no GPU, no model training. The Q-table is 482 states × 3 actions, learned against simulated learners; on device it runs greedy, bounded by deterministic safety rails.

```bash
python sim/train_qtable.py
# 60,000 episodes, ~40s, stdlib only. Writes src/engine/qtable.json
# Measured: session abandonment 21.3% (rule) -> 8.5% (Q-learning),
#           items in the 75-90% flow band 28.3% (rule) -> 33.2% (Q-learning)
```

Three bugs were found in the first version of this trainer and are worth knowing about, because the
symptom was visible in the app (a user answering everything correctly watched the game get *easier*):

1. **Credit assignment was off by one** — each action was updated with the *next* step's reward, so no
   action was ever scored by its own outcome.
2. **Under-challenge was free.** Abandonment cost −6.0 and being too easy cost 0.0, so "step down
   forever and never risk a miss" was genuinely optimal. Boredom now carries a real, smaller cost.
3. **The simulator omitted the L0 rail** that actually runs on the device, so the policy was trained as
   though it alone stood between the user and abandonment, and learned to be far more cautious than it
   needs to be.

Note the state space changed (level is now part of the state), so the "324 states / 972 numbers"
figures in `docs/16` and `docs/06` are now out of date — those planning docs have not been rewritten.

## Audio

Pre-rendered at build time so the phone never calls an API mid-session. The manifest is written
straight to `src/content/audio-manifest.js` and the mp3s are precached by the service worker,
so audio works in airplane mode.

**Keys go in `.env`** (gitignored, loaded automatically — no key in your shell history):

```bash
cp .env.example .env          # then put your key on the SARVAM_API_KEY= line
node scripts/generate-audio.mjs en
```

The key is used **only** by this build-time script. It is never bundled into the app and never
reaches a phone — so do not give it a `VITE_` prefix, which would ship it to the browser.

**Status:** English 22/22 generated and working. **Assamese is blocked** — Sarvam returns
*"Please request beta access to as-IN"*, and `bulbul:v2` rejects `as-IN` outright (needs v3+).
Assamese falls back to Web Speech until one of: a native speaker records `STRINGS.as` (~10 min,
fastest), Bhashini registration, or Sarvam beta access. See [`docs/15`](docs/15-ner-cultural-adaptation.md) —
that error is a useful argument, not just an obstacle.

## Kinship is data, not code

`src/content/kinship.js` carries relationship vocabulary and the default caregiver role per community. Khasi, Jaintia and Garo families are matrilineal — the youngest daughter (Ka Khadduh) inherits and carries the duty of caring for her parents. Hardcoding "daughter-in-law" would break the app in Meghalaya. See [`docs/15`](docs/15-ner-cultural-adaptation.md).

## Safe Walk

A GPS + real-compass guided walk to a caregiver-approved destination, with automatic caregiver
alerting if she wanders off the path for too long. Full write-up: [`docs/20-technical-report.md`](docs/20-technical-report.md) §9, source audit: [`docs/18-safe-walk-source-audit.md`](docs/18-safe-walk-source-audit.md).

Two things were deliberately **not** used, after actually researching them rather than assuming:
**Google ARCore Geospatial API** (native-SDK-only, no web binding, needs Street-View-density visual
positioning coverage rural NER doesn't have, needs Cloud billing) and **bulk offline map-tile
caching** (both OSM's Tile Usage Policy and the Google Maps Platform Terms of Service explicitly
prohibit pre-caching tiles for offline use — live browsing is fine, downloading a region is not).
That's why routing has two tiers instead of one "download the map" mode: a caregiver-recorded fixed
route for zero-signal reliability, and live OSRM turn-by-turn routing when there's a connection.

## Limitation

Not a medical device, diagnostic test or screening tool. Activity data reflects engagement with the app and is not a clinical measure of cognition. Medication times and doses are caregiver-entered; the assistant can read them and can never compose them.
