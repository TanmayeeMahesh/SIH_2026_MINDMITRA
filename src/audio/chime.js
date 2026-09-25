// Zero-asset tones via the Web Audio oscillator — technique lifted from a
// teammate's voice.js (silly-raman), which used it for exactly this. No mp3,
// no network, no file to ship — a chime is just a described waveform, so it
// works offline by construction, same as everything else in this app's audio
// story (docs/06 §5).

let ctx = null;
const getCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

/** A warm ascending arpeggio for a good moment — checkpoint, arrival. */
export function chimeSuccess() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.frequency.setValueAtTime(523.25, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, c.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(783.99, c.currentTime + 0.35);
    gain.gain.setValueAtTime(0.22, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
    osc.start(); osc.stop(c.currentTime + 0.5);
  } catch { /* Web Audio unavailable — silently skip, never block on a chime */ }
}

/** A soft, low, non-alarming descending tone — used for the caregiver-facing
 *  critical alert only. Never played to the elder; nothing should ever sound
 *  like a failure buzzer on her side (docs/04 §5, no punitive feedback). */
export function chimeAlert() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.frequency.setValueAtTime(392.0, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(329.63, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
    osc.start(); osc.stop(c.currentTime + 0.5);
  } catch { /* ignore */ }
}
