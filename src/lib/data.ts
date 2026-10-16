export type ModeId =
  | 'chase' | 'dressup' | 'sketch' | 'poke' | 'gravity'
  | 'dance' | 'says' | 'games' | 'generator' | 'booth' | 'army';

export interface AccessoryDef {
  id: string;
  name: string;
  emoji: string;
  // anchor as fraction of Oliver box (0..1)
  ax: number; ay: number;
  size: number; // base font-size in px at 360px-tall Oliver
  layer: 'behind' | 'front';
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'cowboy', name: 'Cowboy Hat', emoji: '🤠', ax: 0.5, ay: 0.02, size: 110, layer: 'front' },
  { id: 'crown', name: 'Crown', emoji: '👑', ax: 0.5, ay: 0.03, size: 84, layer: 'front' },
  { id: 'propeller', name: 'Propeller Cap', emoji: '🧢', ax: 0.5, ay: 0.03, size: 92, layer: 'front' },
  { id: 'shades', name: 'Sunglasses', emoji: '🕶️', ax: 0.5, ay: 0.235, size: 72, layer: 'front' },
  { id: 'wizard', name: 'Wizard Hat', emoji: '🧙', ax: 0.5, ay: 0.0, size: 104, layer: 'front' },
  { id: 'moustache', name: 'Moustache', emoji: '🥸', ax: 0.5, ay: 0.30, size: 64, layer: 'front' },
  { id: 'chain', name: 'Gold Chain', emoji: '⛓️', ax: 0.5, ay: 0.42, size: 64, layer: 'front' },
  { id: 'bowtie', name: 'Bow Tie', emoji: '🎀', ax: 0.5, ay: 0.375, size: 52, layer: 'front' },
  { id: 'cape', name: 'Cape', emoji: '🦸', ax: 0.5, ay: 0.45, size: 150, layer: 'behind' },
  { id: 'wings', name: 'Wings', emoji: '🪽', ax: 0.5, ay: 0.42, size: 150, layer: 'behind' },
  { id: 'shoes', name: 'Big Shoes', emoji: '👟', ax: 0.5, ay: 0.96, size: 90, layer: 'front' },
  { id: 'party', name: 'Party Hat', emoji: '🎉', ax: 0.58, ay: 0.02, size: 80, layer: 'front' },
];

export interface PlacedAccessory {
  uid: number;
  defId: string;
  dx: number; dy: number; // pixel offset from anchor
  scale: number; rot: number;
}

export const CHASE_PHRASES = ['WAIT FOR ME!', 'COME BACK!', 'WHERE ARE YOU GOING?', 'HEHE!', 'TOO FAST!', 'WHEEE!'];
export const POKE_PHRASES_HEAD = ['OW! MY CURLS!', 'HEY! CAREFUL!', 'BOING!', 'MY GLASSES!!'];
export const POKE_PHRASES_BODY = ['HEHE THAT TICKLES!', 'POKED!', 'OOF!', 'DO IT AGAIN!'];
export const POKE_PHRASES_FEET = ['MY SNEAKERS!', 'TICKLE FEET!', 'EEP!'];

export const GENERATOR_NAMES = [
  'Corporate Oliver', 'Wizard Oliver', 'Disco Oliver', 'Cowboy Oliver',
  'Royalty Oliver', 'Party Oliver', 'Super Oliver', 'Beach Oliver',
  'Spy Oliver', 'Sleepy Oliver',
];

export const ACHIEVEMENTS: { id: string; name: string; desc: string; icon: string }[] = [
  { id: 'first-contact', name: 'First Contact', desc: 'Click Oliver for the first time', icon: '👋' },
  { id: 'fashion-disaster', name: 'Fashion Disaster', desc: 'Wear 5 accessories at once', icon: '🎩' },
  { id: 'menace', name: 'Professional Menace', desc: 'Poke Oliver 20 times', icon: '👉' },
  { id: 'chaos', name: 'Maximum Chaos', desc: 'Fill the chaos meter', icon: '🌪️' },
  { id: 'dancer', name: 'Dance Machine', desc: 'Start a dance party', icon: '🕺' },
  { id: 'artist', name: 'Oliver Picasso', desc: 'Draw 25 strokes on Oliver', icon: '🎨' },
  { id: 'athlete', name: 'Ballin', desc: 'Score in Oliver Basketball', icon: '🏀' },
  { id: 'secret', name: 'OLIVER?!', desc: 'Type the secret code', icon: '🤫' },
  { id: 'sleeper', name: 'Nap Time', desc: 'Catch Oliver sleeping', icon: '😴' },
  { id: 'shooter', name: 'Sharp Shooter', desc: 'Catch Oliver 10 times in one game', icon: '🎯' },
  { id: 'catchme', name: 'Gotcha!', desc: 'Catch the runner 5 times', icon: '🏃' },
  { id: 'meltdown', name: 'Feel His Wrath', desc: 'Push Oliver into a chaos meltdown', icon: '😡' },
  { id: 'baller', name: 'Streetballer', desc: 'Score 8+ in Oliver Hoops', icon: '🏀' },
  { id: 'pongchamp', name: 'Pong Champion', desc: 'Beat Oliver at Pong', icon: '🏓' },
  { id: 'goblin', name: 'Coin Goblin', desc: 'Grab 15 coins in Coin Dash', icon: '🪙' },
];

export const BOOTH_BGS = [
  { id: 'cream', name: 'Cream', css: 'linear-gradient(135deg,#FFF8EC,#FFE9C7)' },
  { id: 'lav', name: 'Lavender Pop', css: 'linear-gradient(135deg,#B9A7F9,#E6DEFF)' },
  { id: 'disco', name: 'Disco', css: 'linear-gradient(135deg,#2B50E0,#B9A7F9 45%,#FF6B5B)' },
  { id: 'lime', name: 'Lime Punch', css: 'linear-gradient(135deg,#C6F24E,#FFD23F)' },
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(135deg,#FF6B5B,#FFD23F,#B9A7F9)' },
  { id: 'dots', name: 'Dots', css: 'radial-gradient(circle at 20% 30%, #FFD23F 0 18px, transparent 19px), radial-gradient(circle at 70% 60%, #FF6B5B 0 22px, transparent 23px), radial-gradient(circle at 40% 80%, #2B50E0 0 16px, transparent 17px), #FFF8EC' },
];

// Body anchors relative to cutout bounds (0..1) — verified against photo:
// head top ~0.02, eyes ~0.235, moustache/mouth ~0.30, neck/collar ~0.36,
// chest/badge ~0.5, waist ~0.68, feet ~0.96
export const ANCHORS = {
  head: { x: 0.5, y: 0.06 },
  face: { x: 0.5, y: 0.24 },
  eyes: { x: 0.5, y: 0.235 },
  neck: { x: 0.5, y: 0.36 },
  chest: { x: 0.5, y: 0.5 },
  hands: { x: 0.5, y: 0.72 },
  waist: { x: 0.5, y: 0.68 },
  feet: { x: 0.5, y: 0.94 },
};
