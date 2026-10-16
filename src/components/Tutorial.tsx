import { SPRITES, HD_SPRITES } from '../lib/sprites';

const STEPS = [
  { title: 'MEET OLIVER 👋', text: 'He runs FROM your cursor. Corner him and CLICK to catch. Every catch makes him faster + smaller. Misses make him cocky.' },
  { title: 'DRESS HIM 🎩', text: 'The wardrobe snaps to his body: hats on head, chains on neck, gloves on hands. Drag to fine-tune. Right-click any gear to remove it.' },
  { title: 'CHAOS METER 😤', text: 'Wild clicking fills CHAOS. At 100% he starts FUMING — back off, or keep poking for a full MELTDOWN. Never the same twice.' },
  { title: 'GAMES + WORLDS 🎮', text: '10 games live in the Games tab (Hoops, Pong, Maze, Snake…). GO 16-BIT swaps the whole world, sprites and lighting included.' },
];

export default function Tutorial({ bit16, step, onNext, onSkip }: {
  bit16: boolean; step: number; onNext: () => void; onSkip: () => void;
}) {
  const s = STEPS[Math.min(step, STEPS.length - 1)];
  const last = step >= STEPS.length - 1;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 flex items-end gap-2" style={{ zIndex: 150 }}>
      <img src={bit16 ? SPRITES['face-happy'] : HD_SPRITES['hd-face-happy']} alt="" draggable={false}
        className="w-16 h-16 pop-in hidden sm:block"
        style={{ imageRendering: bit16 ? 'pixelated' : 'auto', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.4))' }} />
      <div className="card-pop p-4 max-w-sm pop-in">
        <div className="font-display font-extrabold">{s.title}</div>
        <div className="text-sm font-bold opacity-80 mt-1">{s.text}</div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i <= step ? '#2B50E0' : '#ccc' }} />
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={onSkip} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold">SKIP</button>
          <button onClick={onNext} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-4 py-1.5 text-xs font-extrabold">{last ? "LET'S GO!" : 'NEXT ▶'}</button>
        </div>
      </div>
    </div>
  );
}

export function tourSeen(): boolean {
  try { return localStorage.getItem('oliver-tour-seen') === '1'; } catch { return true; }
}
export function markTourSeen() {
  try { localStorage.setItem('oliver-tour-seen', '1'); } catch { /* noop */ }
}
