import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx } from '../lib/sound';
import { SPRITES } from '../lib/sprites';

interface Props {
  bit16: boolean;
  onNotify: (text: string) => void;
  onPoint: (playerScored: boolean) => void;
}

export default function Pong({ bit16, onNotify, onPoint }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState({ you: 0, oli: 0 });
  const S = useRef({
    W: 800, H: 500, py: 200, oy: 200,
    bx: 400, by: 250, bvx: 4, buy: 2.4,
    face: null as HTMLImageElement | null,
    oli: null as HTMLImageElement | null,
    serveT: 0, rally: 0,
  });

  const start = useCallback(() => {
    const s = S.current;
    setScore({ you: 0, oli: 0 });
    s.rally = 0; serve(true);
    setPhase('play');
    onNotify('PONG! First to 7. Oliver has been practicing.');
    sfx.whistle();
  }, [onNotify]);

  function serve(toPlayer: boolean) {
    const s = S.current;
    s.bx = s.W / 2; s.by = s.H / 2;
    const sp = 3.6 + Math.min(3, s.rally * 0.15);
    s.bvx = (toPlayer ? -1 : 1) * sp;
    s.buy = (Math.random() - 0.5) * 4;
    s.serveT = 40;
  }

  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      S.current.W = r.width; S.current.H = r.height;
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.current.py = r.height / 2 - 50; S.current.oy = r.height / 2 - 50;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const f = new Image(); f.src = SPRITES['face-happy']; S.current.face = f;
    const o = new Image(); o.src = SPRITES['walk-right-a']; S.current.oli = o;
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const PH = 100, PW = 14;
      if (s.serveT > 0) s.serveT--;
      else {
        s.bx += s.bvx; s.by += s.buy;
        if (s.by < 16 || s.by > s.H - 16) { s.by = Math.max(16, Math.min(s.H - 16, s.by)); s.buy *= -1; sfx.pop(); }
        // player paddle (left)
        if (s.bx - 14 < 26 + PW && s.bx > 10 && s.by > s.py - 6 && s.by < s.py + PH + 6 && s.bvx < 0) {
          const rel = (s.by - (s.py + PH / 2)) / (PH / 2);
          const sp = Math.min(9, Math.hypot(s.bvx, s.buy) * 1.06 + 0.15);
          const ang = rel * 0.9;
          s.bvx = Math.cos(ang) * sp; s.buy = Math.sin(ang) * sp;
          s.bx = 26 + PW + 14; s.rally++; sfx.pop();
        }
        // oliver AI (right) — tracks with error that shrinks as rally grows
        const target = s.by - PH / 2;
        const err = Math.max(6, 34 - s.rally * 2);
        const aiSpeed = Math.min(6.4, 3.4 + s.rally * 0.18);
        const diff = target - s.oy + (Math.random() - 0.5) * err * 0.3;
        s.oy += Math.max(-aiSpeed, Math.min(aiSpeed, diff));
        s.oy = Math.max(0, Math.min(s.H - PH, s.oy));
        if (s.bx + 14 > s.W - 26 - PW && s.bx < s.W - 10 && s.by > s.oy - 6 && s.by < s.oy + PH + 6 && s.bvx > 0) {
          const rel = (s.by - (s.oy + PH / 2)) / (PH / 2);
          const sp = Math.min(9.5, Math.hypot(s.bvx, s.buy) * 1.07 + 0.15);
          const ang = rel * 0.9;
          s.bvx = -Math.cos(ang) * sp; s.buy = Math.sin(ang) * sp;
          s.bx = s.W - 26 - PW - 14; s.rally++; sfx.pop();
        }
        // goals
        if (s.bx < -20) {
          setScore((sc) => {
            const n = { ...sc, oli: sc.oli + 1 };
            if (n.oli >= 7) { setPhase('over'); onNotify(`OLIVER WINS ${n.oli}–${n.you}. He is doing a victory lap.`); sfx.splat(); }
            else if (n.oli === 6) onNotify('MATCH POINT OLIVER. No pressure.');
            else onNotify(pick(['Oli scores! Rude.', 'He planned that. Probably.', 'The crowd (me) goes mild.']));
            return n;
          });
          onPoint(false); s.rally = 0; serve(true);
        } else if (s.bx > s.W + 20) {
          setScore((sc) => {
            const n = { ...sc, you: sc.you + 1 };
            if (n.you >= 7) { setPhase('over'); onNotify(`YOU BEAT OLIVER ${n.you}–${n.oli}! He demands a rematch.`); sfx.yay(); }
            else if (n.you === 6) onNotify('MATCH POINT YOU!');
            else onNotify(pick(['POINT! Oliver is rattled.', 'He blames the pixels.', 'Unbelievable scenes.']));
            return n;
          });
          onPoint(true); s.rally = 0; serve(false);
        }
      }
      // draw
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.fillStyle = bit16 ? '#101040' : 'rgba(43,80,224,.08)';
      ctx.fillRect(0, 0, s.W, s.H);
      ctx.strokeStyle = bit16 ? '#C6F24E' : '#1e1b3a';
      ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(s.W / 2, 0); ctx.lineTo(s.W / 2, s.H); ctx.stroke();
      ctx.setLineDash([]);
      // player paddle
      ctx.fillStyle = '#C6F24E'; ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3;
      roundRect(ctx, 26, s.py, PW, PH, 7); ctx.fill(); ctx.stroke();
      // oliver paddle: sprite + paddle
      const oi = s.oli;
      if (oi && oi.complete) ctx.drawImage(oi, s.W - 26 - PW - 56, s.oy - 8, 46, 116);
      ctx.fillStyle = '#FF6B5B';
      roundRect(ctx, s.W - 26 - PW, s.oy, PW, PH, 7); ctx.fill(); ctx.stroke();
      // ball = happy Oliver face
      ctx.save();
      ctx.beginPath(); ctx.arc(s.bx, s.by, 15, 0, 7); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(s.bx - 15, s.by - 15, 30, 30);
      if (s.face && s.face.complete) ctx.drawImage(s.face, s.bx - 15, s.by - 15, 30, 30);
      ctx.restore();
      ctx.beginPath(); ctx.arc(s.bx, s.by, 15, 0, 7);
      ctx.strokeStyle = '#1e1b3a'; ctx.lineWidth = 3; ctx.stroke();
      // score
      ctx.fillStyle = bit16 ? '#FFD23F' : '#1e1b3a';
      ctx.font = '900 26px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`YOU ${score.you}  :  ${score.oli} OLI`, s.W / 2, 36);
      if (s.serveT > 0) { ctx.fillText('READY…', s.W / 2, s.H / 2 - 40); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, score, bit16]);

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef}
        onPointerMove={(e) => {
          if (phase !== 'play') return;
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          S.current.py = Math.max(0, Math.min(S.current.H - 100, e.clientY - r.top - 50));
        }}
        onPointerDown={(e) => {
          if (phase !== 'play') return;
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          S.current.py = Math.max(0, Math.min(S.current.H - 100, e.clientY - r.top - 50));
        }}
      />
      {phase !== 'play' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,58,.45)', zIndex: 20 }}>
          <div className="card-pop p-6 text-center max-w-sm mx-4">
            <div className="font-display font-extrabold text-2xl">
              {phase === 'over' ? (score.you > score.oli ? `YOU WIN ${score.you}–${score.oli}!` : `OLI WINS ${score.oli}–${score.you}`) : 'PONG VS OLIVER'}
            </div>
            <div className="text-sm font-bold opacity-70 my-2">Move mouse / finger to slide. First to 7. He gets faster every rally…</div>
            <button onClick={start} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold">▶ {phase === 'over' ? 'REMATCH' : 'SERVE'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
