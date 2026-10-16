import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onNotify: (t: string) => void;
  onGameOver: (score: number) => void;
}

interface Rock { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; verts: number[] }
interface Pick { x: number; y: number; vy: number; kind: 'cookie' | 'cig' }

export default function Rocket({ bit16, onNotify, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(() => Number(localStorage.getItem('oliver-rocket-best') || 0));
  const S = useRef({
    W: 800, H: 520,
    px: 400, py: 400, vx: 0, vy: 0,
    keys: {} as Record<string, boolean>,
    target: null as { x: number; y: number } | null,
    rocks: [] as Rock[],
    picks: [] as Pick[],
    parts: [] as { x: number; y: number; vx: number; vy: number; t: number; c: string }[],
    stars: [] as { x: number; y: number; v: number }[],
    t: 0, spawnT: 0, score: 0, lives: 3, iframes: 0, boost: 0, over: false,
    oli: null as HTMLImageElement | null,
  });

  const start = useCallback(() => {
    const s = S.current;
    s.px = s.W / 2; s.py = s.H - 120; s.vx = 0; s.vy = 0; s.target = null;
    s.rocks = []; s.picks = []; s.parts = [];
    s.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * s.W, y: Math.random() * s.H, v: 1 + Math.random() * 3 }));
    s.t = 0; s.spawnT = 0; s.score = 0; s.lives = 3; s.iframes = 0; s.boost = 0; s.over = false;
    setScore(0); setLives(3);
    setPhase('play');
    onNotify('DODGE ROCKS! 🍪 +1, 🚬 +3 & SPEED! 3 hits and you\'re space dust.');
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
    const o = new Image(); o.src = bit16 ? SPRITES['rocket-16'] : HD_SPRITES['hd-rocket']; S.current.oli = o;
    const kd = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { ro.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [bit16]);

  const spawnRock = (w: number) => {
    const s = S.current;
    const r = 16 + Math.random() * 26;
    s.rocks.push({
      x: Math.random() * w, y: -40, vx: (Math.random() - 0.5) * 1.6,
      vy: 1.6 + Math.random() * 2 + s.t / 3600, r,
      rot: Math.random() * 7, vr: (Math.random() - 0.5) * 0.06,
      verts: Array.from({ length: 9 }, () => 0.75 + Math.random() * 0.35),
    });
  };

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
      const diff = 1 + s.t / 2400;
      // --- input ---
      const k = s.keys;
      const ax = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
      const ay = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);
      const acc = s.boost > 0 ? 0.9 : 0.55;
      s.vx = s.vx * 0.92 + ax * acc;
      s.vy = s.vy * 0.92 + ay * acc;
      if (s.target) {
        s.vx += (s.target.x - s.px) * 0.03;
        s.vy += (s.target.y - s.py) * 0.03;
      }
      const mc = 9 + (s.boost > 0 ? 4 : 0);
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > mc) { s.vx *= mc / sp; s.vy *= mc / sp; }
      s.px = Math.max(24, Math.min(s.W - 24, s.px + s.vx));
      s.py = Math.max(60, Math.min(s.H - 24, s.py + s.vy));
      if (s.boost > 0) s.boost--;
      if (s.iframes > 0) s.iframes--;
      // flame particles
      s.parts.push({ x: s.px + (Math.random() - 0.5) * 10, y: s.py + 34, vx: (Math.random() - 0.5) * 2, vy: 3 + Math.random() * 3, t: 26, c: ['#FFD23F', '#FF9B2B', '#FF6B5B'][Math.floor(Math.random() * 3)] });
      s.parts = s.parts.filter((p) => { p.x += p.vx; p.y += p.vy; return --p.t > 0; });
      // --- spawns ---
      s.spawnT--;
      if (s.spawnT <= 0) {
        s.spawnT = Math.max(14, 42 - s.t / 90);
        spawnRock(s.W);
        if (Math.random() < 0.5) s.picks.push({ x: Math.random() * s.W, y: -20, vy: 1.6, kind: 'cookie' });
        if (Math.random() < 0.12) s.picks.push({ x: Math.random() * s.W, y: -20, vy: 1.4, kind: 'cig' });
      }
      for (const r of s.rocks) { r.x += r.vx; r.y += r.vy; r.rot += r.vr; }
      s.rocks = s.rocks.filter((r) => r.y < s.H + 60);
      for (const p of s.picks) p.y += p.vy;
      s.picks = s.picks.filter((p) => p.y < s.H + 30);
      // --- pickups ---
      s.picks = s.picks.filter((p) => {
        if (Math.hypot(p.x - s.px, p.y - s.py) < 34) {
          if (p.kind === 'cookie') { s.score += 1; sfx.coin(); }
          else { s.score += 3; s.boost = 220; sfx.levelup(); onNotify('SMOKE BREAK = SPEED! 💨'); }
          setScore(s.score);
          return false;
        }
        return true;
      });
      // --- collisions ---
      if (s.iframes <= 0) {
        for (const r of s.rocks) {
          if (Math.hypot(r.x - s.px, r.y - s.py) < r.r + 16) {
            s.lives -= 1; setLives(s.lives);
            s.iframes = 100;
            sfx.splat();
            for (let i = 0; i < 16; i++) s.parts.push({ x: s.px, y: s.py, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7, t: 30, c: '#FF6B5B' });
            if (s.lives <= 0) {
              s.over = true;
              const final = s.score + Math.floor(s.t / 60);
              setScore(final);
              setBest((b) => { const nb = Math.max(b, final); localStorage.setItem('oliver-rocket-best', String(nb)); return nb; });
              setPhase('over');
              sfx.rage();
              onGameOver(final);
              return;
            } else onNotify(`${s.lives} ${s.lives === 1 ? 'HIT' : 'HITS'} LEFT!`);
            break;
          }
        }
      }
      // ================= DRAW =================
      const bg = ctx.createLinearGradient(0, 0, 0, s.H);
      if (bit16) { bg.addColorStop(0, '#05031a'); bg.addColorStop(1, '#1a1050'); }
      else { bg.addColorStop(0, '#0b1035'); bg.addColorStop(1, '#3b2a6e'); }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, s.W, s.H);
      // parallax stars
      ctx.fillStyle = '#fff';
      for (const st of s.stars) {
        st.y += st.v * diff * 0.6;
        if (st.y > s.H) { st.y = 0; st.x = Math.random() * s.W; }
        ctx.globalAlpha = 0.4 + (st.v / 4) * 0.6;
        ctx.fillRect(st.x, st.y, st.v > 2.5 ? 3 : 2, st.v > 2.5 ? 3 : 2);
      }
      ctx.globalAlpha = 1;
      // pickups
      ctx.textAlign = 'center';
      for (const p of s.picks) {
        const bob = Math.sin((s.t + p.x) / 14) * 3;
        ctx.font = '26px serif';
        ctx.fillText(p.kind === 'cookie' ? '🍪' : '🚬', p.x, p.y + bob + 8);
        if (p.kind === 'cig') {
          ctx.fillStyle = 'rgba(200,200,200,.5)';
          ctx.fillRect(p.x + 6, p.y + bob - 14, 3, 10);
        }
      }
      // asteroids (shader-ish: dark rock + rim light)
      for (const r of s.rocks) {
        ctx.save();
        ctx.translate(r.x, r.y); ctx.rotate(r.rot);
        ctx.beginPath();
        r.verts.forEach((v, i) => {
          const a = (i / r.verts.length) * Math.PI * 2;
          const px = Math.cos(a) * r.r * v, py = Math.sin(a) * r.r * v;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.closePath();
        const rg = ctx.createRadialGradient(-r.r * 0.3, -r.r * 0.3, 2, 0, 0, r.r * 1.2);
        rg.addColorStop(0, bit16 ? '#8a7bd8' : '#9a8fc8');
        rg.addColorStop(1, '#241d4e');
        ctx.fillStyle = rg; ctx.fill();
        ctx.strokeStyle = bit16 ? '#C6F24E' : '#1e1b3a'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.beginPath(); ctx.arc(r.r * 0.25, r.r * 0.2, r.r * 0.22, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(-r.r * 0.2, r.r * 0.35, r.r * 0.15, 0, 7); ctx.fill();
        ctx.restore();
      }
      // flame
      for (const p of s.parts) {
        ctx.globalAlpha = Math.min(1, p.t / 14);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      // Oliver rocket pilot (blink during i-frames)
      if (!(s.iframes > 0 && Math.floor(s.t / 5) % 2 === 0)) {
        const oi = s.oli;
        ctx.save();
        ctx.translate(s.px, s.py);
        ctx.rotate(Math.max(-0.5, Math.min(0.5, s.vx * 0.06 - 0.35)));
        if (oi && oi.complete) {
          const rw = 96, rh = 64;
          ctx.drawImage(oi, -rw / 2, -rh / 2, rw, rh);
        }
        else { ctx.fillStyle = '#2B50E0'; ctx.fillRect(-14, -30, 28, 56); }
        ctx.restore();
      }
      // boost aura
      if (s.boost > 0) {
        ctx.strokeStyle = '#C6F24E'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.px, s.py, 34 + Math.sin(s.t / 4) * 4, 0, 7); ctx.stroke();
      }
      // HUD
      ctx.textAlign = 'left';
      ctx.font = '900 17px "Baloo 2", sans-serif';
      ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      const hud = `SCORE ${s.score + Math.floor(s.t / 60)}   ${'❤️'.repeat(s.lives)}${'🖤'.repeat(Math.max(0, 3 - s.lives))}`;
      ctx.strokeText(hud, 12, 26); ctx.fillText(hud, 12, 26);
      try { (window as any).__rocket = { score: s.score, lives: s.lives, rocks: s.rocks.length, y: Math.round(s.py) }; } catch { /* noop */ }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bit16, onNotify, onGameOver]);

  const steer = (e: React.PointerEvent) => {
    if (phase !== 'play') return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    S.current.target = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} onPointerMove={steer} onPointerDown={steer} />
      {phase !== 'play' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.55)', zIndex: 20 }}>
          <div className="card-pop p-6 text-center max-w-sm mx-4">
            <div className="font-display font-extrabold text-2xl">{phase === 'over' ? `SPACE DUST: ${score}` : 'ROCKET OLIVER'}</div>
            <div className="text-sm font-bold opacity-70 my-2">
              {phase === 'over'
                ? `Best: ${Math.max(best, score)}. The asteroids remain undefeated… probably.`
                : `Arrows/WASD or drag. Dodge rocks (3 hits = boom), grab 🍪 +1 and 🚬 +3 with a speed rush. Best: ${best}`}
            </div>
            <button onClick={start} className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'FLY AGAIN' : 'LAUNCH'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
