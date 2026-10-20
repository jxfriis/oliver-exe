# OLIVER.EXE — One Oliver. Infinite possibilities.

A complete, interactive web playground starring Oliver.
Built with **React + TypeScript + Vite + Tailwind CSS v4** and Lucide icons. No paid APIs, no external accounts.

## Run it

```bash
cd oliver-exe
npm install
npm run dev      # dev server, default http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Two looks: HD photo + 16-BIT

- **GO 16-BIT** toggle in the header reskins the whole UI (pixel font, dark arcade
  theme, scanlines) and swaps Oliver to the 10-sprite pixel sheet
  (`public/sprites/oliver-*.png`, named after what each picture shows):
  front-stand, side-stand left/right, back-stand, topdown-bow, sit-fall,
  walk-right A/B (2-frame walk cycle), face-happy, face-angry.
- 16-bit mode adds lively lighting: twinkling stars, flickering torches, a moving
  light sweep, scanlines + CRT vignette.
- **HD mode** keeps the true transparent cutout (`public/oliver-transparent.png`)
  as the base and swaps the 10-sprite realistic sheet (`public/sprites-hd/`) per
  action: walk A/B when running, side/back views, fall pose mid-air, sleep sprite
  for naps, happy face for wins, angry face for rage.
- All PNGs were verified to carry real alpha — nothing fakes transparency.

## Modes & games

- **Catch the runner** (chase rework) — Oliver FLEES the cursor, dodges sideways
  when you close in, and must actually be clicked to score a catch. Every catch:
  faster + smaller (5 catches = Gotcha! badge). Stage misses count as whiffs,
  near-misses get SO CLOSE! An arrow marks him until your first catch.
- **Dress-Up Studio** — body-mapped wardrobe: hats→head, shades→eyes,
  moustache→mouth, chains→neck, capes/wings→back, boxing gloves→both hands,
  stompers→feet. Fitted SVG gear (no more slapped-on emoji), drag to fine-tune,
  right-click removes. Entering dress-up resets him to a clean front pose.
- **Poke** — punches show the anime 💢 hit flash (`public/fx-anger.png`) with an
  impact sound; head/torso/feet regions, combo meter.
- **Oliver Says** — SPEAK uses Puter cloud TTS (lazy-loaded `js.puter.com/v2`,
  standard voices only, never a clone) with system-voice fallback.
- **Games (11)** — Catch (net cursor), Dodge, Oliver Hoops (drag-aim, trajectory
  dots, rim/net physics, swish, streaks, moving hoop, wind), Pong vs Oliver,
  Coin Dash, Whack-an-Oliver, Maze (3 depths, torch lighting, guards),
  Rocket Oliver (asteroids, cookies + cigarettes), Flappy Oliver (hover start,
  floaty physics), Snake Oliver (snake-form head).
- **Chaos, two-stage** — meter fills → FUMING warning (12s, gains doubled, decays
  when ignored). Keep pushing → full MELTDOWN, different every time (no repeats);
  the huge set-pieces (blackout, invasion, mega) only crash the chase tab.
- **Dance party** — rickroll MP3 only (warmed for instant start), real dance-frame
  sprites alternating on the beat, canvas mirror ball, light-up floor,
  spotlights, lasers. Leaving the tab stops everything.
- Plus: sketch canvas (visible in sketch mode only), gravity playground, generator,
  photo booth with real PNG export, Oliver army (right-click minis to dismiss),
  15 achievements (localStorage), SURPRISE ME, landing castle with walk-in
  transition (silent until you opt into sound), first-run tutorial, settings with
  SFX volume.

## Files

- `src/App.tsx` — layout, master rAF loop, flee-AI, meltdowns, panels, export
- `src/components/OliverCharacter.tsx` — cutout / pixel / HD skins, slot-fitted gear, hit flash
- `src/components/FittedGear.tsx` — body-mapped SVG wardrobe
- `src/components/BitLighting.tsx` — 16-bit lighting effects
- `src/components/SketchLayer.tsx` — drawing canvas (Oliver-relative coords)
- `src/games/Basketball.tsx` — Oliver Hoops canvas game
- `src/games/Pong.tsx` — Pong vs Oliver
- `src/games/FunGames.tsx` — Coin Dash + Whack-an-Oliver
- `src/lib/sprites.ts` — named sprite catalogs + per-action mapping + body anchors
- `src/lib/meltdowns.ts` — meltdown pool (no immediate repeats)
- `src/lib/sound.ts` — WebAudio synth SFX (gesture-initiated)
- `src/lib/voice.ts` — Puter TTS with system fallback
- `src/lib/data.ts` — phrases, badges, booth backgrounds

## Third look: 3D WORLD

Click **3D WORLD** on the landing screen or in the header to teleport into the
standalone Three.js island (`public/3d/`). It is a full 3D playground with its
own HUD, objectives, dance floor, waterfall, and eight 3D arcade cabinets.
Use **← BACK TO THE LAB** in the portal bar to return to the React playground.

The 3D build is self-contained and served from `public/3d/`, so the original
16-bit / HD modes and every existing feature keep working exactly as before.
