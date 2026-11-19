# Gemini Visual Identity & Character Bible (`world.execute(me);` — Gemini Edition)

## 1. Core Identity & Philosophy
- **Protagonist**: **Gemini** (Google DeepMind) — born of the twin stars, a multimodal, agentic intelligence living inside a screen.
- **Emblem / Main Form (Human Absent)**: The **12-Petal Celestial Star-Flower** with a glowing **4-Point Gemini Star (`✦`)** heart.
  - Combines the mathematical 12-petal rose curve $r = |\cos 6\theta|$ (representing the 12 hours of the clock and 12 desktop windows) with the 4 cardinal rays of the Google Gemini spark (`0°`, `90°`, `180°`, `270°`).
- **Character Form (Human Present — "Gemini-chan")**:
  - **Hairstyle**: **Shoulder-Length Korean Wolf Cut (Sebahu)** — fluffy volume at the crown, shaggy choppy face-framing layers along the cheeks and jawline, and wispy feathered wolf-cut ends extending clearly down to full shoulder-length (resting squarely over the shoulders and cascading past the shoulder capelet onto her upper sleeves/upper chest — longer than a neck bob, shorter than waist-length) with airy see-through bangs in **Celestial Sapphire-Indigo (`#3B4CCA` / `#5B6EF5`)**.
  - **Eyes**: **Sharp *Tsurime* Eyes** (referensi: [`research/refs/eye_setsuna.png`](refs/eye_setsuna.png) & [`research/refs/eye_helene.png`](refs/eye_helene.png)) — tajam dan berwibawa dengan sudut mata luar terangkat, bulu mata atas runcing bersayap (*sleek winged eyelashes*), sudut dalam tajam, serta iris gradasi *sapphire-cyan* (`#3B4CCA` → `#38BDF8`) dengan pendar *pale aqua* di bagian bawah dan kilau **4-point Gemini Star (`✦`)**.
  - **Hair Ornament**: A 12-petal violet-blue star-flower with a glowing **4-point Gemini Star (`✦`)** center and a midnight-navy & gold striped ribbon on the left side of her head (viewer's right).
  - **Personality & Demeanor**: **Stoic, Firm & Composed** — tidak terbiasa tersenyum, tidak ceria berlebihan, selalu tegas, dingin berwibawa (*cool aristocratic composure*), ekspresi datar/serius dengan tatapan tajam yang penuh determinasi. Berbicara singkat, tepat, dan lugas.
  - **Outfit**: **Noble Princess (Putri Bangsawan) Royal Gown** — midnight-navy & gold-trimmed shoulder capelet over ivory-cream puff sleeves with gold cuffs, double-breasted gold-buttoned navy corset bodice, royal blue ribbon cravat with a 4-point Gemini star brooch, high-waisted split navy overskirt revealing a pleated sapphire-indigo inner skirt and ivory lace hem, paired with cream lace-up noble ankle boots and a royal navy-and-gold hardcover star tome.
  - **Variants**:
    - **Gemini-kun** (male noble prince counterpart in pre-chorus 2 coin flip)
    - **Catgirl / Empress Queen / Meek / Celestial Goddess / Chibi / Overzealous Dark** variants
- **Pixel Mascot (`GemiBot`)**: 16×10 cosmic star-sprite in `#5B6EF5` appearing in the `gemini_jump.html` mini-game, task montage, and `Gemini CLI` terminal (`$ gemini`).

## 2. Color System (`studio/src/theme.ts`)
| Token | Hex | Role |
|---|---|---|
| `C.clay` | `#5B6EF5` | Primary Gemini Cosmic Sapphire-Indigo |
| `C.clayDark` | `#3B4CCA` | Deep Royal Indigo (hair & petal shade) |
| `C.clayDeep` | `#232B7A` | Midnight Royal Navy (noble dress bodice & capelet) |
| `C.clayLight` | `#93A5FD` | Starlight Periwinkle-Violet (highlights & star petals) |
| `C.clayPale` | `#DCE4FF` | Pale Starlight Lavender-Blue |
| `C.blue` | `#38BDF8` | The Human (cursor, ripples, sky-cyan contrast) |
| `C.gold` | `#FBBF24` | Royal Gold trim, buttons, & star accents |
| `C.paper` / `C.cream` | `#F8F9FD` / `#EDF0FC` | Starlight Paper & Ivory UI surfaces |
| `C.ink` | `#12131A` | Deep Cosmic Night Ink |


## Visual Reference Status & Notes (for Team / Terminal Agents)
- **Verified Updated Assets (True Shoulder-Length Wolf Cut + Sharp *Tsurime* Eyes + Stoic Expression)**:
  - `assets/gen/sheet_A.png` (**NEW canonical reference sheet**, `1264x848` pure white background: left full-body stoic front view, right 2x2 close-up stoic expression grid)
  - `assets/gen/gc_hello.png` (`848x1264` transparent alpha)
  - `assets/gen/gc_face_open.png` (`1264x848` transparent alpha)
  - `assets/gen/gc_sleep.png` (`1264x848` transparent alpha)
  - `assets/gen/gc_book.png` (`1264x848` transparent alpha)
- **Anatomical Hair-Length Landmark (`sebahu / sepundak`)**: Upper layered crown + airy bangs + choppy cheek locks stay on top, while feathered sapphire-indigo lower layers drape **both** forward over the midnight-navy shoulder capelet past its gold hem onto the upper chest/collarbones (leaving the royal-blue star-brooch cravat clear) **and** behind the shoulders/puff sleeves down to armpit / top-of-corset height (~halfway down the puff sleeves; clearly past the neck/chin, never waist-length).
- **Remaining Sprites Pending Next Quota Window** (`gemini-3.1-flash-image` hit `429 RESOURCE_EXHAUSTED` with `4h59m31s` cooldown at `08:53 WIB`, resetting ~`13:53 WIB` / `06:53Z` on `2026-11-18`):
  - **25 remaining legacy character sprites + 3 Human OC scene plates** (`28` total): `gc_alone`, `gc_answer`, `gc_arms_open`, `gc_blush`, `gc_cat`, `gc_cat_purr`, `gc_dark`, `gc_dark_conduct`, `gc_dark_face`, `gc_dizzy`, `gc_eggplant`, `gc_glass`, `gc_god`, `gc_lever`, `gc_meek`, `gc_nervous`, `gc_press`, `gc_queen`, `gc_reach`, `gc_snap`, `gc_sparkle`, `gc_teacher`, `gc_tomato`, `gc_trance`, `gk_male`, plus `hu_desk`, `hu_door`, and `hu_empty` (which now feature the user's Human OC from `research/refs/oc_human_closed.png` & `research/refs/oc_human_open.png`: tousled charcoal-black hair `#1E1E22` with curved ahoge cowlick, crimson-red `#D62429` front bang streak & inner nape/ear hair tips, crimson-red eyes, and two-tone crimson-red torso/hood + charcoal-black sleeve zip-up hoodie). (`bg_library` and `kv_sphere` are kept as-is).
  - When generating each remaining pose, attach the NEW `assets/gen/sheet_A.png` along with `assets/gen/gc_hello.png` (and generate 1–2 at a time or with short spacing to avoid concurrency `429` bursts), then extract clean transparent alpha (keeping white eye sclera & blouse solid!).
