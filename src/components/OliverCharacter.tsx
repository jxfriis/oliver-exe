import React, { useEffect, useRef, useState } from 'react';
import { gearDef } from './FittedGear';
import { HD_CUTOUT, HD_PHOTO_FRAMED, HD_SPRITES, SLOT_ANCHORS, SPRITES, type AnySprite, type HdSpriteId, type SpriteId, type SlotId } from '../lib/sprites';
import type { PlacedAccessory } from '../lib/data';

export interface OliverTransform {
  x: number; y: number;
  scale: number; rot: number;
  squashX: number; squashY: number;
  tilt: number;
  faceX: number; faceY: number;
}

export const DEFAULT_TRANSFORM: OliverTransform = {
  x: 0, y: 0, scale: 1, rot: 0, squashX: 1, squashY: 1, tilt: 0, faceX: 0, faceY: 0,
};

export type Skin = 'cutout' | 'pixel' | 'hd';
export type StageSprite = AnySprite | 'cutout-photo'; // transparent photo base

interface Props {
  skin: Skin;
  sprite: StageSprite; // pixel/HD pose, or 'cutout-photo' for the transparent photo
  flipX?: boolean;
  // live transform: App's physics loop writes every frame; this component mirrors
  // it straight to the DOM (zero React re-renders for movement = locked 60fps)
  transformRef: React.MutableRefObject<OliverTransform>;
  height: number;
  accessories: PlacedAccessory[];
  selectedUid: number | null;
  onSelectAccessory: (uid: number | null) => void;
  onMoveAccessory: (uid: number, dx: number, dy: number) => void;
  onRemoveAccessory: (uid: number) => void;
  interactiveAccessories: boolean;
  sleeping: boolean;
  mad: boolean;
  glassesPop: number;
  hairBounce: number;
  hitFx: number; // timestamp of last punch — anime hit flash
  children?: React.ReactNode;
  onRegionClick: (region: 'glasses' | 'hair' | 'head' | 'torso' | 'feet' | 'body') => void;
  danceActive: boolean;
  danceStyle: string;
  dimmed?: boolean;
  fat?: number; // cookie-poke inflation 0..1 — HD swaps the fat sprites, pixel squashes rounder
}

const SPRITE_ASPECT: Record<SpriteId | HdSpriteId, number> = {
  'front-stand': 0.60, 'side-stand-left': 0.52, 'side-stand-right': 0.52,
  'back-stand': 0.60, 'topdown-bow': 0.78, 'sit-fall': 0.88,
  'walk-right-a': 0.62, 'walk-right-b': 0.62,
  'dance-point-up': 0.62, 'dance-point-left': 0.66,
  'flap-16': 1.05, 'rocket-16': 1.15,
  'sleep-16': 1.30, 'snake-16': 1.0,
  'face-happy': 0.80, 'face-angry': 0.80,
  'banana-slip': 1.0, 'laugh-tears': 0.95, 'confused-scratch': 0.85,
  'confetti-jump': 0.95, 'facepalm': 0.9, 'panic-claw': 0.95, 'flex': 0.95,
  'screen-kiss': 0.96, 'smooch': 0.98,
  'hd-fat': 0.67, 'hd-fat-max': 0.66,
  'hd-front-stand': 0.52, 'hd-side-right': 0.50, 'hd-back-stand': 0.55,
  'hd-topdown': 0.75, 'hd-fall': 0.80,
  'hd-walk-right-a': 0.55, 'hd-walk-right-b': 0.55,
  'hd-dance-up-down': 0.62, 'hd-dance-down-up': 0.62,
  'hd-fly': 1.15, 'hd-rocket': 1.0,
  'hd-snake': 1.0,
  'hd-face-angry': 0.85, 'hd-face-happy': 0.85, 'hd-sleep': 1.10,
};

function spriteSrc(sprite: StageSprite): string {
  if (sprite === 'cutout-photo') return HD_CUTOUT;
  if (sprite in SPRITES) return SPRITES[sprite as SpriteId];
  return HD_SPRITES[sprite as HdSpriteId];
}

const HD_FACES: AnySprite[] = ['hd-face-angry', 'hd-face-happy'];
const PIXEL_FACES: AnySprite[] = ['face-happy', 'face-angry'];

const OliverCharacter = React.forwardRef<HTMLDivElement, Props>(function OliverCharacter(props, ref) {
  const { height } = props;
  const t = props.transformRef.current;
  const [framedFallback, setFramedFallback] = useState(false);
  const aspect = props.sprite === 'cutout-photo' ? 0.62 : SPRITE_ASPECT[props.sprite as AnySprite];
  const w = height * aspect;
  const anchors = SLOT_ANCHORS[props.skin === 'pixel' ? 'pixel' : props.skin === 'hd' ? 'hd' : 'cutout'];

  const danceAnim =
    props.danceActive
      ? props.danceStyle === 'Robot' ? 'robot .5s steps(2) infinite'
      : props.danceStyle === 'Rave' ? 'rave .3s ease-in-out infinite alternate'
      : props.danceStyle === 'Silly' ? 'silly .45s ease-in-out infinite'
      : 'discoDance .55s ease-in-out infinite alternate'
      : undefined;

  const pixelated = props.skin === 'pixel';
  const imgSrc = props.sprite === 'cutout-photo'
    ? (framedFallback ? HD_PHOTO_FRAMED : HD_CUTOUT)
    : spriteSrc(props.sprite as AnySprite);
  const fatLevel = props.fat ?? 0;
  const fatSrc = !pixelated && props.sprite === 'cutout-photo' && fatLevel > 0.25
    ? (fatLevel >= 0.8 ? HD_SPRITES['hd-fat-max'] : fatLevel >= 0.5 ? HD_SPRITES['hd-fat'] : null)
    : null;
  const shownSrc = fatSrc ?? imgSrc;
  const madBadge = props.skin === 'pixel' ? SPRITES['face-angry'] : HD_SPRITES['hd-face-angry'];

  // crossfade between poses so sprite swaps read as animation, not flicker
  const prevSrcRef = useRef(shownSrc);
  const [fadeKey, setFadeKey] = useState(0);
  useEffect(() => {
    if (prevSrcRef.current !== shownSrc) {
      prevSrcRef.current = shownSrc;
      setFadeKey((k) => k + 1);
    }
  }, [shownSrc]);

  // 60fps mirror: copy the live transform ref straight to the DOM node.
  // Same string React would render — but without re-rendering anything.
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef(props.flipX);
  flipRef.current = props.flipX;
  useEffect(() => {
    let raf = 0;
    let last = '';
    const apply = () => {
      raf = requestAnimationFrame(apply);
      const n = nodeRef.current;
      if (!n) return;
      const v = props.transformRef.current;
      const s = `translate(${v.x}px, ${v.y}px) rotate(${v.rot + v.tilt}deg) scale(${(v.scale * v.squashX) * (flipRef.current ? -1 : 1)}, ${v.scale * v.squashY})`;
      if (s !== last) { last = s; n.style.transform = s; }
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [props.transformRef]);

  const regionFromPoint = (px: number, py: number) => {
    if (PIXEL_FACES.includes(props.sprite as AnySprite) || HD_FACES.includes(props.sprite as AnySprite)) {
      if (py < 0.35) props.onRegionClick('hair');
      else if (py < 0.55) props.onRegionClick('glasses');
      else props.onRegionClick('head');
      return;
    }
    if (props.sprite === 'hd-sleep' || props.sprite === 'sleep-16') { props.onRegionClick('body'); return; }
    if (py < 0.16) props.onRegionClick('hair');
    else if (py < 0.33 && px > 0.3 && px < 0.7) props.onRegionClick('glasses');
    else if (py < 0.36) props.onRegionClick('head');
    else if (py > 0.87) props.onRegionClick('feet');
    else if (py > 0.38 && py < 0.66) props.onRegionClick('torso');
    else props.onRegionClick('body');
  };

  const gearLayer = (behind: boolean) =>
    props.accessories
      .filter((p) => { try { return (gearDef(p.defId).behind ?? false) === behind; } catch { return false; } })
      .map((p) => {
        const g = gearDef(p.defId);
        // gloves place a mirrored pair on both hands
        if (p.defId === 'gloves') {
          return (
            <React.Fragment key={p.uid}>
              <GearView p={{ ...p, dx: p.dx }} slot="handL" skin={props.skin} anchors={anchors} boxW={w}
                selected={props.selectedUid === p.uid} interactive={props.interactiveAccessories}
                onSelect={props.onSelectAccessory} onMove={props.onMoveAccessory} onRemove={props.onRemoveAccessory} />
              <GearView p={{ ...p, dx: p.dx }} slot="handR" skin={props.skin} anchors={anchors} boxW={w}
                selected={false} interactive={false}
                onSelect={props.onSelectAccessory} onMove={props.onMoveAccessory} onRemove={props.onRemoveAccessory} />
            </React.Fragment>
          );
        }
        return (
          <GearView key={p.uid} p={p} slot={g.slot} skin={props.skin} anchors={anchors} boxW={w}
            selected={props.selectedUid === p.uid} interactive={props.interactiveAccessories}
            onSelect={props.onSelectAccessory} onMove={props.onMoveAccessory} onRemove={props.onRemoveAccessory} />
        );
      });

  return (
    <div
      ref={(n) => {
        nodeRef.current = n;
        if (typeof ref === 'function') ref(n);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = n;
      }}
      data-oliver="true"
      className="relative no-select"
      style={{
        width: w,
        height,
        transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rot + t.tilt}deg) scale(${(t.scale * t.squashX) * (props.flipX ? -1 : 1)}, ${t.scale * t.squashY})`,
        transition: 'transform 60ms linear',
        // pixel-mode inflation: widen him like a balloon as poke count climbs
        ...(fatLevel > 0.05 && pixelated
          ? { width: w * (1 + fatLevel * 0.45), transition: 'width .28s ease-out, transform 60ms linear' }
          : null),
        // HD gets a soft contact shadow + cool rim light; pixel keeps the hard arcade drop
        filter: props.mad
          ? 'drop-shadow(0 0 26px rgba(255,40,30,.85)) drop-shadow(0 0 60px rgba(255,80,40,.4)) saturate(1.5)'
          : pixelated
            ? 'drop-shadow(0 14px 0 rgba(10,8,40,.35)) drop-shadow(0 0 18px rgba(198,242,78,.35)) brightness(1.06)'
            : 'drop-shadow(0 26px 16px rgba(30,27,58,.22)) drop-shadow(6px 0 10px rgba(185,167,249,.22)) drop-shadow(-4px 0 8px rgba(255,210,63,.18)) brightness(1.1) contrast(1.05) saturate(1.12)',
        animation: props.mad ? 'madShake .35s linear infinite' : undefined,
      }}
    >
      <style>{`
        @keyframes discoDance { 0%{ transform: rotate(-6deg) translateY(0);} 100%{ transform: rotate(6deg) translateY(-16px);} }
        @keyframes robot { 0%{ transform: rotate(-4deg);} 50%{ transform: rotate(4deg) translateY(-6px);} 100%{ transform: rotate(-4deg);} }
        @keyframes rave { 0%{ transform: translateY(0) scale(1,1);} 100%{ transform: translateY(-26px) scale(1.06,.94);} }
        @keyframes silly { 0%{ transform: rotate(-12deg) scale(1);} 50%{ transform: rotate(10deg) scale(1.04,.96);} 100%{ transform: rotate(-12deg) scale(1);} }
        @keyframes glassesPop { 0%{transform:scale(1)} 40%{transform:scale(1.6) rotate(-8deg)} 100%{transform:scale(1)} }
        @keyframes hairBoing { 0%{transform:translateY(0) scale(1)} 35%{transform:translateY(6px) scale(1.06,.9)} 70%{transform:translateY(-8px) scale(.96,1.06)} 100%{transform:translateY(0) scale(1)} }
        @keyframes madShake { 0%{ margin-left:-3px;} 25%{ margin-left:3px;} 50%{ margin-left:-2px;} 75%{ margin-left:2px;} 100%{ margin-left:0;} }
        @keyframes hitFlash { 0%{ transform: scale(.4) rotate(-14deg); opacity:0;} 35%{ transform: scale(1.25) rotate(6deg); opacity:1;} 100%{ transform: scale(1.1) rotate(0); opacity:0;} }
        @keyframes poseBlend { 0%{ filter: brightness(1.5) blur(1.5px);} 100%{ filter: none;} }
      `}</style>

      {gearLayer(true)}

      <div style={danceAnim ? { animation: danceAnim } : undefined} className="relative w-full h-full">
        <div
          className="absolute inset-0 overflow-visible"
          style={framedFallback && props.sprite === 'cutout-photo' ? { borderRadius: 28, border: '4px solid #1e1b3a', background: '#fff', overflow: 'hidden' } : undefined}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            regionFromPoint((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
          }}
        >
          <img
            key={fadeKey}
            src={shownSrc}
            alt="Oliver"
            draggable={false}
            onError={() => { if (props.sprite === 'cutout-photo') setFramedFallback(true); }}
            className="w-full h-full"
            style={{
              objectFit: props.sprite === 'cutout-photo' ? (fatSrc ? 'contain' : 'cover') : 'contain',
              imageRendering: pixelated ? 'pixelated' : 'auto',
              transform: `translate(${t.faceX * 6}px, ${t.faceY * 4}px)`,
              opacity: props.dimmed ? 0.55 : 1,
              animation: fadeKey > 0 && !pixelated ? 'poseBlend .28s ease-out both' : undefined,
            }}
          />
          {/* mad overlay: angry face badge */}
          {props.mad && (
            <img src={madBadge} alt="" draggable={false}
              className="absolute pointer-events-none"
              style={{
                right: '-8%', top: '-6%', width: '44%',
                imageRendering: pixelated ? 'pixelated' : 'auto',
                animation: 'glassesPop .5s ease infinite alternate',
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.4))',
              }} />
          )}
          {/* anime punch impact flash */}
          {Date.now() - props.hitFx < 550 && (
            <img src="./fx-anger.png" alt="" draggable={false}
              className="absolute pointer-events-none"
              style={{
                left: '50%', top: '40%', width: '110%',
                transform: 'translate(-50%,-50%)',
                animation: 'hitFlash .5s ease-out forwards',
                filter: 'drop-shadow(0 0 12px rgba(255,30,30,.8))',
                zIndex: 45,
              }} />
          )}
          {/* sleeping overlay (pixel ZZZ in 16-bit, no emoji) */}
          {props.sleeping && (
            pixelated ? (
              <div className="absolute pointer-events-none" style={{ right: '6%', top: '2%' }}>
                {['Z', 'Z', 'Z'].map((z, i) => (
                  <div key={i} style={{
                    fontFamily: '"Press Start 2P", monospace', color: '#7BE0D4',
                    fontSize: 14 + i * 6, textShadow: '2px 2px 0 #000',
                    animation: `zfloat 2s ease-out ${i * 0.5}s infinite`,
                  }}>{z}</div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-start justify-end pointer-events-none" style={{ background: 'rgba(30,27,58,.25)', borderRadius: 24 }}>
                <div className="font-display text-4xl p-3" style={{ animation: 'sleep-zzz 2s ease-out infinite' }}>💤</div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#1e1b3a] text-white text-xs font-extrabold px-3 py-1 rounded-full">shhh… Oliver is napping</div>
              </div>
            )
          )}
          {Date.now() - props.glassesPop < 600 && (
            <div className="absolute pointer-events-none" style={{ left: '30%', right: '30%', top: '19%', height: '10%', borderRadius: 16, animation: 'glassesPop .5s ease', border: '4px solid #FFD23F' }} />
          )}
          {Date.now() - props.hairBounce < 600 && (
            <div className="absolute pointer-events-none" style={{ left: '15%', right: '15%', top: '0%', height: '16%', borderRadius: '50%', animation: 'hairBoing .5s ease', background: 'rgba(198,242,78,.35)' }} />
          )}
        </div>

        {props.children}
        {gearLayer(false)}
      </div>
    </div>
  );
});

function GearView({ p, slot, anchors, boxW, selected, interactive, onSelect, onMove, onRemove }: {
  p: PlacedAccessory; slot: SlotId;
  skin: Skin; anchors: Record<SlotId, { x: number; y: number }>; boxW: number;
  selected: boolean; interactive: boolean;
  onSelect: (uid: number | null) => void; onMove: (uid: number, dx: number, dy: number) => void;
  onRemove: (uid: number) => void;
}) {
  const g = gearDef(p.defId);
  const dragRef = useRef<{ sx: number; sy: number; dx: number; dy: number } | null>(null);
  const a = anchors[slot];
  const pxW = g.wFrac * boxW * p.scale;
  const Art = g.art;
  return (
    <div
      className="absolute"
      style={{
        left: `calc(${a.x * 100}% + ${p.dx}px)`,
        top: `calc(${a.y * 100}% + ${p.dy}px)`,
        width: pxW,
        transform: `translate(${-g.ax * 100}%, ${-g.ay * 100}%) rotate(${p.rot}deg)`,
        zIndex: 30,
        cursor: interactive ? 'grab' : 'default',
        filter: selected
          ? 'drop-shadow(0 0 6px #2B50E0) drop-shadow(0 4px 8px rgba(43,80,224,.5))'
          : 'drop-shadow(0 3px 4px rgba(0,0,0,.3))',
        outline: selected ? '3px dashed #2B50E0' : 'none',
        outlineOffset: 4, borderRadius: 12,
        touchAction: interactive ? 'none' : 'auto',
      }}
      onPointerDown={interactive ? (e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onSelect(p.uid);
        dragRef.current = { sx: e.clientX, sy: e.clientY, dx: p.dx, dy: p.dy };
      } : undefined}
      onPointerMove={interactive ? (e) => {
        const d = dragRef.current; if (!d) return;
        onMove(p.uid, d.dx + (e.clientX - d.sx), d.dy + (e.clientY - d.sy));
      } : undefined}
      onPointerUp={interactive ? () => { dragRef.current = null; } : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(p.uid);
      }}
    >
      <Art />
    </div>
  );
}

export default React.memo(OliverCharacter);
