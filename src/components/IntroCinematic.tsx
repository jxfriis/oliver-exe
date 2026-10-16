import React, { useEffect, useRef, useState, type CSSProperties } from 'react';

import { SPRITES } from '../lib/sprites';

// The "Oliver notices you" entrance: dark stage → spotlight on his back →
// he turns with heart eyes → leaps at the screen and kisses it (drool runs)
// → glides back down → hands over to the real game. ~6.5s, skippable.
type Phase = 'dark' | 'spotlight' | 'turn' | 'leap' | 'kiss' | 'glide';

function IntroCinematic({ bit16, onDone }: { bit16: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('dark');
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; s: number; d: number }[]>([]);
  const [drool, setDrool] = useState<{ id: number; x: number; w: number; len: number; delay: number }[]>([]);
  const timers = useRef<number[]>([]);
  const doneRef = useRef(false);

  const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };

  useEffect(() => {
    const T = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    T(() => setPhase('spotlight'), 700);
    T(() => setPhase('turn'), 2300);
    T(() => {
      setHearts(Array.from({ length: 14 }, (_, i) => ({
        id: i, x: 20 + ((i * 47) % 60), y: 18 + ((i * 31) % 50),
        s: 16 + ((i * 13) % 26), d: (i % 5) * 0.14,
      })));
    }, 2500);
    T(() => setPhase('leap'), 4100);
    T(() => {
      setPhase('kiss');
      setDrool(Array.from({ length: 7 }, (_, i) => ({
        id: i, x: 34 + i * 5.5, w: 5 + (i % 3) * 3, len: 22 + ((i * 17) % 30), delay: (i % 4) * 0.25,
      })));
    }, 4750);
    T(() => setPhase('glide'), 6500);
    T(finish, 7900);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sprite = phase === 'dark' || phase === 'spotlight'
    ? './sprites/oliver-intro-sit.png'
    : phase === 'turn' ? './sprites/oliver-intro-tears.png'
    : phase === 'leap' ? './sprites/oliver-intro-hearts.png'
    : phase === 'kiss' ? './sprites/oliver-intro-smooch.png'
    : SPRITES['sit-fall'];

  let imgAnim = 'none';
  let imgStyle: CSSProperties = {};
  if (phase === 'spotlight') imgAnim = 'introSway 1.6s ease-in-out infinite';
  if (phase === 'turn') imgAnim = 'introTurn .55s cubic-bezier(.34,1.56,.64,1) both';
  if (phase === 'leap') imgAnim = 'introLeap .65s cubic-bezier(.5,-.2,.8,.4) both';
  if (phase === 'kiss') imgAnim = 'introPress 1.7s ease-out both';
  if (phase === 'glide') imgAnim = 'introGlide 1.4s ease-in-out both';

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ zIndex: 500, background: '#020108', cursor: 'pointer' }} onClick={finish}>
      {/* ambient haze so pure black doesn't feel dead */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(43,80,224,.08), transparent 60%)' }} />
      {/* spotlight cone onto him */}
      {(phase !== 'dark') && (
        <div className="absolute left-1/2 top-0 pointer-events-none" style={{
          width: '46vmin', height: '110vh', transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(255,240,200,.0) 0%, rgba(255,236,180,.28) 22%, rgba(255,236,180,.10) 78%, transparent)',
          clipPath: 'polygon(44% 0, 56% 0, 92% 100%, 8% 100%)',
          filter: 'blur(6px)', opacity: phase === 'glide' ? 0.4 : 1, transition: 'opacity .6s',
        }} />
      )}
      {/* floor pool of light */}
      {phase !== 'dark' && (
        <div className="absolute left-1/2 pointer-events-none rounded-full" style={{
          bottom: '12%', width: '52vmin', height: '12vmin', transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(255,236,180,.35), transparent 70%)',
          filter: 'blur(10px)', opacity: phase === 'glide' ? 0.4 : 1, transition: 'opacity .6s',
        }} />
      )}
      {/* OLIVER */}
      <div className="absolute left-1/2" style={{
        bottom: phase === 'kiss' || phase === 'leap' ? undefined : '14%',
        top: phase === 'kiss' || phase === 'leap' ? '50%' : undefined,
        transform: 'translateX(-50%)',
      }}>
        <img src={sprite} alt="" draggable={false} style={{
          height: phase === 'kiss' || phase === 'leap' ? '150vmin' : '52vmin',
          imageRendering: 'pixelated',
          animation: imgAnim === 'none' ? undefined : imgAnim,
          transformOrigin: '50% 60%',
          filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.8))',
          ...imgStyle,
        }} />
      </div>
      {/* hearts floating around him when he sees you */}
      {hearts.map((h) => (
        <div key={h.id} className="absolute pointer-events-none" style={{
          left: `${h.x}%`, top: `${h.y}%`, fontSize: h.s,
          animation: `introHeart 1.6s ease-out ${h.d}s both`,
          filter: 'drop-shadow(0 0 8px rgba(255,80,140,.9))', zIndex: 3,
        }}>💖</div>
      ))}
      {/* drool running down the glass during the kiss */}
      {drool.map((d) => (
        <div key={`dr${d.id}`} className="absolute pointer-events-none" style={{
          left: `${d.x}%`, top: '46%', width: d.w, height: `${d.len}vh`,
          borderRadius: 999, zIndex: 6,
          background: 'linear-gradient(180deg, rgba(190,235,255,.95), rgba(150,215,255,.25))',
          boxShadow: '0 0 10px rgba(180,230,255,.8)',
          animation: `introDrool 1.9s ease-in ${d.delay}s both`,
        }} />
      ))}
      {/* greasy kiss smudge on the glass */}
      {phase === 'kiss' && (
        <div className="absolute left-1/2 top-[42%] pointer-events-none rounded-full" style={{
          width: '60vmin', height: '34vmin', transform: 'translate(-50%,-50%) rotate(-4deg)',
          background: 'radial-gradient(ellipse, rgba(255,255,255,.16), rgba(190,235,255,.10) 55%, transparent 72%)',
          filter: 'blur(4px)', animation: 'pop-in .4s ease both', zIndex: 5,
        }} />
      )}
      {/* captions */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center font-display font-extrabold pop-in" style={{
        bottom: '4%', color: '#C6F24E', fontSize: 13, letterSpacing: '.14em',
        textShadow: '2px 2px 0 #000', zIndex: 8, opacity: phase === 'glide' ? 0 : 0.9, transition: 'opacity .5s',
      }}>
        {phase === 'dark' || phase === 'spotlight' ? '*someone is sitting in the dark…*'
          : phase === 'turn' ? 'wait… he NOTICED you 🥺'
          : phase === 'leap' ? 'HE SEES YOU 💖'
          : '😗 SMOOCH — he is kissing YOUR SCREEN'}
      </div>
      <div className="absolute right-4 top-4 font-display" style={{ color: '#5f5a8f', fontSize: 11, zIndex: 8 }}>click to skip ▶</div>
      {bit16 && <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 2px, transparent 2px 4px)' }} />}
      <style>{`
        @keyframes introSway { 0%,100%{ transform: translateX(-50%) translateY(0);} 50%{ transform: translateX(-50%) translateY(-8px);} }
        @keyframes introTurn { 0%{ transform: translateX(-50%) scaleX(1);} 45%{ transform: translateX(-50%) scaleX(.12);} 100%{ transform: translateX(-50%) scaleX(1);} }
        @keyframes introLeap { 0%{ transform: translate(-50%,-50%) scale(.35);} 70%{ transform: translate(-50%,-50%) scale(1.12);} 100%{ transform: translate(-50%,-50%) scale(1);} }
        @keyframes introPress { 0%{ transform: translate(-50%,-50%) scale(1) rotate(0deg);} 18%{ transform: translate(-50%,-50%) scale(1.05) rotate(-2deg);} 40%{ transform: translate(-50%,-50%) scale(1.02) rotate(1.5deg);} 62%{ transform: translate(-50%,-50%) scale(1.06) rotate(-1deg);} 100%{ transform: translate(-50%,-50%) scale(1.03) rotate(0deg);} }
        @keyframes introGlide { 0%{ transform: translate(-50%,-50%) scale(1.03);} 30%{ transform: translate(-46%,-58%) scale(.5) rotate(6deg);} 100%{ transform: translate(-50%,60vh) scale(.32) rotate(-4deg); opacity:.2;} }
        @keyframes introHeart { 0%{ transform: translateY(0) scale(.4); opacity:0;} 25%{ opacity:1;} 100%{ transform: translateY(-70px) scale(1.15); opacity:0;} }
        @keyframes introDrool { 0%{ transform: scaleY(0); opacity:0; transform-origin: top;} 15%{ opacity:1;} 100%{ transform: scaleY(1) translateY(30vh); opacity:.85; transform-origin: top;} }
      `}</style>
    </div>
  );
}
export default React.memo(IntroCinematic);
