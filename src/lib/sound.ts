// Tiny WebAudio synth — no external files, user-gesture initiated.
let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.9;

export function setSoundEnabled(v: boolean) { enabled = v; }
export function isSoundEnabled() { return enabled; }
export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem('oliver-vol', String(volume)); } catch { /* noop */ }
}
export function getVolume(): number {
  try {
    const s = localStorage.getItem('oliver-vol');
    if (s != null) volume = Math.max(0, Math.min(1, Number(s) || 0));
  } catch { /* noop */ }
  return volume;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

export function blip(freq = 440, dur = 0.12, type: OscillatorType = 'sine', vol = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol * volume, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

// Richer helpers: filtered noise bursts + pitch sweeps + arpeggios.
function noise(dur = 0.2, vol = 0.2, from = 400, to = 4000, type: BiquadFilterType = 'lowpass') {
  const c = ac(); if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type;
  f.frequency.setValueAtTime(from, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, to), c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol * volume, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start();
}

function sweep(f0: number, f1: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(30, f0), t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function arp(notes: number[], step = 85, type: OscillatorType = 'square', vol = 0.11) {
  notes.forEach((f, i) => setTimeout(() => blip(f, 0.16, type, vol), i * step));
}

export const sfx = {
  pop: () => sweep(500 + Math.random() * 250, 900 + Math.random() * 300, 0.1, 'square', 0.1),
  boing: () => { sweep(150, 640, 0.2, 'sine', 0.24); sweep(300, 1280, 0.16, 'triangle', 0.1, 0.02); },
  poke: () => { sweep(280 + Math.random() * 480, 180, 0.09, 'triangle', 0.2); noise(0.05, 0.06, 2000, 5000, 'highpass'); },
  punch: () => { noise(0.16, 0.32, 3000, 200, 'lowpass'); sweep(220, 60, 0.16, 'sine', 0.3); },
  yay: () => arp([523, 659, 784, 1047], 90),
  splat: () => { noise(0.22, 0.2, 1200, 120, 'lowpass'); sweep(160, 60, 0.2, 'sawtooth', 0.14); },
  whistle: () => { sweep(880, 880, 0.09, 'sine', 0.15); sweep(1174, 1400, 0.2, 'sine', 0.15, 0.1); },
  bass: (f = 110) => sweep(f, f * 0.8, 0.22, 'sawtooth', 0.1),
  coin: () => { blip(988, 0.07, 'square', 0.1); setTimeout(() => blip(1319, 0.22, 'square', 0.1), 70); },
  rage: () => {
    sweep(420, 65, 0.7, 'sawtooth', 0.24);
    noise(0.6, 0.1, 400, 120, 'lowpass');
    setTimeout(() => sweep(300, 55, 0.5, 'square', 0.1), 120);
  },
  dodge: () => { noise(0.14, 0.12, 600, 6000, 'bandpass'); },
  catchIt: () => { arp([392, 523, 659, 784], 70); noise(0.1, 0.1, 3000, 6000, 'highpass'); },
  levelup: () => arp([523, 659, 784, 1047, 1319], 75),
  thud: () => { noise(0.12, 0.24, 500, 80, 'lowpass'); sweep(120, 45, 0.14, 'sine', 0.26); },
  ui: () => sweep(700, 990, 0.06, 'sine', 0.08),
  grr: () => { sweep(200, 85, 0.32, 'sawtooth', 0.16); noise(0.25, 0.07, 300, 150, 'lowpass'); },
};

// Simple looping disco beat using setInterval-driven blips
let beatTimer: number | null = null;
export function startBeat(bpm = 118) {
  stopBeat();
  const interval = 60000 / bpm / 2;
  let step = 0;
  beatTimer = window.setInterval(() => {
    if (!enabled) return;
    if (step % 4 === 0) sfx.bass(82);
    else if (step % 2 === 0) sfx.bass(110);
    if (step % 4 === 2) blip(1200, 0.05, 'square', 0.06);
    if (step % 2 === 1) blip(6000, 0.03, 'highpass' as OscillatorType, 0.03);
    step++;
  }, interval);
}
export function stopBeat() {
  if (beatTimer !== null) { clearInterval(beatTimer); beatTimer = null; }
}

export function speak(text: string) {
  try {
    if (!enabled) return;
    // Standard browser voices only — never clone Oliver's voice.
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 140));
    u.rate = 1.02; u.pitch = 1.1;
    window.speechSynthesis?.speak(u);
  } catch { /* noop */ }
}
