/**
 * Pre-render every fixed prompt to an mp3, ONCE, at build time.
 *
 * You were right that Sarvam and Bhashini already do Assamese well — so use
 * them. The point was never "record a human instead of using the API". The
 * point is WHEN the API is called: here, on your laptop, not on a grandmother's
 * phone in a village with no signal, mid-session.
 *
 * What this buys:
 *   - the app works in airplane mode, which is the whole thesis
 *   - instant playback, no inference latency on a 2GB phone
 *   - one Assamese speaker can listen to all ~40 clips once and approve them
 *   - no API key, quota, rate limit or outage can break a live demo
 *
 * STATUS, 10 Sep 2026 — verified against the live API:
 *   en-IN  22/22 clips generated. Pipeline proven end to end.
 *   as-IN  BLOCKED. Sarvam returns:
 *            "Please request beta access to as-IN by contacting our support team."
 *          Assamese also requires bulbul:v3 or v4 — v2 rejects as-IN outright.
 *
 * That error is worth keeping. Assamese is one of India's 22 scheduled
 * languages and it is still gated behind a beta waitlist on a leading Indic
 * TTS vendor. It is the low-resource-language problem in one HTTP response,
 * and it is exactly why this file exists: because we pre-render rather than
 * synthesise at runtime, a community with a native speaker and a quiet room
 * can ship a language pack that no vendor supports yet. See docs/15.
 *
 * Routes to Assamese audio, in order of speed:
 *   1. Record a native speaker reading STRINGS.as — ~10 minutes, works today
 *   2. Bhashini (government platform, AI4Bharat models) — free, needs registration
 *   3. Request Sarvam as-IN beta access — free, but not before Friday
 *
 * Usage (PowerShell):
 *   $env:SARVAM_API_KEY='xxx'; node scripts/generate-audio.mjs en
 * Usage (bash):
 *   SARVAM_API_KEY=xxx node scripts/generate-audio.mjs en
 *
 * Optional: SARVAM_SPEAKER, SARVAM_MODEL.
 * The manifest is written straight to src/content/audio-manifest.js — no
 * copy-paste step. A language with no clips falls back to Web Speech.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { STRINGS } from '../src/content/strings.js';

// Load .env (gitignored) so nobody has to paste a key into a shell command,
// where it ends up in history, screenshots and screen shares.
// Native in Node 20.12+; an already-set environment variable still wins.
try { process.loadEnvFile('.env'); } catch { /* no .env — env vars only */ }

const lang = process.argv[2] || 'as';
const outDir = `public/audio/${lang}`;

// Only strings the ELDER hears need audio. Caregiver-facing text does not.
const SPOKEN = [
  'home.greeting', 'home.question', 'home.general', 'home.personal', 'home.chat', 'home.quote',
  'games.title', 'games.sub', 'game.listen', 'game.hint', 'game.next', 'game.finish',
  'mm.whoIs', 'mm.whatName', 'ft.title',
  'fb.good', 'fb.great', 'fb.soft', 'fb.shown',
  'session.done', 'session.floor', 'progress.title',
];

// bulbul:v3 speakers (Assamese needs v3+; v2 does NOT support as-IN).
//   female: ritu, priya, neha, pooja, simran, kavya, ishita, shreya, roopa,
//           tanya, shruti, suhani, kavitha, rupali
//   male:   aditya, ashutosh, rahul, rohan, amit, dev, ratan, varun, manan,
//           sumit, kabir, aayan, shubh, advait, anand, tarun, sunny, mani,
//           gokul, vijay, mohit, rehan, soham
// Generate with two or three and let an Assamese speaker pick the warmest for
// an elderly listener. Override with SARVAM_SPEAKER.
const SPEAKER = process.env.SARVAM_SPEAKER || 'ritu';
const MODEL = process.env.SARVAM_MODEL || 'bulbul:v3';   // as-IN needs v3+; v2 does not support it

async function sarvam(text) {
  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'api-subscription-key': process.env.SARVAM_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      target_language_code: lang === 'as' ? 'as-IN' : 'en-IN',
      speaker: SPEAKER,
      pace: 0.85,          // slower — mild hearing loss and slower processing
      model: MODEL,
    }),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.audios[0], 'base64');
}

async function bhashini(text) {
  const res = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
    method: 'POST',
    headers: { Authorization: process.env.BHASHINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: 'tts', config: { language: { sourceLanguage: lang }, gender: 'female' } }],
      inputData: { input: [{ source: text }] },
    }),
  });
  if (!res.ok) throw new Error(`Bhashini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.pipelineResponse[0].audio[0].audioContent, 'base64');
}

const provider = process.env.SARVAM_API_KEY ? sarvam
  : process.env.BHASHINI_API_KEY ? bhashini
    : null;

if (!provider) {
  console.error(
    'No API key found.\n' +
    '  1. cp .env.example .env\n' +
    '  2. put your key on the SARVAM_API_KEY= line\n' +
    '  3. node scripts/generate-audio.mjs en\n\n' +
    'Without a key the app falls back to Web Speech and still works.',
  );
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const manifest = {};

for (const key of SPOKEN) {
  const text = STRINGS[lang]?.[key];
  if (!text) { console.warn(`skip ${key} — no ${lang} string`); continue; }
  try {
    const buf = await provider(text);
    const file = `${key.replace(/\./g, '_')}.mp3`;
    await writeFile(`${outDir}/${file}`, buf);
    manifest[key] = `/audio/${lang}/${file}`;
    console.log(`ok  ${key}`);
  } catch (e) {
    console.error(`FAIL ${key}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 250)); // be polite to the API
}

// Merge into the manifest the app imports. No copy-paste step.
// Written as a .js module, not .json, so Vite and plain Node load it
// identically — Node ESM would otherwise demand `with { type: 'json' }`.
const manifestPath = 'src/content/audio-manifest.js';
let all = { en: {}, as: {} };
try { all = (await import('../src/content/audio-manifest.js')).default; } catch { /* first run */ }
all[lang] = { ...(all[lang] || {}), ...manifest };
await writeFile(manifestPath,
  '// GENERATED by scripts/generate-audio.mjs — do not edit by hand.\n' +
  '// A .js module rather than .json so Vite and plain Node load it identically.\n' +
  '// A language with an empty map falls back to Web Speech, so the app always works.\n\n' +
  'export default ' + JSON.stringify(all, null, 2) + ';\n');

const n = Object.keys(manifest).length;
console.log(`\n${n}/${SPOKEN.length} clips generated for "${lang}" (speaker: ${SPEAKER}, model: ${MODEL}).`);
console.log(`Written to ${outDir}/ and merged into ${manifestPath}.`);
console.log(n === SPOKEN.length
  ? 'Now have a native speaker listen to all of them once and sign off.'
  : 'Some clips failed — the app falls back to Web Speech for those keys and still works.');
