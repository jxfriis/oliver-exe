import React from 'react';
// Lively 16-bit lighting: pixel starfield with shooting stars, parallax skyline,
// torches with warm pools + rising embers, colored rim glows, CRT sweep,
// scanlines, vignette and phosphor flicker.
function BitLighting() {
  const stars = Array.from({ length: 42 }, (_, i) => ({
    left: (i * 37.7 + (i % 5) * 6.1) % 100,
    top: (i * 53.3) % 52,
    d: 0.6 + ((i * 13) % 20) / 10,
    s: 2 + ((i * 7) % 4) * 2,
    c: ['#ffffff', '#cfe8ff', '#ffe9a8', '#b9a7f9'][i % 4],
  }));
  // chunky pixel clouds drifting behind the skyline
  const clouds = Array.from({ length: 4 }, (_, i) => ({
    top: 8 + i * 11, dur: 34 + i * 12, delay: -i * 14, o: 0.10 + (i % 2) * 0.05,
  }));
  const motes = Array.from({ length: 12 }, (_, i) => ({
    left: (i * 61.7) % 100, d: 4 + ((i * 11) % 30) / 10, delay: ((i * 7) % 20) / 10,
  }));

  const torch = (side: 'left' | 'right', seed: number) => (
    <div className="absolute bottom-6" style={{ [side]: 18 } as React.CSSProperties}>
      {/* wall sconce bracket */}
      <div className="absolute" style={{ left: -3, top: 26, width: 8, height: 26, background: '#3a2b1c', boxShadow: 'inset -2px -2px 0 #241a10' }} />
      {/* layered flame pixels */}
      <div className="relative" style={{ animation: `torch ${1.05 + seed * 0.1}s ease-in-out infinite alternate` }}>
        <div style={{ width: 18, height: 26, background: '#ff8a2a', clipPath: 'polygon(50% 0, 78% 34%, 92% 70%, 50% 100%, 8% 70%, 22% 34%)', filter: 'drop-shadow(0 0 10px rgba(255,140,40,.9))', animation: `flameDance ${0.5 + seed * 0.07}s steps(2) infinite` }} />
        <div style={{ position: 'absolute', left: 4, top: 8, width: 10, height: 14, background: '#ffd23f', clipPath: 'polygon(50% 0, 85% 45%, 50% 100%, 15% 45%)' }} />
        <div style={{ position: 'absolute', left: 7, top: 13, width: 4, height: 7, background: '#fff6d8' }} />
      </div>
      {/* big warm glow + floor pool */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: 260, height: 260, left: -121, top: -110,
        background: 'radial-gradient(circle, rgba(255,150,40,.5), rgba(255,120,30,.18) 45%, transparent 70%)',
        animation: `torchGlow ${1.15 + seed * 0.1}s ease-in-out infinite alternate`,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 190, height: 46, left: -86, top: 58, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,170,60,.4), transparent 70%)',
        animation: `poolFlicker ${0.9 + seed * 0.12}s ease-in-out infinite alternate`,
      }} />
      {/* rising embers */}
      {[0, 1, 2, 3].map((e) => (
        <div key={e} className="absolute pointer-events-none" style={{
          left: -6 + e * 5, top: -6, width: 3 + (e % 2) * 2, height: 3 + (e % 2) * 2,
          background: e % 2 ? '#ffb040' : '#ff6b2b', boxShadow: '0 0 6px rgba(255,140,40,.9)',
          animation: `ember ${1.7 + e * 0.5}s linear ${e * 0.45}s infinite`,
        }} />
      ))}
    </div>
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {/* night arcade sky tint — kept light so sprites stay bright */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(16,12,64,.38), rgba(16,12,64,.06) 45%, rgba(43,80,224,.05))' }} />
      {/* twinkling pixel stars (varied colors + cross flare on the bright ones) */}
      {stars.map((st, i) => (
        <div key={i} className="absolute" style={{
          left: `${st.left}%`, top: `${st.top}%`, width: st.s, height: st.s,
          background: st.c,
          boxShadow: i % 5 === 0 ? `0 0 8px ${st.c}, 0 0 2px ${st.c}` : `0 0 4px ${st.c}`,
          animation: `twinkle ${st.d}s steps(2) infinite`, animationDelay: `${(i % 7) * 0.23}s`,
        }} />
      ))}
      {/* occasional shooting star streaks */}
      <div className="absolute" style={{ left: '12%', top: '8%', width: 46, height: 3, background: 'linear-gradient(90deg, #fff, transparent)', transform: 'rotate(24deg)', animation: 'shoot 9s linear .8s infinite', opacity: 0 }} />
      <div className="absolute" style={{ left: '58%', top: '5%', width: 60, height: 3, background: 'linear-gradient(90deg, #cfe8ff, transparent)', transform: 'rotate(18deg)', animation: 'shoot 13s linear 6s infinite', opacity: 0 }} />
      {/* parallax pixel cloud bands — transform-only drift, same path as before */}
      {clouds.map((c, i) => (
        <div key={`cl${i}`} className="absolute" style={{
          top: `${c.top}%`, left: 0, width: '40%', height: 14, opacity: c.o,
          background: 'repeating-linear-gradient(90deg, #8f8fd0 0 26px, transparent 26px 44px)',
          borderRadius: 4, filter: 'blur(1px)', willChange: 'transform',
          animation: `bitCloud ${c.dur}s linear infinite`, animationDelay: `${c.delay}s`,
        }} />
      ))}
      {/* distant arcade skyline silhouette for depth */}
      <div className="absolute inset-x-0" style={{
        bottom: '18%', height: 64, opacity: 0.5,
        background: 'linear-gradient(0deg, #0a0730 55%, transparent)',
        WebkitMaskImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'64\'><rect x=\'4\' y=\'28\' width=\'26\' height=\'36\'/><rect x=\'38\' y=\'14\' width=\'20\' height=\'50\'/><rect x=\'66\' y=\'34\' width=\'30\' height=\'30\'/><rect x=\'104\' y=\'8\' width=\'18\' height=\'56\'/><rect x=\'130\' y=\'26\' width=\'26\' height=\'38\'/><rect x=\'164\' y=\'18\' width=\'22\' height=\'46\'/><rect x=\'194\' y=\'36\' width=\'30\' height=\'28\'/></svg>")',
        WebkitMaskRepeat: 'repeat-x', maskRepeat: 'repeat-x',
      }} />
      {/* lime/magenta rim glows from the cabinet edges */}
      <div className="absolute inset-y-0 left-0" style={{ width: 90, background: 'linear-gradient(90deg, rgba(198,242,78,.16), transparent)' }} />
      <div className="absolute inset-y-0 right-0" style={{ width: 90, background: 'linear-gradient(-90deg, rgba(185,167,249,.16), transparent)' }} />
      {/* animated light sweep — transform-only so it never triggers layout */}
      <div className="absolute inset-y-0" style={{
        left: 0, width: '34%',
        background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.10) 45%, rgba(198,242,78,.08) 55%, transparent)',
        mixBlendMode: 'screen', animation: 'sweep 7s linear infinite', willChange: 'transform',
      }} />
      {/* floating dust catching the torchlight */}
      {motes.map((m, i) => (
        <div key={`mt${i}`} className="absolute" style={{
          left: `${m.left}%`, bottom: 40, width: 3, height: 3, background: '#ffe9a8',
          boxShadow: '0 0 5px rgba(255,220,140,.8)',
          animation: `bitMote ${m.d}s ease-in-out ${m.delay}s infinite`,
        }} />
      ))}
      {/* torches with pools + embers */}
      {torch('left', 0)}
      {torch('right', 2)}
      {/* scanlines (finer) + subtle RGB shadow mask */}
      <div className="absolute inset-0" style={{
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, transparent 1px 3px)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'repeating-linear-gradient(90deg, rgba(255,0,60,.03) 0 1px, rgba(0,255,120,.03) 1px 2px, rgba(0,80,255,.03) 2px 3px)',
      }} />
      {/* CRT curvature vignette + phosphor flicker */}
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.45), inset 0 0 24px rgba(0,0,0,.28)' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(190,200,255,.02)', animation: 'crtFlicker 3.1s steps(3) infinite' }} />
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.12; transform: scale(.8);} 50%{opacity:1; transform: scale(1.15);} }
        @keyframes shoot { 0%{ opacity:0; transform: rotate(24deg) translateX(0);} 2%{opacity:.9;} 8%{ opacity:0; transform: rotate(24deg) translateX(340px);} 100%{opacity:0;} }
        @keyframes torch { from{ transform: scale(1) skewX(0deg);} to{ transform: scale(1.16) skewX(-4deg);} }
        @keyframes flameDance { 0%{ transform: scaleX(1);} 50%{ transform: scaleX(.86) translateY(1px);} 100%{ transform: scaleX(1.06);} }
        @keyframes torchGlow { from{ opacity:.55; transform: scale(.96);} to{ opacity:1; transform: scale(1.05);} }
        @keyframes poolFlicker { from{ opacity:.5; transform: scaleX(.92);} to{ opacity:.95; transform: scaleX(1.06);} }
        @keyframes ember { 0%{ transform: translate(0,0); opacity:1;} 100%{ transform: translate(10px,-90px); opacity:0;} }
        @keyframes sweep { from{ transform: translateX(-118%);} to{ transform: translateX(324%);} }
        @keyframes bitCloud { from{ transform: translateX(-125%);} to{ transform: translateX(250%);} }
        @keyframes bitMote { 0%{ transform: translate(0,0); opacity:0;} 20%{opacity:.9;} 100%{ transform: translate(18px,-120px); opacity:0;} }
        @keyframes crtFlicker { 0%,100%{ opacity:.5;} 50%{ opacity:.9;} }
      `}</style>
    </div>
  );
}
export default React.memo(BitLighting);
