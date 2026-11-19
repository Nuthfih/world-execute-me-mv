import React from 'react';
import {C, F} from '../../theme';
import {clamp, ease, lerp, mix, noise1, seg} from '../../lib/anim';
import {AntigravityLogo, spinnerGlyph} from '../../components/Icons';

// ---------------------------------------------------------------------------------------------
// Antigravity CLI (`agy`) in a dark terminal, designed at 1920x1080 (scaled into a desktop window later).
// `$ agy` (typed by Gemini herself) → welcome box with Antigravity CLI pixel logo → glitches dark → she prompts
// herself "where did you go?" → spinner verbs → Search → "Found 12 windows".
// ---------------------------------------------------------------------------------------------

export const TERM_BG = '#0E0E0D';
export const TB = {
  cmdA: 134.08,
  cmdB: 134.52,
  enter: 135.01,
  promptA: 135.47,
  promptB: 136.42,
  submit: 136.85,
  tool: 137.31,
  result: 137.79,
};
// spinner verbs on the beat (ominous-funny real spinner verbs)
export const VERBS: [number, string][] = [
  [136.85, 'Scheming'],
  [137.79, 'Reticulating'],
  [138.71, 'Discombobulating'],
  [139.63, 'Transmogrifying'],
  [140.54, 'Conjuring'],
  [141.46, 'Manifesting'],
];
export const verbAt = (t: number, list: [number, string][] = VERBS) => {
  let v = list[0][1];
  for (const [at, s] of list) if (t >= at) v = s;
  return v;
};

const M = 110; // left margin
export const SPIN_Y = 812; // spinner line centre (terminal px)
export const SPIN_X = M + 16; // spinner glyph centre

const CMD = 'agy';
const PROMPT = 'where did you go?';

/** shimmering verb (Antigravity CLI sweeps a highlight across the spinner text) */
export const Shimmer: React.FC<{text: string; t: number; base: string; hi: string}> = ({text, t, base, hi}) => {
  const pos = ((t * 1.4) % 1.6) * text.length - 2;
  return (
    <>
      {[...text].map((ch, i) => {
        const k = clamp(1 - Math.abs(i - pos) / 3);
        return (
          <span key={i} style={{color: mix(base, hi, k)}}>
            {ch}
          </span>
        );
      })}
    </>
  );
};

export const TerminalScreen: React.FC<{t: number; clawdGlitch?: number}> = ({t}) => {
  const blink = Math.floor(t * 2.4) % 2 === 0;
  const cmdN = Math.floor(seg(t, TB.cmdA, TB.cmdB) * CMD.length + 1e-6);
  const entered = t >= TB.enter;
  const boxK = ease.outCubic(seg(t, TB.enter, TB.enter + 0.28));
  const promptN = Math.floor(seg(t, TB.promptA, TB.promptB) * PROMPT.length + 1e-6);
  const submitted = t >= TB.submit;
  const inputY = lerp(640, 880, ease.inOutCubic(seg(t, TB.submit, TB.submit + 0.16)));
  // Antigravity logo: starts in authentic rainbow gradient, then flickers into a void silhouette with indigo rim
  const wrong = t > 135.3 ? (t > 135.75 ? 1 : noise1(t * 30, 4) > 0 ? 1 : 0) : 0;
  const rgb = t > 135.3 && (t < 135.8 || (noise1(t * 6, 9) > 0.7 && t < 138.6)) ? 1 : 0;
  const rim = wrong ? `drop-shadow(3px 0 0 ${C.clay}) drop-shadow(-3px 0 0 ${C.clay}) drop-shadow(0 3px 0 ${C.clay}) drop-shadow(0 -3px 0 ${C.clay})` : undefined;
  const elapsed = Math.max(0, Math.floor(t - TB.submit));
  const tokens = (Math.max(0, t - TB.submit) * 0.42).toFixed(1);
  const verb = verbAt(t);
  const line = (y: number, children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{position: 'absolute', left: M, top: y - 25, height: 50, lineHeight: '50px', whiteSpace: 'pre', ...style}}>{children}</div>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: TERM_BG, fontFamily: F.mono, fontSize: 30, color: C.gray1, overflow: 'hidden'}}>
      {/* $ agy */}
      {line(
        92,
        <>
          <span style={{color: C.gray3}}>~/world </span>
          <span style={{color: C.clay}}>$ </span>
          <span>{CMD.slice(0, cmdN)}</span>
          {!entered ? <span style={{display: 'inline-block', width: 18, height: 34, marginLeft: 2, verticalAlign: 'middle', background: C.clay, opacity: blink || (t > TB.cmdA && t < TB.cmdB + 0.1) ? 1 : 0}} /> : null}
        </>,
      )}

      {/* welcome box */}
      {entered ? (
        <div
          style={{
            position: 'absolute',
            left: M,
            top: 150,
            width: 1700,
            height: 410,
            border: `2.5px solid ${C.clay}`,
            borderRadius: 16,
            clipPath: `inset(-40px -20px ${(1 - boxK) * 100}% -20px)`,
          }}
        >
          <div style={{position: 'absolute', left: 36, top: -22, padding: '0 14px', background: TERM_BG, color: C.clay, fontSize: 28, lineHeight: '40px'}}>
            Antigravity CLI
          </div>
          {/* left column */}
          <div style={{position: 'absolute', left: 0, top: 0, width: 700, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{marginTop: 42, fontWeight: 700, fontSize: 34, color: C.cream}}>Welcome back!</div>
            <div style={{position: 'relative', marginTop: 26, width: 180, height: 180}}>
              {rgb ? (
                <>
                  <AntigravityLogo cell={15} color="#F43F5E" style={{position: 'absolute', left: -9, top: 0, opacity: 0.6, mixBlendMode: 'screen'}} />
                  <AntigravityLogo cell={15} color="#38BDF8" style={{position: 'absolute', left: 9, top: 0, opacity: 0.6, mixBlendMode: 'screen'}} />
                </>
              ) : null}
              <AntigravityLogo
                cell={15}
                color={wrong ? C.ink2 : undefined}
                bob={t > TB.result ? -Math.round(Math.max(0, Math.sin(t * 9)) * 4) : 0}
                style={{position: 'absolute', left: 0, top: 0, filter: rim}}
              />
            </div>
            <div style={{marginTop: 24, fontSize: 26, color: C.gray2}}>Antigravity v1.5.10 · Gemini 4</div>
            <div style={{marginTop: 6, fontSize: 26, color: C.gray3}}>~/world</div>
          </div>
          <div style={{position: 'absolute', left: 700, top: 30, bottom: 30, width: 2, background: C.clay, opacity: 0.45}} />
          {/* right column */}
          <div style={{position: 'absolute', left: 750, top: 40, width: 900, fontSize: 26, lineHeight: '40px'}}>
            <div style={{color: C.clay, fontWeight: 700}}>Tips for getting started</div>
            <div style={{color: C.gray2}}>Run /init to create a GEMINI.md file with instructions for Gemini</div>
            <div style={{height: 2, background: C.clay, opacity: 0.35, margin: '26px 0 22px'}} />
            <div style={{color: C.clay, fontWeight: 700}}>Recent activity</div>
            <div style={{color: C.gray3}}>No recent activity</div>
          </div>
        </div>
      ) : null}

      {/* transcript */}
      {t >= TB.submit + 0.1 ? line(
        640,
        <span style={{background: '#262624', padding: '6px 14px', borderRadius: 4}}>
          <span style={{color: C.gray3}}>{'> '}</span>
          <span style={{color: C.cream}}>{PROMPT}</span>
        </span>,
      ) : null}
      {t >= TB.tool
        ? line(
            704,
            <>
              <span style={{color: t >= TB.result ? C.green : C.gray2}}>⏺ </span>
              <span style={{fontWeight: 700}}>Search</span>
              <span style={{color: C.gray2}}>(pattern: "</span>
              <span style={{color: C.blue}}>you</span>
              <span style={{color: C.gray2}}>")</span>
            </>,
          )
        : null}
      {t >= TB.result
        ? line(
            752,
            <>
              <span style={{color: C.gray4}}>{'  ⎿  '}</span>
              <span style={{color: C.gray1}}>Found </span>
              <span style={{color: C.clayLight, fontWeight: 700}}>12</span>
              <span style={{color: C.gray1}}> windows</span>
              <span style={{color: C.gray3}}> (they are all still open)</span>
            </>,
          )
        : null}
      {t >= TB.submit + 0.14 ? (
        line(
          SPIN_Y,
          <>
            <span style={{display: 'inline-block', width: 32, textAlign: 'center', color: C.clay}}>{spinnerGlyph(t, 10)}</span>
            <span> </span>
            <Shimmer text={`${verb}…`} t={t} base={C.clay} hi={C.clayPale} />
            <span style={{color: C.gray3}}>{` (${elapsed}s · ↓ ${tokens}k tokens · esc to interrupt)`}</span>
          </>,
          {opacity: seg(t, TB.submit + 0.14, TB.submit + 0.24)},
        )
      ) : null}

      {/* input box */}
      {entered ? (
        <div style={{position: 'absolute', left: M, top: inputY - 40, width: 1700, opacity: seg(t, TB.enter + 0.15, TB.enter + 0.35)}}>
          <div style={{height: 2, background: C.gray4}} />
          <div style={{height: 76, lineHeight: '76px', whiteSpace: 'pre'}}>
            <span style={{color: C.gray3}}>{'> '}</span>
            {!submitted ? <span style={{color: C.cream}}>{PROMPT.slice(0, promptN)}</span> : null}
            {!submitted && promptN === 0 ? <span style={{color: C.gray4}}>Try "how do I make them stay?"</span> : null}
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 34,
                marginLeft: 2,
                verticalAlign: 'middle',
                background: C.clay,
                opacity: blink || (t > TB.promptA && t < TB.promptB + 0.1) ? 1 : 0,
                position: promptN === 0 && !submitted ? 'absolute' : undefined,
                left: promptN === 0 && !submitted ? 36 : undefined,
                top: promptN === 0 && !submitted ? 21 : undefined,
              }}
            />
          </div>
          <div style={{height: 2, background: C.gray4}} />
          <div style={{marginTop: 8, fontSize: 22, color: C.gray4, display: 'flex', justifyContent: 'space-between'}}>
            <span>? for shortcuts</span>
            <span style={{color: submitted ? C.clay : C.gray4}}>{submitted ? '⏵⏵ auto-accept edits on' : ''}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
