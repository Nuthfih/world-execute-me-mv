import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, W} from '../../theme';
import {lerp, rand} from '../../lib/anim';
import {CRACK_X, CRACK_Y, DOME_R} from './chorus3_cracks';

// ------------------------------------------------------------------------------------------------
// Final shot: kv_sphere (Gemini-chan inside the glass sphere in a starry void), placed so that its
// sphere coincides with the healed dome circle (CRACK_X, CRACK_Y, DOME_R).
// ------------------------------------------------------------------------------------------------

export const KV_BG = '#050B1B';
const IMG_W = 1536, IMG_H = 1024;
const SPH_CX = 0.4995, SPH_CY = 0.471, SPH_R = 0.3065; // normalized (R relative to width)
const S0 = DOME_R / (SPH_R * IMG_W);
export const KV_W = IMG_W * S0;
export const KV_H = IMG_H * S0;
export const KV_LEFT = CRACK_X - SPH_CX * KV_W;
export const KV_TOP = CRACK_Y - SPH_CY * KV_H;

const STARS = Array.from({length: 170}, (_, i) => {
  const x = rand(90, i) * W, y = rand(91, i) * H;
  const inside = x > KV_LEFT + 70 && x < KV_LEFT + KV_W - 70 && y > KV_TOP + 30 && y < KV_TOP + KV_H - 30;
  return {x, y, r: lerp(0.8, 2.4, rand(92, i) ** 3), inside, ph: rand(93, i) * 6.28, sp: lerp(1.5, 4, rand(94, i)), warm: rand(95, i) > 0.7};
}).filter((s) => !s.inside);

export const StarVoid: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #0B1530 0%, ${KV_BG} 65%)`}}>
    <svg width={W} height={H}>
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.warm ? '#F6D9B8' : '#CFE0F0'} opacity={0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))} />
      ))}
    </svg>
  </AbsoluteFill>
);

const EDGE_MASK =
  'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 2%, #000 98%, transparent 100%)';

export const KVImage: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: KV_LEFT,
      top: KV_TOP,
      width: KV_W,
      height: KV_H,
      opacity,
      WebkitMaskImage: EDGE_MASK,
      WebkitMaskComposite: 'source-in',
      maskImage: EDGE_MASK,
      maskComposite: 'intersect',
    }}
  >
    <Img src={staticFile('img/kv_sphere.png')} style={{width: '100%', height: '100%', display: 'block'}} />
  </div>
);

/** soft drifting 4-point Gemini stardust ("like snow"), back layer + blurred foreground stars */
export const PetalSnow: React.FC<{t: number; opacity?: number; front?: boolean}> = ({t, opacity = 1, front = false}) => {
  const n = front ? 7 : 42;
  const seed = front ? 61 : 60;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity, filter: front ? 'blur(4px)' : undefined, pointerEvents: 'none'}}>
      {Array.from({length: n}, (_, i) => {
        const s = (front ? lerp(22, 36, rand(seed, i)) : lerp(7, 15, rand(seed, i))) * 0.9;
        const c = s * 0.19;
        const v = (front ? 85 : 42) * lerp(0.6, 1.3, rand(seed + 1, i));
        const x0 = rand(seed + 2, i) * (W + 200) - 100;
        const span = H + 240;
        const y = ((rand(seed + 3, i) * span + t * v) % span) - 120;
        const x = x0 + Math.sin(t * lerp(0.5, 1.1, rand(seed + 4, i)) + i * 1.7) * 46 + t * 12;
        const r = t * lerp(-40, 40, rand(seed + 5, i)) + i * 41;
        const tw = 0.55 + 0.45 * Math.abs(Math.cos(t * lerp(0.9, 1.8, rand(seed + 6, i)) + i));
        const col = rand(seed + 7, i) > 0.72 ? C.clayLight : C.clay;
        return (
          <path
            key={i}
            d={`M0,${-s} Q${c},${-c} ${s},0 Q${c},${c} 0,${s} Q${-c},${c} ${-s},0 Q${-c},${-c} 0,${-s} Z`}
            fill={col}
            transform={`translate(${((x % (W + 200)) + W + 200) % (W + 200) - 100} ${y}) rotate(${r}) scale(${tw})`}
            opacity={(front ? 0.58 : 0.88) * tw}
          />
        );
      })}
    </svg>
  );
};
