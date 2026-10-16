import React from 'react';
// sweeping spotlights, laser beams and color-wash ambience.
import DiscoBall from './DiscoBall';

function DiscoFloor({ bit16 }: { bit16: boolean }) {
  const tiles = Array.from({ length: 48 }, (_, i) => i);
  const tileColors = ['#FF6B5B', '#FFD23F', '#C6F24E', '#2B50E0', '#B9A7F9', '#FF9BD2'];
  const beams = [
    { left: '8%', color: '#FF6B5B', dur: '3.2s', delay: '0s' },
    { left: '30%', color: '#2B50E0', dur: '2.6s', delay: '.4s' },
    { left: '62%', color: '#C6F24E', dur: '3.8s', delay: '.9s' },
    { left: '84%', color: '#B9A7F9', dur: '2.9s', delay: '.2s' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      {/* color wash */}
      <div className="absolute inset-0 disco-animate" style={{ background: 'linear-gradient(135deg, rgba(185,167,249,.4), rgba(255,107,91,.3), rgba(198,242,78,.3))' }} />
      {/* smoky haze so the beams have something to cut through — oversized layer
          drifting on transform (identical look, zero repaint) */}
      <div className="absolute" style={{ inset: -160, opacity: .5, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='h'><feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/></filter><rect width='300' height='300' filter='url(%23h)'/></svg>\")", mixBlendMode: 'soft-light', animation: 'hazeDrift 18s ease-in-out infinite alternate', willChange: 'transform' }} />
      {/* dance floor */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '26%', perspective: 300 }}>
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-3 gap-1 p-2" style={{ transform: 'rotateX(18deg) scaleY(1.15)', transformOrigin: 'bottom' }}>
          {tiles.map((i) => (
            <div key={i} style={{
              background: tileColors[i % tileColors.length],
              opacity: 0.55, borderRadius: 4,
              border: '2px solid rgba(0,0,0,.55)',
              boxShadow: `0 0 14px ${tileColors[i % tileColors.length]}`,
              animation: `tileBlink ${0.5 + ((i * 29) % 50) / 50}s steps(2) ${((i * 17) % 20) / 20}s infinite`,
            }} />
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,.45))' }} />
      </div>
      {/* spotlights — wider cones with a bright source flare at the top */}
      {beams.map((b, i) => (
        <div key={i} className="absolute top-0" style={{
          left: b.left, width: 130, height: '82%',
          background: `linear-gradient(180deg, ${b.color}dd, ${b.color}33 55%, transparent 85%)`,
          clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0% 100%)',
          transformOrigin: 'top center',
          animation: `beamSway ${b.dur} ease-in-out ${b.delay} infinite alternate`,
          mixBlendMode: 'screen', opacity: 0.85, filter: 'blur(1px)',
        }} />
      ))}
      {beams.map((b, i) => (
        <div key={`fx${i}`} className="absolute top-1 rounded-full" style={{
          left: `calc(${b.left} + 52px)`, width: 26, height: 26,
          background: `radial-gradient(circle, #fff, ${b.color} 55%, transparent 75%)`,
          boxShadow: `0 0 30px ${b.color}`, mixBlendMode: 'screen',
          animation: `sourcePulse ${b.dur} ease-in-out ${b.delay} infinite alternate`,
        }} />
      ))}
      {/* THE mirror ball */}
      <DiscoBall bit16={bit16} />
      {/* laser beams */}
      <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
        <div style={{ position: 'absolute', top: '22%', left: '-10%', width: '120%', height: 3, background: '#FF2B2B', boxShadow: '0 0 18px #FF2B2B', opacity: .7, animation: 'laser1 4s linear infinite' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-10%', width: '120%', height: 3, background: '#C6F24E', boxShadow: '0 0 18px #C6F24E', opacity: .7, animation: 'laser2 5.5s linear infinite' }} />
      </div>
      <style>{`
        @keyframes tileBlink { 0%,100%{ opacity:.25;} 50%{ opacity:.85;} }
        @keyframes beamSway { from{ transform: rotate(-16deg);} to{ transform: rotate(16deg);} }
        @keyframes sourcePulse { from{ opacity:.6; transform: scale(.9);} to{ opacity:1; transform: scale(1.15);} }
        @keyframes hazeDrift { from{ transform: translate(0,0);} to{ transform: translate(140px,60px);} }
        @keyframes ballSpin { to { filter: hue-rotate(360deg); } }
        @keyframes sparkOrbit { from{ transform: translate(0,0) scale(.4); opacity:0;} 30%{opacity:1;} to{ transform: translate(var(--ox), var(--oy)) scale(1.1); opacity:0;} }
        @keyframes laser1 { 0%{ transform: translateY(0) rotate(-4deg);} 50%{ transform: translateY(60px) rotate(3deg);} 100%{ transform: translateY(0) rotate(-4deg);} }
        @keyframes laser2 { 0%{ transform: translateY(50px) rotate(3deg);} 50%{ transform: translateY(-40px) rotate(-3deg);} 100%{ transform: translateY(50px) rotate(3deg);} }
      `}</style>
    </div>
  );
}
export default React.memo(DiscoFloor);
