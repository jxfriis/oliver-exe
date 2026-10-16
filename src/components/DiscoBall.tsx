import { useEffect, useRef } from 'react';

// Real-time mirror ball: rotating faceted sphere with specular glints,
// halo, orbiting room dots and sweeping beams. Runs both skins.
export default function DiscoBall({ bit16 }: { bit16: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const S = useRef({ t: 0, w: 0, h: 0 });

  useEffect(() => {
    const cv = canvasRef.current!;
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(50, r.width * dpr); cv.height = Math.max(50, r.height * dpr);
      S.current.w = r.width; S.current.h = r.height;
      cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = S.current;
      s.t += 0.016;
      const ctx = cv.getContext('2d');
      if (!ctx || !s.w) return;
      const cx = s.w / 2, cy = s.h / 2 + 6, R = Math.min(s.w, s.h) / 2 - 8;
      ctx.clearRect(0, 0, s.w, s.h);
      // halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 2.6);
      halo.addColorStop(0, 'rgba(255,255,255,.5)');
      halo.addColorStop(0.4, 'rgba(185,167,249,.28)');
      halo.addColorStop(1, 'rgba(185,167,249,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, s.w, s.h);
      // base sphere
      const base = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      base.addColorStop(0, '#fdfdff');
      base.addColorStop(0.55, '#aab4e8');
      base.addColorStop(1, '#2a2560');
      ctx.fillStyle = base;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      // mirror facets
      const COLS = bit16 ? 12 : 18, ROWS = bit16 ? 7 : 10;
      const rot = s.t * 0.9;
      const hue = (s.t * 24) % 360;
      const flares: { x: number; y: number; r: number }[] = [];
      for (let row = 0; row < ROWS; row++) {
        const lat = (row + 0.5) / ROWS; // 0 top → 1 bottom
        const theta = lat * Math.PI;
        const ringR = Math.sin(theta);
        const y3 = Math.cos(theta);
        for (let col = 0; col < COLS; col++) {
          const phi = ((col / COLS) * Math.PI * 2 + rot) % (Math.PI * 2);
          const x3 = Math.cos(phi) * ringR;
          const z3 = Math.sin(phi) * ringR;
          if (z3 < 0.08) continue; // back side
          const px = cx + x3 * R * 0.96;
          const py = cy - y3 * R * 0.96;
          // light from top-left-front
          const facing = Math.max(0, (x3 * -0.45 + -y3 * -0.55 + z3 * 0.72));
          const glint = Math.pow(Math.max(0, Math.sin(phi * 3 + s.t * 2.2) * Math.sin(lat * 9 - s.t * 1.4)), 8);
          const b = Math.min(1, 0.12 + facing * 0.75 + glint);
          const ts = (R * 2 / COLS) * (0.55 + z3 * 0.45);
          const l = Math.round(14 + b * 82);
          ctx.fillStyle = `hsl(${(hue + b * 40) % 360}, ${bit16 ? 20 : 45}%, ${l}%)`;
          if (bit16) {
            ctx.fillRect(Math.round(px - ts / 2), Math.round(py - ts / 2), Math.max(2, Math.round(ts)), Math.max(2, Math.round(ts)));
          } else {
            ctx.fillRect(px - ts / 2, py - ts / 2, ts, ts);
          }
          if (glint > 0.86 && z3 > 0.5) flares.push({ x: px, y: py, r: ts * (1 + glint) });
        }
      }
      // star flares on hottest facets
      for (const f of flares.slice(0, 7)) {
        const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
        fg.addColorStop(0, 'rgba(255,255,255,.95)');
        fg.addColorStop(0.35, 'rgba(255,240,190,.55)');
        fg.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 3, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(f.x - f.r * 3.4, f.y); ctx.lineTo(f.x + f.r * 3.4, f.y);
        ctx.moveTo(f.x, f.y - f.r * 3.4); ctx.lineTo(f.x, f.y + f.r * 3.4);
        ctx.stroke();
      }
      // glass rim light
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, R - 1.5, Math.PI * 1.05, Math.PI * 1.65); ctx.stroke();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, 7); ctx.stroke();
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [bit16]);

  const dots = Array.from({ length: 26 }, (_, i) => ({
    ang: (i / 26) * Math.PI * 2,
    rad: 90 + ((i * 53) % 70),
    c: ['#FF6B5B', '#FFD23F', '#C6F24E', '#2B50E0', '#B9A7F9', '#FF9BD2'][i % 6],
    dur: 2.6 + ((i * 29) % 30) / 14,
    delay: -((i * 17) % 30) / 10,
  }));

  return (
    <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 2 }}>
      <div style={{ width: 2, height: 30, background: '#000', margin: '0 auto' }} />
      <div className="relative" style={{ width: 150, margin: '0 auto' }}>
        <canvas ref={canvasRef} style={{ width: 150, height: 150, display: 'block', imageRendering: bit16 ? 'pixelated' : 'auto' }} />
        {/* light dots thrown around the room */}
        {dots.map((d, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: 8, height: 8, left: 75, top: 75,
            background: d.c, boxShadow: `0 0 12px ${d.c}, 0 0 26px ${d.c}`,
            // @ts-ignore orbit vars
            ['--ox']: `${Math.cos(d.ang) * d.rad}px`, ['--oy']: `${Math.sin(d.ang) * d.rad * 0.7}px`,
            animation: `dotOrbit ${d.dur}s linear ${d.delay}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes dotOrbit {
          from { transform: translate(-50%,-50%) rotate(0deg) translateX(var(--ox, 90px)) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          to { transform: translate(-50%,-50%) rotate(360deg) translateX(var(--ox, 90px)) rotate(-360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
