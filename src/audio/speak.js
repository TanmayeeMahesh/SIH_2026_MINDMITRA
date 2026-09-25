// VOICE OUT.
//
// Architecture rule (docs/06 §5): we do NOT call a TTS engine at runtime for
// fixed prompts. Every fixed string is generated ONCE at build time by
// scripts/generate-audio.mjs (Sarvam or Bhashini) and shipped as an mp3 in the
// content pack.
//
// Why, given the APIs support Assamese perfectly well:
//   - works offline, which is the whole product thesis
//   - instant playback on a cheap phone; no inference latency mid-session
//   - one native speaker can listen to all 40 clips once and approve them
//   - no API key, quota, rate limit or network failure can break a session
//
// Runtime synthesis is only the fallback, and only for genuinely dynamic
// strings (a person's name). If it fails, the picture and the pre-rendered
// carrier phrase still carry the meaning.

let manifest = {};
let lang = 'as';
const cache = new Map();
let current = null;

export function configureAudio(nextManifest, nextLang) {
  manifest = nextManifest || {};
  lang = nextLang || 'as';
}

export function stopAudio() {
  if (current) { current.pause(); current = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/**
 * Play a pre-rendered clip by key. Falls back to Web Speech with the supplied
 * text if the clip is missing (which it will be until you run the generator).
 * Returns a promise that resolves when playback finishes.
 */
export function play(key, fallbackText) {
  stopAudio();
  const src = manifest[key];
  if (src) {
    let a = cache.get(src);
    if (!a) { a = new Audio(src); cache.set(src, a); }
    current = a;
    a.currentTime = 0;
    return a.play().catch(() => synth(fallbackText));
  }
  return synth(fallbackText);
}

/** Dynamic text (names, numbers) — synthesis is acceptable here. */
export function synth(text) {
  return new Promise((res) => {
    if (!text || !('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'as' ? 'as-IN' : 'en-IN';
    u.rate = 0.82; // slower — mild hearing loss and processing speed
    u.onend = u.onerror = () => res();
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang?.toLowerCase().startsWith(u.lang.toLowerCase().slice(0, 2)));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  });
}

/** Speak a key and then a dynamic tail, e.g. prompt + a person's name. */
export async function playThen(key, fallbackText, tail) {
  await play(key, fallbackText);
  if (tail) await synth(tail);
}

export const audioAvailable = () => Object.keys(manifest).length > 0;
