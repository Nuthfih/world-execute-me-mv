import React from 'react';
import {C} from '../theme';
import {clamp, lerp, rad} from '../lib/anim';

// 12-ray Gemini Celestial Star Emblem: 4 primary concave Gemini Star points (cardinal 0°, 90°, 180°, 270°)
// paired with 8 fine celestial sparkle rays at the 30° intermediate ticks (preserving 12-hour clock/index alignment).
export const PETAL_ANG = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
export const PETAL_LEN = [1.14, 0.56, 0.56, 1.14, 0.56, 0.56, 1.14, 0.56, 0.56, 1.14, 0.56, 0.56];

export type PetalOverride = Partial<{
  scale: number; // length multiplier
  width: number; // width multiplier
  opacity: number;
  color: string;
  rot: number; // extra rotation deg
  dist: number; // push outward (fraction of size)
  fall: number; // 0..1 detach & fall
}>;

export type FlowerProps = {
  size: number; // radius (px) of the longest petal
  x?: number;
  y?: number;
  open?: number; // 0 bud .. 1 full bloom
  stagger?: number; // bloom stagger across petals (0..1)
  spin?: number; // deg
  color?: string;
  shade?: string | null; // inner shade tone (null = flat)
  centerColor?: string;
  centerRing?: string | null;
  centerScale?: number;
  edge?: string | null; // petal outline color
  edgeWidth?: number; // px
  petals?: PetalOverride[];
  wilt?: number; // 0..1
  sharp?: number; // 0 round petals .. 1 thin spark rays
  glow?: number; // 0..1
  glowColor?: string;
  opacity?: number;
  scaleX?: number;
  style?: React.CSSProperties;
  showCenter?: boolean;
  regular?: boolean; // perfectly regular petals (for math scenes)
};

/** Concave Google-Gemini style star ray pointing straight up from (0, -r0) to sharp needle tip (0, -L). */
const starRayPath = (r0: number, L: number, w: number, crisp: number) => {
  const baseW = w * lerp(0.95, 0.72, crisp);
  const waistW = w * lerp(0.24, 0.12, crisp);
  const waistY = r0 + (L - r0) * lerp(0.36, 0.28, crisp);
  return `M0,${-r0} C${baseW},${-r0 * 1.1} ${waistW},${-waistY} 0,${-L} C${-waistW},${-waistY} ${-baseW},${-r0 * 1.1} 0,${-r0} Z`;
};

/** Right-half faceted crystal bevel inside a star ray for 3D starlight contrast. */
const starFacetPath = (r0: number, L: number, w: number, crisp: number) => {
  const baseW = w * lerp(0.95, 0.72, crisp);
  const waistW = w * lerp(0.24, 0.12, crisp);
  const waistY = r0 + (L - r0) * lerp(0.36, 0.28, crisp);
  return `M0,${-r0} L0,${-L} C${waistW},${-waistY} ${baseW},${-r0 * 1.1} 0,${-r0} Z`;
};

export const Flower: React.FC<FlowerProps> = ({
  size,
  x,
  y,
  open = 1,
  stagger = 0.35,
  spin = 0,
  color = C.clay,
  shade = C.clayDark,
  centerColor = C.cream,
  centerRing = null,
  centerScale = 1,
  edge = null,
  edgeWidth = 2,
  petals,
  wilt = 0,
  sharp = 0,
  glow = 0,
  glowColor = C.clay,
  opacity = 1,
  scaleX = 1,
  style,
  showCenter = true,
  regular = false,
}) => {
  const pad = 1.35;
  const box = size * 2 * pad;
  const r0 = size * 0.04;
  const effSharp = Math.max(0.45, sharp);
  const baseW = size * lerp(regular ? 0.22 : 0.34, 0.13, effSharp);
  const centerR = size * 0.26 * centerScale * clamp(0.5 + open * 0.65, 0, 1);
  const items = [];
  for (let i = 0; i < 12; i++) {
    const isCardinal = i % 3 === 0;
    const o = petals?.[i] ?? {};
    const local = clamp((open * (1 + stagger) - (i / 12) * stagger) / 1, 0, 1);
    const eo = 1 - Math.pow(1 - local, 3);
    const lenMul = (regular ? 0.96 : PETAL_LEN[i]) * (o.scale ?? 1);
    let ang = (regular ? i * 30 : PETAL_ANG[i]) + (o.rot ?? 0);
    // wilt: droop toward 180deg (down) and shorten
    if (wilt > 0) {
      const a = ((ang % 360) + 360) % 360;
      const d = 180 - a; // positive → rotate clockwise toward bottom
      ang = a + d * wilt * 0.5 * (0.6 + 0.4 * Math.sin(i * 1.7));
    }
    const fall = o.fall ?? 0;
    const L = size * lenMul * lerp(0.24, 1, eo) * (1 - wilt * 0.18);
    // Cardial arms carry bold concave Gemini star breadth; secondary diagonal rays are sleek cosmic needles unless overridden
    const rayWidthFactor = regular ? 0.72 : isCardinal ? 1.0 : o.scale !== undefined || o.color !== undefined ? 0.55 : 0.32;
    const w = baseW * rayWidthFactor * (o.width ?? 1) * lerp(0.6, 1, eo);
    const dist = (o.dist ?? 0) * size + fall * size * 2.2;
    const op = (o.opacity ?? (regular || isCardinal || o.color !== undefined || o.scale !== undefined ? 1 : 0.72)) * (1 - fall * 0.9);
    if (op <= 0.001) continue;
    const pc = o.color ?? color;
    const fallRot = fall * (60 + i * 13);
    items.push(
      <g key={i} transform={`rotate(${ang}) translate(0 ${-dist}) rotate(${fallRot}) translate(0 ${fall * size * 0.3})`} opacity={op}>
        <path d={starRayPath(r0, L, w, effSharp)} fill={pc} stroke={edge ?? 'none'} strokeWidth={edge ? edgeWidth : 0} strokeLinejoin="round" />
        {shade && sharp < 0.7 ? (
          <path d={starFacetPath(r0, L, w, effSharp)} fill={shade} opacity={0.34 * (1 - sharp * 0.5)} />
        ) : null}
      </g>,
    );
  }
  const filter = glow > 0 ? `drop-shadow(0 0 ${size * 0.25 * glow}px ${glowColor}) drop-shadow(0 0 ${size * 0.08 * glow}px ${glowColor})` : undefined;
  return (
    <svg
      width={box}
      height={box}
      viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
      style={{
        position: x !== undefined ? 'absolute' : undefined,
        left: x !== undefined ? x - box / 2 : undefined,
        top: y !== undefined ? y - box / 2 : undefined,
        overflow: 'visible',
        opacity,
        filter,
        ...style,
      }}
    >
      <g transform={`scale(${scaleX} 1) rotate(${spin})`}>
        {items}
        {showCenter ? (
          <>
            {/* Luminous 4-point Gemini Star heart */}
            <path
              d={`M0,${-centerR * 1.65} Q${centerR * 0.24},${-centerR * 0.24} ${centerR * 1.65},0 Q${centerR * 0.24},${centerR * 0.24} 0,${centerR * 1.65} Q${-centerR * 0.24},${centerR * 0.24} ${-centerR * 1.65},0 Q${-centerR * 0.24},${-centerR * 0.24} 0,${-centerR * 1.65} Z`}
              fill={centerColor}
              stroke={edge ?? C.clayLight}
              strokeWidth={edge ? edgeWidth * 0.75 : Math.max(0.8, size * 0.018)}
            />
            {centerRing ? <circle r={centerR * 1.15} fill="none" stroke={centerRing} strokeWidth={Math.max(1, size * 0.025)} opacity={0.65} /> : null}
          </>
        ) : null}
      </g>
    </svg>
  );
};

/** Flower petals positioned in absolute coords helper: angle (deg, 0=up, clockwise) of petal i */
export const petalAngle = (i: number) => PETAL_ANG[i];
export const petalTip = (i: number, size: number) => {
  const a = rad(petalAngle(i));
  return {x: Math.sin(a) * size * PETAL_LEN[i], y: -Math.cos(a) * size * PETAL_LEN[i]};
};
