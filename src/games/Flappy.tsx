import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onNotify: (t: string) => void;
  onFlap: () => void;
  onGameOver: (score: number) => void;
}

interface Pipe { x: number; gapY: number; scored: boolean }

export default function Flappy({ bit16, onNotify, onFlap, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('oliver-flappy-best') || 0));
  const S = useRef({
    W: 800, H: 500,
    by: 250, vy: 0,
    pipes: [] as Pipe[],
    t: 0, score: 0, over: false, dead: false, started: false,
    clouds: [] as { x: number; y: number; v: number }[],
    bird: null as HTMLImageElement | null,
  });

  const BX = () => S.current.W * 0.32;
  const GAP = 196;

  const start = useCallback(() => {
    const s = S.current;
    s.by = s.H / 2; s.vy = 0; s.pipes = []; s.t = 0; s.score = 0; s.over = false; s.dead = false; s.started = false;
    s.clouds = Array.from({ length: 8 }, () => ({ x: Math.random() * s.W, y: Math.random() * s.H * 0.7, v: 0.5 + Math.random() }));
    setScore(0);
    setPhase('play');
    onNotify('FLAP! Click / tap / SPACE. Thread the pipes!');
    sfx.whistle();
  }, [onNotify]);

  const flap = useCallback(() => {
    const s = S.current;
    if (s.over) return;
    s.started = true;
    s.vy = -7.8;
    onFlap();
    sfx.boing();
  }, [onFlap]);

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
    const b = new Image(); b.src = bit16 ? SPRITES['flap-16'] : HD_SPRITES['hd-fly']; S.current.bird = b;
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); flap(); }
    };
    window.addEventListener('keydown', kd);
    return () => { ro.disconnect(); window.removeEventListener('keydown', kd); };
  }, [bit16, flap]);

  const die = useCallback(() => {
    const s = S.current;
    if (s.over) return;
    s.over = true; s.dead = true;
    setBest((b) => {
      const nb = Math.max(b, s.score);
      localStorage.setItem('oliver-flappy-best', String(nb));
      return nb;
    });
    setPhase('over');
    sfx.splat();
    onGameOver(s.score);
  }, [onGameOver]);

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
      // hover in place until the first flap — no instant death
      if (!s.started) {
        s.by = s.H / 2 + Math.sin(s.t / 18) * 12;
        s.vy = 0;
      } else {
        // floaty, forgiving physics
        s.vy = Math.min(9, s.vy + 0.38);
        s.by += s.vy;
      }
      const speed = 2.8 + Math.min(1.8, s.score * 0.07);
      if (s.started && s.t % 88 === 0) {
        const margin = 80;
        s.pipes.push({ x: s.W + 40, gapY: margin + Math.random() * (s.H - margin * 2 - GAP), scored: false });
      }
      for (const p of s.pipes) p.x -= speed;
      s.pipes = s.pipes.filter((p) => p.x > -80);
      const bx = BX(), br = 20;
      // score
      for (const p of s.pipes) {
        if (!p.scored && p.x + 34 < bx - br) {
          p.scored = true; s.score += 1; setScore(s.score);
          sfx.coin();
        }
      }
      // collide
      if (s.by - br < 0 || s.by + br > s.H) { die(); return; }
      for (const p of s.pipes) {
        if (bx + br > p.x && bx - br < p.x + 68) {
          if (s.by - br < p.gapY || s.by + br > p.gapY + GAP) { die(); return; }
        }
      }
      for (const c of s.clouds) { c.x -= c.v; if (c.x < -60) { c.x = s.W + 40; c.y = Math.random() * s.H * 0.7; } }
      // ================= DRAW =================
      const sky = ctx.createLinearGradient(0, 0, 0, s.H);
      if (bit16) { sky.addColorStop(0, '#0b0830'); sky.addColorStop(1, '#2a1660'); }
      else { sky.addColorStop(0, '#7ec8f0'); sky.addColorStop(1, '#e8f7ff'); }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, s.W, s.H);
      // sun / moon
      ctx.fillStyle = bit16 ? '#FFD23F' : '#fff3b0';
      ctx.beginPath(); ctx.arc(s.W - 80, 80, bit16 ? 26 : 34, 0, 7); ctx.fill();
      if (bit16) { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke(); }
      // clouds / stars
      ctx.fillStyle = bit16 ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.9)';
      for (const c of s.clouds) {
        if (bit16) ctx.fillRect(c.x, c.y, 46, 12);
        else { ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, 7); ctx.arc(c.x + 16, c.y - 6, 12, 0, 7); ctx.fill(); }
      }
      // pipes
      const PW = 68;
      for (const p of s.pipes) {
        for (const [py, ph] of [[0, p.gapY], [p.gapY + GAP, s.H - p.gapY - GAP]] as const) {
          const g = ctx.createLinearGradient(p.x, 0, p.x + PW, 0);
          if (bit16) { g.addColorStop(0, '#2f8f3a'); g.addColorStop(0.5, '#5ce06e'); g.addColorStop(1, '#2f8f3a'); }
          else { g.addColorStop(0, '#3aa845'); g.addColorStop(0.5, '#7be382'); g.addColorStop(1, '#3aa845'); }
          ctx.fillStyle = g;
          ctx.fillRect(p.x, py, PW, ph);
          ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3;
          ctx.strokeRect(p.x, py, PW, ph);
          // lip
          ctx.fillStyle = bit16 ? '#5ce06e' : '#8ff09a';
          const lipY = py === 0 ? p.gapY - 16 : p.gapY + GAP;
          ctx.fillRect(p.x - 5, lipY, PW + 10, 16);
          ctx.strokeRect(p.x - 5, lipY, PW + 10, 16);
        }
      }
      // ground
      ctx.fillStyle = bit16 ? '#1d5c33' : '#8bd450';
      ctx.fillRect(0, s.H - 26, s.W, 26);
      ctx.fillStyle = bit16 ? '#C6F24E' : '#5da53a';
      ctx.fillRect(0, s.H - 26, s.W, 5);
      // bird Oliver
      const tilt = Math.max(-0.45, Math.min(0.6, s.vy * 0.07));
      ctx.save();
      ctx.translate(bx, s.by);
      ctx.rotate(tilt);
      const img = s.bird;
      const flapBob = Math.sin(s.t / 5) * 3;
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, -34, -26 + flapBob * 0.3, 68, 52);
      } else {
        // loading fallback: golden bird blob with attitude
        ctx.fillStyle = '#FFD23F';
        ctx.beginPath(); ctx.arc(0, 0, br, 0, 7); ctx.fill();
        ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#1e1b3a';
        ctx.beginPath(); ctx.arc(7, -5, 3.5, 0, 7); ctx.fill(); // eye
        ctx.fillStyle = '#FF6B5B';
        ctx.beginPath(); ctx.moveTo(br - 2, 0); ctx.lineTo(br + 10, 5); ctx.lineTo(br - 2, 9); ctx.fill(); // beak
      }
      ctx.restore();
      // HUD
      ctx.textAlign = 'center';
      ctx.font = '900 44px "Baloo 2", sans-serif';
      ctx.lineWidth = 7; ctx.strokeStyle = bit16 ? '#000' : '#1e1b3a';
      ctx.strokeText(String(s.score), s.W / 2, 70);
      ctx.fillStyle = '#fff';
      ctx.fillText(String(s.score), s.W / 2, 70);
      if (!s.started) {
        ctx.font = '900 20px "Baloo 2", sans-serif';
        ctx.globalAlpha = 0.7 + Math.sin(s.t / 12) * 0.3;
        ctx.strokeText('TAP / SPACE TO FLAP!', s.W / 2, s.H / 2 + 90);
        ctx.fillStyle = '#FFD23F';
        ctx.fillText('TAP / SPACE TO FLAP!', s.W / 2, s.H / 2 + 90);
        ctx.globalAlpha = 1;
      }
      try { (window as any).__flappy = { score: s.score, pipes: s.pipes.length, y: Math.round(s.by) }; } catch { /* noop */ }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bit16, die]);

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} onPointerDown={() => { if (phase === 'play') flap(); }} />
      {bit16 && <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 2px, transparent 2px 4px)' }} />}
      {phase !== 'play' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.55)', zIndex: 20 }}>
          <div className="card-pop p-6 text-center max-w-sm mx-4">
            <div className="font-display font-extrabold text-2xl">{phase === 'over' ? `SPLAT! ${score}` : 'FLAPPY OLIVER'}</div>
            <div className="text-sm font-bold opacity-70 my-2">
              {phase === 'over'
                ? `Best: ${Math.max(best, score)}. Pipes: 1, Oliver: 0.`
                : `Click / tap / SPACE to flap through the pipes. Best: ${best}`}
            </div>
            <button onClick={start} className="btn-3d bg-[#7BE0D4] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'FLAP AGAIN' : 'FLAP!'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
