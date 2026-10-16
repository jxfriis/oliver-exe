// Sprite catalog — files are named after what the picture shows so the
// game can pick the right sprite for each interaction.
export type SpriteId =
  | 'front-stand'      // standing idle, facing camera — default stage / dress-up base
  | 'side-stand-left'  // standing in profile, facing left
  | 'side-stand-right' // standing in profile, facing right
  | 'back-stand'       // standing, seen from behind — run-away / dodge
  | 'topdown-bow'      // seen from above, head bowed — defeat / shy / dodge win
  | 'sit-fall'         // sitting/falling, soles toward camera — gravity airborne
  | 'walk-right-a'     // walking right, stride frame A
  | 'walk-right-b'     // walking right, stride frame B (alternate with A)
  | 'dance-point-up'   // disco pose, right arm up — dance frame A
  | 'dance-point-left' // disco pose, pointing left — dance frame B
  | 'flap-16'          // flying bird form — flappy + rocket pilot (16-bit)
  | 'rocket-16'        // rocket rider form — rocket game (16-bit)
  | 'sleep-16'         // tucked in bed sleeping — idle sleep (16-bit)
  | 'snake-16'         // snake form — snake game head (16-bit)
  | 'face-happy'       // giant happy face — catch target, pong ball, cheers
  | 'face-angry';      // giant angry face — meltdowns, whack penalty, mad Oliver

export const SPRITES: Record<SpriteId, string> = {
  'front-stand': './sprites/oliver-front-stand.png',
  'side-stand-left': './sprites/oliver-side-stand-left.png',
  'side-stand-right': './sprites/oliver-side-stand-right.png',
  'back-stand': './sprites/oliver-back-stand.png',
  'topdown-bow': './sprites/oliver-topdown-bow.png',
  'sit-fall': './sprites/oliver-sit-fall.png',
  'walk-right-a': './sprites/oliver-walk-right-a.png',
  'walk-right-b': './sprites/oliver-walk-right-b.png',
  'dance-point-up': './sprites/oliver-dance-point-up.png',
  'dance-point-left': './sprites/oliver-dance-point-left.png',
  'flap-16': './sprites/oliver-flap-16.png',
  'rocket-16': './sprites/oliver-rocket-16.png',
  'sleep-16': './sprites/oliver-sleep-16.png',
  'snake-16': './sprites/oliver-snake-16.png',
  'face-happy': './sprites/oliver-face-happy.png',
  'face-angry': './sprites/oliver-face-angry.png',
};

export const HD_CUTOUT = './oliver-transparent.png';
export const HD_PHOTO_FRAMED = './oliver-original.jpg'; // fallback if cutout missing

// Realistic (HD) action sheet — same poses, photographic style.
// Default base stays HD_CUTOUT (the transparent photo); these swap in per action.
export type HdSpriteId =
  | 'hd-front-stand'   // standing idle, facing camera — dress-up alternate base
  | 'hd-side-right'    // standing in profile, facing right — idle direction
  | 'hd-back-stand'    // standing, seen from behind — running away
  | 'hd-topdown'       // seen from below/above, looming — defeat / victory leer
  | 'hd-fall'          // falling, soles toward camera — gravity airborne
  | 'hd-walk-right-a'  // walking right, stride frame A
  | 'hd-walk-right-b'  // walking right, stride frame B
  | 'hd-dance-up-down'   // disco pose: right arm up, left down — dance frame A
  | 'hd-dance-down-up'   // disco pose: left arm up, right down — dance frame B
  | 'hd-fly'             // flying bird form — flappy (realistic)
  | 'hd-rocket'          // rocket rider form — rocket game (realistic)
  | 'hd-snake'           // snake form — snake game head (realistic)
  | 'hd-face-angry'    // furious face — meltdowns, mad badge
  | 'hd-face-happy'    // big grin — catch target, wins
  | 'hd-sleep';        // lying on side, napping — idle sleep

export const HD_SPRITES: Record<HdSpriteId, string> = {
  'hd-front-stand': './sprites-hd/oliver-hd-front-stand.png',
  'hd-side-right': './sprites-hd/oliver-hd-side-right.png',
  'hd-back-stand': './sprites-hd/oliver-hd-back-stand.png',
  'hd-topdown': './sprites-hd/oliver-hd-topdown.png',
  'hd-fall': './sprites-hd/oliver-hd-fall.png',
  'hd-walk-right-a': './sprites-hd/oliver-hd-walk-right-a.png',
  'hd-walk-right-b': './sprites-hd/oliver-hd-walk-right-b.png',
  'hd-dance-up-down': './sprites-hd/oliver-hd-dance-up-down.png',
  'hd-dance-down-up': './sprites-hd/oliver-hd-dance-down-up.png',
  'hd-fly': './sprites-hd/oliver-hd-fly.png',
  'hd-rocket': './sprites-hd/oliver-hd-rocket.png',
  'hd-snake': './sprites-hd/oliver-hd-snake.png',
  'hd-face-angry': './sprites-hd/oliver-hd-face-angry.png',
  'hd-face-happy': './sprites-hd/oliver-hd-face-happy.png',
  'hd-sleep': './sprites-hd/oliver-hd-sleep.png',
};

export type AnySprite = SpriteId | HdSpriteId;

export function hdWalkFrame(distancePx: number): HdSpriteId {
  return Math.floor(distancePx / 46) % 2 === 0 ? 'hd-walk-right-a' : 'hd-walk-right-b';
}

// Which HD sprite best represents Oliver for a given situation (photo mode).
// Returns null when the default transparent-photo base should be used.
export function hdSpriteFor(mode: string, o: {
  moving?: boolean; dirX?: number; airborne?: boolean; sleeping?: boolean;
  dancing?: boolean; gameSub?: string; avoiding?: boolean;
} = {}): HdSpriteId | null {
  if (o.sleeping && !o.dancing) return 'hd-sleep';
  if (mode === 'chase') {
    if (o.moving) return hdWalkFrame(Date.now() / 90);
    return (o.dirX || 0) < 0 ? 'hd-back-stand' : 'hd-side-right';
  }
  if (mode === 'gravity') return o.airborne ? 'hd-fall' : null;
  if (mode === 'dance' && o.dancing) return Math.floor(Date.now() / 380) % 2 === 0 ? 'hd-dance-up-down' : 'hd-dance-down-up';
  if (mode === 'games' && o.gameSub === 'catch') return 'hd-face-happy';
  if (mode === 'games' && o.gameSub === 'avoid' && o.avoiding) return 'hd-walk-right-a';
  return null;
}

// Walk-cycle helper: alternate A/B based on distance travelled.
export function walkFrame(distancePx: number): SpriteId {
  return Math.floor(distancePx / 46) % 2 === 0 ? 'walk-right-a' : 'walk-right-b';
}

// Which sprite best represents Oliver for a given situation (16-bit mode).
export function spriteFor(mode: string, opts: { moving?: boolean; dirX?: number; airborne?: boolean; mad?: boolean } = {}): SpriteId {
  if (opts.mad) return 'face-angry';
  if (mode === 'chase') {
    if (opts.moving) return walkFrame(Math.abs(opts.dirX || 0) * 40 + Date.now() / 90);
    return (opts.dirX || 0) < 0 ? 'side-stand-left' : 'side-stand-right';
  }
  if (mode === 'gravity') return opts.airborne ? 'sit-fall' : 'front-stand';
  if (mode === 'dance') return Math.floor(Date.now() / 350) % 2 === 0 ? 'walk-right-a' : 'walk-right-b';
  return 'front-stand';
}

// Body-slot anchors as fractions of the sprite box, per base skin.
// Verified against the actual assets: HD cutout is the top-down photo,
// pixel-front is oliver-front-stand (character spans ~x .28-.72, head top ~.03).
export type SlotId = 'head' | 'eyes' | 'mouth' | 'neck' | 'back' | 'handL' | 'handR' | 'feet';

export const SLOT_ANCHORS: Record<'cutout' | 'pixel' | 'hd', Record<SlotId, { x: number; y: number }>> = {
  cutout: {
    head: { x: 0.5, y: 0.015 },
    eyes: { x: 0.5, y: 0.235 },
    mouth: { x: 0.5, y: 0.30 },
    neck: { x: 0.5, y: 0.375 },
    back: { x: 0.5, y: 0.46 },
    handL: { x: 0.27, y: 0.72 },
    handR: { x: 0.73, y: 0.72 },
    feet: { x: 0.5, y: 0.955 },
  },
  pixel: {
    head: { x: 0.5, y: 0.03 },
    eyes: { x: 0.5, y: 0.265 },
    mouth: { x: 0.5, y: 0.325 },
    neck: { x: 0.5, y: 0.375 },
    back: { x: 0.5, y: 0.46 },
    handL: { x: 0.335, y: 0.615 },
    handR: { x: 0.665, y: 0.615 },
    feet: { x: 0.5, y: 0.945 },
  },
  // tuned for oliver-hd-front-stand (1024x1536)
  hd: {
    head: { x: 0.5, y: 0.03 },
    eyes: { x: 0.5, y: 0.22 },
    mouth: { x: 0.5, y: 0.27 },
    neck: { x: 0.5, y: 0.33 },
    back: { x: 0.5, y: 0.45 },
    handL: { x: 0.28, y: 0.62 },
    handR: { x: 0.72, y: 0.62 },
    feet: { x: 0.5, y: 0.95 },
  },
};
