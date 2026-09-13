/**
 * Tiny WebAudio synth. Every sound on this site is generated in the browser —
 * there is not a single audio file to download. Off by default; the user
 * opts in with the speaker toggle, and the preference is remembered.
 */

let ctx = null;
let enabled = false;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Browsers suspend the context until a user gesture; resume on demand.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setSoundEnabled(value) {
  enabled = value;
  if (value) audio();
}

export function isSoundEnabled() {
  return enabled;
}

/**
 * Play a single shaped tone.
 * @param {object} opts
 * @param {number} opts.freq      start frequency in Hz
 * @param {number} [opts.to]      frequency to glide to
 * @param {number} [opts.dur]     seconds
 * @param {OscillatorType} [opts.type]
 * @param {number} [opts.gain]    peak gain 0..1
 * @param {number} [opts.delay]   seconds to wait before starting
 */
export function tone({ freq, to, dur = 0.12, type = "sine", gain = 0.06, delay = 0 }) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;

  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + dur);

  // Quick attack, smooth decay — avoids the click of a hard stop.
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function chord(notes, opts = {}) {
  notes.forEach((n, i) => tone({ freq: n, delay: i * 0.055, ...opts }));
}

/** Named sounds used across the UI. */
export const sfx = {
  hover: () => tone({ freq: 880, to: 1180, dur: 0.06, type: "sine", gain: 0.022 }),
  click: () => tone({ freq: 520, to: 300, dur: 0.09, type: "triangle", gain: 0.05 }),
  open: () => chord([523, 784], { dur: 0.14, type: "sine", gain: 0.045 }),
  close: () => chord([784, 392], { dur: 0.1, type: "sine", gain: 0.04 }),
  type: () =>
    tone({ freq: 1400 + Math.random() * 500, dur: 0.03, type: "square", gain: 0.012 }),
  success: () => chord([523.25, 659.25, 783.99], { dur: 0.28, type: "sine", gain: 0.05 }),
  // The achievement fanfare: a rising major arpeggio with an octave landing.
  unlock: () => chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.4, type: "triangle", gain: 0.055 }),
  error: () => tone({ freq: 180, to: 90, dur: 0.24, type: "sawtooth", gain: 0.05 }),
  request: () => tone({ freq: 660, to: 1320, dur: 0.16, type: "sine", gain: 0.035 }),
  boot: () => chord([392, 523.25, 659.25], { dur: 0.5, type: "sine", gain: 0.04 }),
  konami: () =>
    chord([659.25, 659.25, 783.99, 1046.5, 783.99, 1318.5], { dur: 0.2, type: "square", gain: 0.045 }),
};
