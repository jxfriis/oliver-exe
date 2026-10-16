import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onScore: (points: number, swish: boolean) => void;
  onShoot: () => void;
  onNotify: (text: string) => void;
}

interface Ball { x: number; y: number; vx: number; vy: number; flying: boolean; touchedRim: boolean; touchedBoard: boolean; scored: boolean }

const GRAV = 0.45;

export default function Basketball({ bit16, onScore, onShoot, onNotify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(10);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('oliver-basket-best') || 0));
  const [level, setLevel] = useState(1);
  const [wind, setWind] = useState(0);
  const S = useRef({
    W: 800, H: 520,
    ball: { x: 120, y: 440, vx: 0, vy: 0, flying: false, touchedRim: false, touchedBoard: false, scored: false } as Ball,
    aiming: false, aimX: 0, aimY: 0,
    hoopY: 150, hoopT: 0,
    popups: [] as { x: number; y: number; txt: string; t: number }[],
    rimFlash: 0,
    faceImg: null as HTMLImageElement | null,
    oliverImg: null as HTMLImageElement | null,
    makes: 0,
  });

  const W = () => S.current.W, H = () => S.current.H;
  const hoopX = () => W() - 165;
  const rimW = 86;
  const BALL_R = 17;

  const startRound = useCallback(() => {
    setScore(0); setShotsLeft(10); setStreak(0); setLevel(1); setWind(0);
    S.current.makes = 0; S.current.popups = [];
    resetBall();
    setPhase('play');
    onNotify('SHOOTOUT! 10 balls — drag to aim!');
    sfx.whistle();
  }, [onNotify]);

  function resetBall() {
    const s = S.current;
    s.ball = { x: 120, y: H() - 70, vx: 0, vy: 0, flying: false, touchedRim: false, touchedBoard: false, scored: false };
    s.aiming = false;
  }

  // fit canvas
  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(300, r.width * dpr); cv.height = Math.max(300, r.height * dpr);
      S.current.W = r.width; S.current.H = r.height;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      const ctx = cv.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    // preload images
    const f = new Image(); f.src = SPRITES['face-happy']; S.current.faceImg = f;
    const o = new Image(); o.src = SPRITES['walk-right-a']; S.current.oliverImg = o;
    return () => ro.disconnect();
  }, []);

  const endRound = useCallback(() => {
    setPhase('over');
    setBest((b) => {
      const nb = Math.max(b, score);
      localStorage.setItem('oliver-basket-best', String(nb));
      return nb;
    });
    if (score >= 14) onNotify(`ALL-STAR! ${score} pts!`);
    else if (score >= 8) onNotify(`Nice handles! ${score} pts!`);
    else onNotify(`Full time: ${score} pts. Run it back?`);
    sfx.yay();
  }, [score, onNotify]);

  // main loop
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      s.hoopT += 0.016;
      const lvl = level;
      const hy = 150 + (lvl >= 2 ? Math.sin(s.hoopT * 1.6) * 46 : 0);
      s.hoopY = hy;
      const b = s.ball;
      if (b.flying) {
        b.vy += GRAV;
        b.vx += wind * 0.012;
        b.x += b.vx; b.y += b.vy;
        const hx = hoopX();
        // backboard (right of rim)
        if (b.x + BALL_R > hx + rimW / 2 + 14 && b.x - BALL_R < hx + rimW / 2 + 22 && b.y > hy - 70 && b.y < hy + 10 && b.vx > 0) {
          b.x = hx + rimW / 2 + 14 - BALL_R; b.vx = -Math.abs(b.vx) * 0.62; b.touchedBoard = true; sfx.thud();
        }
        // rim points
        for (const rx of [hx - rimW / 2, hx + rimW / 2]) {
          const dx = b.x - rx, dy = b.y - hy;
          const d = Math.hypot(dx, dy);
          if (d < BALL_R + 6 && d > 0.1) {
            b.x = rx + (dx / d) * (BALL_R + 6); b.y = hy + (dy / d) * (BALL_R + 6);
            const sp = Math.hypot(b.vx, b.vy);
            b.vx = (dx / d) * sp * 0.55 + b.vx * 0.3;
            b.vy = (dy / d) * sp * 0.55;
            b.touchedRim = true; sfx.pop();
          }
        }
        // scoring: crossing rim plane downward inside rim
        if (!b.scored && b.vy > 0 && Math.abs(b.y - hy) < 10 && Math.abs(b.x - hx) < rimW / 2 - 14) {
          b.scored = true;
          const swish = !b.touchedRim && !b.touchedBoard;
          const pts = swish ? 3 : 2;
          s.rimFlash = 20;
          s.popups.push({ x: hx, y: hy - 40, txt: swish ? `SWISH +${pts}` : `BUCKET +${pts}`, t: 70 });
          setScore((sc) => sc + pts);
          setStreak((st) => {
            const nst = st + 1;
            if (nst % 3 === 0) {
              setScore((sc) => sc + 2);
              s.popups.push({ x: hx - 60, y: hy - 70, txt: 'STREAK +2 🔥', t: 70 });
            }
            return nst;
          });
          s.makes += 1;
          if (s.makes === 3) { setLevel(2); onNotify('The hoop is MOVING now!'); }
          if (s.makes === 6) { setLevel(3); setWind(Number(((Math.random() * 4 - 2).toFixed(1)))); onNotify(`Wind picked up! (${wind >= 0 ? '→' : '←'} ${Math.abs(wind)})`); }
          onScore(pts, swish);
        }
        // net drag
        if (b.y > hy && b.y < hy + 44 && Math.abs(b.x - hx) < rimW / 2) { b.vx *= 0.92; b.vy *= 0.94; }
        // floor
        if (b.y > H() - 30) {
          b.y = H() - 30;
          if (Math.abs(b.vy) > 2.2 && !b.scored) { b.vy *= -0.55; b.vx *= 0.85; sfx.pop(); }
          else { nextBall(b.scored); }
        }
        if (b.x < -40 || b.x > W() + 60 || b.y < -80) nextBall(false);
      }
      // ----- draw -----
      ctx.clearRect(0, 0, W(), H());
      // court
      ctx.fillStyle = bit16 ? '#1a1440' : 'rgba(198,242,78,.25)';
      ctx.fillRect(0, H() - 60, W(), 60);
      ctx.strokeStyle = bit16 ? '#C6F24E' : '#1e1b3a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, H() - 60); ctx.lineTo(W(), H() - 60); ctx.stroke();
      ctx.beginPath(); ctx.arc(W() / 2, H() - 60, 70, Math.PI, 0); ctx.stroke();
      // wind indicator
      if (level >= 3) {
        ctx.fillStyle = bit16 ? '#FFD23F' : '#1e1b3a';
        ctx.font = '800 15px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`WIND ${wind > 0 ? '→'.repeat(Math.min(4, Math.round(wind))) : '←'.repeat(Math.min(4, Math.round(-wind)))} ${wind}`, 14, 30);
      }
      // Oliver courtside mascot
      const oi = s.oliverImg;
      if (oi && oi.complete) {
        const oy = H() - 60 - 96 + Math.sin(s.hoopT * 3) * (s.rimFlash > 0 ? 8 : 2);
        ctx.drawImage(oi, W() - 250, oy, 72, 96);
      }
      // hoop: pole, backboard, rim, net
      const hx = hoopX();
      ctx.fillStyle = '#888';
      ctx.fillRect(hx + rimW / 2 + 18, hy - 70, 8, 120);
      ctx.fillStyle = bit16 ? '#fff' : 'rgba(255,255,255,.9)';
      ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 4;
      ctx.fillRect(hx + rimW / 2 + 8, hy - 66, 12, 60);
      ctx.strokeRect(hx + rimW / 2 + 8, hy - 66, 12, 60);
      // net
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - rimW / 2, hy); ctx.lineTo(hx - rimW / 2 + 12, hy + 40);
      ctx.moveTo(hx + rimW / 2, hy); ctx.lineTo(hx + rimW / 2 - 12, hy + 40);
      ctx.moveTo(hx - rimW / 2 + 12, hy + 40); ctx.lineTo(hx + rimW / 2 - 12, hy + 40);
      ctx.stroke();
      // rim
      ctx.strokeStyle = s.rimFlash > 0 ? '#FFD23F' : '#FF6B5B';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(hx - rimW / 2, hy); ctx.lineTo(hx + rimW / 2, hy); ctx.stroke();
      if (s.rimFlash > 0) s.rimFlash--;
      // tee + ball
      if (!b.flying) {
        ctx.fillStyle = '#1e1b3a';
        ctx.fillRect(b.x - 3, H() - 60, 6, 26);
        drawBall(ctx, b.x, b.y, s.faceImg, bit16);
      } else {
        drawBall(ctx, b.x, b.y, s.faceImg, bit16);
      }
      // aim preview
      if (s.aiming && !b.flying) {
        const dx = b.x - s.aimX, dy = b.y - s.aimY;
        let px = b.x, py = b.y, pvx = dx * 0.18, pvy = dy * 0.18;
        ctx.fillStyle = '#2B50E0';
        for (let i = 0; i < 14; i++) {
          pvy += GRAV; pvx += wind * 0.012; px += pvx; py += pvy;
          ctx.globalAlpha = 1 - i / 15;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // power meter
        const pow = Math.min(1, Math.hypot(dx, dy) / 220);
        ctx.fillStyle = '#eee'; ctx.fillRect(b.x - 60, b.y + 30, 120, 12);
        ctx.fillStyle = pow > 0.8 ? '#FF6B5B' : '#C6F24E';
        ctx.fillRect(b.x - 60, b.y + 30, 120 * pow, 12);
        ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 60, b.y + 30, 120, 12);
      }
      // popups
      ctx.textAlign = 'center';
      s.popups = s.popups.filter((p) => p.t > 0);
      for (const p of s.popups) {
        p.t--; p.y -= 0.6;
        ctx.font = '900 20px "Baloo 2", sans-serif';
        ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 4;
        ctx.strokeText(p.txt, p.x, p.y); ctx.fillText(p.txt, p.x, p.y);
      }
      // HUD
      ctx.textAlign = 'left';
      ctx.font = '900 18px "Baloo 2", sans-serif';
      ctx.fillStyle = bit16 ? '#fff' : '#1e1b3a';
      ctx.fillText(`SCORE ${score}   BALLS ${shotsLeft}/10   STREAK x${streak}`, 14, H() - 16);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, level, wind, score, streak, shotsLeft, bit16]);

  function nextBall(scored: boolean) {
    const s = S.current;
    if (!scored) { setStreak(0); }
    setShotsLeft((n) => {
      const left = n - 1;
      if (left <= 0) setTimeout(() => endRound(), 600);
      else resetBall();
      return Math.max(0, left);
    });
  }

  const toLocal = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef}
        onPointerDown={(e) => {
          if (phase !== 'play') return;
          const s = S.current, b = s.ball;
          if (b.flying) return;
          const p = toLocal(e);
          if (Math.hypot(p.x - b.x, p.y - b.y) < 70) {
            s.aiming = true; s.aimX = p.x; s.aimY = p.y;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          const s = S.current;
          if (!s.aiming) return;
          const p = toLocal(e);
          s.aimX = p.x; s.aimY = p.y;
        }}
        onPointerUp={(e) => {
          const s = S.current, b = s.ball;
          if (!s.aiming || b.flying) return;
          s.aiming = false;
          const p = toLocal(e);
          const dx = b.x - p.x, dy = b.y - p.y;
          if (Math.hypot(dx, dy) < 12) return; // accidental tap
          b.vx = dx * 0.18; b.vy = dy * 0.18;
          b.flying = true; b.touchedRim = false; b.touchedBoard = false; b.scored = false;
          onShoot();
        }}
      />
      {phase === 'ready' && (
        <Overlay title="OLIVER HOOPS" sub="Drag the ball to aim. Dots + power meter show the arc. Swish = 3pts, streaks bonus. Hoop moves, wind blows. 10 balls.">
          <button onClick={startRound} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ TIP OFF</button>
        </Overlay>
      )}
      {phase === 'over' && (
        <Overlay title={`FULL TIME: ${score}`} sub={`Best: ${Math.max(best, score)} — ${score >= 14 ? 'certified bucket getter 🏆' : score >= 8 ? 'solid run!' : 'the rim is not your enemy. probably.'}`}>
          <button onClick={startRound} className="btn-3d bg-[#FFD23F] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">↻ RUN IT BACK</button>
        </Overlay>
      )}
    </div>
  );
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, face: HTMLImageElement | null, bit16: boolean) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 17, 0, 7);
  ctx.fillStyle = '#F5820B'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#1e1b3a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.clip();
  if (face && face.complete && face.naturalWidth) ctx.drawImage(face, x - 13, y - 13, 27, 27);
  ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x + 17, y); ctx.stroke();
  ctx.restore();
  void bit16;
}

function Overlay({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
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
