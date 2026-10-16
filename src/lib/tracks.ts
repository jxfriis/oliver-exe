// Meme MP3 reactions + rickroll dance loop. HTMLAudio, user-gesture started,
// follows the master SFX volume/mute from sound.ts.
import { getVolume, isSoundEnabled } from './sound';

export type MemeId = 'getback' | 'hehe' | 'nice' | 'cry' | 'hehehaw' | 'fart';

const FILES: Record<MemeId, string> = {
  getback: './sfx/get-back-here.mp3',
  hehe: './sfx/hehe-boy.mp3',
  nice: './sfx/nice.mp3',
  cry: './sfx/crying.mp3',
  hehehaw: './sfx/hehehaw.mp3',
  fart: './sfx/fart.mp3',
};

const lastPlay: Record<MemeId, number> = { getback: 0, hehe: 0, nice: 0, cry: 0, hehehaw: 0, fart: 0 };
const COOLDOWN: Record<MemeId, number> = { getback: 4000, hehe: 2500, nice: 3000, cry: 5000, hehehaw: 4000, fart: 6000 };

// While the dance party is on, the rickroll owns the audio — no memes.
let partyOn = false;
export function setParty(on: boolean) { partyOn = on; }

export function meme(id: MemeId) {
  try {
    if (!isSoundEnabled() || partyOn) return;
    const now = Date.now();
    if (now - lastPlay[id] < COOLDOWN[id]) return;
    lastPlay[id] = now;
    const a = new Audio(FILES[id]);
    a.volume = getVolume();
    void a.play().catch(() => { /* autoplay guard */ });
  } catch { /* noop */ }
}

let rick: HTMLAudioElement | null = null;
let warmed = false;

// Warm up the dance track + meme clips on app start so first play is instant.
export function warmAudio() {
  if (warmed) return;
  warmed = true;
  try {
    rick = new Audio('./sfx/rickroll.mp3');
    rick.loop = true;
    rick.preload = 'auto';
    rick.volume = Math.min(1, getVolume() * 0.9);
    rick.load();
    for (const id of Object.keys(FILES) as MemeId[]) {
      const a = new Audio(FILES[id]);
      a.preload = 'auto';
      a.volume = 0;
      a.load();
    }
  } catch { /* noop */ }
}

export function rickStart() {
  try {
    setParty(true);
    if (!isSoundEnabled()) return;
    if (!rick) {
      rick = new Audio('./sfx/rickroll.mp3');
      rick.loop = true;
    }
    rick.volume = Math.min(1, getVolume() * 0.9);
    rick.currentTime = 0;
    void rick.play().catch(() => { /* autoplay guard */ });
  } catch { /* noop */ }
}

export function rickStop() {
  setParty(false);
  try { rick?.pause(); } catch { /* noop */ }
}

export function tracksSetVolume() {
  try { if (rick) rick.volume = Math.min(1, getVolume() * 0.9); } catch { /* noop */ }
}
