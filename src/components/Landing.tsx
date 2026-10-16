import { useEffect, useRef, useState } from 'react';
import { SPRITES, HD_SPRITES } from '../lib/sprites';

// Cinematic landing: Oliver outside the castle. ENTER → he walks to the gate,
// shrinks into the distance, the door bursts open with light, fade to black.
export default function Landing({ bit16, onToggleBit, onEnter }: {
  bit16: boolean; onToggleBit: () => void; onEnter: () => void;
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
      {/* cinematic vignette + grade */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(3,1,12,.55) 100%)',
      }} />
      {bit16 && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.2) 0 2px, transparent 2px 4px)' }} />
      )}
      {/* fireflies */}
      {!walking && Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: `${(i * 61.3 + 5) % 100}%`, top: `${64 + ((i * 29) % 24)}%`,
          width: 5, height: 5, background: '#eaff9b', boxShadow: '0 0 12px #C6F24E',
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
        @keyframes firefly { 0%,100%{ transform: translate(0,0); opacity:.2;} 50%{ transform: translate(24px,-30px); opacity:1;} }
        @keyframes walkBob { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-9px);} }
      `}</style>
    </div>
  );
}
