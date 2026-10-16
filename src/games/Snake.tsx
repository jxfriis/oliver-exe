import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onNotify: (t: string) => void;
  onEat: () => void;
  onGameOver: (score: number) => void;
}

const N = 21;

export default function Snake({ bit16, onNotify, onEat, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('oliver-snake-best') || 0));
  const S = useRef({
    W: 800, H: 500, cell: 24, ox: 0, oy: 0,
    snake: [{ x: 10, y: 10 }] as { x: number; y: number }[],
    dir: { x: 1, y: 0 }, next: { x: 1, y: 0 },
    food: { x: 14, y: 10, kind: 'cookie' as 'cookie' | 'cig' },
    tick: 0, acc: 0, last: 0,
    head: null as HTMLImageElement | null,
    touch: null as { x: number; y: number } | null,
  });

  const start = useCallback(() => {
    const s = S.current;
    s.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    s.dir = { x: 1, y: 0 }; s.next = { x: 1, y: 0 };
    s.tick = 0; s.acc = 0; s.last = performance.now();
    placeFood();
    setScore(0);
    setPhase('play');
    onNotify('SNAKE OLIVER! Eat cookies, dodge yourself. Arrows/WASD, swipe, or the pad.');
    sfx.whistle();
  }, [onNotify]);

  function placeFood() {
    const s = S.current;
    const free: { x: number; y: number }[] = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      if (!s.snake.some((c) => c.x === x && c.y === y)) free.push({ x, y });
    if (!free.length) return;
    const c = free[Math.floor(Math.random() * free.length)];
    s.food = { ...c, kind: Math.random() < 0.14 ? 'cig' : 'cookie' };
  }

  const die = useCallback(() => {
    const s = S.current;
    setPhase('over');
    setBest((b) => {
      const nb = Math.max(b, s.tick);
      localStorage.setItem('oliver-snake-best', String(nb));
      return nb;
    });
    sfx.splat();
    onGameOver(s.tick);
  }, [onGameOver]);

  const step = useCallback(() => {
    const s = S.current;
    // no 180° turns
    if (!(s.next.x === -s.dir.x && s.next.y === -s.dir.y)) s.dir = s.next;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) { die(); return; }
    const eats = head.x === s.food.x && head.y === s.food.y;
    const body = eats ? s.snake : s.snake.slice(0, -1);
    if (body.some((c) => c.x === head.x && c.y === head.y)) { die(); return; }
    s.snake.unshift(head);
    if (eats) {
      const pts = s.food.kind === 'cookie' ? 1 : 3;
      s.tick += pts;
      setScore(s.tick);
      if (s.food.kind === 'cookie') sfx.coin(); else sfx.levelup();
      onEat();
      placeFood();
    } else {
      s.snake.pop();
    }
  }, [die, onEat]);

  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      const s = S.current;
      s.W = r.width; s.H = r.height;
      s.cell = Math.min(r.width, r.height) / (N + 1);
      s.ox = (r.width - s.cell * N) / 2; s.oy = (r.height - s.cell * N) / 2;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const h = new Image(); h.src = bit16 ? SPRITES['snake-16'] : HD_SPRITES['hd-snake']; S.current.head = h;
    const setDir = (x: number, y: number) => { S.current.next = { x, y }; };
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') setDir(0, -1);
      else if (k === 'arrowdown' || k === 's') setDir(0, 1);
      else if (k === 'arrowleft' || k === 'a') setDir(-1, 0);
      else if (k === 'arrowright' || k === 'd') setDir(1, 0);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', kd);
    return () => { ro.disconnect(); window.removeEventListener('keydown', kd); };
  }, [bit16]);

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const dt = Math.min(100, now - (s.last || now));
      s.last = now;
      s.acc += dt;
      const interval = Math.max(70, 150 - s.tick * 2.2);
      while (s.acc >= interval) { s.acc -= interval; step(); if (phase !== 'play') return; }
      // ================= DRAW =================
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.fillStyle = bit16 ? '#0b0830' : '#17351f';
      ctx.fillRect(0, 0, s.W, s.H);
      // board
      const bx = s.ox, by = s.oy, bs = s.cell * N;
      ctx.fillStyle = bit16 ? '#141040' : '#1e4d2a';
      ctx.fillRect(bx, by, bs, bs);
      ctx.fillStyle = bit16 ? 'rgba(198,242,78,.06)' : 'rgba(255,255,255,.05)';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
        if ((x + y) % 2 === 0) ctx.fillRect(bx + x * s.cell, by + y * s.cell, s.cell, s.cell);
      ctx.strokeStyle = bit16 ? '#C6F24E' : '#e8f7ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx - 2, by - 2, bs + 4, bs + 4);
      const X = (cx: number) => bx + cx * s.cell, Y = (cy: number) => by + cy * s.cell;
      // food
      ctx.font = `${Math.round(s.cell * 0.8)}px serif`; ctx.textAlign = 'center';
      ctx.fillText(s.food.kind === 'cookie' ? '🍪' : '🚬', X(s.food.x) + s.cell / 2, Y(s.food.y) + s.cell * 0.82);
      // body (tail → neck)
      for (let i = s.snake.length - 1; i >= 1; i--) {
        const c = s.snake[i];
        const fade = 1 - (i / s.snake.length) * 0.45;
        ctx.fillStyle = bit16 ? `rgba(150,110,220,${fade})` : `rgba(70,110,220,${fade})`;
        ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 2;
        const pad = s.cell * 0.08;
        ctx.beginPath();
        ctx.roundRect(X(c.x) + pad, Y(c.y) + pad, s.cell - pad * 2, s.cell - pad * 2, 6);
        ctx.fill(); ctx.stroke();
        // scale dots
        ctx.fillStyle = bit16 ? 'rgba(230,210,255,.5)' : 'rgba(220,235,255,.55)';
        ctx.beginPath();
        ctx.arc(X(c.x) + s.cell / 2, Y(c.y) + s.cell / 2, s.cell * 0.12, 0, 7);
        ctx.fill();
      }
      // head = Oliver-snake portrait, rotated to direction
      const h0 = s.snake[0];
      const ang = s.dir.x === 1 ? 0 : s.dir.x === -1 ? Math.PI : s.dir.y === 1 ? Math.PI / 2 : -Math.PI / 2;
      ctx.save();
      ctx.translate(X(h0.x) + s.cell / 2, Y(h0.y) + s.cell / 2);
      ctx.rotate(ang);
      const img = s.head;
      const hs = s.cell * 1.9;
      if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -hs / 2, -hs / 2, hs, hs);
      else { ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(0, 0, s.cell * 0.45, 0, 7); ctx.fill(); }
      ctx.restore();
      // HUD
      ctx.textAlign = 'left';
      ctx.font = '900 17px "Baloo 2", sans-serif';
      ctx.fillStyle = bit16 ? '#FFD23F' : '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      const hud = `🐍 ${s.tick}   BEST ${Math.max(best, s.tick)}`;
      ctx.strokeText(hud, 12, 26); ctx.fillText(hud, 12, 26);
      try { (window as any).__snake = { score: s.tick, len: s.snake.length, head: s.snake[0] }; } catch { /* noop */ }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bit16, step, die, best]);

  const swipe = (e: React.PointerEvent) => {
    const s = S.current;
    if (phase !== 'play') return;
    if (e.type === 'pointerdown') {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      s.touch = { x: e.clientX - r.left, y: e.clientY - r.top };
    } else if (s.touch) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dx = (e.clientX - r.left) - s.touch.x, dy = (e.clientY - r.top) - s.touch.y;
      if (Math.hypot(dx, dy) > 24) {
        s.next = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
        s.touch = null;
      }
    }
  };

  const pad = (x: number, y: number) => () => { S.current.next = { x, y }; };

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} onPointerDown={swipe} onPointerMove={swipe} />
      {phase === 'play' && (
        <div className="absolute bottom-2 right-2 grid grid-cols-3 gap-1" style={{ zIndex: 10 }}>
          {[['▲', 0, -1], ['◀', -1, 0], ['▼', 0, 1], ['▶', 1, 0]].map(([l, x, y], i) => (
            <button key={i} onPointerDown={(e) => { e.stopPropagation(); pad(x as number, y as number)(); }}
              className="btn-3d bg-white/85 border-2 border-[#1e1b3a] w-11 h-11 font-extrabold"
              style={{ gridColumnStart: l === '▲' ? 2 : l === '◀' ? 1 : l === '▼' ? 2 : 3, gridRowStart: l === '▲' ? 1 : 2 }}>{l}</button>
          ))}
        </div>
      )}
      {phase !== 'play' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.55)', zIndex: 20 }}>
          <div className="card-pop p-6 text-center max-w-sm mx-4">
            <div className="font-display font-extrabold text-2xl">{phase === 'over' ? `TANGLED! ${score}` : 'SNAKE OLIVER'}</div>
            <div className="text-sm font-bold opacity-70 my-2">
              {phase === 'over'
                ? `Best: ${Math.max(best, score)}. He ate himself. Classic.`
                : `Oliver-snake eats 🍪 (+1) and 🚬 (+3). Walls and tail are lava. Best: ${best}`}
            </div>
            <button onClick={start} className="btn-3d bg-[#B9A7F9] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'SLITHER AGAIN' : 'START'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
