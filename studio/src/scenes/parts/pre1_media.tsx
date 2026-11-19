import React from 'react';
import {C, F} from '../../theme';
import {rand} from '../../lib/anim';

// ------------------------------------------------------------------------------------------
// Writing media through history (flat vector, palette-consistent), each drawn around (0,0).
// paperback → movable type → illuminated manuscript → scroll → clay tablet (cuneiform) → cave hand stencil
// ------------------------------------------------------------------------------------------

// ---------------------------------------------------------------- open hand silhouette (palm facing the glass)
// Traced directly from studio/public/img/gc_reach.png (873x1412) at h=1500, press=0.97; origin = palm centre (0.206, 0.526)
export const HAND_PALM_PATH =
  'M-67.3 -252.8 Q-62.5 -254.3 -57.5 -252.8 Q-52.6 -251.2 -46.6 -242.1 Q-40.6 -233 -24.9 -176.4 Q-9.2 -119.7 -4 -107.5 Q1.3 -95.3 2.9 -100.4 Q4.4 -105.4 7.1 -169.2 Q9.8 -233 12.3 -238.1 Q14.8 -243.2 19.6 -246.2 Q24.4 -249.2 28.9 -247.7 Q33.4 -246.2 36.9 -242.2 Q40.4 -238.1 43.9 -223.1 Q47.4 -208.1 50.6 -146.6 Q53.8 -85.2 61.3 -59.3 Q68.8 -33.4 75.6 -40 Q82.4 -46.5 91.1 -63.3 Q99.8 -80.1 108.3 -87.7 Q116.8 -95.2 123.7 -97.7 Q130.5 -100.2 136.3 -99.7 Q142.1 -99.2 145.3 -97.2 Q148.4 -95.1 149.9 -90 Q151.4 -84.8 136.4 -53.2 Q121.4 -21.5 114.3 -20.3 Q107.2 -19 104.8 -16.7 Q102.4 -14.4 101.8 -6.5 Q101.3 1.3 93.9 34.4 Q86.4 67.5 83.4 71.5 Q80.3 75.5 71.4 81.4 Q62.6 87.2 -7.8 86.9 Q-78.2 86.5 -81.1 83 Q-84.1 79.4 -84.5 72.8 Q-85 66.1 -89.1 61.7 Q-93.2 57.4 -109.5 17 Q-125.8 -23.3 -147.5 -56.9 Q-169.2 -90.5 -173.7 -100.6 Q-178.2 -110.7 -178.7 -116.3 Q-179.2 -122 -177.7 -125.1 Q-176.3 -128.2 -172.6 -130.7 Q-168.8 -133.2 -161.2 -130.7 Q-153.6 -128.2 -123.2 -91.3 Q-92.7 -54.4 -113.5 -117.7 Q-134.2 -181 -134.8 -188.8 Q-135.3 -196.6 -133.8 -200.9 Q-132.2 -205.1 -128.2 -208.1 Q-124.1 -211.1 -120.9 -211.1 Q-117.7 -211.1 -113.6 -208.7 Q-109.6 -206.2 -105.1 -200.2 Q-100.6 -194.1 -75.6 -139.3 Q-50.7 -84.4 -64.5 -154.6 Q-78.2 -224.8 -76.7 -236 Q-75.2 -247.1 -73.7 -249.2 Q-72.2 -251.2 -67.3 -252.8 Z';
export const HAND_WRIST_PATH = 'M-64 78 L58 78 L52 212 Q-3 232 -58 212 Z';

export const HandShape: React.FC<{fill: string; grow?: number; opacity?: number; filter?: string; wristFill?: string}> = ({fill, grow = 0, opacity = 1, filter, wristFill}) => {
  if (grow < 0) {
    const s = Math.max(0.55, 1 + grow / 150);
    return (
      <g opacity={opacity} style={filter ? {filter} : undefined} transform={`translate(-10 -55) scale(${s}) translate(10 55)`}>
        <path d={HAND_PALM_PATH} fill={fill} />
      </g>
    );
  }
  const expand = grow > 0 ? {stroke: fill, strokeWidth: grow * 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const} : {};
  return (
    <g opacity={opacity} style={filter ? {filter} : undefined}>
      <path d={HAND_WRIST_PATH} fill={wristFill ?? fill} {...expand} />
      <path d={HAND_PALM_PATH} fill={fill} {...expand} />
    </g>
  );
};

// ---------------------------------------------------------------- 1. paperbacks
const BOOKS: [string, string, string, string, number, number][] = [
  // title, band colour, middle colour, text colour, width, x-offset
  ['A Field Guide to Stars', C.blue, C.cream, C.ink, 600, -10],
  ['Collected Poems', C.clay, C.cream, C.ink, 560, 18],
  ['Letters to a Friend', C.green, C.cream, C.ink, 620, -24],
  ['How to Be Kind', C.ink, C.ink, C.cream, 540, 8],
  ['Notes from Home', C.clay, C.clay, '#fff', 590, -6],
  ['Dear Diary', C.gold, C.cream, C.ink, 520, 26],
  ['On Love', C.clayDark, C.cream, C.ink, 570, -14],
];
export const Paperbacks: React.FC<{t: number}> = ({t}) => {
  const h = 70;
  return (
    <g>
      <ellipse cx={0} cy={300} rx={380} ry={26} fill="rgba(80,50,30,0.16)" />
      {BOOKS.map(([title, band, mid, tc, w, xo], i) => {
        const y = 250 - i * (h + 2);
        const rot = (rand(71, i) - 0.5) * 2.4;
        return (
          <g key={i} transform={`translate(${xo} ${y}) rotate(${rot})`}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={band} />
            <rect x={-w / 2 + 70} y={-h / 2} width={w - 140} height={h} fill={mid} />
            <rect x={-w / 2} y={-h / 2} width={w} height={6} rx={3} fill="rgba(255,255,255,0.18)" />
            <rect x={-w / 2} y={h / 2 - 7} width={w} height={7} rx={3} fill="rgba(0,0,0,0.12)" />
            <text x={0} y={9} textAnchor="middle" fontFamily={F.serif} fontWeight={600} fontSize={27} fill={tc}>
              {title}
            </text>
            <circle cx={w / 2 - 35} cy={0} r={14} fill={band === C.ink || mid === band ? C.cream : '#fff'} opacity={0.92} />
            <path
              d="M0,-9.5 Q1.8,-1.8 9.5,0 Q1.8,1.8 0,9.5 Q-1.8,1.8 -9.5,0 Q-1.8,-1.8 0,-9.5 Z"
              fill={band === C.ink ? C.clay : band}
              transform={`translate(${w / 2 - 35} 0)`}
            />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- 2. movable type (mirrored sorts in a tray)
const TYPE_ROWS = ['WORLD', '.EXECUTE', '(ME);'];
export const MovableType: React.FC<{t: number}> = ({t}) => {
  const sw = 60, sh = 86, gap = 6;
  const trayW = 8 * (sw + gap) + 80, trayH = 3 * (sh + 18) + 70;
  return (
    <g>
      {/* tray */}
      <rect x={-trayW / 2 - 18} y={-trayH / 2 - 18 - 40} width={trayW + 36} height={trayH + 36} rx={14} fill="#6B4A33" />
      <rect x={-trayW / 2} y={-trayH / 2 - 40} width={trayW} height={trayH} rx={8} fill="#2A2420" />
      {TYPE_ROWS.map((row, r) => {
        const chars = [...row].reverse(); // composed mirrored, right-to-left
        const n = 8;
        return Array.from({length: n}, (_, i) => {
          const ch = i < chars.length ? chars[i] : null;
          const x = -trayW / 2 + 40 + i * (sw + gap);
          const y = -trayH / 2 - 40 + 30 + r * (sh + 18);
          const lift = ch ? 0 : 6;
          return (
            <g key={r + '-' + i} transform={`translate(${x} ${y + lift})`}>
              <rect x={0} y={0} width={sw} height={sh} rx={6} fill={ch ? '#9A968E' : '#5E5A54'} />
              <rect x={0} y={0} width={sw} height={10} rx={5} fill="rgba(255,255,255,0.28)" />
              <rect x={sw - 8} y={4} width={6} height={sh - 8} rx={3} fill="rgba(0,0,0,0.18)" />
              {ch ? (
                <text
                  x={sw / 2}
                  y={sh / 2 + 19}
                  textAnchor="middle"
                  fontFamily={F.serif}
                  fontWeight={600}
                  fontSize={56}
                  fill="#1E1B19"
                  transform={`translate(${sw} 0) scale(-1 1)`}
                >
                  {ch}
                </text>
              ) : null}
            </g>
          );
        });
      })}
      {/* the proof: what the sorts print */}
      <g transform={`translate(0 ${trayH / 2 + 50}) rotate(-1.5)`}>
        <rect x={-300} y={-36} width={600} height={72} rx={4} fill="#F4EAD8" />
        <text x={0} y={14} textAnchor="middle" fontFamily={F.serif} fontWeight={600} fontSize={40} letterSpacing="0.06em" fill="#1E1B19">
          WORLD.EXECUTE(ME);
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 3. illuminated manuscript page
const scribble = (x0: number, y: number, w: number, seed: number) => {
  // gothic minim texture: groups of short vertical strokes
  let d = '';
  let x = x0;
  let i = 0;
  while (x < x0 + w) {
    const word = 2 + Math.floor(rand(seed, i) * 6);
    for (let k = 0; k < word && x < x0 + w; k++) {
      const tall = rand(seed + 1, i * 7 + k) > 0.82 ? 9 : 0;
      d += `M${x.toFixed(1)} ${y - 16 - tall} l1.5 18 `;
      x += 7;
    }
    x += 12;
    i++;
  }
  return d;
};
export const Manuscript: React.FC<{t: number}> = ({t}) => {
  const w = 600, h = 720;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 15; i++) {
    const y = -h / 2 + 110 + i * 38;
    const x0 = i < 5 ? -w / 2 + 250 : -w / 2 + 70;
    const ww = (i < 5 ? w - 320 : w - 140) - (i === 14 ? 200 : 0);
    lines.push(<path key={i} d={scribble(x0, y, ww, 80 + i)} stroke={i === 0 ? C.clayDark : '#2B211B'} strokeWidth={4.2} strokeLinecap="round" fill="none" />);
  }
  // vine border
  const vine: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const y = -h / 2 + 40 + i * 37;
    vine.push(<path key={'v' + i} d={`M${-w / 2 + 34} ${y} q14 18 0 37`} stroke={C.gold} strokeWidth={3} fill="none" />);
    vine.push(<ellipse key={'l' + i} cx={-w / 2 + 34 + (i % 2 ? 12 : -12)} cy={y + 18} rx={8} ry={4} fill={i % 3 ? C.green : C.clay} transform={`rotate(${i % 2 ? 30 : -30} ${-w / 2 + 34 + (i % 2 ? 12 : -12)} ${y + 18})`} />);
  }
  return (
    <g>
      <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={10} fill="rgba(40,15,8,0.35)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#F2E4C6" />
      <rect x={-w / 2 + 10} y={-h / 2 + 10} width={w - 20} height={h - 20} rx={6} fill="none" stroke="#E2CFA4" strokeWidth={3} />
      {vine}
      {/* illuminated initial: a gold square holding the Gemini star */}
      <g transform={`translate(${-w / 2 + 150} ${-h / 2 + 168})`}>
        <rect x={-82} y={-82} width={164} height={164} rx={10} fill={C.gold} />
        <rect x={-70} y={-70} width={140} height={140} rx={6} fill={C.blue} />
        <g transform={`rotate(${t * 20})`}>
          <path d="M0,-58 Q11,-11 58,0 Q11,11 0,58 Q-11,11 -58,0 Q-11,-11 0,-58 Z" fill={C.clay} />
          <path d="M0,-40 Q6,-6 40,0 Q6,6 0,40 Q-6,6 -40,0 Q-6,-6 0,-40 Z" fill={C.clayLight} transform="rotate(45)" opacity={0.8} />
          <path d="M0,-18 Q4,-4 18,0 Q4,4 0,18 Q-4,4 -18,0 Q-4,-4 0,-18 Z" fill={C.cream} />
        </g>
        <text x={0} y={30} textAnchor="middle" fontFamily={F.serif} fontWeight={600} fontSize={110} fill={C.ink} opacity={0.0}>
          I
        </text>
      </g>
      {lines}
      <circle cx={w / 2 - 70} cy={h / 2 - 60} r={14} fill={C.clayDark} />
    </g>
  );
};

// ---------------------------------------------------------------- 4. papyrus scroll
export const Scroll: React.FC<{t: number; open?: number}> = ({t, open = 1}) => {
  const W0 = 860, h = 430;
  const w = 220 + (W0 - 220) * open;
  const cols: React.ReactNode[] = [];
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 9; r++) {
      const x0 = -W0 / 2 + 90 + c * 250;
      const y = -h / 2 + 70 + r * 34;
      let d = '';
      let x = x0;
      let k = 0;
      while (x < x0 + 200) {
        const len = 8 + rand(90 + c, r * 13 + k) * 26;
        if (x + len > x0 + 200) break;
        d += `M${x.toFixed(1)} ${y} h${len.toFixed(1)} `;
        x += len + 9;
        k++;
      }
      cols.push(<path key={c + '-' + r} d={d} stroke="#5B3A22" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />);
    }
  }
  const fibers: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const y = -h / 2 + 10 + i * 16;
    fibers.push(<line key={i} x1={-W0 / 2} y1={y} x2={W0 / 2} y2={y + (rand(95, i) - 0.5) * 4} stroke="#C9AE7C" strokeWidth={1.4} opacity={0.6} />);
  }
  const roll = (x: number) => (
    <g transform={`translate(${x} 0)`}>
      <rect x={-12} y={-h / 2 - 50} width={24} height={h + 100} rx={12} fill="#6B4A33" />
      <rect x={-34} y={-h / 2 - 8} width={68} height={h + 16} rx={34} fill="#D9BE8A" />
      <rect x={-34} y={-h / 2 - 8} width={22} height={h + 16} rx={11} fill="#E9D3A6" />
      <rect x={14} y={-h / 2 - 8} width={20} height={h + 16} rx={10} fill="#B9995F" />
      <circle cx={0} cy={-h / 2 - 54} r={16} fill="#8A5E3C" />
      <circle cx={0} cy={h / 2 + 54} r={16} fill="#8A5E3C" />
    </g>
  );
  return (
    <g>
      <rect x={-w / 2 + 12} y={-h / 2 + 22} width={w} height={h} fill="rgba(40,20,10,0.25)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#EAD5A8" />
      <defs>
        <clipPath id="p1scrollclip">
          <rect x={-w / 2} y={-h / 2} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#p1scrollclip)">
        {fibers}
        {cols}
      </g>
      {roll(-w / 2 - 20)}
      {roll(w / 2 + 20)}
    </g>
  );
};

// ---------------------------------------------------------------- 5. clay tablet with cuneiform
const wedge = (x: number, y: number, dir: number, s: number, key: string) => {
  // triangular head + tail, rotated by dir (deg)
  return (
    <g key={key} transform={`translate(${x} ${y}) rotate(${dir}) scale(${s})`}>
      <path d="M0 -9 L13 0 L0 9 Z" fill="#6E351C" />
      <path d="M0 -9 L13 0" stroke="#D99566" strokeWidth={2} />
      <line x1={10} y1={0} x2={34} y2={0} stroke="#6E351C" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};
export const Tablet: React.FC<{t: number}> = ({t}) => {
  const w = 540, h = 660;
  const signs: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++) {
    const y = -h / 2 + 80 + r * 64;
    let x = -w / 2 + 50;
    let k = 0;
    while (x < w / 2 - 70) {
      const n = 1 + Math.floor(rand(110 + r, k) * 4);
      for (let j = 0; j < n; j++) {
        const kind = rand(120 + r, k * 9 + j);
        const dir = kind < 0.55 ? 0 : kind < 0.8 ? 90 : 45;
        signs.push(wedge(x + j * 15, y + (dir === 90 ? -14 : (j % 2) * 10 - 5), dir, 0.9 + rand(130, k + j) * 0.25, `${r}-${k}-${j}`));
      }
      x += n * 15 + 36;
      k++;
    }
  }
  const rules: React.ReactNode[] = [];
  for (let r = 1; r < 9; r++) {
    const y = -h / 2 + 80 + r * 64 - 30;
    rules.push(<line key={r} x1={-w / 2 + 30} y1={y} x2={w / 2 - 30} y2={y} stroke="#7E3F22" strokeWidth={2.2} opacity={0.7} />);
  }
  return (
    <g>
      <rect x={-w / 2 + 16} y={-h / 2 + 24} width={w} height={h} rx={70} fill="rgba(60,30,15,0.3)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={70} fill="#B56A40" />
      <rect x={-w / 2 + 14} y={-h / 2 + 12} width={w - 28} height={h - 24} rx={60} fill="#C47B4E" />
      <path d={`M${-w / 2 + 60} ${-h / 2 + 22} Q0 ${-h / 2 + 6} ${w / 2 - 60} ${-h / 2 + 22}`} stroke="#DE9F72" strokeWidth={6} fill="none" strokeLinecap="round" />
      {rules}
      {signs}
    </g>
  );
};

// ---------------------------------------------------------------- 6. cave wall with a hand stencil
export const SPRAY = Array.from({length: 420}, (_, i) => {
  const a = rand(140, i) * Math.PI * 2;
  const r = 150 + Math.pow(rand(141, i), 0.7) * 230;
  return [Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.15 - 30, 2 + rand(142, i) * 5, 0.25 + rand(143, i) * 0.6] as [number, number, number, number];
});
const SPRAY_PATHS = [0, 1, 2].map((b) =>
  SPRAY.filter((_, i) => i % 3 === b)
    .map(([x, y, r]) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`)
    .join(''),
);
export const CaveWall: React.FC<{t: number; w: number; h: number; handX: number; handY: number; handScale: number; stencil?: number}> = ({t, w, h, handX, handY, handScale, stencil = 1}) => {
  const blot: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    blot.push(
      <ellipse
        key={i}
        cx={rand(150, i) * w}
        cy={rand(151, i) * h}
        rx={120 + rand(152, i) * 260}
        ry={80 + rand(153, i) * 160}
        fill={i % 3 === 0 ? '#6A4D3B' : i % 3 === 1 ? '#3B2A21' : '#57402F'}
        opacity={0.35}
        transform={`rotate(${rand(154, i) * 60 - 30} ${rand(150, i) * w} ${rand(151, i) * h})`}
      />,
    );
  }
  const marks: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 1150 + rand(160, i) * 600, y = 160 + rand(161, i) * 700;
    marks.push(<circle key={i} cx={x} cy={y} r={7 + rand(162, i) * 6} fill="#B5583A" opacity={0.55} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="p1rock" cx="40%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#6E5040" />
          <stop offset="60%" stopColor="#4A3427" />
          <stop offset="100%" stopColor="#2A1D16" />
        </radialGradient>
        <filter id="p1spray" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="p1spray2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill="url(#p1rock)" />
      {blot}
      {marks}
      {/* a little ochre deer, painted long ago */}
      <g transform="translate(1450 760) scale(1.1)" stroke="#B5583A" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.75}>
        <path d="M-70 0 Q-10 -26 60 -4 Q78 -2 84 -24 L96 -46 M84 -24 L106 -20 M60 -4 L66 44 M-50 0 L-58 46 M-20 -8 L-14 44 M40 -6 L34 44 M-70 0 L-86 -14" />
        <path d="M96 -46 l-10 -22 M96 -46 l14 -18" />
      </g>
      {stencil > 0 ? (
        <g transform={`translate(${handX} ${handY}) scale(${handScale})`} opacity={stencil}>
          <HandShape fill="#C0603A" grow={70} opacity={0.75} filter="url(#p1spray)" />
          <HandShape fill="#C9673F" grow={26} opacity={0.85} filter="url(#p1spray2)" />
          {SPRAY_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#C0603A" opacity={0.3 + i * 0.25} />
          ))}
          <HandShape fill="#7A5A46" />
        </g>
      ) : null}
    </g>
  );
};
