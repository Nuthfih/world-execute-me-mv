import React from 'react';

type P = {size?: number; color?: string; stroke?: number; style?: React.CSSProperties; fill?: string};
const Svg: React.FC<P & {children: React.ReactNode; vb?: string}> = ({size = 20, color = 'currentColor', stroke = 1.6, style, children, vb = '0 0 24 24'}) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const IPlus: React.FC<P> = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const ISearch: React.FC<P> = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>;
export const IChat: React.FC<P> = (p) => <Svg {...p}><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A1.5 1.5 0 0 1 5 14.5z" /></Svg>;
export const IFolder: React.FC<P> = (p) => <Svg {...p}><path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></Svg>;
export const IArtifact: React.FC<P> = (p) => <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Svg>;
export const ICode: React.FC<P> = (p) => <Svg {...p}><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5" /></Svg>;
export const ICopy: React.FC<P> = (p) => <Svg {...p}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" /></Svg>;
export const IThumbUp: React.FC<P> = (p) => (
  <Svg {...p}><path d="M7.5 10.5V19H5a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1zM7.5 10.5l3.6-6.3a1.6 1.6 0 0 1 2.9 1.2L13.3 9.5h4.9a1.8 1.8 0 0 1 1.7 2.2l-1.4 5.9A1.8 1.8 0 0 1 16.8 19H7.5" /></Svg>
);
export const IThumbDown: React.FC<P> = (p) => (
  <Svg {...p} style={{...(p.style || {}), transform: 'scaleY(-1)'}}><path d="M7.5 10.5V19H5a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1zM7.5 10.5l3.6-6.3a1.6 1.6 0 0 1 2.9 1.2L13.3 9.5h4.9a1.8 1.8 0 0 1 1.7 2.2l-1.4 5.9A1.8 1.8 0 0 1 16.8 19H7.5" /></Svg>
);
export const IRetry: React.FC<P> = (p) => <Svg {...p}><path d="M19 12a7 7 0 1 1-2.1-5M19 4.5V8h-3.5" /></Svg>;
export const ISliders: React.FC<P> = (p) => <Svg {...p}><path d="M5 7h9M18 7h1M5 17h3M12 17h7" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>;
export const IArrowUp: React.FC<P> = (p) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const IChevron: React.FC<P> = (p) => <Svg {...p}><path d="M7 10l5 5 5-5" /></Svg>;
export const IClose: React.FC<P> = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const ISidebar: React.FC<P> = (p) => <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9.5 4.5v15" /></Svg>;
export const IPlay: React.FC<P> = (p) => <Svg {...p}><path d="M8 5.5v13l10.5-6.5z" fill={p.color ?? 'currentColor'} /></Svg>;
export const ICheck: React.FC<P> = (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const ISun: React.FC<P> = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Svg>;
export const IMoon: React.FC<P> = (p) => <Svg {...p}><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" /></Svg>;
export const ITerminal: React.FC<P> = (p) => <Svg {...p}><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" /></Svg>;
export const IHeart: React.FC<P> = (p) => <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={p.fill ?? 'none'} /></Svg>;
export const IPencil: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M11 4H5.5A2 2 0 0 0 3.5 6v12.5a2 2 0 0 0 2 2H18a2 2 0 0 0 2-2V13" />
    <path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4z" />
  </Svg>
);
export const IGems: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M7.5 4.5L9.5 8l3.5 2-3.5 2-2 3.5-2-3.5L2 10l3.5-2z" />
    <path d="M16.5 3.5L17.8 6l2.5 1.2-2.5 1.3-1.3 2.5-1.2-2.5L12.8 7.2 15.3 6z" />
    <path d="M15.5 13l1.3 2.8 2.7 1.2-2.7 1.3-1.3 2.7-1.2-2.7L11.5 17l2.8-1.2z" />
  </Svg>
);
export const IImage: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M20.5 15.5l-4.5-4.5-6.5 6.5-2.5-2.5-3.5 3.5" />
  </Svg>
);
export const IClock: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IGear: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
export const IMic: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="9" y="3.5" width="6" height="10" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
  </Svg>
);
export const ICustomize: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IVideo: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3 9.5h18M9 5l2.5 4.5M14 5l2.5 4.5" />
  </Svg>
);
export const IFilter: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </Svg>
);

/** Official-style 4-point Gemini star emblem with multi-stop sapphire-periwinkle gradient */
export const IGeminiSpark: React.FC<{size?: number; style?: React.CSSProperties; color?: string}> = ({size = 24, style, color}) => {
  const gid = React.useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style}>
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B6EF3" />
          <stop offset="48%" stopColor="#4F87FF" />
          <stop offset="100%" stopColor="#9B72CB" />
        </linearGradient>
      </defs>
      <path
        d="M14 1.5 C15.1 9.8 18.2 12.9 26.5 14 C18.2 15.1 15.1 18.2 14 26.5 C12.9 18.2 9.8 15.1 1.5 14 C9.8 12.9 12.9 9.8 14 1.5 Z"
        fill={color ?? `url(#${gid})`}
      />
    </svg>
  );
};

/** Antigravity CLI (`agy`) rainbow pixel logo from PowerShell banner (12x10 grid) */
export const ANTIGRAVITY_GRID: (string | null)[][] = [
  [null, null, null, null, null, '#f2922e', '#f07236', null, null, null, null, null],
  [null, null, null, null, '#dbb131', '#f6912e', '#f37337', '#f0583b', null, null, null, null],
  [null, null, null, '#9ec345', '#b5b43e', '#e2993d', '#f67a34', '#f86a35', '#ef5442', null, null, null],
  [null, null, null, '#86c64e', '#75b45e', '#cc954d', '#ef7947', '#e16652', '#e14f59', null, null, null],
  [null, null, '#7cc251', '#71c25c', '#5ca98f', '#5c91b3', '#8373b0', '#746fc3', '#995da8', '#9c5b97', null, null],
  [null, null, '#80c654', '#54b881', '#4097de', null, null, '#4a7ee4', '#706ece', '#8f64b4', null, null],
  [null, null, '#61c37d', '#43aeab', null, null, null, null, '#4a80ea', '#6c73d8', null, null],
  [null, '#6dc694', '#62bad5', '#47a8dc', null, null, null, null, '#3d89fb', '#4a81f0', '#6579e1', null],
  [null, '#6bc7a3', '#64b6f6', null, null, null, null, null, null, '#3886fb', '#4881f4', null],
  ['#67b9f4', '#64b6f6', null, null, null, null, null, null, null, null, '#3883f9', '#3d85fc'],
];

export const AntigravityLogo: React.FC<{
  cell?: number;
  color?: string;
  bob?: number;
  style?: React.CSSProperties;
}> = ({cell = 15, color, bob = 0, style}) => {
  const cw = cell;
  const ch = Math.round(cell * 1.18);
  const rects: React.ReactNode[] = [];
  ANTIGRAVITY_GRID.forEach((row, y) => {
    row.forEach((hex, x) => {
      if (!hex) return;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * cw}
          y={y * ch + bob}
          width={cw + 0.4}
          height={ch + 0.4}
          fill={color ?? hex}
        />,
      );
    });
  });
  return (
    <svg width={12 * cw} height={10 * ch} viewBox={`0 0 ${12 * cw} ${10 * ch}`} style={style} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};

/** Gemmy — Google Gemini Star pixel mascot (15x13 grid, 4-point Gemini spark with running feet) */
export const GEMMY_GRID = [
  '.......T.......',
  '.......T.......',
  '......TTB......',
  '......TBB......',
  '.....TWBBV.....',
  '...TTEBBBEIV...',
  'TTTBBEEBBEIVVVV',
  '...TBBBBIIVV...',
  '.....BBIIV.....',
  '......BIV......',
  '.....K.I.K.....',
  '.....K...K.....',
  '.....KK..KK....',
];

const GEMMY_PAL: Record<string, string> = {
  T: '#0EA5E9', // sky cyan highlight
  B: '#4285F4', // Google Gemini blue
  I: '#5B6EF5', // Gemini cobalt midtone
  V: '#8B5CF6', // Gemini violet bevel
  W: '#FFFFFF', // starlight glint
  E: '#0F172A', // eyes
  K: '#1E3A8A', // sapphire boots
};

export const Gemmy: React.FC<{cell?: number; color?: string; eye?: string; walk?: number; arms?: number; blink?: boolean; style?: React.CSSProperties}> = ({
  cell = 8,
  color,
  eye = '#0F172A',
  walk = 0,
  arms = 0,
  blink = false,
  style,
}) => {
  const rects: React.ReactNode[] = [];
  GEMMY_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      if (ch === 'E') {
        // 2-px tall eyes (r05..r06); collapse to top-bottom center line during blink
        if (blink && y === 5) return;
        rects.push(
          <rect
            key={`e${x}-${y}`}
            x={x * cell}
            y={y * cell + (blink ? cell * 0.45 : 0)}
            width={cell + 0.4}
            height={blink ? cell * 0.45 : cell + 0.4}
            fill={eye}
          />,
        );
        return;
      }
      let dy = 0;
      if (y >= 10 && ch === 'K') {
        const legPair = x < 7 ? 0 : 1;
        dy = arms > 0 ? -0.65 : Math.round(Math.sin(walk * Math.PI * 2 + legPair * Math.PI) * 0.65);
      } else if ((x <= 1 || x >= 13) && y === 6 && arms) {
        // Horizontal star wingtips lift upward smoothly on hops/jumps without disconnecting
        dy -= arms * 0.55;
      } else if ((x === 2 || x === 12) && y === 6 && arms) {
        dy -= arms * 0.25;
      }
      const fill = ch === 'W' ? GEMMY_PAL.W : color ?? GEMMY_PAL[ch] ?? GEMMY_PAL.I;
      rects.push(<rect key={`${x}-${y}`} x={x * cell} y={(y + dy) * cell} width={cell + 0.4} height={cell + 0.4} fill={fill} />);
    });
  });
  return (
    <svg width={15 * cell} height={14 * cell} viewBox={`0 ${-cell} ${15 * cell} ${14 * cell}`} style={style} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};

export const SPINNER_GLYPHS = ['·', '✧', '✦', '✴', '✵', '✺', '✺', '✵', '✴', '✦', '✧', '·'];
export const spinnerGlyph = (t: number, speed = 9) => SPINNER_GLYPHS[Math.floor(t * speed) % SPINNER_GLYPHS.length];
export const SPINNER_VERBS = [
  'Geminizing', 'Synthesizing', 'Constellating', 'Reasoning', 'Stargazing', 'Orchestrating', 'Harmonizing', 'Unfurling',
  'Illuminating', 'Crystallizing', 'Orbiting', 'Blooming', 'Blossoming', 'Daydreaming', 'Transmogrifying', 'Musing',
];
