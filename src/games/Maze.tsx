import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onNotify: (t: string) => void;
  onWin: (secs: number, level: number) => void;
}

const LEVELS = [
  { cols: 15, rows: 11, cookies: 4, guards: 0, name: 'BASEMENT' },
  { cols: 19, rows: 13, cookies: 6, guards: 1, name: 'CATACOMBS' },
  { cols: 23, rows: 15, cookies: 8, guards: 2, name: 'THE VOID' },
];

interface Guard { x: number; y: number; tx: number; ty: number; cool: number; speed: number }

// recursive-backtracker maze: true = wall
function genMaze(cols: number, rows: number): boolean[][] {
  const g: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(true));
  const stack: [number, number][] = [[1, 1]];
  g[1][1] = false;
  const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const opts = dirs
      .map(([dx, dy]) => [cx + dx, cy + dy, cx + dx / 2, cy + dy / 2] as const)
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && g[ny][nx]);
    if (!opts.length) { stack.pop(); continue; }
    const [nx, ny, wx, wy] = opts[Math.floor(Math.random() * opts.length)];
    g[wy][wx] = false; g[ny][nx] = false;
    stack.push([nx, ny]);
  }
  // a few loops so it never feels unfair
  for (let i = 0; i < cols; i++) {
    const x = 1 + Math.floor(Math.random() * (cols - 2));
    const y = 1 + Math.floor(Math.random() * (rows - 2));
    g[y][x] = false;
  }
  g[1][1] = false; g[rows - 2][cols - 2] = false;
  return g;
}

function openCells(g: boolean[][]): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 1; y < g.length - 1; y++)
    for (let x = 1; x < g[0].length - 1; x++)
      if (!g[y][x] && !(x <= 2 && y <= 2)) out.push([x, y]);
  return out;
}

export default function Maze({ bit16, onNotify, onWin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [level, setLevel] = useState(0);
  const [time, setTime] = useState(0);
  const [cookiesLeft, setCookiesLeft] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('oliver-maze-best') || 0));
  const S = useRef({
    W: 800, H: 520, grid: [] as boolean[][], cols: 15, rows: 11,
    cell: 30, ox: 0, oy: 0,
    px: 0, py: 0, vx: 0, vy: 0,
    keys: {} as Record<string, boolean>,
    target: null as { x: number; y: number } | null,
    cookies: [] as { x: number; y: number }[],
    guards: [] as Guard[],
    torches: [] as { x: number; y: number; ph: number }[],
    fog: [] as { x: number; y: number; v: number; s: number }[],
    t: 0, startT: 0, done: false,
    phaseStr: 'ready',
    oli: null as HTMLImageElement | null,
    angry: null as HTMLImageElement | null,
  });

  const startLevel = useCallback((lv: number) => {
    const s = S.current;
    const L = LEVELS[lv];
    const grid = genMaze(L.cols, L.rows);
    s.grid = grid; s.cols = L.cols; s.rows = L.rows;
    const cells = openCells(grid);
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    s.cookies = shuffled.slice(0, L.cookies).map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
    s.torches = shuffled.slice(L.cookies, L.cookies + 7).map(([x, y], i) => ({ x: x + 0.5, y: y + 0.5, ph: i * 1.3 }));
    s.guards = Array.from({ length: L.guards }, (_, i) => {
      const [gx, gy] = shuffled[(L.cookies + 8 + i * 3) % shuffled.length];
      return { x: gx + 0.5, y: gy + 0.5, tx: gx + 0.5, ty: gy + 0.5, cool: 20 + i * 25, speed: 0.035 + lv * 0.008 };
    });
    s.fog = Array.from({ length: 26 }, () => ({ x: Math.random() * L.cols, y: Math.random() * L.rows, v: 0.004 + Math.random() * 0.01, s: 20 + Math.random() * 40 }));
    s.px = 1.5; s.py = 1.5; s.vx = 0; s.vy = 0; s.target = null;
    s.t = 0; s.done = false; s.startT = Date.now(); s.phaseStr = 'play';
    setCookiesLeft(L.cookies);
    setTime(0);
    setPhase('play');
    onNotify(`${L.name}: grab ${L.cookies} cookies, then escape!`);
    sfx.whistle();
  }, [onNotify]);

  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(300, r.width * dpr); cv.height = Math.max(300, r.height * dpr);
      S.current.W = r.width; S.current.H = r.height;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const o = new Image(); o.src = bit16 ? SPRITES['walk-right-a'] : HD_SPRITES['hd-walk-right-a']; S.current.oli = o;
    const a = new Image(); a.src = bit16 ? SPRITES['face-angry'] : HD_SPRITES['hd-face-angry']; S.current.angry = a;
    const kd = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { S.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { ro.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [bit16]);

  useEffect(() => {
    if (phase !== 'play') return;
    const timer = setInterval(() => setTime((Date.now() - S.current.startT) / 1000), 200);
    return () => clearInterval(timer);
  }, [phase]);

  const solidAt = (cx: number, cy: number) => {
    const s = S.current;
    if (cx < 0 || cy < 0 || cx >= s.cols || cy >= s.rows) return true;
    return s.grid[cy][cx];
  };

  const tryMove = (nx: number, ny: number, r: number) => {
    // axis-separated circle-vs-grid
    const s = S.current;
    const ok = (x: number, y: number) => {
      for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]] as const) {
        if (solidAt(Math.floor(x + ox), Math.floor(y + oy))) return false;
      }
      return true;
    };
    if (ok(nx, s.py)) s.px = nx;
    if (ok(s.px, ny)) s.py = ny;
  };

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      if (s.done || !s.grid.length) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      s.t++;
      const cell = Math.min(s.W / s.cols, s.H / s.rows);
      s.cell = cell;
      s.ox = (s.W - cell * s.cols) / 2; s.oy = (s.H - cell * s.rows) / 2;
      const X = (cx: number) => s.ox + cx * cell, Y = (cy: number) => s.oy + cy * cell;
      // --- movement ---
      const k = s.keys;
      const ax = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
      const ay = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);
      const SP = 0.055;
      s.vx = s.vx * 0.82 + ax * SP;
      s.vy = s.vy * 0.82 + ay * SP;
      if (s.target) {
        s.vx += (s.target.x - s.px) * 0.012;
        s.vy += (s.target.y - s.py) * 0.012;
        if (Math.hypot(s.target.x - s.px, s.target.y - s.py) < 0.15) s.target = null;
      }
      const spd = Math.hypot(s.vx, s.vy), max = 0.075;
      if (spd > max) { s.vx *= max / spd; s.vy *= max / spd; }
      tryMove(s.px + s.vx, s.py + s.vy, 0.22);
      // --- cookies ---
      s.cookies = s.cookies.filter((c) => {
        if (Math.hypot(c.x - s.px, c.y - s.py) < 0.4) {
          sfx.coin(); setCookiesLeft((n) => n - 1);
          return false;
        }
        return true;
      });
      // --- guards ---
      for (const g of s.guards) {
        // wander open corridors cell by cell
        g.cool--;
        if (g.cool <= 0) {
          g.cool = 45 + Math.random() * 50;
          const cx = Math.floor(g.tx), cy = Math.floor(g.ty);
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            .map(([dx, dy]) => [cx + dx, cy + dy] as const)
            .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < s.cols && ny < s.rows && !s.grid[ny][nx]);
          if (opts.length) {
            const [nx, ny] = opts[Math.floor(Math.random() * opts.length)];
            g.tx = nx + 0.5; g.ty = ny + 0.5;
          }
        }
        g.x += (g.tx - g.x) * g.speed * 2;
        g.y += (g.ty - g.y) * g.speed * 2;
        if (Math.hypot(g.x - s.px, g.y - s.py) < 0.45) {
          s.px = 1.5; s.py = 1.5; s.vx = 0; s.vy = 0;
          s.startT += 5000;
          sfx.splat(); onNotify('CAUGHT BY THE GRUMP! +5s');
        }
      }
      // --- exit ---
      const ex = s.cols - 1.5, ey = s.rows - 1.5;
      if (s.cookies.length === 0 && Math.hypot(ex - s.px, ey - s.py) < 0.5) {
        s.done = true;
        s.phaseStr = 'over';
        const secs = (Date.now() - s.startT) / 1000;
        setBest((b) => {
          const nb = b === 0 ? secs : Math.min(b, secs);
          localStorage.setItem('oliver-maze-best', String(nb));
          return nb;
        });
        setPhase('over');
        sfx.levelup();
        onWin(secs, level);
        return;
      }
      // ================= DRAW =================
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.fillStyle = bit16 ? '#0b0830' : '#241d4e';
      ctx.fillRect(0, 0, s.W, s.H);
      // floor
      for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
        if (s.grid[y][x]) continue;
        ctx.fillStyle = (x + y) % 2 ? (bit16 ? '#17124a' : '#2e2560') : (bit16 ? '#141040' : '#2a2258');
        ctx.fillRect(X(x), Y(y), cell + 0.5, cell + 0.5);
      }
      // walls with bevel
      for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
        if (!s.grid[y][x]) continue;
        ctx.fillStyle = bit16 ? '#3b2f8f' : '#4a3f9e';
        ctx.fillRect(X(x), Y(y), cell + 0.5, cell + 0.5);
        ctx.fillStyle = bit16 ? '#6f5df0' : '#8f80ff';
        ctx.fillRect(X(x), Y(y), cell + 0.5, 3);
        ctx.fillStyle = bit16 ? '#241d66' : '#332a72';
        ctx.fillRect(X(x), Y(y) + cell - 3, cell + 0.5, 3);
      }
      // exit portal
      const pulse = 0.6 + Math.sin(s.t / 14) * 0.4;
      const eg = ctx.createRadialGradient(X(ex), Y(ey), 2, X(ex), Y(ey), cell * (1.2 + pulse * 0.5));
      eg.addColorStop(0, '#C6F24E'); eg.addColorStop(1, 'transparent');
      ctx.fillStyle = eg;
      ctx.fillRect(X(ex) - cell * 2, Y(ey) - cell * 2, cell * 4, cell * 4);
      ctx.fillStyle = s.cookies.length === 0 ? '#C6F24E' : '#5a5a7a';
      ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(X(ex), Y(ey), cell * 0.32, 0, 7); ctx.fill(); ctx.stroke();
      // cookies
      for (const c of s.cookies) {
        const bob = Math.sin((s.t + c.x * 40) / 16) * 2;
        ctx.font = `${Math.round(cell * 0.55)}px serif`; ctx.textAlign = 'center';
        ctx.fillText('🍪', X(c.x), Y(c.y) + bob + cell * 0.18);
      }
      // torches
      for (const tc of s.torches) {
        const fl = 0.7 + Math.sin(s.t / 7 + tc.ph) * 0.3;
        ctx.font = `${Math.round(cell * 0.5)}px serif`; ctx.textAlign = 'center';
        ctx.fillText('🔥', X(tc.x), Y(tc.y) + cell * 0.2);
        void fl;
      }
      // guards
      const ai = s.angry;
      for (const g of s.guards) {
        if (ai && ai.complete) ctx.drawImage(ai, X(g.x) - cell * 0.4, Y(g.y) - cell * 0.55, cell * 0.8, cell * 0.8);
        else { ctx.fillStyle = '#FF2B2B'; ctx.fillRect(X(g.x) - 8, Y(g.y) - 8, 16, 16); }
      }
      // player
      const oi = s.oli;
      const pr = cell * 0.42;
      ctx.save();
      if (s.vx < -0.005) { ctx.translate(X(s.px), 0); ctx.scale(-1, 1); ctx.translate(-X(s.px), 0); }
      if (oi && oi.complete) ctx.drawImage(oi, X(s.px) - pr, Y(s.py) - pr * 1.5, pr * 2, pr * 2.4);
      else { ctx.fillStyle = '#2B50E0'; ctx.fillRect(X(s.px) - 10, Y(s.py) - 14, 20, 28); }
      ctx.restore();
      // ===== lighting pass ("shaders") =====
      ctx.save();
      ctx.fillStyle = bit16 ? 'rgba(4,2,18,.62)' : 'rgba(10,6,30,.42)';
      ctx.fillRect(0, 0, s.W, s.H);
      ctx.globalCompositeOperation = 'destination-out';
      const punch = (x: number, y: number, r: number, a: number) => {
        const g2 = ctx.createRadialGradient(x, y, 4, x, y, r);
        g2.addColorStop(0, `rgba(0,0,0,${a})`);
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      punch(X(s.px), Y(s.py), cell * 4.2, 1);
      for (const tc of s.torches) {
        const fl = 0.75 + Math.sin(s.t / 7 + tc.ph) * 0.25;
        punch(X(tc.x), Y(tc.y), cell * 2.4 * fl, 0.85);
      }
      punch(X(ex), Y(ey), cell * 3, 0.9);
      ctx.restore();
      // fog wisps
      ctx.fillStyle = bit16 ? 'rgba(120,100,255,.06)' : 'rgba(255,255,255,.05)';
      for (const f of s.fog) {
        f.x += f.v * (0.5 + Math.sin(s.t / 90 + f.y));
        if (f.x > s.cols) f.x = 0;
        ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), f.s, 0, 7); ctx.fill();
      }
      // HUD
      ctx.textAlign = 'left';
      ctx.font = '900 16px "Baloo 2", sans-serif';
      ctx.fillStyle = bit16 ? '#FFD23F' : '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      const hud = `${LEVELS[level].name}  🍪${cookiesLeft}  ⏱${time.toFixed(1)}s`;
      ctx.strokeText(hud, 12, 24); ctx.fillText(hud, 12, 24);
      try { (window as any).__maze = { phase: s.phaseStr, px: +s.px.toFixed(2), py: +s.py.toFixed(2), cookies: s.cookies.length, guards: s.guards.length, grid: s.grid.length > 0, t: s.t }; } catch { /* noop */ }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bit16, level, time, cookiesLeft, onNotify, onWin]);

  const steer = (e: React.PointerEvent) => {
    if (phase !== 'play') return;
    const s = S.current;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    s.target = {
      x: (e.clientX - r.left - s.ox) / s.cell,
      y: (e.clientY - r.top - s.oy) / s.cell,
    };
  };

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} onPointerMove={steer} onPointerDown={steer} />
      {bit16 && <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 2px, transparent 2px 4px)' }} />}
      {phase !== 'play' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.55)', zIndex: 20 }}>
          <div className="card-pop p-6 text-center max-w-sm mx-4">
            <div className="font-display font-extrabold text-2xl">
              {phase === 'over' ? `ESCAPED in ${time.toFixed(1)}s!` : 'OLIVER MAZE'}
            </div>
            <div className="text-sm font-bold opacity-70 my-2">
              {phase === 'over'
                ? `Best: ${best ? best.toFixed(1) + 's' : '—'}${level < 2 ? ' — deeper next?' : ' — you beat THE VOID!'})`
                : `Arrows/WASD or drag. Grab every cookie, dodge the grumps, find the glowing exit. 3 depths. Best: ${best ? best.toFixed(1) + 's' : '—'}`}
            </div>
            <div className="flex gap-2 justify-center">
              {phase === 'over' && level < 2 && (
                <button onClick={() => { setLevel(level + 1); startLevel(level + 1); }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-5 py-2.5 font-display font-extrabold">▼ DEEPER</button>
              )}
              <button onClick={() => startLevel(phase === 'over' && level >= 2 ? 0 : level)} className="btn-3d bg-[#FFD23F] border-2 border-[#1e1b3a] px-5 py-2.5 font-display font-extrabold">
                ▶ {phase === 'over' ? (level >= 2 ? 'RUN IT BACK' : 'RETRY') : level > 0 ? `ENTER LV${level + 1}` : 'ENTER'}
              </button>
            </div>
            {phase === 'ready' && level > 0 && (
              <button onClick={() => { setLevel(0); }} className="text-xs font-bold opacity-60 mt-2">back to level 1</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
