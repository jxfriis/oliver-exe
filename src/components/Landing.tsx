import React, { useEffect, useRef, useState } from 'react';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

// Cinematic landing: Oliver outside the castle. ENTER → he walks to the gate,
// shrinks into the distance, the door bursts open with light, fade to black.
function Landing({ bit16, onToggleBit, onEnter, onPlay3d }: {
  bit16: boolean; onToggleBit: () => void; onEnter: () => void; onPlay3d: () => void;
}) {
  const [walking, setWalking] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const go = () => {
    if (walking) return;
    setWalking(true);
    timers.current.push(window.setTimeout(() => setDoorOpen(true), 950));
    timers.current.push(window.setTimeout(() => setBlackout(true), 1500));
    timers.current.push(window.setTimeout(() => onEnter(), 1950));
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 300, background: '#05031a' }}>
      {/* castle backdrop: closed, then the open-door version with light burst */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'url(./castle-closed.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center 70%',
        imageRendering: bit16 ? 'pixelated' : 'auto',
        filter: bit16 ? 'saturate(1.5) contrast(1.12)' : 'none',
        transform: walking ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 2s ease-out',
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: 'url(./castle-open.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center 70%',
        imageRendering: bit16 ? 'pixelated' : 'auto',
        filter: bit16 ? 'saturate(1.5) contrast(1.12)' : 'none',
        opacity: doorOpen ? 1 : 0,
        transition: 'opacity .5s ease-in',
        transform: walking ? 'scale(1.06)' : 'scale(1)',
      }} />
      {/* light burst when the door opens */}
      <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{
        width: '70vmax', height: '70vmax', transform: 'translate(-50%,-52%)',
        background: 'radial-gradient(circle, rgba(255,240,200,.95), rgba(255,210,100,.45) 40%, transparent 70%)',
        opacity: doorOpen ? 1 : 0, transition: 'opacity .45s ease-in',
        mixBlendMode: 'screen',
      }} />
      {/* pixel moon drifting above the tower */}
      <img src="./landing/moon.png" alt="" draggable={false} className="absolute pointer-events-none" style={{
        right: '6%', top: '4%', width: 'min(30vw,320px)', imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 46px rgba(140,170,255,.55))',
        animation: 'moonDrift 11s ease-in-out infinite alternate', opacity: 0.95,
      }} />
      {/* storm clouds + lightning behind the tower — moody backlight */}
      <img src="./landing/storm.png" alt="" draggable={false} className="absolute pointer-events-none" style={{
        left: '50%', top: '-4%', width: 'min(72vw,760px)', transform: 'translateX(-50%)',
        imageRendering: 'pixelated', opacity: bit16 ? 0.5 : 0.4, mixBlendMode: 'screen',
        animation: 'stormPulse 9s ease-in-out infinite',
      }} />
      {/* warm glow halo directly behind the castle tower */}
      <div className="absolute pointer-events-none" style={{
        left: '50%', top: '30%', width: '46vmax', height: '46vmax', transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(255,190,110,.34), rgba(255,140,80,.12) 45%, transparent 70%)',
        mixBlendMode: 'screen', filter: 'blur(6px)',
        animation: 'towerGlow 5.5s ease-in-out infinite alternate',
      }} />
      {/* hanging lanterns framing the scene */}
      <img src="./landing/lantern-left.png" alt="" draggable={false} className="absolute pointer-events-none" style={{
        left: '2%', top: '10%', width: 'min(15vw,150px)', imageRendering: 'pixelated',
        transformOrigin: '50% 0', animation: 'lanternSway 4.2s ease-in-out infinite alternate',
        filter: 'drop-shadow(0 0 22px rgba(255,180,80,.75))',
      }} />
      <img src="./landing/lantern-right.png" alt="" draggable={false} className="absolute pointer-events-none" style={{
        right: '3%', top: '16%', width: 'min(13vw,132px)', imageRendering: 'pixelated',
        transformOrigin: '50% 0', animation: 'lanternSway 5.1s ease-in-out .6s infinite alternate-reverse',
        filter: 'drop-shadow(0 0 22px rgba(255,180,80,.7))',
      }} />
      {/* cinematic vignette + grade */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(3,1,12,.55) 100%)',
      }} />
      {!bit16 && (
        <>
          {/* teal/orange cinematic grade */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(40,60,120,.28), transparent 40%, rgba(255,150,60,.10))',
            mixBlendMode: 'overlay',
          }} />
          {/* cool moon key light from upper left */}
          <div className="absolute pointer-events-none" style={{
            left: '-10%', top: '-18%', width: '55vmax', height: '55vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,220,255,.30), transparent 65%)',
            filter: 'blur(30px)', animation: 'moonDrift 9s ease-in-out infinite alternate',
          }} />
          {/* faint film grain */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: .07, mixBlendMode: 'overlay', backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>\")" }} />
        </>
      )}
      {bit16 && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.2) 0 2px, transparent 2px 4px)' }} />
      )}
      {/* fireflies with warm/cool variety and glow pulse */}
      {!walking && Array.from({ length: 16 }, (_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: `${(i * 61.3 + 5) % 100}%`, top: `${60 + ((i * 29) % 28)}%`,
          width: 4 + (i % 3), height: 4 + (i % 3),
          background: i % 4 === 3 ? '#bfe6ff' : '#eaff9b',
          boxShadow: `0 0 ${10 + (i % 4) * 4}px ${i % 4 === 3 ? '#7BE0D4' : '#C6F24E'}`,
          animation: `firefly ${3 + ((i * 11) % 30) / 10}s ease-in-out ${((i * 7) % 20) / 10}s infinite`,
        }} />
      ))}
      {/* Oliver: foreground idle, then walks to the gate shrinking */}
      <div className="absolute" style={{
        left: walking ? '50%' : '18%',
        bottom: walking ? '30%' : '5%',
        transform: walking ? 'translateX(-50%)' : 'none',
        transition: 'left 1.5s ease-in-out, bottom 1.5s ease-in-out',
      }}>
        <div style={{ animation: walking ? 'walkBob .38s ease-in-out infinite' : 'bounce-soft 2.4s ease-in-out infinite' }}>
          <img
            src={bit16 ? SPRITES['walk-right-a'] : HD_SPRITES['hd-front-stand']}
            alt="Oliver waiting outside" draggable={false}
            style={{
              height: walking ? 110 : 'min(42vh,360px)',
              transition: 'height 1.5s ease-in-out',
              imageRendering: bit16 ? 'pixelated' : 'auto',
              filter: 'drop-shadow(0 18px 18px rgba(0,0,0,.65)) drop-shadow(0 0 26px rgba(198,242,78,.35))',
            }} />
        </div>
      </div>
      {/* theme switch */}
      {!walking && (
        <button onClick={onToggleBit}
          className="absolute font-display"
          style={{
            top: 16, right: 16, zIndex: 5, cursor: 'pointer',
            fontSize: 11, color: '#C6F24E', background: '#191448',
            border: '3px solid #C6F24E', borderRadius: 8, padding: '10px 14px',
            boxShadow: '0 4px 0 #000, 0 0 18px rgba(198,242,78,.5)',
          }}>
          {bit16 ? '▶ HD MODE' : '▶ 16-BIT'}
        </button>
      )}
      {/* 3D world portal */}
      {!walking && (
        <button onClick={onPlay3d}
          className="absolute font-display"
          style={{
            top: 64, right: 16, zIndex: 5, cursor: 'pointer',
            fontSize: 11, color: '#05031a', background: '#B9A7F9',
            border: '3px solid #05031a', borderRadius: 8, padding: '10px 14px',
            boxShadow: '0 4px 0 #000, 0 0 22px rgba(185,167,249,.75)',
            animation: 'portalPulse 2.4s ease-in-out infinite',
          }}>
          ▶ 3D WORLD
        </button>
      )}
      {/* the one button */}
      {!walking && (
        <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ bottom: '9%' }}>
          <button onClick={go}
            className="font-display font-extrabold text-white"
            style={{
              fontSize: 18, background: '#FF6B5B', border: '4px solid #000',
              borderRadius: bit16 ? 6 : 14, padding: '16px 42px', cursor: 'pointer',
              textShadow: '2px 2px 0 #000',
              boxShadow: '0 6px 0 #000, 0 0 40px #FF6B5B, 0 0 90px #FF6B5B66',
              animation: 'enterPulse 1.6s ease-in-out infinite',
            }}>
            ▶ ENTER
          </button>
        </div>
      )}
      {/* fade to black into the main board */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: '#000', opacity: blackout ? 1 : 0, transition: 'opacity .45s ease-in',
      }} />
      <style>{`
        @keyframes firefly { 0%,100%{ transform: translate(0,0) scale(.9); opacity:.2;} 35%{opacity:1;} 60%{ transform: translate(16px,-22px) scale(1.1);} 100%{ transform: translate(30px,-38px) scale(.85); opacity:.1;} }
        @keyframes walkBob { 0%,100%{ transform: translateY(0) rotate(-1deg);} 50%{ transform: translateY(-9px) rotate(1.5deg);} }
        @keyframes lanternSway { 0%{ transform: rotate(-4deg);} 100%{ transform: rotate(4.5deg);} }
        @keyframes towerGlow { 0%{ opacity:.55; transform: translate(-50%,-50%) scale(.96);} 100%{ opacity:1; transform: translate(-50%,-50%) scale(1.05);} }
        @keyframes stormPulse { 0%,86%,100%{ opacity:.35; filter:brightness(1);} 88%{ opacity:.75; filter:brightness(1.9);} 90%{ opacity:.4; filter:brightness(1);} 92%{ opacity:.7; filter:brightness(1.7);} 94%{ opacity:.35; filter:brightness(1);} }
        @keyframes portalPulse { 0%,100%{ box-shadow:0 4px 0 #000, 0 0 18px rgba(185,167,249,.55);} 50%{ box-shadow:0 4px 0 #000, 0 0 30px rgba(185,167,249,.95), 0 0 60px rgba(198,242,78,.35);} }
      `}</style>
    </div>
  );
}

export default React.memo(Landing);
