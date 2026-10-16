import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MousePointer2, Shirt, Pencil, Hand, Rocket, PartyPopper, MessageCircle,
  Gamepad2, Sparkles, Camera, Users, Volume2, VolumeX, HelpCircle, RotateCcw,
  Dices, Trophy, Star, Zap, Crown, Timer, Play, Pause, Binary, Settings,
} from 'lucide-react';
import OliverCharacter, { DEFAULT_TRANSFORM, type OliverTransform, type StageSprite } from './components/OliverCharacter';
import SketchLayer, { type SketchHandle, type Stroke, type StampMark } from './components/SketchLayer';
import BitLighting from './components/BitLighting';
import DiscoFloor from './components/DiscoFloor';
import Landing from './components/Landing';
import Tutorial, { tourSeen, markTourSeen } from './components/Tutorial';
import { GEAR, gearDef } from './components/FittedGear';
import Basketball from './games/Basketball';
import Pong from './games/Pong';
import Maze from './games/Maze';
import RocketGame from './games/Rocket';
import Flappy from './games/Flappy';
import Snake from './games/Snake';
import { CoinDash, WhackOliver } from './games/FunGames';
import { sfx, setSoundEnabled, startBeat, stopBeat, setVolume as setMasterVol, getVolume } from './lib/sound';
import {
  CHASE_PHRASES, POKE_PHRASES_HEAD, POKE_PHRASES_BODY, POKE_PHRASES_FEET,
  GENERATOR_NAMES, ACHIEVEMENTS, BOOTH_BGS, type ModeId, type PlacedAccessory,
} from './lib/data';
import { SPRITES, HD_SPRITES, HD_CUTOUT, walkFrame, hdWalkFrame, hdSpriteFor, type SpriteId } from './lib/sprites';
import { pickMeltdown, MAD_PHRASES } from './lib/meltdowns';
import { meme, rickStart, rickStop, tracksSetVolume, warmAudio } from './lib/tracks';

import { preloadAll } from './lib/preload';

let uidCounter = 1;

type BubbleStyle = 'normal' | 'angry' | 'whisper' | 'announce' | 'thought';
type GameSub = 'catch' | 'avoid' | 'basket' | 'pong' | 'dash' | 'whack' | 'maze' | 'rocket' | 'flappy' | 'snake';

export default function App() {
  const [mode, setMode] = useState<ModeId>('chase');
  const [soundOn, setSoundOn] = useState(false); // landing stays silent; consent asks on entry
  const [soundAsk, setSoundAsk] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [interactions, setInteractions] = useState(0);
  const [chaos, setChaos] = useState(12);
  const [transform, setTransform] = useState<OliverTransform>(DEFAULT_TRANSFORM);
  const [accessories, setAccessories] = useState<PlacedAccessory[]>([]);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [bubble, setBubble] = useState<{ text: string; style: BubbleStyle } | null>({ text: 'Hi! I\'m Oliver. Click me!', style: 'normal' });
  const [sayText, setSayText] = useState('Hello! I am Oliver!');
  const [sayStyle, setSayStyle] = useState<BubbleStyle>('normal');
  const [stars, setStars] = useState<{ id: number; x: number; y: number; txt: string }[]>([]);
  const [pokeCount, setPokeCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sleeping, setSleeping] = useState(false);
  const [glassesPop, setGlassesPop] = useState(0);
  const [hairBounce, setHairBounce] = useState(0);
  const [secretMode, setSecretMode] = useState(false);
  const [scurry, setScurry] = useState(false);
  const [logoScatter, setLogoScatter] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; txt: string }[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('oliver-achievements') || '[]'); } catch { return []; }
  });
  // sketch
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#2B50E0');
  const [brushW, setBrushW] = useState(5);
  const [stamp, setStamp] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [stampMarks, setStampMarks] = useState<StampMark[]>([]);
  const sketchRef = useRef<SketchHandle>(null);
  // dance
  const [danceOn, setDanceOn] = useState(false);
  const [dancePreset, setDancePreset] = useState('Disco');
  const [confetti, setConfetti] = useState<{ id: number; x: number; c: string; d: number }[]>([]);
  // gravity
  const [gravLevel, setGravLevel] = useState<'normal' | 'low' | 'zero'>('normal');
  const [balls, setBalls] = useState<{ id: number; x: number; y: number; vx: number; vy: number; c: string }[]>([]);
  // games
  const [gameSub, setGameSub] = useState<GameSub>('catch');
  const [catchOn, setCatchOn] = useState(false);
  const [catchScore, setCatchScore] = useState(0);
  const [catchTime, setCatchTime] = useState(30);
  const [catchBest, setCatchBest] = useState(() => Number(localStorage.getItem('oliver-catch-best') || 0));
  const [entered, setEntered] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vol, setVol] = useState(() => getVolume());
  const [avoidOn, setAvoidOn] = useState(false);
  const [avoidStatus, setAvoidStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [avoidTime, setAvoidTime] = useState(0);
  // generator / booth / army
  const [genName, setGenName] = useState('Classic Oliver');
  const [boothBg, setBoothBg] = useState(BOOTH_BGS[0]);
  const [boothPose, setBoothPose] = useState(0);
  const [army, setArmy] = useState<{ id: number; x: number; y: number; vx: number; vy: number; s: number }[]>([]);
  const [armyFollow, setArmyFollow] = useState(true);
  // 16-bit mode + sprite pose (16-bit is the default home)
  const [bit16, setBit16] = useState(true);
  const [pose, setPose] = useState<StageSprite>('cutout-photo');
  const [flip, setFlip] = useState(false);
  // mad + meltdowns
  const [madUntil, setMadUntil] = useState(0);
  const [fumingUntil, setFumingUntil] = useState(0); // warning stage before a real meltdown
  const [meltdown, setMeltdown] = useState<{ id: string; title: string; until: number } | null>(null);
  const [invertUntil, setInvertUntil] = useState(0);
  const [blackoutUntil, setBlackoutUntil] = useState(0);
  const [giantUntil, setGiantUntil] = useState(0);
  const lastMeltdownId = useRef<string | null>(null);
  const poseRef = useRef<StageSprite>('cutout-photo');
  const flipRef = useRef(false);
  const poseT = useRef(0);
  const decayRef = useRef(0);
  const walkDist = useRef(0);

  // chase-the-runner score
  const [catches, setCatches] = useState(0);
  const [misses, setMisses] = useState(0);
  const [runLevel, setRunLevel] = useState(0);
  const [chaseBest, setChaseBest] = useState(() => Number(localStorage.getItem('oliver-chase-best') || 0));
  const [hitFx, setHitFx] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const phys = useRef({
    px: 0, py: 0, vx: 0, vy: 0, tilt: 0, faceX: 0, faceY: 0,
    squashX: 1, squashY: 1, squashT: 0,
    cx: 0, cy: 0, // cursor in stage-centered coords
    dragging: false, dragOffX: 0, dragOffY: 0,
    distractX: 0, distractY: 0, distractT: 0,
    lastBubble: 0, lastInteract: Date.now(),
    hoverStart: 0, jumpV: 0, stunUntil: 0, dodgeAt: 0, shrink: 1,
    avoidX: -140, avoidY: -100, avoidOliverX: 60, avoidOliverY: 40,
  });
  const [oliverH, setOliverH] = useState(440);
  const typedBuf = useRef('');

  useEffect(() => {
    const fit = () => setOliverH(Math.max(300, Math.min(560, window.innerHeight * 0.58)));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => { setSoundEnabled(soundOn); if (!soundOn) rickStop(); }, [soundOn]);
  useEffect(() => { tracksSetVolume(); }, [vol]);
  useEffect(() => { preloadAll(); warmAudio(); }, []);

  const unlock = useCallback((id: string) => {
    setUnlocked((u) => {
      if (u.includes(id)) return u;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      const nu = [...u, id];
      try { localStorage.setItem('oliver-achievements', JSON.stringify(nu)); } catch { /* noop */ }
      const tid = Date.now() + Math.random();
      setToasts((t) => [...t, { id: tid, txt: `${def?.icon || '🏆'} ${def?.name} — ${def?.desc}` }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 4200);
      sfx.yay();
      return nu;
    });
  }, []);

  // Oliver gets MAD and something really crazy — and different — happens.
  const triggerMeltdown = () => {
    const m = pickMeltdown(lastMeltdownId.current, mode);
    lastMeltdownId.current = m.id;
    const now = Date.now();
    setMadUntil(now + 9000);
    setMeltdown({ id: m.id, title: m.title, until: now + 6000 });
    setTimeout(() => setMeltdown((x) => (x && Date.now() >= x.until ? null : x)), 6200);
    unlock('meltdown');
    unlock('chaos');
    sfx.rage();
    setTimeout(() => meme('cry'), 700);
    say(`${m.shout} ${m.title}!!!`, 'angry');
    const P = phys.current;
    if (m.id === 'invert') { setInvertUntil(now + 6000); }
    else if (m.id === 'meteor') {
      setBalls((b) => [...b.slice(-4), ...Array.from({ length: 8 }, (_, i) => ({
        id: now + i, x: (Math.random() - 0.5) * 400, y: -200 - i * 40,
        vx: (Math.random() - 0.5) * 6, vy: 2, c: ['#B9A7F9', '#2B50E0', '#C6F24E', '#FF6B5B', '#FFD23F'][i % 5],
      }))]);
    }
    else if (m.id === 'invasion') { spawnArmy(20); }
    else if (m.id === 'giant') { setGiantUntil(now + 10000); }
    else if (m.id === 'blackout') { setBlackoutUntil(now + 5000); startBeat(140); setTimeout(() => stopBeat(), 5200); }
    else if (m.id === 'wardrobe-explosion') {
      const shuffled = [...GEAR].sort(() => Math.random() - 0.5).slice(0, 6);
      const boomIds = shuffled.map(() => uidCounter++);
      setAccessories(shuffled.map((d, i) => ({ uid: boomIds[i], defId: d.id, dx: 0, dy: 0, scale: 1, rot: (Math.random() - 0.5) * 24 })));
      // the clothes vanish again almost as fast as they appeared
      setTimeout(() => {
        setAccessories((acc) => acc.filter((x) => !boomIds.includes(x.uid)));
        setSelectedUid((s) => (s != null && boomIds.includes(s) ? null : s));
      }, 4000);
      meme('hehehaw');
    }
    else if (m.id === 'gravity-flip') {
      setMode('gravity'); setGravLevel('zero');
      P.vy = -16; P.vx = (Math.random() - 0.5) * 10;
      setTimeout(() => setGravLevel('normal'), 8000);
    }
    else if (m.id === 'stampede') {
      setScurry(true);
      setTimeout(() => setScurry(false), 6000);
      spawnArmy(8);
      setConfetti(Array.from({ length: 40 }, (_, i) => ({
        id: now + i, x: Math.random() * 100,
        c: ['#B9A7F9', '#2B50E0', '#C6F24E', '#FF6B5B', '#FFD23F'][i % 5],
        d: 2 + Math.random() * 2,
      })));
      setTimeout(() => setConfetti([]), 3500);
    }
    bump(3, -70);
  };

  const say = useCallback((text: string, style: BubbleStyle = 'normal') => {
    setBubble({ text, style });
  }, []);

  const bump = useCallback((n = 1, c = 5) => {
    setInteractions((i) => i + n);
    phys.current.lastInteract = Date.now();
    setSleeping(false);
    const fuming = Date.now() < fumingUntil;
    const gain = fuming ? c * 2 : c; // poking a fuming Oliver is reckless
    setChaos((ch) => {
      const v = Math.min(100, Math.max(0, ch + gain));
      if (v >= 100) {
        if (fuming) {
          // REALLY mad now — full meltdown
          setFumingUntil(0);
          setTimeout(() => triggerMeltdown(), 50);
          return 30;
        }
        // first boiling point: WARNING stage, not a meltdown yet
        setFumingUntil(Date.now() + 12000);
        setTimeout(() => {
          say('I am WARNING you… 😤', 'angry');
          sfx.grr();
        }, 50);
        return 92;
      }
      return v;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlock, fumingUntil, say]);

  // Master physics loop
  useEffect(() => {
    let raf = 0;
    const P = phys.current;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const stage = stageRef.current;
      const W = stage?.clientWidth || 800, H = stage?.clientHeight || 600;
      const now = Date.now();
      const t = transform;

      // squash decay
      if (P.squashT > 0) {
        P.squashT -= 1;
        if (P.squashT <= 0) { P.squashX = 1; P.squashY = 1; }
      }

      if (mode === 'chase') {
        // CATCH THE RUNNER: Oliver flees the cursor. Click him to catch —
        // each catch makes him faster and smaller. Misses make him cocky.
        if (now < P.stunUntil) {
          P.vx *= 0.9; P.vy *= 0.9; P.px += P.vx; P.py += P.vy;
        } else {
          const dx = P.px - P.cx, dy = P.py - P.cy;
          const d = Math.hypot(dx, dy) || 1;
          const lvl = Math.min(8, runLevel);
          const fleeR = Math.min(W, H) * 0.30;
          let tx = P.px + (dx / d) * fleeR;
          let ty = P.py + (dy / d) * fleeR;
          if (P.distractT > now) { tx = P.distractX; ty = P.distractY; }
          else if (Math.random() < 0.002) {
            P.distractX = (Math.random() - 0.5) * W * 0.6;
            P.distractY = (Math.random() - 0.5) * H * 0.5;
            P.distractT = now + 1500;
            if (Math.random() < 0.5) say(rand(['ooh, shiny…', 'brb, distracted!', 'was that confetti?']));
          }
          const k = 0.010 + lvl * 0.0012;
          P.vx += (tx - P.px) * k; P.vy += (ty - P.py) * k;
          // dodge! sidestep when the cursor gets close
          if (d < 130 && now > P.dodgeAt) {
            P.dodgeAt = now + 900;
            const s = Math.random() < 0.5 ? 1 : -1;
            P.vx += (-dy / d) * 7 * s; P.vy += (dx / d) * 7 * s;
            sfx.dodge();
            if (Math.random() < 0.3) { say(rand(['TOO SLOW!', 'WHIFF!', 'CANNOT CATCH ME!', 'nice try!!'])); meme('hehe'); }
          }
          const cap = 4.3 + lvl * 0.65;
          const speed = Math.hypot(P.vx, P.vy);
          if (speed > cap) { P.vx *= cap / speed; P.vy *= cap / speed; }
          P.vx *= 0.985; P.vy *= 0.985;
          P.px += P.vx; P.py += P.vy;
        }
        const speed = Math.hypot(P.vx, P.vy);
        // clamp + edge peek-back
        const mx = W / 2 - 90, my = H / 2 - 120;
        if (Math.abs(P.px) > mx || Math.abs(P.py) > my) {
          P.px = Math.max(-mx, Math.min(mx, P.px));
          P.py = Math.max(-my, Math.min(my, P.py));
          P.vx *= -0.4; P.vy *= -0.4;
          if (Math.random() < 0.1) { say('peek-a-boo!'); sfx.pop(); }
        }
        P.tilt += ((P.vx * 0.9) - P.tilt) * 0.1;
        P.faceX += (Math.max(-1, Math.min(1, (P.cx - P.px) / 200)) - P.faceX) * 0.08;
        P.faceY += (Math.max(-1, Math.min(1, (P.cy - P.py) / 200)) - P.faceY) * 0.08;
        if (now - P.lastBubble > 11000 && speed > 1 && Math.random() < 0.008) {
          P.lastBubble = now; say(rand(CHASE_PHRASES));
        }
      } else if (mode === 'gravity') {
        if (!P.dragging) {
          const g = gravLevel === 'normal' ? 0.55 : gravLevel === 'low' ? 0.18 : 0;
          P.vy += g + (mode === 'gravity' && P.jumpV ? P.jumpV : 0);
          P.jumpV = 0;
          P.vx *= 0.995; P.vy *= 0.999;
          P.px += P.vx; P.py += P.vy;
          const mx = W / 2 - 100, fl = H / 2 - 130;
          if (P.px < -mx) { P.px = -mx; P.vx = Math.abs(P.vx) * 0.75; sfx.pop(); }
          if (P.px > mx) { P.px = mx; P.vx = -Math.abs(P.vx) * 0.75; sfx.pop(); }
          if (P.py > fl) {
            P.py = fl;
            const impact = Math.abs(P.vy);
            P.vy = -impact * 0.72;
            P.vx *= 0.94;
            if (impact > 1.5) { sfx.thud(); if (impact > 9) meme('fart'); }
            if (Math.abs(P.vy) < 0.8) P.vy = 0;
          }
          if (P.py < -H / 2) { P.py = -H / 2; P.vy = Math.abs(P.vy) * 0.6; }
          P.tilt += ((P.vx * 1.2) - P.tilt) * 0.08;
        }
        // balls physics (skip when empty to avoid 60fps re-renders)
        if (mode === 'gravity' && balls.length > 0) {
        setBalls((bs) => bs.map((b) => {
          let { x, y, vx, vy } = b;
          vy += gravLevel === 'normal' ? 0.5 : gravLevel === 'low' ? 0.15 : 0;
          x += vx; y += vy;
          const bx = W / 2 - 20, by = H / 2 - 20;
          if (x < -bx) { x = -bx; vx = Math.abs(vx) * 0.8; }
          if (x > bx) { x = bx; vx = -Math.abs(vx) * 0.8; }
          if (y > by) { y = by; vy = -Math.abs(vy) * 0.78; vx *= 0.98; }
          if (y < -by) { y = -by; vy = Math.abs(vy) * 0.8; }
          // simplified Oliver collision proxy (circle)
          const dx = x - P.px, dy = y - (P.py - 20);
          const d = Math.hypot(dx, dy);
          if (d < 110 && d > 1) { const push = (110 - d) / 110; x += (dx / d) * push * 14; y += (dy / d) * push * 14; vx += (dx / d) * 1.2; vy += (dy / d) * 1.2; }
          return { ...b, x, y, vx, vy };
        }));
        }
      } else if (mode === 'games' && gameSub === 'catch' && catchOn) {
        // Oliver teleports handled by timer; gentle wobble here
        P.px += Math.sin(now / 300) * 0.6; P.py += Math.cos(now / 380) * 0.5;
      } else {
        // default: ease back to center with idle bob (all creative modes)
        if (!P.dragging) {
          P.vx += (0 - P.px) * 0.02; P.vy += (0 - P.py) * 0.02;
          P.vx *= 0.9; P.vy *= 0.9;
          P.px += P.vx; P.py += P.vy + Math.sin(now / 900) * 0.25;
          P.tilt += (0 - P.tilt) * 0.06;
          P.faceX += ((P.cx - P.px) / 400 - P.faceX) * 0.03;
          P.faceY += ((P.cy - P.py) / 400 - P.faceY) * 0.03;
        }
      }
      // space jump impulse
      if (P.jumpV && mode !== 'gravity') { P.py -= 6; P.jumpV = 0; }

      // army wander
      if (army.length) {
        setArmy((arr) => arr.map((m) => {
          let vx = m.vx, vy = m.vy;
          if (armyFollow) { vx += (P.cx - m.x) * 0.0006; vy += (P.cy - m.y) * 0.0006; }
          vx += (Math.random() - 0.5) * 0.3; vy += (Math.random() - 0.5) * 0.3;
          vx *= 0.985; vy *= 0.985;
          let x = m.x + vx, y = m.y + vy;
          const bx = W / 2 - 30, by = H / 2 - 30;
          if (x < -bx || x > bx) vx *= -1;
          if (y < -by || y > by) vy *= -1;
          x = Math.max(-bx, Math.min(bx, x)); y = Math.max(-by, Math.min(by, y));
          return { ...m, x, y, vx, vy };
        }));
      }

      // idle sleep (never while the dance party is on)
      if (now - P.lastInteract > 45000 && !sleeping && !danceOn) { setSleeping(true); unlock('sleeper'); }

      // fuming expires → he calms down (this time)
      if (fumingUntil && now > fumingUntil) {
        setFumingUntil(0);
        setChaos(50);
        say('...fine. I am calm. THIS time.');
      }
      // slow chaos decay when left alone
      if (now - P.lastInteract > 3000 && now - decayRef.current > 2000) {
        decayRef.current = now;
        setChaos((c) => Math.max(fumingUntil ? 60 : 0, c - 1));
      }

      // Sprite pose: pick the right picture for the interaction.
      // 16-bit → pixel sheet; HD → realistic sheet; default base = transparent photo.
      if (now - poseT.current > 130) {
        poseT.current = now;
        let sp: StageSprite = bit16 ? 'front-stand' : 'cutout-photo';
        let fl = false;
        const mad = now < madUntil;
        const speed = Math.hypot(P.vx, P.vy);
        if (!mad) {
          if (bit16) {
            if (sleeping) sp = 'sleep-16';
            else if (mode === 'dressup') sp = 'front-stand';
            else if (mode === 'chase') {
              if (speed > 1.1) { walkDist.current += speed * 9; sp = walkFrame(walkDist.current); fl = P.vx < 0; }
              else sp = P.cx - P.px < 0 ? 'side-stand-left' : 'side-stand-right';
            }
            else if (mode === 'gravity') sp = (!P.dragging && (Math.abs(P.vy) > 2.5 || Math.abs(P.vx) > 3)) ? 'sit-fall' : 'front-stand';
            else if (mode === 'dance' && danceOn) sp = Math.floor(now / 380) % 2 ? 'dance-point-up' : 'dance-point-left';
            else if (mode === 'games' && gameSub === 'catch') sp = 'face-happy';
            else if (mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing') {
              walkDist.current += 7; sp = walkFrame(walkDist.current); fl = (P.cx - P.avoidOliverX) < 0;
            }
          } else {
            // HD photo mode: swap the realistic sheet in per action
            const hd = hdSpriteFor(mode, {
              moving: mode === 'chase' ? speed > 1.1 : mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing' ? true : undefined,
              dirX: mode === 'chase' ? P.cx - P.px : P.vx,
              airborne: mode === 'gravity' ? (!P.dragging && (Math.abs(P.vy) > 2.5 || Math.abs(P.vx) > 3)) : undefined,
              sleeping: sleeping && !danceOn || undefined,
              dancing: mode === 'dance' && danceOn,
              gameSub: mode === 'games' ? gameSub : undefined,
              avoiding: mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing',
            });
            if (hd) {
              if (mode === 'chase' && speed > 1.1) { walkDist.current += speed * 9; sp = hdWalkFrame(walkDist.current); fl = P.vx < 0; }
              else { sp = hd; fl = hd.startsWith('hd-walk') ? P.vx < 0 : false; }
            }
          }
        }
        if (sp !== poseRef.current || fl !== flipRef.current) {
          poseRef.current = sp; flipRef.current = fl;
          setPose(sp); setFlip(fl);
        }
      }

      const giant = now < giantUntil;
      const dancing = mode === 'dance' && danceOn;
      const baseScale = (giant ? 2.1 : secretMode ? 1.06 : 1) * (mode === 'chase' ? P.shrink : 1);
      const nt: OliverTransform = {
        x: P.px, y: P.py,
        // beat bounce while dancing + instant revert when the party stops
        scale: dancing ? baseScale * (1 + Math.sin(now / 160) * 0.035) : baseScale, rot: 0,
        squashX: P.squashX, squashY: P.squashY, tilt: Math.max(-14, Math.min(14, P.tilt)),
        faceX: P.faceX, faceY: P.faceY,
      };
      setTransform((prev) =>
        Math.abs(prev.x - nt.x) < 0.05 && Math.abs(prev.y - nt.y) < 0.05 &&
        Math.abs(prev.tilt - nt.tilt) < 0.05 && Math.abs(prev.scale - nt.scale) < 0.004 &&
        prev.squashX === nt.squashX ? prev : nt
      );
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gravLevel, gameSub, catchOn, army.length, armyFollow, secretMode, balls.length, sleeping, bit16, danceOn, madUntil, giantUntil, avoidStatus, runLevel, fumingUntil]);

  // catch game timer
  useEffect(() => {
    if (!catchOn) return;
    if (catchTime <= 0) {
      setCatchOn(false); sfx.yay();
      setCatchBest((b) => { const nb = Math.max(b, catchScore); localStorage.setItem('oliver-catch-best', String(nb)); return nb; });
      say(catchScore >= 10 ? `WOW! ${catchScore} catches!` : `You caught me ${catchScore} times!`);
      if (catchScore >= 10) unlock('shooter');
      return;
    }
    const id = window.setTimeout(() => setCatchTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [catchOn, catchTime, catchScore, say, unlock]);

  // catch teleport
  useEffect(() => {
    if (!catchOn) return;
    const id = window.setInterval(() => {
      const P = phys.current;
      const stage = stageRef.current;
      const W = stage?.clientWidth || 700, H = stage?.clientHeight || 500;
      P.px = (Math.random() - 0.5) * (W - 260);
      P.py = (Math.random() - 0.5) * (H - 260);
      P.vx = 0; P.vy = 0;
    }, 1100);
    return () => clearInterval(id);
  }, [catchOn]);

  // avoid game timer
  useEffect(() => {
    if (avoidStatus !== 'playing') return;
    const id = window.setInterval(() => setAvoidTime((t) => t + 0.1), 100);
    return () => clearInterval(id);
  }, [avoidStatus]);

  // meme reactions on mode entry + dress-up mannequin reset
  useEffect(() => {
    if (mode === 'chase') meme('getback');
    if (mode === 'dressup') {
      // default state so clothes snap on correctly: awake, centered, front pose
      setSleeping(false);
      const P = phys.current;
      P.px = 0; P.py = 0; P.vx = 0; P.vy = 0; P.tilt = 0;
      P.squashX = 1; P.squashY = 1; P.squashT = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => { if (!danceOn) { stopBeat(); rickStop(); } }, [danceOn, mode]);

  // leaving the dance tab ends the party: music stops, pose reverts
  useEffect(() => {
    if (mode !== 'dance') setDanceOn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // keyboard: space jump + OLIVER code
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.code === 'Space' && !typing) {
        e.preventDefault();
        phys.current.jumpV = -3; phys.current.vy = -11;
        phys.current.squashY = 1.18; phys.current.squashX = 0.86; phys.current.squashT = 14;
        sfx.boing(); bump(1, 4); say(rand(['WHEEE!', 'BOING!', 'TO THE MOON!']));
      }
      if (!typing && /^[a-zA-Z]$/.test(e.key)) {
        typedBuf.current = (typedBuf.current + e.key.toUpperCase()).slice(-6);
        if (typedBuf.current.endsWith('OLIVER')) {
          typedBuf.current = '';
          setSecretMode(true); setScurry(true); unlock('secret');
          say('YOU FOUND ME!!!'); sfx.yay(); bump(3, 15);
          setTimeout(() => { setSecretMode(false); setScurry(false); }, 12000);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bump, say, unlock]);

  const burst = (region: string) => {
    const id = Date.now() + Math.random();
    const P = phys.current;
    const texts = region === 'head' ? POKE_PHRASES_HEAD : region === 'feet' ? POKE_PHRASES_FEET : POKE_PHRASES_BODY;
    setStars((s) => [...s.slice(-8), { id, x: P.px, y: P.py - 60, txt: `${rand(['⭐', '💥', '✨'])} ${rand(texts)}` }]);
    setTimeout(() => setStars((s) => s.filter((x) => x.id !== id)), 1600);
  };

  const handleRegionClick = (region: 'glasses' | 'hair' | 'head' | 'torso' | 'feet' | 'body') => {
    const P = phys.current;
    const mad = Date.now() < madUntil;
    P.squashX = 1.22; P.squashY = 0.78; P.squashT = 12;
    // punching him: anime hit flash + impact sound
    setHitFx(Date.now());
    if (mode === 'poke') { sfx.punch(); } else { sfx.poke(); }
    bump(1, mad ? 9 : 5);
    setPokeCount((c) => {
      const n = c + 1;
      if (n >= 20) unlock('menace');
      return n;
    });
    setCombo((c) => {
      const n = c + 1;
      if (n === 8) { say('COMBO x8!! UNSTOPPABLE!'); sfx.yay(); }
      return n;
    });
    setTimeout(() => setCombo(0), 1400);
    unlock('first-contact');

    if (mad) { say(rand(MAD_PHRASES), 'angry'); sfx.grr(); meme('cry'); burst('head'); }
    else if (region === 'glasses') { setGlassesPop(Date.now()); say(rand(['MY GLASSES!!', '*adjusts glasses*', 'FOUR EYES FOREVER'])); }
    else if (region === 'hair') { setHairBounce(Date.now()); say(rand(['BOING! MY CURLS!', 'THE CURLS HAVE SPOKEN', 'DO NOT FLOOF THE FRO'])); }
    else if (region === 'head') { say(rand(POKE_PHRASES_HEAD)); burst('head'); }
    else if (region === 'feet') { say(rand(POKE_PHRASES_FEET)); burst('feet'); }
    else { say(rand(POKE_PHRASES_BODY)); burst('body'); }

    if (mode === 'games' && gameSub === 'catch' && catchOn) {
      setCatchScore((s) => s + 1); sfx.pop(); bump(1, 4);
    }

    // CHASE MODE: clicking Oliver = a real catch. He gets faster + smaller.
    if (mode === 'chase') {
      P.stunUntil = Date.now() + 700;
      P.shrink = Math.max(0.68, P.shrink - 0.05);
      P.vx = 0; P.vy = 0;
      setCatches((c) => {
        const n = c + 1;
        setRunLevel(n);
        setChaseBest((b) => {
          const nb = Math.max(b, n);
          try { localStorage.setItem('oliver-chase-best', String(nb)); } catch { /* noop */ }
          return nb;
        });
        if (n === 5) { unlock('catchme'); sfx.levelup(); }
        return n;
      });
      sfx.catchIt();
      meme('nice');
      say(rand(['CAUGHT! +1 🏃', 'GOT HIM!', 'TAGGED! He is faster now…', 'NO FAIR!!']));
      burst('head');
    }
  };

  const onStagePointer = (e: React.PointerEvent) => {
    const r = stageRef.current?.getBoundingClientRect(); if (!r) return;
    const cx = e.clientX - (r.left + r.width / 2);
    const cy = e.clientY - (r.top + r.height / 2);
    phys.current.cx = cx; phys.current.cy = cy;
    if (mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing') {
      phys.current.avoidX = cx; phys.current.avoidY = cy;
      // Oliver obstructs: chase cursor slowly
      const P = phys.current;
      P.avoidOliverX += (cx - P.avoidOliverX) * 0.03 + Math.sin(Date.now() / 500) * 1.2;
      P.avoidOliverY += (cy - P.avoidOliverY) * 0.03 + Math.cos(Date.now() / 620) * 1.2;
      const d = Math.hypot(cx - P.avoidOliverX, cy - P.avoidOliverY);
      if (d < 70) { setAvoidStatus('lost'); sfx.splat(); meme('cry'); say('GOTCHA! You touched Oliver!'); }
      if (cx > r.width / 2 - 60 && avoidTime > 1) { setAvoidStatus('won'); sfx.yay(); meme('nice'); say(`YOU MADE IT in ${avoidTime.toFixed(1)}s!`); bump(3, 12); }
    }
    if (mode === 'gravity' && phys.current.dragging) {
      phys.current.px = cx - phys.current.dragOffX;
      phys.current.py = cy - phys.current.dragOffY;
      phys.current.vx = 0; phys.current.vy = 0;
    }
  };

  const surpriseMe = () => {
    const pool: ModeId[] = ['chase', 'dressup', 'sketch', 'poke', 'gravity', 'dance', 'says', 'games', 'generator', 'booth', 'army'];
    const m = rand(pool);
    setMode(m); sfx.whistle(); bump(2, 10);
    if (m === 'dance') { setDanceOn(true); rickStart(); unlock('dancer'); }
    if (m === 'generator') doGenerate();
    if (m === 'army' && army.length === 0) spawnArmy(8);
    if (m === 'gravity') setBalls((b) => [...b, { id: Date.now(), x: -100, y: -150, vx: 3, vy: 0, c: '#FF6B5B' }]);
    if (m === 'games') setGameSub(rand(['basket', 'pong', 'dash', 'whack', 'maze', 'rocket', 'flappy', 'snake', 'catch'] as GameSub[]));
    say(rand(['SURPRISE!', 'TRY THIS!', 'NEW TOY UNLOCKED!']));
  };

  const doGenerate = () => {
    const n = pick(2, 4);
    const shuffled = [...GEAR].sort(() => Math.random() - 0.5).slice(0, n);
    setAccessories(shuffled.map((d) => ({ uid: uidCounter++, defId: d.id, dx: 0, dy: 0, scale: 1, rot: pick(-10, 10) })));
    const name = rand(GENERATOR_NAMES);
    setGenName(name);
    setBoothBg(rand(BOOTH_BGS));
    sfx.yay(); bump(2, 9);
    say(`${name}!`);
    if (n >= 4) unlock('fashion-disaster');
  };

  const spawnArmy = (n: number) => {
    setArmy(Array.from({ length: n }, (_, i) => ({
      id: Date.now() + i, x: pick(-200, 200), y: pick(-150, 150),
      vx: pick(-2, 2), vy: pick(-2, 2), s: 0.28 + Math.random() * 0.2,
    })));
    sfx.boing(); bump(n, 6);
  };

  const exportBooth = () => {
    const cv = document.createElement('canvas');
    cv.width = 900; cv.height = 1200;
    const ctx = cv.getContext('2d')!;
    // bg
    const g = ctx.createLinearGradient(0, 0, 900, 1200);
    g.addColorStop(0, '#FFF8EC'); g.addColorStop(1, '#FFE1B8');
    ctx.fillStyle = boothBg.css.includes('gradient') ? g : '#FFF8EC';
    ctx.fillRect(0, 0, 900, 1200);
    ctx.fillStyle = boothBg.css; ctx.fillRect(0, 0, 900, 1200);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '800 64px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#1e1b3a';
    ctx.fillText('OLIVER.EXE', 450, 110);
    ctx.font = '700 34px Nunito, sans-serif';
    ctx.fillText(genName + ' • photo booth', 450, 160);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const s = Math.min(560 / img.width, 760 / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.save();
      ctx.translate(450, 640); ctx.rotate((boothPose * Math.PI) / 180);
      (ctx as any).roundRect?.(-w / 2, -h / 2, w, h, 36);
      ctx.clip();
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.lineWidth = 10; ctx.strokeStyle = '#1e1b3a';
      ctx.strokeRect(450 - w / 2, 640 - h / 2, w, h);
      ctx.font = '80px serif'; ctx.textAlign = 'center';
      const slotXY: Record<string, { x: number; y: number }> =
        bit16
          ? { head: { x: .5, y: .03 }, eyes: { x: .5, y: .265 }, mouth: { x: .5, y: .325 }, neck: { x: .5, y: .375 }, back: { x: .5, y: .46 }, handL: { x: .335, y: .615 }, handR: { x: .665, y: .615 }, feet: { x: .5, y: .945 } }
          : { head: { x: .5, y: .015 }, eyes: { x: .5, y: .235 }, mouth: { x: .5, y: .30 }, neck: { x: .5, y: .375 }, back: { x: .5, y: .46 }, handL: { x: .27, y: .72 }, handR: { x: .73, y: .72 }, feet: { x: .5, y: .955 } };
      for (const a of accessories) {
        try {
          const def = gearDef(a.defId);
          const sxy = slotXY[def.slot];
          const drawAt = (sx: number) => {
            ctx.save();
            ctx.translate(450 - w / 2 + sx * w + a.dx * 2, 640 - h / 2 + sxy.y * h + a.dy * 2);
            ctx.rotate((a.rot * Math.PI) / 180);
            ctx.font = `${Math.round(64 * a.scale)}px serif`;
            ctx.fillText(def.icon, 0, 0);
            ctx.restore();
          };
          drawAt(sxy.x);
          if (a.defId === 'gloves') drawAt(slotXY.handR.x);
        } catch { /* unknown gear */ }
      }
      for (const m of stampMarks) {
        ctx.fillText(m.emoji, 450 - w / 2 + m.x * w, 640 - h / 2 + m.y * h);
      }
      const a = document.createElement('a');
      a.download = 'oliver-booth.png';
      a.href = cv.toDataURL('image/png');
      a.click();
      sfx.yay(); bump(2, 8); say('SAY CHEESE! 📸');
    };
    img.src = bit16 ? SPRITES['front-stand'] : './oliver-transparent.png';
    img.onerror = () => { img.src = './oliver-original.jpg'; };
  };

  const MODES: { id: ModeId; label: string; icon: any; color: string }[] = [
    { id: 'chase', label: 'Chase', icon: MousePointer2, color: '#B9A7F9' },
    { id: 'dressup', label: 'Dress-Up', icon: Shirt, color: '#FFD23F' },
    { id: 'sketch', label: 'Sketch', icon: Pencil, color: '#C6F24E' },
    { id: 'poke', label: 'Poke', icon: Hand, color: '#FF6B5B' },
    { id: 'gravity', label: 'Gravity', icon: Rocket, color: '#2B50E0' },
    { id: 'dance', label: 'Dance', icon: PartyPopper, color: '#FF9BD2' },
    { id: 'says', label: 'Oliver Says', icon: MessageCircle, color: '#7BE0D4' },
    { id: 'games', label: 'Games', icon: Gamepad2, color: '#FFB020' },
    { id: 'generator', label: 'Generator', icon: Dices, color: '#B9A7F9' },
    { id: 'booth', label: 'Booth', icon: Camera, color: '#2B50E0' },
    { id: 'army', label: 'Army', icon: Users, color: '#C6F24E' },
  ];

  const bubbleStyle: Record<BubbleStyle, React.CSSProperties> = {
    normal: { background: '#fff', color: '#1e1b3a', border: '3px solid #1e1b3a', borderRadius: 18 },
    angry: { background: '#FF6B5B', color: '#fff', border: '3px solid #1e1b3a', borderRadius: 4, fontStyle: 'italic' as any },
    whisper: { background: '#EDE9FF', color: '#4c4490', border: '2px dashed #4c4490', borderRadius: 18, fontSize: 13 },
    announce: { background: '#FFD23F', color: '#1e1b3a', border: '4px solid #1e1b3a', borderRadius: 18 },
    thought: { background: '#fff', color: '#1e1b3a', border: '3px solid #1e1b3a', borderRadius: 28 },
  };

  const skin = bit16 ? 'pixel' : pose === 'cutout-photo' ? 'cutout' : 'hd';
  const madNow = Date.now() < madUntil;
  const fumingNow = Date.now() < fumingUntil;
  const catchingNow = mode === 'games' && gameSub === 'catch' && catchOn;
  const NET_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><g stroke='%231e1b3a' stroke-width='3' fill='none'><circle cx='28' cy='20' r='16'/><path d='M12 20h32M28 4v32M16 8l24 24M40 8L16 32'/><path d='M28 36L20 52M28 36l8 16' stroke-linecap='round'/></g></svg>") 28 20, crosshair`;
  const fullGame = mode === 'games' && (gameSub === 'basket' || gameSub === 'pong' || gameSub === 'dash' || gameSub === 'whack' || gameSub === 'maze' || gameSub === 'rocket' || gameSub === 'flappy' || gameSub === 'snake');

  return (
    <div className={`min-h-full flex flex-col ${bit16 ? 'bit16' : ''}`} style={{ background: secretMode ? 'linear-gradient(135deg,#B9A7F9,#2B50E0,#C6F24E,#FF6B5B,#FFD23F)' : undefined }}>
      {!bit16 && <div className="hd-aurora"><i /><i /><i /></div>}
      {/* hidden decode strip: keeps both skins' key sprites decoded so switching is instant */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 2, height: 2, opacity: 0.01, pointerEvents: 'none', overflow: 'hidden' }}>
        {[SPRITES['front-stand'], SPRITES['walk-right-a'], SPRITES['dance-point-up'], SPRITES['face-happy'], HD_CUTOUT, HD_SPRITES['hd-front-stand'], HD_SPRITES['hd-walk-right-a'], HD_SPRITES['hd-dance-up-down'], HD_SPRITES['hd-face-happy']].map((src) => (
          <img key={src} src={src} alt="" draggable={false} style={{ width: 2, height: 2 }} />
        ))}
      </div>
      {/* TOP BAR */}
      <header className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <button
          onClick={() => { setLogoScatter(true); sfx.boing(); bump(1, 3); setTimeout(() => setLogoScatter(false), 900); }}
          className="font-display font-extrabold text-2xl md:text-3xl tracking-tight flex"
          title="click me!"
        >
          {(bit16 ? 'OLIVER.16' : 'OLIVER.EXE').split('').map((ch, i) => (
            <span key={i} className="inline-block"
              style={logoScatter ? {
                // @ts-ignore css vars
                ['--dx']: `${pick(-70, 70)}px`, ['--dy']: `${pick(-50, 50)}px`, ['--rr']: `${pick(-180, 180)}deg`,
                animation: 'scatter .7s ease forwards', color: ['#2B50E0', '#FF6B5B', '#B9A7F9'][i % 3],
              } : { color: bit16 ? '#C6F24E' : (i > 6 ? '#2B50E0' : '#1e1b3a') }}>{ch}</span>
          ))}
        </button>
        <span className="hidden md:inline text-sm font-bold bg-white border-2 border-[#1e1b3a] rounded-full px-3 py-1">The Oliver Lab</span>
        <span className="text-sm font-bold bg-[#1e1b3a] text-white rounded-full px-3 py-1">👆 {interactions} interactions</span>
        <div className="flex-1" />
        <button onClick={() => { setBit16(!bit16); sfx.coin(); bump(1, 4); say(bit16 ? 'Back to HD, baby!' : '16-BIT MODE! Insert coin!'); }}
          className={`btn-3d gloss border-2 border-[#1e1b3a] px-4 py-2 flex items-center gap-2 text-sm font-extrabold ${bit16 ? 'bg-[#C6F24E]' : 'bg-[#191448] text-[#C6F24E]'}`}>
          <Binary size={16} /> {bit16 ? '16-BIT: ON' : 'GO 16-BIT'}
        </button>
        <button onClick={() => { setSoundOn(!soundOn); }} className="btn-3d gloss bg-[#FFD23F] border-2 border-[#1e1b3a] px-4 py-2 flex items-center gap-2 text-sm">
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} {soundOn ? 'SOUND ON' : 'MUTED'}
        </button>
        <button onClick={() => setHelpOpen(true)} className="btn-3d gloss bg-white border-2 border-[#1e1b3a] px-4 py-2 flex items-center gap-2 text-sm">
          <HelpCircle size={16} /> HELP
        </button>
        <button onClick={() => { sfx.ui(); setSettingsOpen(true); }} className="btn-3d gloss bg-white border-2 border-[#1e1b3a] px-4 py-2 flex items-center gap-2 text-sm" title="Settings">
          <Settings size={16} /> SETTINGS
        </button>
        <button onClick={() => {
          setAccessories([]); setStrokes([]); setStampMarks([]); setBalls([]); setArmy([]);
          setDanceOn(false); stopBeat(); rickStop(); setChaos(12); setCombo(0); setBubble({ text: 'Fresh start!', style: 'normal' });
          phys.current.px = 0; phys.current.py = 0; phys.current.vx = 0; phys.current.vy = 0;
          phys.current.shrink = 1;
          setMadUntil(0); setMeltdown(null); setInvertUntil(0); setBlackoutUntil(0); setGiantUntil(0);
          setCatches(0); setMisses(0); setRunLevel(0);
          sfx.pop();
        }} className="btn-3d gloss bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-4 py-2 flex items-center gap-2 text-sm">
          <RotateCcw size={16} /> RESET
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-3 px-3 md:px-4 pb-3 flex-1 min-h-0">
        {/* LEFT: mode selector */}
        <nav className="desktop-only card-pop p-3 w-48 shrink-0 flex-col gap-2 hidden lg:flex overflow-auto" style={{ maxHeight: 'calc(100vh - 170px)' }}>
          <div className="font-display font-extrabold text-sm opacity-60 px-1">MODES</div>
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); sfx.pop(); bump(1, 2); }}
              className={`btn-3d gloss flex items-center gap-2 px-3 py-2.5 text-sm border-2 border-[#1e1b3a] ${mode === m.id ? 'text-white' : 'bg-white'}`}
              style={mode === m.id ? { background: '#1e1b3a' } : { background: m.color + '33' }}>
              <m.icon size={16} /> {m.label}
            </button>
          ))}
          <div className="mt-2 card-pop !rounded-2xl p-2 text-xs font-bold" style={{ background: '#FFF3C4' }}>
            <Trophy size={14} className="inline" /> {unlocked.length}/{ACHIEVEMENTS.length} badges
            <div className="flex flex-wrap gap-1 mt-1">
              {ACHIEVEMENTS.map((a) => (
                <span key={a.id} title={`${a.name}: ${a.desc}`} style={{ opacity: unlocked.includes(a.id) ? 1 : 0.25, filter: unlocked.includes(a.id) ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
              ))}
            </div>
          </div>
        </nav>
        {/* mobile mode strip */}
        <div className="mobile-only flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); sfx.pop(); }}
              className={`btn-3d shrink-0 px-4 py-2 text-sm border-2 border-[#1e1b3a] ${mode === m.id ? 'bg-[#1e1b3a] text-white' : 'bg-white'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* CENTER STAGE */}
        <main className="flex-1 min-h-0">
          <div
            ref={stageRef}
            onPointerMove={onStagePointer}
            onPointerDown={(e) => {
              onStagePointer(e);
              if (mode === 'chase') {
                const hitOliver = !!(e.target as HTMLElement).closest?.('[data-oliver]');
                if (!hitOliver) {
                  setMisses((m) => m + 1);
                  sfx.ui(); bump(1, 2);
                  const P = phys.current;
                  const dd = Math.hypot(P.cx - P.px, P.cy - P.py);
                  if (dd < 170) say(rand(['SO CLOSE!', 'almost had him!', 'AAARGH!']));
                  else if (Math.random() < 0.4) say(rand(['WHIFF!', 'too slow!', 'he\'s over here!!']));
                }
              }
              if (mode === 'gravity') {
                const r = stageRef.current?.getBoundingClientRect(); if (!r) return;
                const cx = e.clientX - (r.left + r.width / 2), cy = e.clientY - (r.top + r.height / 2);
                const P = phys.current;
                if (Math.abs(cx - P.px) < 130 && Math.abs(cy - P.py) < 220) {
                  P.dragging = true; P.dragOffX = cx - P.px; P.dragOffY = cy - P.py;
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                }
              }
            }}
            onPointerUp={(e) => {
              if (mode === 'gravity' && phys.current.dragging) {
                phys.current.dragging = false;
                phys.current.vx = pick(-6, 6); phys.current.vy = -6;
                sfx.boing(); bump(1, 4);
              }
            }}
            className="card-pop stage-grid relative overflow-hidden w-full"
            style={{
              minHeight: 480, height: 'calc(100vh - 250px)',
              background: boothBg && mode === 'booth' ? boothBg.css : undefined,
              filter: Date.now() < invertUntil ? 'invert(1) hue-rotate(180deg)' : undefined,
              cursor: catchingNow ? NET_CURSOR : undefined,
            }}
          >
            {bit16 && <BitLighting />}
            {!bit16 && <div className="hd-stage-sweep" />}
            {/* full disco club when the party is on */}
            {danceOn && <DiscoFloor bit16={bit16} />}
            {/* confetti */}
            {confetti.map((c) => (
              <div key={c.id} className="absolute top-0 pointer-events-none" style={{
                left: `${c.x}%`, width: 10, height: 14, background: c.c, borderRadius: 3,
                animation: `confetti-fall ${c.d}s linear forwards`,
              }} />
            ))}
            {/* scurry minis */}
            {scurry && <ScurryRow />}
            {/* army (right-click a mini to dismiss it) */}
            {army.map((m) => (
              <img key={m.id} src={bit16 ? SPRITES['walk-right-a'] : HD_SPRITES['hd-walk-right-a']} alt="" draggable={false}
                title="right-click to dismiss"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setArmy((a) => a.filter((x) => x.id !== m.id));
                  sfx.pop(); bump(1, 1);
                  say(rand(['bye!!', 'freedom!', 'i\'m out!']));
                }}
                className="absolute rounded-xl border-2 border-[#1e1b3a]"
                style={{
                  left: `calc(50% + ${m.x}px)`, top: `calc(50% + ${m.y}px)`, width: 90 * m.s + 40, transform: 'translate(-50%,-50%)',
                  imageRendering: bit16 ? 'pixelated' : 'auto', cursor: 'pointer',
                }} />
            ))}
            {/* full-stage games */}
            {mode === 'games' && gameSub === 'basket' && (
              <Basketball bit16={bit16}
                onScore={(pts, swish) => {
                  bump(2, 8); sfx.catchIt(); if (swish) meme('hehehaw'); unlock('athlete');
                  say(swish ? `SWISH! +${pts} 🔥` : rand(['BUCKET!', 'HE SCORES!', 'COUNT IT!']));
                  if (pts >= 3) { /* streaks handled in game */ }
                }}
                onShoot={() => { bump(1, 3); }}
                onNotify={(t) => {
                  say(t); bump(1, 4);
                  const m = t.match(/(\d+) pts/);
                  if (m && Number(m[1]) >= 8) unlock('baller');
                }}
              />
            )}
            {mode === 'games' && gameSub === 'pong' && (
              <Pong bit16={bit16}
                onNotify={(t) => { say(t); if (t.startsWith('YOU BEAT')) { unlock('pongchamp'); meme('nice'); bump(3, 12); } }}
                onPoint={(you) => bump(1, you ? 5 : 3)}
              />
            )}
            {mode === 'games' && gameSub === 'dash' && (
              <CoinDash bit16={bit16}
                onNotify={(t) => say(t)}
                onCoin={() => bump(1, 1)}
                onFinish={(c) => {
                  if (c >= 15) { unlock('goblin'); sfx.levelup(); meme('nice'); }
                  say(c >= 15 ? `${c} coins! CERTIFIED GOBLIN 🪙` : `${c} coins! The socks remain…`);
                  bump(2, 6);
                }}
              />
            )}
            {mode === 'games' && gameSub === 'whack' && (
              <WhackOliver
                onNotify={(t) => say(t)}
                onBonk={(good) => { bump(1, good ? 4 : 6); if (!good) meme('cry'); }}
              />
            )}
            {mode === 'games' && gameSub === 'maze' && (
              <Maze bit16={bit16}
                onNotify={(t) => say(t)}
                onWin={(secs, lv) => {
                  bump(3, 10); sfx.levelup(); meme('hehehaw'); unlock('athlete');
                  say(secs < 60 ? `ESCAPED in ${secs.toFixed(1)}s?! Show-off.` : `Out in ${secs.toFixed(1)}s!`);
                }}
              />
            )}
            {mode === 'games' && gameSub === 'rocket' && (
              <RocketGame bit16={bit16}
                onNotify={(t) => say(t)}
                onGameOver={(sc) => { bump(3, 8); meme('fart'); setTimeout(() => meme('cry'), 700); say(`SPACE DUST! ${sc} pts!`); }}
              />
            )}
            {mode === 'games' && gameSub === 'flappy' && (
              <Flappy bit16={bit16}
                onNotify={(t) => say(t)}
                onFlap={() => bump(1, 1)}
                onGameOver={(sc) => {
                  bump(2, 6); meme('cry');
                  if (sc >= 10) { unlock('athlete'); meme('nice'); }
                  say(sc >= 10 ? `${sc} pipes! Bird law certified.` : `SPLAT! ${sc}. The pipes remain.`);
                }}
              />
            )}
            {mode === 'games' && gameSub === 'snake' && (
              <Snake bit16={bit16}
                onNotify={(t) => say(t)}
                onEat={() => bump(1, 2)}
                onGameOver={(sc) => {
                  bump(2, 6); meme('cry');
                  if (sc >= 15) { unlock('athlete'); meme('nice'); }
                  say(sc >= 15 ? `${sc}! Apex predator.` : `Tangled at ${sc}. Tasty tail though.`);
                }}
              />
            )}
            {/* gravity balls */}
            {balls.map((b) => (
              <div key={b.id} className="absolute rounded-full border-[3px] border-[#1e1b3a] no-select"
                style={{ left: `calc(50% + ${b.x}px)`, top: `calc(50% + ${b.y}px)`, width: 34, height: 34, background: b.c, transform: 'translate(-50%,-50%)' }} />
            ))}
            {/* avoid-mode cursor + obstacle */}
            {mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing' && (
              <>
                <div className="absolute w-5 h-5 rounded-full bg-[#C6F24E] border-[3px] border-[#1e1b3a]"
                  style={{ left: `calc(50% + ${phys.current.avoidX}px)`, top: `calc(50% + ${phys.current.avoidY}px)`, transform: 'translate(-50%,-50%)' }} />
                <div className="absolute font-display text-xs font-extrabold bg-[#C6F24E] border-2 border-[#1e1b3a] rounded-full px-2 py-0.5"
                  style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }}>START</div>
                <div className="absolute font-display text-xs font-extrabold bg-[#FFD23F] border-2 border-[#1e1b3a] rounded-full px-2 py-0.5"
                  style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}>FINISH 🏁</div>
              </>
            )}

            {/* MAIN OLIVER (hidden while a full-stage game owns the stage) */}
            {!fullGame && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto"
                onPointerEnter={() => { phys.current.hoverStart = Date.now(); }}
                onPointerLeave={() => {
                  if (Date.now() - phys.current.hoverStart > 2500) { say(rand(['…are you still there?', '*yawn*', 'BOO!'])); sfx.pop(); bump(1, 3); }
                  phys.current.hoverStart = 0;
                }}
              >
                <OliverCharacter
                  skin={skin}
                  sprite={pose}
                  flipX={flip}
                  transform={mode === 'games' && gameSub === 'avoid' && avoidStatus === 'playing'
                    ? { ...transform, x: phys.current.avoidOliverX, y: phys.current.avoidOliverY }
                    : transform}
                  height={oliverH * (mode === 'games' && gameSub === 'catch' ? 0.62 : 1)}
                  accessories={accessories}
                  selectedUid={selectedUid}
                  onSelectAccessory={setSelectedUid}
                  onMoveAccessory={(uid, dx, dy) => setAccessories((a) => a.map((x) => x.uid === uid ? { ...x, dx, dy } : x))}
                  onRemoveAccessory={(uid) => {
                    setAccessories((a) => a.filter((x) => x.uid !== uid));
                    setSelectedUid((s) => (s === uid ? null : s));
                    sfx.splat(); bump(1, 1);
                  }}
                  interactiveAccessories={mode === 'dressup'}
                  sleeping={sleeping && (bit16 || pose === 'cutout-photo')}
                  mad={madNow}
                  glassesPop={glassesPop}
                  hairBounce={hairBounce}
                  hitFx={hitFx}
                  danceActive={danceOn}
                  danceStyle={dancePreset}
                  onRegionClick={handleRegionClick}
                >
                  {mode === 'sketch' && (
                  <SketchLayer
                    ref={sketchRef}
                    active={mode === 'sketch'}
                    tool={tool} color={color} width={brushW} stamp={stamp}
                    strokes={strokes} stamps={stampMarks}
                    onStrokes={setStrokes} onStamps={setStampMarks}
                    onDrawn={() => {
                      bump(1, 2);
                      setPokeCount((c) => c);
                      if (strokes.length + 1 >= 25) unlock('artist');
                    }}
                  />
                  )}
                </OliverCharacter>
              </div>
            </div>
            )}

            {/* speech bubble */}
            {bubble && (
              <div className={`absolute top-3 left-1/2 -translate-x-1/2 max-w-[90%] px-4 py-2 font-display font-extrabold text-center pop-in ${sayStyle === 'thought' ? 'bubble-thought relative' : ''}`}
                style={{ ...bubbleStyle[sayStyle], zIndex: 50, fontSize: sayStyle === 'whisper' ? 13 : 17 }}>
                {bubble.text}
              </div>
            )}
            {/* combo meter */}
            {combo > 1 && (
              <div className="absolute top-3 right-3 bg-[#1e1b3a] text-white font-display font-extrabold rounded-full px-4 py-1.5 pop-in" style={{ zIndex: 50 }}>
                🔥 COMBO x{combo}
              </div>
            )}
            {/* poke stars */}
            {stars.map((s) => (
              <div key={s.id} className="absolute font-display font-extrabold pop-in pointer-events-none text-center"
                style={{ left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`, transform: 'translate(-50%,-50%)', zIndex: 60 }}>
                <div className="bg-[#FFD23F] border-[3px] border-[#1e1b3a] rounded-2xl px-3 py-1 text-sm">{s.txt}</div>
              </div>
            ))}
            {/* fuming warning badge */}
            {fumingNow && !madNow && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 pop-in pointer-events-none" style={{ zIndex: 55 }}>
                <div className="font-display font-extrabold text-sm bg-[#FFD23F] text-[#1e1b3a] border-[3px] border-[#1e1b3a] px-4 py-1 rounded-full"
                  style={{ animation: 'madShake .4s linear infinite' }}>
                  😤 HE'S FUMING… back off or else!
                </div>
              </div>
            )}
            {/* chase hint arrow until the first catch */}
            {mode === 'chase' && catches === 0 && !fullGame && (
              <div className="absolute pop-in pointer-events-none text-center font-display font-extrabold"
                style={{
                  left: `calc(50% + ${transform.x}px)`, top: `calc(50% + ${transform.y - oliverH * 0.62}px)`,
                  transform: 'translate(-50%,-100%)', zIndex: 45,
                  animation: 'bounce-soft 1s ease-in-out infinite',
                }}>
                <div className="bg-[#FFD23F] text-[#1e1b3a] border-[3px] border-[#1e1b3a] rounded-2xl px-3 py-1 text-sm whitespace-nowrap">
                  👇 HE RUNS FROM YOU — CLICK HIM!
                </div>
              </div>
            )}
            {meltdown && Date.now() < meltdown.until && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 pop-in pointer-events-none text-center" style={{ zIndex: 55 }}>
                <div className="font-display font-extrabold text-xl md:text-2xl bg-[#FF2B2B] text-white border-4 border-[#1e1b3a] px-5 py-1.5"
                  style={{ transform: 'rotate(-2deg)', boxShadow: '0 6px 0 #1e1b3a' }}>
                  😡 {meltdown.title} 😡
                </div>
              </div>
            )}
            {/* rage blackout */}
            {Date.now() < blackoutUntil && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,2,12,.72)', zIndex: 40 }}>
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 font-display font-extrabold text-[#FF2B2B] text-2xl" style={{ animation: 'madShake .3s linear infinite' }}>
                  OLIVER IS MAD
                </div>
              </div>
            )}
            {/* dynamic soft shadow */}
            {!fullGame && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 oliver-shadow pointer-events-none"
              style={{ width: 220 - Math.max(0, -transform.y * 0.2), height: 34, borderRadius: '50%' }} />
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold opacity-60 whitespace-nowrap">
              {bit16 ? '16-bit sprite sheet • pick the pose per action' : 'true transparent cutout + HD action sheet per move'}
            </div>
          </div>

          {/* BOTTOM TOOLBAR */}
          <div className="card-pop mt-3 px-3 py-2.5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <Zap size={14} /> {fumingNow ? '😤 FUMING' : 'CHAOS'}
              <div className="w-28 md:w-40 h-3.5 bg-[#eee] border-2 border-[#1e1b3a] rounded-full overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${chaos}%`, background: fumingNow || chaos > 75 ? '#FF6B5B' : chaos > 45 ? '#FFD23F' : '#C6F24E' }} />
              </div>
              <span>{Math.round(chaos)}%</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <QuickBtn label="😂 Joke" onClick={() => { say(rand(['Why did Oliver cross the road? To chase YOUR cursor!', 'I put the "fun" in "lanyard".', 'My curls have their own weather system.'])); sfx.pop(); bump(1, 4); }} />
              <QuickBtn label="💃 Dance" onClick={() => { setMode('dance'); setDanceOn(true); startBeat(); unlock('dancer'); bump(1, 6); }} />
              <QuickBtn label="🎲 Random fit" onClick={() => { setMode('dressup'); doGenerate(); }} />
              <QuickBtn label="😴 Nap" onClick={() => { setSleeping(true); unlock('sleeper'); say('shhh…'); }} />
            </div>
            <div className="flex-1" />
            <button onClick={surpriseMe} className="btn-3d gloss bg-[#2B50E0] text-white border-2 border-[#1e1b3a] px-6 py-2.5 font-display font-extrabold flex items-center gap-2">
              <Sparkles size={18} /> SURPRISE ME
            </button>
          </div>
        </main>

        {/* RIGHT: context panel */}
        <aside className="card-pop p-4 w-full lg:w-80 shrink-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 170px)' }}>
          <RightPanel
            mode={mode} setMode={setMode}
            accessories={accessories} setAccessories={setAccessories} selectedUid={selectedUid} setSelectedUid={setSelectedUid}
            tool={tool} setTool={setTool} color={color} setColor={setColor} brushW={brushW} setBrushW={setBrushW}
            stamp={stamp} setStamp={setStamp} sketchRef={sketchRef} strokes={strokes} stampMarks={stampMarks}
            danceOn={danceOn} setDanceOn={setDanceOn} dancePreset={dancePreset} setDancePreset={setDancePreset}
            gravLevel={gravLevel} setGravLevel={setGravLevel} balls={balls} setBalls={setBalls}
            sayText={sayText} setSayText={setSayText} sayStyle={sayStyle} setSayStyle={setSayStyle}
            gameSub={gameSub} setGameSub={setGameSub}
            catchOn={catchOn} setCatchOn={setCatchOn} catchScore={catchScore} setCatchScore={setCatchScore}
            catchTime={catchTime} setCatchTime={setCatchTime} catchBest={catchBest}
            avoidOn={avoidOn} setAvoidOn={setAvoidOn} avoidStatus={avoidStatus} setAvoidStatus={setAvoidStatus} avoidTime={avoidTime} setAvoidTime={setAvoidTime}
            catches={catches} misses={misses} catchBestChase={chaseBest} runLevel={runLevel}
            resetChase={() => { setCatches(0); setMisses(0); setRunLevel(0); phys.current.shrink = 1; phys.current.px = 0; phys.current.py = 0; sfx.pop(); say('TIME! Again!'); }}
            genName={genName} doGenerate={doGenerate}
            boothBg={boothBg} setBoothBg={setBoothBg} boothPose={boothPose} setBoothPose={setBoothPose} exportBooth={exportBooth}
            army={army} spawnArmy={spawnArmy} setArmy={setArmy} armyFollow={armyFollow} setArmyFollow={setArmyFollow}
            pokeCount={pokeCount} combo={combo}
            bump={bump} say={say} unlock={unlock}
          />
        </aside>
      </div>

      {/* toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center" style={{ zIndex: 100 }}>
        {toasts.map((t) => (
          <div key={t.id} className="pop-in bg-[#1e1b3a] text-white font-extrabold text-sm rounded-full px-5 py-2.5 shadow-xl">🏆 {t.txt}</div>
        ))}
      </div>

      {/* help modal */}
      {helpOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(30,27,58,.5)', zIndex: 200 }} onClick={() => setHelpOpen(false)}>
          <div className="card-pop max-w-lg w-full p-6 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-2xl mb-2">How to Oliver 🧪</h2>
            <ul className="text-sm font-semibold space-y-1.5">
              <li>• <b>Chase</b> — HOW TO PLAY: Oliver RUNS from your cursor. Corner him, click him to catch. Dodges sidesteps. Each catch = faster + smaller.</li>
              <li>• <b>Dress-Up</b> — wardrobe is mapped to his body. Right-click any clothing to remove it (works on army minis too).</li>
              <li>• <b>Sketch</b> — draw directly on Oliver; drawings stick to him. Stamps included.</li>
              <li>• <b>Poke</b> — punching shows the anime hit flash 💥. Chain pokes for COMBO.</li>
              <li>• <b>Gravity</b> — drag & throw Oliver; toggle gravity; launch the rocket; add balls.</li>
              <li>• <b>Dance</b> — MAKE HIM DANCE for disco + synthesized beat (starts on click, mutable).</li>
              <li>• <b>Oliver Says</b> — type anything; pick a bubble style; SPEAK uses Puter cloud voice (system fallback).</li>
              <li>• <b>Games</b> — Catch, Dodge, Hoops, Pong, Dash, Whack, Maze (3 depths), Rocket, Flappy, Snake.</li>
              <li>• <b>GO 16-BIT</b> — whole UI + pixel sprite sheet + torch lighting. HD mode uses the realistic action sheet per move.</li>
              <li>• Fill CHAOS and Oliver gets MAD — a different meltdown every time 😡</li>
              <li>• Secrets: click glasses / hair, hover 3s, press Space, type OLIVER, idle 45s, drag Oliver to the edge, click the logo.</li>
            </ul>
            <button onClick={() => setHelpOpen(false)} className="btn-3d bg-[#1e1b3a] text-white px-6 py-2 mt-4 w-full">GOT IT!</button>
            <button onClick={() => { setHelpOpen(false); setTourStep(0); }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-6 py-2 mt-2 w-full text-sm font-extrabold">↻ REPLAY TOUR</button>
          </div>
        </div>
      )}

      {/* settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(30,27,58,.5)', zIndex: 200 }} onClick={() => setSettingsOpen(false)}>
          <div className="card-pop max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-xl mb-3">⚙️ SETTINGS</h2>
            <label className="text-xs font-extrabold block mb-1">🔊 SOUND EFFECTS VOLUME: {Math.round(vol * 100)}%</label>
            <input type="range" min={0} max={100} value={Math.round(vol * 100)}
              onChange={(e) => { const v = Number(e.target.value) / 100; setVol(v); setMasterVol(v); }}
              onPointerUp={() => sfx.coin()}
              className="w-full" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setSoundOn(!soundOn); }} className="btn-3d bg-[#FFD23F] border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1">
                {soundOn ? '🔊 SOUND ON' : '🔇 MUTED'}
              </button>
              <button onClick={() => { setVol(0.9); setMasterVol(0.9); sfx.pop(); }} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1">RESET VOL</button>
            </div>
            <button onClick={() => {
              try { localStorage.removeItem('oliver-achievements'); } catch { /* noop */ }
              setUnlocked([]); sfx.splat(); say('Badges wiped. Fresh shame!');
            }} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold w-full mt-2">🧹 CLEAR BADGES</button>
            <button onClick={() => setSettingsOpen(false)} className="btn-3d bg-[#1e1b3a] text-white px-6 py-2 mt-4 w-full">DONE</button>
          </div>
        </div>
      )}

      {/* sound consent: landing is silent, ask once inside */}
      {entered && soundAsk && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(5,2,12,.72)', zIndex: 400 }}>
          <div className="card-pop p-6 text-center max-w-xs w-full pop-in">
            <div className="text-5xl">🔊</div>
            <div className="font-display font-extrabold text-xl mt-2">HEAR OLIVER?</div>
            <div className="text-sm font-bold opacity-70 my-2">Sound effects, meme reactions + dance music. You can mute anytime up top.</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => {
                setSoundAsk(false); setSoundOn(true); sfx.yay(); bump(1, 3);
                say(bit16 ? 'WHOA. 16-BIT ME! Sound on!' : 'YOU MADE IT! Sound on!');
                if (!tourSeen()) setTourStep(0);
              }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-4 py-2.5 flex-1 font-display font-extrabold">YES 🔊</button>
              <button onClick={() => {
                setSoundAsk(false); setSoundOn(false); bump(1, 1);
                say(bit16 ? 'WHOA. 16-BIT ME! (quiet mode)' : 'YOU MADE IT! (quiet mode)');
                if (!tourSeen()) setTourStep(0);
              }} className="btn-3d bg-white border-2 border-[#1e1b3a] px-4 py-2.5 flex-1 font-extrabold text-sm">no thanks</button>
            </div>
          </div>
        </div>
      )}

      {/* first-run tutorial: Oliver shows you around (skippable) */}
      {entered && tourStep >= 0 && (
        <Tutorial bit16={bit16} step={tourStep}
          onNext={() => {
            sfx.ui();
            if (tourStep >= 3) { setTourStep(-1); markTourSeen(); }
            else setTourStep(tourStep + 1);
          }}
          onSkip={() => { setTourStep(-1); markTourSeen(); }}
        />
      )}

      {/* LANDING: Oliver outside — one button to enter his world */}
      {!entered && (
        <Landing
          bit16={bit16}
          onToggleBit={() => { setBit16(!bit16); bump(1, 2); }}
          onEnter={() => {
            setEntered(true);
            setSoundAsk(true);
          }}
        />
      )}
    </div>
  );
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold">{label}</button>
  );
}

function ScurryRow() {
  const minis = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="absolute inset-x-0 top-1/3 pointer-events-none" style={{ zIndex: 40 }}>
      {minis.map((i) => (
        <img key={i} src="./oliver-original.jpg" alt="" draggable={false}
          className="absolute rounded-lg border-2 border-[#1e1b3a]"
          style={{
            width: 54, left: '-80px', top: `${(i % 5) * 44}px`,
            animation: `scurryAcross ${3 + (i % 4)}s linear ${i * 0.15}s forwards`,
          }} />
      ))}
      <style>{`@keyframes scurryAcross { to { transform: translateX(120vw) rotate(8deg); } }`}</style>
    </div>
  );
}

// ---------- RIGHT PANEL ----------
function RightPanel(props: any) {
  const { mode } = props;
  const H = (t: string) => <div className="font-display font-extrabold text-lg mb-1">{t}</div>;
  const Sub = (t: string) => <div className="text-xs font-bold opacity-60 mb-2">{t}</div>;

  if (mode === 'chase') return (
    <div>{H('Catch the runner 🏃')}{Sub('Oliver FLEES your cursor now. Corner him and click to catch — every catch makes him faster and smaller. Misses make him cocky.')}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card-pop !rounded-2xl p-2"><div className="font-display font-extrabold text-2xl">{props.catches}</div><div className="text-[10px] font-extrabold">CAUGHT</div></div>
        <div className="card-pop !rounded-2xl p-2"><div className="font-display font-extrabold text-2xl">{props.misses}</div><div className="text-[10px] font-extrabold">WHIFFS</div></div>
        <div className="card-pop !rounded-2xl p-2"><div className="font-display font-extrabold text-2xl">{props.catchBestChase}</div><div className="text-[10px] font-extrabold">BEST</div></div>
      </div>
      <div className="text-xs font-extrabold mt-2">SPEED LVL {Math.min(8, props.runLevel)} {props.runLevel >= 5 ? '🔥🔥' : props.runLevel >= 3 ? '🔥' : ''}</div>
      <ul className="text-sm font-semibold space-y-1 mt-1">
        <li>• He dodges sideways when you get close</li>
        <li>• 5 catches = Gotcha! badge 🏃</li>
      </ul>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { props.say(rand(CHASE_PHRASES)); sfx.pop(); meme('getback'); props.bump(1, 3); }} className="btn-3d bg-[#B9A7F9] border-2 border-[#1e1b3a] px-4 py-2 flex-1 font-extrabold text-sm">TAUNT HIM!</button>
        <button onClick={() => { props.resetChase(); }} className="btn-3d bg-white border-2 border-[#1e1b3a] px-4 py-2 flex-1 font-extrabold text-sm">RESET RUN</button>
      </div>
    </div>
  );

  if (mode === 'dressup') return (
    <div>{H('Dress-Up Studio 🎩')}{Sub('Every piece snaps to the right body part — hats on head, chains on neck, gloves on hands. Drag to fine-tune, select to tweak.')}
      {(['head', 'eyes', 'mouth', 'neck', 'back', 'handL', 'feet'] as const).map((slot) => (
        <div key={slot} className="mb-2">
          <div className="text-[10px] font-extrabold opacity-60 tracking-widest">
            {slot === 'head' ? '🎩 HEAD' : slot === 'eyes' ? '👓 EYES' : slot === 'mouth' ? '👄 MOUTH' : slot === 'neck' ? '📿 NECK' : slot === 'back' ? '🦸 BACK' : slot === 'handL' ? '🥊 HANDS (PAIR)' : '👟 FEET'}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {GEAR.filter((a) => a.slot === slot).map((a) => (
              <button key={a.id} title={`${a.name} — snaps to ${slot}`}
                onClick={() => {
                  props.setAccessories((acc: PlacedAccessory[]) => {
                    if (acc.some((x) => x.defId === a.id)) return acc;
                    return [...acc, { uid: uidCounter++, defId: a.id, dx: 0, dy: 0, scale: 1, rot: 0 }];
                  });
                  sfx.pop(); props.bump(1, 4);
                  if (props.accessories.length + 1 >= 5) props.unlock('fashion-disaster');
                }}
                className="btn-3d bg-white border-2 border-[#1e1b3a] py-1.5 text-2xl">{a.icon}<div className="text-[9px] font-extrabold">{a.name}</div></button>
            ))}
          </div>
        </div>
      ))}
      {props.selectedUid != null && (() => {
        const p = props.accessories.find((x: PlacedAccessory) => x.uid === props.selectedUid);
        if (!p) return null;
        const upd = (d: Partial<PlacedAccessory>) => props.setAccessories((acc: PlacedAccessory[]) => acc.map((x) => x.uid === p.uid ? { ...x, ...d } : x));
        let nm = p.defId;
        try { nm = gearDef(p.defId).name; } catch { /* keep id */ }
        return (
          <div className="mt-3 bg-[#FFF3C4] border-2 border-[#1e1b3a] rounded-2xl p-3">
            <div className="text-xs font-extrabold mb-2">SELECTED: {nm}</div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold" onClick={() => upd({ rot: p.rot - 15 })}>⟲ ROT</button>
              <button className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold" onClick={() => upd({ rot: p.rot + 15 })}>ROT ⟳</button>
              <button className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold" onClick={() => upd({ scale: Math.min(2.5, p.scale + 0.15) })}>BIG +</button>
              <button className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold" onClick={() => upd({ scale: Math.max(0.4, p.scale - 0.15) })}>SMALL −</button>
              <button className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold" onClick={() => { props.setAccessories((acc: PlacedAccessory[]) => acc.filter((x) => x.uid !== p.uid)); props.setSelectedUid(null); }}>REMOVE</button>
            </div>
          </div>
        );
      })()}
      <button onClick={() => { props.setAccessories([]); props.setSelectedUid(null); sfx.splat(); }} className="btn-3d bg-white border-2 border-[#1e1b3a] px-4 py-2 mt-3 w-full text-sm font-extrabold">🧹 RESET WARDROBE</button>
    </div>
  );

  if (mode === 'sketch') return (
    <div>{H('Sketch on Oliver 🎨')}{Sub('Draw on the transparent layer glued to Oliver. Touch works, no scroll hijack.')}
      <div className="flex gap-1.5 flex-wrap mb-2">
        {[['pencil', '✏️ Pencil'], ['marker', '🖊️ Marker'], ['highlighter', '🖍️ Glow'], ['eraser', '🧽 Eraser']].map(([v, l]) => (
          <button key={v} onClick={() => { props.setTool(v); props.setStamp(null); }} className={`btn-3d border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold ${props.tool === v && !props.stamp ? 'bg-[#1e1b3a] text-white' : 'bg-white'}`}>{l}</button>
        ))}
      </div>
      <div className="flex gap-2 items-center mb-2">
        {['#2B50E0', '#FF6B5B', '#C6F24E', '#FFD23F', '#B9A7F9', '#1e1b3a', '#ffffff'].map((c) => (
          <button key={c} onClick={() => props.setColor(c)} className="w-7 h-7 rounded-full border-2 border-[#1e1b3a]" style={{ background: c, outline: props.color === c ? '3px solid #2B50E0' : 'none' }} />
        ))}
      </div>
      <label className="text-xs font-extrabold">BRUSH: {props.brushW}px</label>
      <input type="range" min={2} max={24} value={props.brushW} onChange={(e) => props.setBrushW(Number(e.target.value))} className="w-full" />
      <div className="text-xs font-extrabold mt-2 mb-1">STAMPS (tap then tap Oliver)</div>
      <div className="flex gap-1.5 flex-wrap">
        {['⭐', '❤️', '⚡', '🤨', '💬', '🌈', '🔥'].map((s) => (
          <button key={s} onClick={() => props.setStamp(props.stamp === s ? null : s)} className={`btn-3d border-2 border-[#1e1b3a] w-10 h-10 text-xl ${props.stamp === s ? 'bg-[#FFD23F]' : 'bg-white'}`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => props.sketchRef.current?.undo()} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1">↩ UNDO</button>
        <button onClick={() => props.sketchRef.current?.redo()} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1">REDO ↪</button>
        <button onClick={() => props.sketchRef.current?.clear()} className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1">CLEAR</button>
      </div>
      <div className="text-xs font-bold opacity-60 mt-2">{props.strokes.length} strokes • {props.stampMarks.length} stamps</div>
    </div>
  );

  if (mode === 'poke') return (
    <div>{H('Poke Mode 👉')}{Sub('Head, torso and feet react differently. Fast repeated pokes build COMBO.')}
      <div className="card-pop !rounded-2xl p-3 text-center" style={{ background: '#FFE9EC' }}>
        <div className="font-display font-extrabold text-3xl">{props.pokeCount}</div>
        <div className="text-xs font-extrabold">TOTAL POKES {props.combo > 1 && `• COMBO x${props.combo} 🔥`}</div>
      </div>
      <div className="text-xs font-bold mt-2 opacity-70">Tip: try the glasses and the curls — they have secrets. 20 pokes earns Professional Menace.</div>
    </div>
  );

  if (mode === 'gravity') return (
    <div>{H('Gravity Playground 🚀')}{Sub('Drag Oliver and fling him. Balls bounce off a simplified Oliver proxy — photo never distorts.')}
      <div className="flex gap-2">
        {(['normal', 'low', 'zero'] as const).map((g) => (
          <button key={g} onClick={() => props.setGravLevel(g)} className={`btn-3d border-2 border-[#1e1b3a] px-3 py-1.5 text-xs font-extrabold flex-1 ${props.gravLevel === g ? 'bg-[#1e1b3a] text-white' : 'bg-white'}`}>{g.toUpperCase()}</button>
        ))}
      </div>
      <button onClick={() => { (window as any).__oliverBoost?.(); }} className="hidden" />
      <button onClick={() => {
        const P = (document as any);
        void P;
        // rocket: direct impulse via custom event read in loop — simpler: use bump + toast
        props.say('TO THE MOON! 🚀'); sfx.whistle(); props.bump(2, 8);
        // apply impulse through stage physics ref is internal; emulate with poke squash + jump
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      }} className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-4 py-2.5 mt-3 w-full font-display font-extrabold">🚀 ROCKET LAUNCH (SPACE)</button>
      <button onClick={() => {
        props.setBalls((b: any[]) => [...b.slice(-11), { id: Date.now(), x: pick(-180, 180), y: -180, vx: pick(-3, 3), vy: 0, c: rand(['#B9A7F9', '#2B50E0', '#C6F24E', '#FF6B5B', '#FFD23F']) }]);
        sfx.pop(); props.bump(1, 3);
      }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-4 py-2 mt-2 w-full font-extrabold text-sm">＋ SPAWN BOUNCY BALL</button>
      <button onClick={() => props.setBalls([])} className="btn-3d bg-white border-2 border-[#1e1b3a] px-4 py-2 mt-2 w-full text-xs font-extrabold">CLEAR BALLS ({props.balls.length})</button>
    </div>
  );

  if (mode === 'dance') return (
    <div>{H('Dance Party 🪩')}{Sub('User-initiated synthesized beat only. Honors reduced-motion by toning down.')}
      <button onClick={() => {
        const on = !props.danceOn;
        props.setDanceOn(on);
        if (on) { rickStart(); props.unlock('dancer'); props.bump(2, 8); props.say('…never gonna give you up! ♪'); }
        else { rickStop(); props.say('phew… water break'); }
      }} className={`btn-3d border-2 border-[#1e1b3a] px-4 py-3 w-full font-display font-extrabold flex items-center justify-center gap-2 ${props.danceOn ? 'bg-[#1e1b3a] text-white' : 'bg-[#FFD23F]'}`}>
        {props.danceOn ? <><Pause size={18} /> STOP THE MUSIC</> : <><Play size={18} /> MAKE HIM DANCE</>}
      </button>
      <div className="text-xs font-extrabold mt-3 mb-1">PRESET</div>
      <div className="grid grid-cols-2 gap-2">
        {['Disco', 'Robot', 'Rave', 'Silly'].map((d) => (
          <button key={d} onClick={() => { props.setDancePreset(d); if (!props.danceOn) sfx.pop(); }} className={`btn-3d border-2 border-[#1e1b3a] px-3 py-2 text-sm font-extrabold ${props.dancePreset === d ? 'bg-[#B9A7F9]' : 'bg-white'}`}>{d}</button>
        ))}
      </div>
      {window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && (
        <div className="text-xs font-bold mt-2 text-[#FF6B5B]">Reduced-motion detected: moves are toned down.</div>
      )}
    </div>
  );

  if (mode === 'says') return (
    <div>{H('Oliver Says 💬')}{Sub('Arbitrary text in a bubble anchored to Oliver. Optional standard system voice — never cloned.')}
      <textarea value={props.sayText} onChange={(e) => props.setSayText(e.target.value)} rows={3} maxLength={140}
        className="w-full border-[3px] border-[#1e1b3a] rounded-2xl p-3 text-sm font-bold" placeholder="Make Oliver say anything…" />
      <div className="flex gap-1.5 flex-wrap mt-2">
        {(['normal', 'angry', 'whisper', 'announce', 'thought'] as const).map((s) => (
          <button key={s} onClick={() => props.setSayStyle(s)} className={`btn-3d border-2 border-[#1e1b3a] px-3 py-1 text-xs font-extrabold ${props.sayStyle === s ? 'bg-[#1e1b3a] text-white' : 'bg-white'}`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { props.say(props.sayText || '…', props.sayStyle); sfx.pop(); props.bump(1, 3); }} className="btn-3d bg-[#2B50E0] text-white border-2 border-[#1e1b3a] px-4 py-2 flex-1 font-extrabold text-sm">SHOW BUBBLE</button>
        <button onClick={async () => {
          props.say(props.sayText || '…', props.sayStyle); props.bump(1, 4);
          const { speak: voice } = await import('./lib/voice');
          const ok = await voice(props.sayText || 'Hello!');
          if (!ok) props.say('(voice unavailable — bubble only)');
        }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-4 py-2 flex-1 font-extrabold text-sm">🔊 SPEAK (PUTER)</button>
      </div>
      <div className="text-[11px] font-bold opacity-60 mt-1">Voice: Puter.js cloud TTS, falls back to system voice.</div>
    </div>
  );

  if (mode === 'games') return (
    <div>{H('Mini Games 🎮')}{Sub('Complete loops: start → play → score → game over → retry.')}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {([['catch', 'Catch'], ['avoid', 'Dodge'], ['basket', 'Hoops'], ['pong', 'Pong'], ['dash', 'Dash'], ['whack', 'Whack'], ['maze', 'Maze'], ['rocket', 'Rocket'], ['flappy', 'Flappy'], ['snake', 'Snake']] as [GameSub, string][]).map(([v, l]) => (
          <button key={v} onClick={() => { props.setGameSub(v); sfx.ui(); }} className={`btn-3d border-2 border-[#1e1b3a] px-1 py-1.5 text-xs font-extrabold ${props.gameSub === v ? 'bg-[#1e1b3a] text-white' : 'bg-white'}`}>{l}</button>
        ))}
      </div>
      {props.gameSub === 'catch' && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 font-display font-extrabold text-2xl">
            <span className="flex items-center gap-1"><Timer size={20} /> {props.catchTime}s</span>
            <span className="flex items-center gap-1"><Star size={20} /> {props.catchScore}</span>
          </div>
          <div className="text-xs font-bold opacity-60">Best: {props.catchBest}</div>
          {!props.catchOn ? (
            <button onClick={() => { props.setCatchScore(0); props.setCatchTime(30); props.setCatchOn(true); sfx.whistle(); meme('hehe'); props.say('CATCH ME IF YOU CAN!'); }} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-4 py-2.5 mt-2 w-full font-extrabold">▶ START (30s — click Oliver!)</button>
          ) : <button onClick={() => props.setCatchOn(false)} className="btn-3d bg-[#FF6B5B] text-white border-2 border-[#1e1b3a] px-4 py-2 mt-2 w-full font-extrabold">■ GIVE UP</button>}
          <div className="text-xs font-bold mt-2 opacity-70">Oliver shrinks & teleports. 10+ catches = Sharp Shooter 🏆</div>
        </div>
      )}
      {props.gameSub === 'avoid' && (
        <div className="text-center">
          <div className="text-sm font-bold">Move from START → FINISH without touching Oliver. He hunts you.</div>
          <div className="font-display font-extrabold text-2xl mt-1">{props.avoidTime.toFixed(1)}s — {props.avoidStatus.toUpperCase()}</div>
          {props.avoidStatus !== 'playing' ? (
            <button onClick={() => { props.setAvoidTime(0); props.setAvoidStatus('playing'); sfx.whistle(); meme('hehe'); props.say('You can\'t dodge me!'); }} className="btn-3d bg-[#B9A7F9] border-2 border-[#1e1b3a] px-4 py-2.5 mt-2 w-full font-extrabold">▶ START COURSE</button>
          ) : <div className="text-xs font-bold opacity-60 mt-1">Move your cursor / finger across the stage →</div>}
        </div>
      )}
      {props.gameSub === 'basket' && (
        <div className="text-center text-sm font-bold">
          <div>🏀 OLIVER HOOPS lives on the stage!</div>
          <div className="opacity-70 mt-1">Drag the ball to aim (dots + power meter). Swish = 3, streaks bonus, moving hoop, wind. 10 balls.</div>
          <div className="opacity-70">8+ pts in a round = Streetballer 🏆</div>
        </div>
      )}
      {props.gameSub === 'pong' && (
        <div className="text-center text-sm font-bold">
          <div>🏓 PONG VS OLIVER on the stage!</div>
          <div className="opacity-70 mt-1">Slide to move. First to 7 — he speeds up every rally. Beat him = Pong Champion 🏆</div>
        </div>
      )}
      {props.gameSub === 'dash' && (
        <div className="text-center text-sm font-bold">
          <div>🪙 COIN DASH on the stage!</div>
          <div className="opacity-70 mt-1">Arrows/WASD or drag. Coins +1, socks −2, 30s. 15+ = Coin Goblin 🏆</div>
        </div>
      )}
      {props.gameSub === 'whack' && (
        <div className="text-center text-sm font-bold">
          <div>🔨 WHACK-AN-OLIVER on the stage!</div>
          <div className="opacity-70 mt-1">Bonk happy +1, spare the angry one (−2). 20 seconds of glory.</div>
        </div>
      )}
      {props.gameSub === 'maze' && (
        <div className="text-center text-sm font-bold">
          <div>🌀 OLIVER MAZE on the stage!</div>
          <div className="opacity-70 mt-1">3 depths, torch-lit darkness, grump patrols. Grab every cookie, find the exit.</div>
        </div>
      )}
      {props.gameSub === 'rocket' && (
        <div className="text-center text-sm font-bold">
          <div>🚀 ROCKET OLIVER on the stage!</div>
          <div className="opacity-70 mt-1">Dodge asteroids (3 hits = boom). 🍪 +1, 🚬 +3 with a speed rush.</div>
        </div>
      )}
      {props.gameSub === 'flappy' && (
        <div className="text-center text-sm font-bold">
          <div>🐤 FLAPPY OLIVER on the stage!</div>
          <div className="opacity-70 mt-1">Click / tap / SPACE to flap. Bird-Oliver through the pipes. 10+ = certified.</div>
        </div>
      )}
      {props.gameSub === 'snake' && (
        <div className="text-center text-sm font-bold">
          <div>🐍 SNAKE OLIVER on the stage!</div>
          <div className="opacity-70 mt-1">Arrows/WASD, swipe, or pad. 🍪 +1, 🚬 +3. Walls and tail are lava.</div>
        </div>
      )}
    </div>
  );

  if (mode === 'generator') return (
    <div>{H('Oliver Generator 🎲')}{Sub('Random accessory + background + vibe combo with a name.')}
      <div className="card-pop !rounded-2xl p-3 text-center font-display font-extrabold text-xl" style={{ background: '#EDE9FF' }}>
        <Crown className="inline mr-1" size={20} /> {props.genName}
      </div>
      <button onClick={props.doGenerate} className="btn-3d bg-[#B9A7F9] border-2 border-[#1e1b3a] px-4 py-3 mt-3 w-full font-display font-extrabold">🎲 GENERATE OLIVER</button>
    </div>
  );

  if (mode === 'booth') return (
    <div>{H('Photo Booth 📸')}{Sub('Background + pose + your accessories & stamps. Exports a real PNG composite.')}
      <div className="text-xs font-extrabold mb-1">BACKGROUND</div>
      <div className="grid grid-cols-3 gap-1.5">
        {BOOTH_BGS.map((b) => (
          <button key={b.id} onClick={() => props.setBoothBg(b)} title={b.name}
            className="h-12 rounded-xl border-[3px] border-[#1e1b3a]" style={{ background: b.css, outline: props.boothBg.id === b.id ? '3px solid #2B50E0' : 'none' }} />
        ))}
      </div>
      <label className="text-xs font-extrabold mt-3 block">POSE TILT: {props.boothPose}°</label>
      <input type="range" min={-15} max={15} value={props.boothPose} onChange={(e) => props.setBoothPose(Number(e.target.value))} className="w-full" />
      <button onClick={props.exportBooth} className="btn-3d bg-[#2B50E0] text-white border-2 border-[#1e1b3a] px-4 py-3 mt-3 w-full font-display font-extrabold">📥 EXPORT PNG</button>
    </div>
  );

  if (mode === 'army') return (
    <div>{H('Oliver Army 🪖')}{Sub('Mini Olivers wander, follow your cursor and bump around.')}
      <div className="flex gap-2">
        <button onClick={() => props.spawnArmy(5)} className="btn-3d bg-[#C6F24E] border-2 border-[#1e1b3a] px-3 py-2 flex-1 text-xs font-extrabold">+ 5 OLIVERS</button>
        <button onClick={() => props.setArmy([])} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-2 flex-1 text-xs font-extrabold">DISMISS</button>
      </div>
      <button onClick={() => props.setArmyFollow(!props.armyFollow)} className="btn-3d bg-white border-2 border-[#1e1b3a] px-3 py-2 mt-2 w-full text-xs font-extrabold">
        {props.armyFollow ? '🛑 STOP FOLLOWING ME' : '👉 FOLLOW MY CURSOR'}
      </button>
      <div className="text-xs font-bold opacity-60 mt-2">Deployed: {props.army.length} units</div>
    </div>
  );

  return null;
}

// make rand available to panel
function rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function pick(n: number, m: number) { return Math.floor(Math.random() * (m - n + 1)) + n; }
