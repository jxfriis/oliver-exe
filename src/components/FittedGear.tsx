import type { SlotId } from '../lib/sprites';

export interface GearDef {
  id: string;
  name: string;
  icon: string; // wardrobe button glyph
  slot: SlotId;
  wFrac: number; // width as fraction of Oliver box width
  ax: number; ay: number; // anchor point inside the 100x100 art that sits ON the slot
  behind?: boolean;
  art: () => React.ReactNode;
}

const O = '#1e1b3a'; // outline
const S = (p: React.SVGProps<any>) => p; // shorthand helper unused guard

function Cowboy() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <ellipse cx="50" cy="78" rx="46" ry="12" fill="#8A5A2B" stroke={O} strokeWidth="4" />
      <path d="M28 76 Q30 40 50 38 Q70 40 72 76 Q60 84 50 84 Q40 84 28 76" fill="#A9743B" stroke={O} strokeWidth="4" />
      <rect x="29" y="64" width="42" height="9" fill="#2B50E0" stroke={O} strokeWidth="3" />
    </svg>
  );
}
function Crown() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <polygon points="14,86 10,44 30,60 50,30 70,60 90,44 86,86" fill="#FFD23F" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="50" cy="52" r="6" fill="#FF6B5B" stroke={O} strokeWidth="3" />
      <circle cx="28" cy="66" r="5" fill="#2B50E0" stroke={O} strokeWidth="3" />
      <circle cx="72" cy="66" r="5" fill="#2B50E0" stroke={O} strokeWidth="3" />
      <rect x="14" y="86" width="72" height="8" fill="#E8A800" stroke={O} strokeWidth="3" />
    </svg>
  );
}
function Propeller() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <path d="M24 82 Q26 52 50 50 Q74 52 76 82 Q50 92 24 82" fill="#FF6B5B" stroke={O} strokeWidth="4" />
      <rect x="47" y="30" width="6" height="22" fill="#999" stroke={O} strokeWidth="3" />
      <ellipse cx="50" cy="28" rx="34" ry="7" fill="#FFD23F" stroke={O} strokeWidth="4" />
      <circle cx="50" cy="28" r="6" fill="#2B50E0" stroke={O} strokeWidth="3" />
    </svg>
  );
}
function Party() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <polygon points="50,8 78,88 22,88" fill="#B9A7F9" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <polygon points="42,42 58,42 64,58 36,58" fill="#FFD23F" stroke={O} strokeWidth="3" />
      <polygon points="34,66 66,66 70,78 30,78" fill="#FF6B5B" stroke={O} strokeWidth="3" />
      <circle cx="50" cy="10" r="9" fill="#FF6B5B" stroke={O} strokeWidth="3" />
    </svg>
  );
}
function Wizard() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <path d="M50 2 Q56 34 74 62 Q50 74 26 62 Q40 34 50 2" fill="#2B50E0" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <polygon points="50,20 53,28 61,28 55,33 57,41 50,36 43,41 45,33 39,28 47,28" fill="#FFD23F" />
      <polygon points="58,46 60,51 65,51 61,54 62,59 58,56 54,59 55,54 51,51 56,51" fill="#FFD23F" />
      <ellipse cx="50" cy="70" rx="38" ry="10" fill="#1E3AA8" stroke={O} strokeWidth="4" />
    </svg>
  );
}
function Shades() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <rect x="6" y="34" width="38" height="30" rx="10" fill="#14142b" stroke={O} strokeWidth="4" />
      <rect x="56" y="34" width="38" height="30" rx="10" fill="#14142b" stroke={O} strokeWidth="4" />
      <rect x="42" y="40" width="16" height="8" fill="#14142b" />
      <polygon points="14,40 30,40 22,56" fill="rgba(255,255,255,.35)" />
      <polygon points="64,40 80,40 72,56" fill="rgba(255,255,255,.35)" />
    </svg>
  );
}
function Moustache() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <path d="M50 52 Q34 38 12 46 Q20 62 36 62 Q46 62 50 52" fill="#5A3418" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 52 Q66 38 88 46 Q80 62 64 62 Q54 62 50 52" fill="#5A3418" stroke={O} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
function Chain() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <path d="M20 18 Q50 92 80 18" fill="none" stroke="#FFD23F" strokeWidth="10" strokeLinecap="round" />
      <path d="M20 18 Q50 92 80 18" fill="none" stroke={O} strokeWidth="14" strokeLinecap="round" opacity="0.001" />
      <circle cx="50" cy="72" r="13" fill="#FFD23F" stroke={O} strokeWidth="4" />
      <text x="50" y="78" textAnchor="middle" fontSize="16" fontWeight="900" fill={O}>O</text>
    </svg>
  );
}
function Bowtie() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <polygon points="8,30 44,50 8,70" fill="#FF6B5B" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <polygon points="92,30 56,50 92,70" fill="#FF6B5B" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <rect x="42" y="40" width="16" height="20" rx="5" fill="#C62828" stroke={O} strokeWidth="4" />
    </svg>
  );
}
function Cape() {
  return (
    <svg viewBox="0 0 100 140" className="w-full h-auto overflow-visible">
      <path d="M18 6 Q8 80 30 134 Q50 122 70 134 Q92 80 82 6 Q50 20 18 6" fill="#7B2FF7" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 22 Q26 80 38 118" fill="none" stroke="#B9A7F9" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
function Wings() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-auto overflow-visible">
      <ellipse cx="30" cy="44" rx="26" ry="30" fill="#fff" stroke={O} strokeWidth="4" transform="rotate(-24 30 44)" />
      <ellipse cx="90" cy="44" rx="26" ry="30" fill="#fff" stroke={O} strokeWidth="4" transform="rotate(24 90 44)" />
      <path d="M30 30 L14 12 M30 44 L10 34 M90 30 L106 12 M90 44 L110 34" stroke={O} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function Glove() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto overflow-visible">
      <circle cx="50" cy="54" r="30" fill="#E0392B" stroke={O} strokeWidth="4" />
      <rect x="34" y="74" width="32" height="18" rx="6" fill="#fff" stroke={O} strokeWidth="4" />
      <path d="M28 44 Q22 30 34 28" fill="none" stroke={O} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function Sneakers() {
  return (
    <svg viewBox="0 0 120 60" className="w-full h-auto overflow-visible">
      <g>
        <ellipse cx="32" cy="38" rx="28" ry="16" fill="#C6F24E" stroke={O} strokeWidth="4" />
        <ellipse cx="88" cy="38" rx="28" ry="16" fill="#C6F24E" stroke={O} strokeWidth="4" />
        <rect x="8" y="44" width="48" height="10" rx="5" fill="#fff" stroke={O} strokeWidth="3" />
        <rect x="64" y="44" width="48" height="10" rx="5" fill="#fff" stroke={O} strokeWidth="3" />
        <path d="M22 30 L42 30 M78 30 L98 30" stroke={O} strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export const GEAR: GearDef[] = [
  { id: 'cowboy', name: 'Cowboy Hat', icon: '🤠', slot: 'head', wFrac: 0.62, ax: 0.5, ay: 0.86, art: Cowboy },
  { id: 'crown', name: 'Crown', icon: '👑', slot: 'head', wFrac: 0.44, ax: 0.5, ay: 0.94, art: Crown },
  { id: 'propeller', name: 'Propeller Cap', icon: '🧢', slot: 'head', wFrac: 0.5, ax: 0.5, ay: 0.86, art: Propeller },
  { id: 'party', name: 'Party Hat', icon: '🎉', slot: 'head', wFrac: 0.4, ax: 0.5, ay: 0.9, art: Party },
  { id: 'wizard', name: 'Wizard Hat', icon: '🧙', slot: 'head', wFrac: 0.52, ax: 0.5, ay: 0.78, art: Wizard },
  { id: 'shades', name: 'Sunglasses', icon: '🕶️', slot: 'eyes', wFrac: 0.42, ax: 0.5, ay: 0.5, art: Shades },
  { id: 'moustache', name: 'Moustache', icon: '🥸', slot: 'mouth', wFrac: 0.34, ax: 0.5, ay: 0.5, art: Moustache },
  { id: 'chain', name: 'Gold Chain', icon: '⛓️', slot: 'neck', wFrac: 0.4, ax: 0.5, ay: 0.18, art: Chain },
  { id: 'bowtie', name: 'Bow Tie', icon: '🎀', slot: 'neck', wFrac: 0.3, ax: 0.5, ay: 0.5, art: Bowtie },
  { id: 'cape', name: 'Cape', icon: '🦸', slot: 'back', wFrac: 0.72, ax: 0.5, ay: 0.04, art: Cape, behind: true },
  { id: 'wings', name: 'Wings', icon: '🪽', slot: 'back', wFrac: 0.95, ax: 0.5, ay: 0.42, art: Wings, behind: true },
  { id: 'gloves', name: 'Boxing Gloves', icon: '🥊', slot: 'handL', wFrac: 0.2, ax: 0.5, ay: 0.5, art: Glove },
  { id: 'sneakers', name: 'Stompers', icon: '👟', slot: 'feet', wFrac: 0.62, ax: 0.5, ay: 0.55, art: Sneakers },
];

export function gearDef(id: string): GearDef {
  const g = GEAR.find((x) => x.id === id);
  if (!g) throw new Error('unknown gear ' + id);
  return g;
}

void S;
