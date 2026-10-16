// Lively lighting effects for 16-bit mode: animated light sweep, flickering
// torch glows, twinkling pixel stars, scanlines + CRT vignette.
export default function BitLighting() {
  const stars = Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37.7) % 100,
    top: (i * 53.3) % 60,
    d: 0.6 + ((i * 13) % 20) / 10,
    s: 3 + ((i * 7) % 3) * 2,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {/* night arcade sky tint */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(16,12,64,.55), rgba(16,12,64,.15) 45%, rgba(43,80,224,.12))' }} />
      {/* twinkling stars */}
      {stars.map((st, i) => (
        <div key={i} className="absolute" style={{
          left: `${st.left}%`, top: `${st.top}%`, width: st.s, height: st.s,
          background: '#fff', boxShadow: '0 0 6px #fff',
          animation: `twinkle ${st.d}s steps(2) infinite`,
        }} />
      ))}
      {/* torch glows */}
      <div className="absolute bottom-8 left-4 text-3xl" style={{ animation: 'torch 1.1s ease-in-out infinite alternate' }}>🔥</div>
      <div className="absolute bottom-8 left-4 rounded-full" style={{ width: 130, height: 130, background: 'radial-gradient(circle, rgba(255,150,40,.5), transparent 70%)', transform: 'translate(-30px,-46px)', animation: 'torchGlow 1.1s ease-in-out infinite alternate' }} />
      <div className="absolute bottom-8 right-4 text-3xl" style={{ animation: 'torch 1.3s ease-in-out infinite alternate' }}>🔥</div>
      <div className="absolute bottom-8 right-4 rounded-full" style={{ width: 130, height: 130, background: 'radial-gradient(circle, rgba(255,150,40,.5), transparent 70%)', transform: 'translate(-64px,-46px)', animation: 'torchGlow 1.3s ease-in-out infinite alternate' }} />
      {/* moving light sweep */}
      <div className="absolute inset-y-0" style={{
        width: '38%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.14), transparent)',
        animation: 'sweep 7s linear infinite',
      }} />
      {/* scanlines + vignette */}
      <div className="absolute inset-0" style={{
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 2px, transparent 2px 4px)',
      }} />
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.55)' }} />
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.15;} 50%{opacity:1;} }
        @keyframes torch { from{ transform: scale(1);} to{ transform: scale(1.18) rotate(-4deg);} }
        @keyframes torchGlow { from{ opacity:.55;} to{ opacity:1;} }
        @keyframes sweep { from{ left:-40%;} to{ left:110%;} }
      `}</style>
    </div>
  );
}
