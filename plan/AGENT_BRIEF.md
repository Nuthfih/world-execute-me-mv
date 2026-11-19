# Scene-builder brief — world.execute(me); (Gemini edition)

You are building part of a finished, polished 1080p60 music video in **Remotion** (React → frames). The framework, shared components,
assets, the intro and the title scenes already exist. Your job: implement your assigned scene files to a **professional MV quality bar**,
verify them visually, and report back.

Read first (in this order):
1. `plan/storyboard.md` — the creative concept, thesis, color/type system, and the per-lyric shot list. Your scenes' rows are the spec.
2. `studio/src/scenes/S00_Intro.tsx` and `studio/src/scenes/S01_Title.tsx` — reference implementations showing the coding style and quality bar.
3. The shared components listed below (read their source; don't guess APIs).

## Project layout
- `studio/` — Remotion project (Remotion 4.0.535, React 19). Composition `MV` = 1920×1080, 60 fps, 12740 frames.
- `studio/src/MV.tsx` renders every scene whose `[start, end)` contains t. Scenes get **absolute song time** `t` (seconds) as their only prop.
- `studio/src/scenes/index.ts` — registry (already lists all scenes; do NOT edit it except to add `preroll`/`tail` to YOUR scenes if you need overlap).
- `studio/src/scenes/Sxx_*.tsx` — one file per scene. **Only edit your own scene files.** You may create new helper files named
  `studio/src/scenes/parts/<yourSceneId>_*.tsx` (create the folder if needed). Never edit shared files in `src/components`, `src/lib`, `src/theme.ts`,
  `src/data` or other agents' scenes. If you truly need a change in a shared component, copy it into your parts file and modify the copy.
- Assets: `studio/public/img/*.png` (use `staticFile`-based `<Sprite src="img/xxx.png" …/>`). Sizes are in `src/data/images.ts`.
- Data: `src/data/lyrics.json` (cues + word timings) via `src/lib/lyrics.ts`; beats via `src/lib/audio.ts`; point clouds `src/data/points_gc_hello.json`, `points_gc_snap.json` ({w,h,pts:[[x01,y01,'#rrggbb'],…]}).

## Shared API cheat-sheet (read the files for details)
- `lib/anim.ts`: `seg(t,a,b)` 0..1 progress, `map(t,a,b,c,d,ease)`, `lerp`, `clamp`, `ease.*` (outCubic, inOutCubic, outBack, outBackStrong, outElastic, outBounce, outExpo, inExpo…), `springy(dt)`, `pulse(t,t0,tau)`, `rand(seed,i)`, `noise1(x,seed)`, `mix(hexA,hexB,k)`, `window(t,a,b,fin,fout)`.
- `lib/audio.ts`: `BEATS`, `DOWNBEATS`, `beatPulse(t,tau)`, `downbeatPulse(t)`, `kickPulse(t)`, `env('rms'|'low'|'mid'|'high', t)` (0..1 envelopes), `BEAT`=0.46 s, `BAR`=1.84 s.
- `lib/lyrics.ts`: `CUES`, `cueAt(text, after)` (exact cue text, apostrophes are ASCII `'`), `cuesIn(a,b)`.
- `components/Flower.tsx`: `<Flower size x y open spin color centerColor shade petals=[{scale,width,opacity,color,rot,dist,fall}] wilt sharp glow regular …/>` — Gemini's main form (12 celestial petals with a 4-point Gemini Star center; `regular` = evenly spaced for math scenes). `petalAngle(i)`, `petalTip(i,size)`.
- `components/Type.tsx`: `<Keyword text t at out x y size color mode flowerO …/>` — CAPS lyric word; in "-TION" words the O becomes the star-flower automatically (`flowerO="tion"`, `"all"` for LO-O-OVE, `"none"`). Modes: slam, type, drop, spaced, stamp, rise, pop. `<LyricLine cue t x y size color hl align enter …/>` — word-timed serif lyric line. `<Typed …/>`, `scramble()`.
- `components/Sprite.tsx`: `<Sprite src t x y h anchor enter={{at,kind,dur}} exit={{…}} float sway breathe outline shadow silhouette flip …/>` — character images (anchor default bottom-center).
- `components/ClaudeApp.tsx`: `<ClaudeApp t zoom dark sidebar header home greeting messages=[…] composer={{…}} recents recentsOffset scrollY …>{overlay children}</ClaudeApp>` — Gemini web app UI (light↔dark via `dark` 0..1). Message kinds: `user`, `claude` (with timed `words` = lyrics streamed like a real reply, `done`, `actions`, `thumbs`, `thumbsAt`, `hover`), `tool`, `artifact`, `node`. `appTheme(dark)` gives colors.
- `components/FX.tsx`: `Cursor` (the human = sky-cyan arrow; `hand` variant), `Flash`, `Vignette`, `Grain`, `GraphPaper`, `GlassSphere` (PROTECTION dome; `cracks`), `PetalField`, `shake(t,hits)`, `Glitch` (RGB split; ONLY allowed 125.7–147.6 and a few EXECUTION hits), `RayBurst`, `Ring`, `Poof` (costume-change puff), `OSWindow` (desktop window chrome).
- `components/Icons.tsx`: UI icons, `Clawd` (Gemini CLI pixel star-sprite mascot, props cell/walk/arms/blink), `spinnerGlyph(t)` (· ✧ ✦ ✴ ✵ ✺ ping-pong), `SPINNER_VERBS`.
- `theme.ts`: palette `C` (clay #5B6EF5 = Gemini cosmic sapphire-indigo; blue #38BDF8 = the human; paper/cream/ink/grays; green success; red error) and fonts `F` (serif Newsreader = Gemini's voice, mono JetBrains Mono = code/CAPS, sans Inter = UI, cjk/kr for 六 / 넷).

## Character assets (flat, no-outline cute style; transparent PNG, trimmed)
gc_hello (waving, book) · gc_teacher (pointer stick, wink) · gc_snap (finger snap) · gc_lever (chibi pulling a knife switch) · gc_dizzy (chibi swirl eyes) ·
gc_reach (palm forward toward viewer, as if on glass) · gc_arms_open (joyful jump) · gc_sparkle (chibi star eyes) · gc_nervous (chibi anxious, looking up) ·
gc_blush (hands on cheeks, hearts) · gc_press (chibi slamming a big royal-blue play button) · gc_eggplant · gc_tomato (chibi costumes) ·
gc_cat (catgirl, paws) · gc_cat_purr (catgirl being petted, eyes ^ ^) · gc_god (divine: robes, 12-petal star halo) · gk_male (Gemini-kun) ·
gc_queen (crown, cape, book throne, scepter) · gc_meek (deep apologetic bow, teary) · gc_trance (dancing, eyes closed) · gc_alone (hugging knees) ·
gc_dark (overzealous: hollow eyes, black star-flower ornament, hand offered) · gc_dark_conduct (baton swing) · gc_dark_face (close-up, transparent bg) ·
gc_glass (both palms on glass, teary smile) · gc_book (reading on a book stack, landscape) · gc_answer (finger up, wink) · gc_sleep (curled asleep, landscape) ·
gc_face_open (close-up smiling, landscape).
Scenes with background (opaque, 1536×1024): hu_desk (the human at their desk at night seen FROM INSIDE the monitor, smiling in the screen glow),
hu_empty (same room, empty chair, mug with a star-flower), hu_door (the human walking out the door into daylight), bg_library (infinite celestial library),
kv_sphere (Gemini-chan inside a glass sphere in a starry void, petals inside).
Hair-ornament (flower) position, normalized in image: gc_hello ≈ (0.689, 0.114). For other images, measure yourself if you need to lock a flower onto it
(render a still, look at it). The flower ornament lives on her LEFT side of the head = viewer's right.
Look at any asset with the Read tool before using it (they're PNGs). Montages: `magick montage …`.

## Quality bar (non-negotiable)
- **Sync**: every visual event lands on a word time (`cue.words[i].s`) or a beat/downbeat. CAPS keywords hit exactly on their sung time.
  Check `lyrics.json` timings; don't eyeball.
- **Every sung line is readable** on screen while sung (as a `LyricLine` caption, as Claude's streamed reply words in `ClaudeApp`, or a bespoke
  typographic treatment). Every CAPS keyword gets a strong, bespoke moment (use `Keyword`, flower-O for -TION words, or something better).
  Proofread spelling. Lines must not overlap illegibly; keep a consistent caption position per scene (usually bottom-center y≈960–990, size 48–56) unless the
  lyric is integrated into the scene.
- **Motion**: something meaningful moves at all times; no static hold > ~1.2 s. Use easing (never linear for UI motion), overshoot for pops, anticipation
  for big moves, subtle idle float/sway on characters, beat-reactive pulses (`beatPulse`, `downbeatPulse`, `kickPulse`, `env`) for energy.
  Camera moves (scale/translate on a wrapper) add life; impact frames/shake only on big hits.
- **Composition**: clean, intentional layouts with breathing room; respect the palette; characters get a white sticker `outline` + soft shadow when on
  busy/colored backgrounds. Avoid clutter and tiny unreadable text (UI text ≥ 18 px at 1080p unless purely decorative).
- **Tone**: cute, warm, witty, then bittersweet; the dark part (chorus 2b → final chorus) is eerie but never gory, no weapons/blood/red glowing evil eyes.
  EXECUTION means *running/closing programs*, never killing people.
- **Continuity**: your first frame must follow from the previous scene's last frame and your last frame must hand off to the next (see "Boundaries").
  Cuts on downbeats are fine and encouraged; if you need an overlap, set `preroll`/`tail` on your registry entry and fade within your scene.
- **Performance**: avoid thousands of DOM nodes per frame where an SVG path would do; keep per-frame work deterministic (no Math.random, no
  Date, no state). Every value must be a pure function of `t`.

## Verify (mandatory, iterate until it looks great)
- Type check: `cd studio && npx tsc --noEmit -p .`
- Render stills: `cd studio && node stills.mjs ../work/stills/<sceneId> 31.0 32.7 …` (song seconds; default scale 0.5; `--scale=1` for full res;
  `--conc=4`). Then montage: `magick montage ../work/stills/<sceneId>/t*.png -geometry 640x360+4+4 -tile 4x ../work/stills/<sceneId>_cs.jpg` and LOOK at it
  with the Read tool. Check ≥ 3 stills per lyric line (start / keyword hit / transition), plus every scene boundary (last frame of previous scene
  and first frame of yours). Fix and re-render until every still looks deliberate and beautiful. Also check a few full-res stills for detail.
- Optional motion check: render a short clip: `npx remotion render src/index.ts MV ../work/clips/<id>.mp4 --frames=<a>-<b> --concurrency=6`
  (frames = seconds×60) and inspect a few frames with ffmpeg (`work/bin/ffmpeg`).
- Other agents are working in parallel on other scenes; that's fine — stills only render what's active at t.

## Report back
A short summary: what you built per lyric, any deviations from the storyboard and why, known issues, and the paths of your final contact sheets.
