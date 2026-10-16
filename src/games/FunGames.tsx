import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES } from '../lib/sprites';

// ---------- COIN DASH: steer walking Oliver, grab coins, 30 seconds ----------
export function CoinDash({ bit16, onNotify, onCoin, onFinish }: { bit16: boolean; onNotify: (t: string) => void; onCoin: () => void; onFinish?: (coins: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [coins, setCoins] = useState(0);
  const [time, setTime] = useState(30);
  const S = useRef({
    W: 800, H: 500, px: 400, py: 250, vx: 0, vy: 0,
    keys: {} as Record<string, boolean>,
    drops: [] as { x: number; y: number; kind: 'coin' | 'sock' }[],
    t: 0, dist: 0, a: null as HTMLImageElement | null, b: null as HTMLImageElement | null,
    over: false,
  });

  const start = useCallback(() => {
    const s = S.current;
    setCoins(0); setTime(30);
    s.px = s.W / 2; s.py = s.H / 2; s.vx = 0; s.vy = 0; s.drops = []; s.t = 0; s.dist = 0; s.over = false;
    setPhase('play');
    onNotify('GRAB COINS! Avoid the stinky socks. Arrows/WASD or drag.');
    sfx.whistle();
  }, [onNotify]);

  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      S.current.W = r.width; S.current.H = r.height;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const a = new Image(); a.src = SPRITES['walk-right-a']; S.current.a = a;
    const b = new Image(); b.src = SPRITES['walk-right-b']; S.current.b = b;
    const kd = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { ro.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useEffect(() => {
    if (phase !== 'play') return;
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          S.current.over = true;
          setPhase('over');
          sfx.yay();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'over') onFinish?.(coins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      if (s.over) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      s.t++;
      // movement
      const k = s.keys;
      const ax = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
      const ay = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);
      s.vx = s.vx * 0.88 + ax * 0.9;
      s.vy = s.vy * 0.88 + ay * 0.9;
      s.px = Math.max(30, Math.min(s.W - 30, s.px + s.vx));
      s.py = Math.max(50, Math.min(s.H - 30, s.py + s.vy));
      s.dist += Math.abs(s.vx) + Math.abs(s.vy);
      // spawn drops
      if (s.t % 34 === 0 && s.drops.length < 9) {
        s.drops.push({
          x: 40 + Math.random() * (s.W - 80), y: 70 + Math.random() * (s.H - 120),
          kind: Math.random() < 0.22 ? 'sock' : 'coin',
        });
      }
      // collect
      s.drops = s.drops.filter((d) => {
        if (Math.hypot(d.x - s.px, d.y - s.py) < 38) {
          if (d.kind === 'coin') { setCoins((c) => c + 1); onCoin(); sfx.coin(); }
          else {
            setCoins((c) => Math.max(0, c - 2)); sfx.splat();
            onNotify('STINKY SOCK! −2');
          }
          return false;
        }
        return true;
      });
      // draw
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.fillStyle = bit16 ? '#0e2a1a' : 'rgba(198,242,78,.18)';
      ctx.fillRect(0, 0, s.W, s.H);
      // pixel grass tufts
      ctx.fillStyle = bit16 ? '#1d5c33' : 'rgba(43,80,224,.15)';
      for (let i = 0; i < 24; i++) {
        const gx = (i * 137) % s.W, gy = 60 + ((i * 89) % (s.H - 80));
        ctx.fillRect(gx, gy, 6, 3);
      }
      for (const d of s.drops) {
        const bob = Math.sin((s.t + d.x) / 18) * 4;
        if (d.kind === 'coin') {
          ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(d.x, d.y + bob, 13, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#1e1b3a'; ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('O', d.x, d.y + bob + 5);
        } else {
          ctx.font = '24px serif'; ctx.textAlign = 'center';
          ctx.fillText('🧦', d.x, d.y + bob + 8);
        }
      }
      // oliver walk cycle
      const img = Math.floor(s.dist / 40) % 2 === 0 ? s.a : s.b;
      ctx.save();
      if (s.vx < -0.3) { ctx.translate(s.px, 0); ctx.scale(-1, 1); ctx.translate(-s.px, 0); }
      if (img && img.complete) ctx.drawImage(img, s.px - 30, s.py - 68, 60, 80);
      else { ctx.fillStyle = '#2B50E0'; ctx.fillRect(s.px - 15, s.py - 60, 30, 60); }
      ctx.restore();
      // HUD
      ctx.fillStyle = bit16 ? '#fff' : '#1e1b3a';
      ctx.font = '900 20px "Baloo 2", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`🪙 ${coins}   ⏱ ${time}s`, 14, 32);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bit16, coins, time]);

  const dragMove = (e: React.PointerEvent) => {
    if (phase !== 'play') return;
    const s = S.current;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tx = e.clientX - r.left, ty = e.clientY - r.top;
    s.vx += (tx - s.px) * 0.02; s.vy += (ty - s.py) * 0.02;
  };

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} onPointerMove={dragMove} onPointerDown={dragMove} />
      {phase !== 'play' && (
        <GameOverlay title={phase === 'over' ? `${coins} COINS!` : 'COIN DASH'}
          sub={phase === 'over' ? (coins >= 15 ? 'Certified coin goblin 🪙' : 'The socks remain undefeated…') : 'Steer Oliver with arrows/WASD or drag. Coins +1, socks −2. 30 seconds.'}>
          <button onClick={start} className="btn-3d bg-[#FFD23F] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'DASH AGAIN' : 'START'}</button>
        </GameOverlay>
      )}
    </div>
  );
}

// ---------- WHACK-AN-OLIVER: bonk happy (+1), spare angry (−2) ----------
export function WhackOliver({ onNotify, onBonk }: { onNotify: (t: string) => void; onBonk: (good: boolean) => void }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [holes, setHoles] = useState<(null | { angry: boolean; id: number })[]>(Array(9).fill(null));
  const idRef = useRef(0);

  const start = useCallback(() => {
    setScore(0); setTime(20); setHoles(Array(9).fill(null));
    setPhase('play');
    onNotify('BONK the happy ones! The angry one bites (−2)!');
    sfx.whistle();
  }, [onNotify]);

  useEffect(() => {
    if (phase !== 'play') return;
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setPhase('over');
          sfx.yay();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    const pop = setInterval(() => {
      setHoles((hs) => {
        const n = [...hs];
        const empties = n.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0);
        if (!empties.length) return n;
        const i = empties[Math.floor(Math.random() * empties.length)];
        const angry = Math.random() < 0.3;
        const id = ++idRef.current;
        n[i] = { angry, id };
        setTimeout(() => {
          setHoles((hh) => {
            const m = [...hh];
            if (m[i]?.id === id) m[i] = null;
            return m;
          });
        }, angry ? 900 : 1100);
        return n;
      });
    }, 620);
    return () => { clearInterval(timer); clearInterval(pop); };
  }, [phase]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 overflow-auto">
      <div className="font-display font-extrabold text-xl">🔨 WHACK-AN-OLIVER — {score} pts • {time}s</div>
      {phase === 'play' ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {holes.map((h, i) => (
            <button key={i}
              onClick={() => {
                if (!h) return;
                if (h.angry) { setScore((s) => Math.max(0, s - 2)); onBonk(false); sfx.splat(); onNotify('OW! That one bites! −2'); }
                else { setScore((s) => s + 1); onBonk(true); sfx.pop(); }
                setHoles((hh) => { const m = [...hh]; m[i] = null; return m; });
              }}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-[3px] border-[#1e1b3a] bg-white/70 flex items-center justify-center overflow-hidden btn-squash"
              style={{ background: h ? (h.angry ? '#FF6B5B55' : '#C6F24E55') : 'rgba(255,255,255,.4)' }}>
              {h && (
                <img src={h.angry ? SPRITES['face-angry'] : SPRITES['face-happy']} alt=""
                  className="w-16 h-16 md:w-20 md:h-20 pop-in" draggable={false}
                  style={{ imageRendering: 'pixelated' }} />
              )}
            </button>
          ))}
        </div>
      ) : (
        <GameOverlay title={phase === 'over' ? `BONKED: ${score}` : 'WHACK-AN-OLIVER'}
          sub={phase === 'over' ? (score >= 12 ? 'Professional bonker 🔨' : 'The Olivers forgive you.') : 'Happy face +1, angry face −2. 20 seconds. Go go go.'}>
          <button onClick={start} className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'BONK AGAIN' : 'START'}</button>
        </GameOverlay>
      )}
    </div>
  );
}

export function GameOverlay({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.45)', zIndex: 20 }}>
      <div className="card-pop p-6 text-center max-w-sm mx-4">
        <div className="font-display font-extrabold text-2xl">{title}</div>
        <div className="text-sm font-bold opacity-70 my-2">{sub}</div>
        {children}
      </div>
    </div>
  );
}
