import React from 'react';
import {C, F} from '../theme';
import {clamp, ease, mix, seg} from '../lib/anim';
import {Flower} from './Flower';
import {
  IArrowUp,
  IArtifact,
  IChevron,
  IClock,
  ICode,
  ICopy,
  ICustomize,
  IFilter,
  IGear,
  IGeminiSpark,
  IImage,
  IMic,
  IPencil,
  IPlus,
  IRetry,
  ISearch,
  ISidebar,
  IThumbDown,
  IThumbUp,
  IVideo,
} from './Icons';

export type TimedWord = {w: string; s: number};

export type Msg =
  | {kind: 'user'; text: string; at?: number}
  | {
      kind: 'claude';
      words?: TimedWord[];
      text?: string;
      at?: number; // appear time (for text without words: start of stream)
      dur?: number; // stream duration for plain text
      done?: number; // time the stream completes (spark settles)
      actions?: boolean | number; // show action row (number = time it appears)
      thumbs?: 'up' | 'down' | null;
      thumbsAt?: number;
      hover?: 'up' | 'down' | 'copy' | null;
      size?: number; // font size multiplier
      color?: string;
    }
  | {kind: 'node'; node: React.ReactNode; at?: number; align?: 'left' | 'right' | 'center'}
  | {kind: 'tool'; label: string; at?: number; doneAt?: number; error?: boolean}
  | {kind: 'artifact'; title: string; type: string; at?: number};

export type AppTheme = ReturnType<typeof appTheme>;
export const appTheme = (dark: number) => ({
  page: mix('#FFFFFF', '#0B0D14', dark),
  sidebar: mix('#F0F4F9', '#1B1C1F', dark),
  raised: mix('#FFFFFF', '#1E1F23', dark),
  bubble: mix('#D3E3FD', '#282A2E', dark),
  chip: mix('#F0F4F9', '#1E1F23', dark),
  text: mix('#1F1F1F', '#E3E3E3', dark),
  text2: mix('#444746', '#C4C7C5', dark),
  muted: mix('#747775', '#8E918F', dark),
  hair: dark > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(31,31,31,0.10)',
  hair2: dark > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(31,31,31,0.15)',
  brand: mix('#1A73E8', '#4285F4', dark),
  clay: C.clay,
});

type ComposerProps = {
  text?: string;
  typeFrom?: number;
  typeTo?: number;
  placeholder?: string;
  sendPulse?: number; // time of send press
  streaming?: boolean;
  opacity?: number;
  highlight?: number; // 0..1 glow border
};

export type AppProps = {
  t: number;
  width?: number;
  height?: number;
  zoom?: number;
  dark?: number;
  sidebar?: number; // 0..1
  header?: number; // 0..1
  home?: boolean;
  greeting?: string;
  greetingOpacity?: number;
  greetFlower?: React.ReactNode; // custom flower node in greeting
  hideGreetFlower?: boolean;
  messages?: Msg[];
  messagesOpacity?: number;
  scrollY?: number;
  composer?: ComposerProps;
  composerOpacity?: number;
  recents?: string[];
  recentsOffset?: number;
  title?: string;
  children?: React.ReactNode; // overlay inside main pane
  style?: React.CSSProperties;
  radius?: number;
  sidebarOverlay?: React.ReactNode;
  disclaimer?: boolean;
};

export const DEFAULT_RECENTS = [
  'world.execute(me)',
  'Explain sine waves like I am five',
  'Help me write a birthday poem',
  'Debug my recursive function',
  'Eggplant recipes for dinner',
  'Is it normal to miss someone?',
  'Plan a trip to Kyoto',
  'Why do cats purr?',
  'Draft an apology email',
  'What is a context window?',
  'Summarize this paper on optics',
  'Make a tiny game in HTML',
];

const MsgWrap: React.FC<{t: number; at?: number; children: React.ReactNode; align?: string}> = ({t, at, children, align}) => {
  const p = at === undefined ? 1 : clamp((t - at) / 0.28);
  if (p <= 0) return null;
  const e = ease.outCubic(p);
  return (
    <div style={{display: 'grid', gridTemplateRows: `${e}fr`, width: '100%'}}>
      <div style={{minHeight: 0, overflow: 'visible'}}>
        <div style={{opacity: e, transform: `translateY(${(1 - e) * 18}px)`, display: 'flex', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'}}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const MessageSpark: React.FC<{t: number; size: number; streaming: boolean; doneAt?: number}> = ({t, size, streaming, doneAt}) => {
  const wob = streaming ? 1 : clamp(1 - (t - (doneAt ?? t)) / 0.4);
  const rot = streaming ? t * 140 : wob * 20;
  const s = 1 + wob * 0.14 * Math.sin(t * 10);
  return (
    <div style={{transform: `rotate(${rot}deg) scale(${s})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <IGeminiSpark size={size * 1.95} />
    </div>
  );
};

export const ClaudeApp: React.FC<AppProps> = ({
  t,
  width = 1920,
  height = 1080,
  zoom = 1.5,
  dark = 0,
  sidebar = 1,
  header = 1,
  home = false,
  greeting = 'Good evening',
  greetingOpacity = 1,
  greetFlower,
  hideGreetFlower,
  messages = [],
  messagesOpacity = 1,
  scrollY = 0,
  composer = {},
  composerOpacity = 1,
  recents = DEFAULT_RECENTS,
  recentsOffset = 0,
  title = 'world.execute(me)',
  children,
  style,
  radius = 0,
  sidebarOverlay,
  disclaimer = true,
}) => {
  const z = zoom;
  const th = appTheme(dark);
  const sbW = 264 * z * clamp(sidebar);
  const mainW = width - sbW;
  const colW = Math.min(760 * z, mainW - 80 * z);
  const fs = 16 * z;

  // ---------- composer
  const typedLen = composer.text
    ? composer.typeFrom !== undefined
      ? Math.floor(seg(t, composer.typeFrom, composer.typeTo ?? composer.typeFrom + 0.6) * composer.text.length + 1e-6)
      : composer.text.length
    : 0;
  const typed = composer.text ? composer.text.slice(0, typedLen) : '';
  const blink = Math.floor(t * 2.1) % 2 === 0;
  const sendK = composer.sendPulse !== undefined ? clamp(1 - Math.abs(t - composer.sendPulse) / 0.15) : 0;
  const hasText = typed.length > 0;
  const activeAction = composer.streaming || hasText || composer.sendPulse !== undefined;
  const barH = 58 * z;
  const showCaret = (hasText || composer.typeFrom !== undefined) && t < (composer.sendPulse ?? 1e9);
  const composerNode = (
    <div
      style={{
        width: colW,
        minHeight: barH,
        background: th.raised,
        borderRadius: 999 * z,
        border: `${1 * z}px solid ${th.hair2}`,
        boxShadow:
          dark > 0.5
            ? `0 ${8 * z}px ${28 * z}px rgba(0,0,0,0.42)${composer.highlight ? `, 0 0 ${30 * z * composer.highlight}px ${C.clay}` : ''}`
            : `0 ${3 * z}px ${16 * z}px rgba(26,55,120,0.08)${composer.highlight ? `, 0 0 ${30 * z * composer.highlight}px ${C.clay}` : ''}`,
        padding: `${8 * z}px ${10 * z}px ${8 * z}px ${14 * z}px`,
        boxSizing: 'border-box',
        opacity: composerOpacity * (composer.opacity ?? 1),
        fontFamily: F.sans,
        display: 'flex',
        alignItems: 'center',
        gap: 10 * z,
      }}
    >
      <div style={{width: 34 * z, height: 34 * z, borderRadius: 999 * z, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
        <IPlus size={19 * z} color={th.text2} stroke={1.9} />
      </div>
      <div style={{flex: 1, fontSize: fs, color: hasText ? th.text : th.muted, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden'}}>
        {hasText ? typed : composer.placeholder ?? (home ? 'Ask Gemini' : 'Ask Gemini')}
        {showCaret ? (
          <span style={{color: th.brand, opacity: blink || (composer.typeTo !== undefined && t < composer.typeTo) ? 1 : 0, marginLeft: 1}}>|</span>
        ) : null}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 6 * z, flexShrink: 0}}>
        <div style={{fontSize: 13.5 * z, color: th.text2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 * z, padding: `${5 * z}px ${10 * z}px`, borderRadius: 999 * z}}>
          Gemini 4 <IChevron size={13 * z} color={th.text2} />
        </div>
        <div
          style={{
            width: 38 * z,
            height: 38 * z,
            borderRadius: 999 * z,
            background: activeAction ? th.brand : th.chip,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${1 - sendK * 0.16})`,
            boxShadow: sendK > 0 ? `0 0 ${24 * z * sendK}px ${th.brand}` : undefined,
          }}
        >
          {composer.streaming ? (
            <div style={{width: 10 * z, height: 10 * z, background: '#fff', borderRadius: 2 * z}} />
          ) : activeAction ? (
            <IArrowUp size={18 * z} color="#fff" stroke={2.2} />
          ) : (
            <IMic size={17 * z} color={th.text2} stroke={1.8} />
          )}
        </div>
      </div>
    </div>
  );

  // ---------- messages
  const renderMsg = (m: Msg, i: number) => {
    if (m.kind === 'user') {
      return (
        <MsgWrap key={i} t={t} at={m.at} align="right">
          <div
            style={{
              maxWidth: colW * 0.85,
              background: th.bubble,
              borderRadius: `${20 * z}px ${20 * z}px ${6 * z}px ${20 * z}px`,
              padding: `${10 * z}px ${18 * z}px`,
              fontFamily: F.sans,
              fontSize: fs,
              lineHeight: 1.5,
              color: th.text,
            }}
          >
            {m.text}
          </div>
        </MsgWrap>
      );
    }
    if (m.kind === 'claude') {
      let content: React.ReactNode;
      let streaming = false;
      const start = m.words?.length ? m.words[0].s - 0.05 : m.at ?? 0;
      if (t < start - 0.3) return null;
      if (m.words) {
        const last = m.words[m.words.length - 1].s;
        streaming = t < (m.done ?? last + 0.3);
        content = m.words.map((w, k) => {
          const p = clamp((t - w.s) / 0.12);
          return (
            <span key={k} style={{opacity: p, filter: p < 1 ? `blur(${(1 - p) * 3}px)` : undefined}}>
              {w.w}
              {k < m.words!.length - 1 ? ' ' : ''}
            </span>
          );
        });
      } else {
        const txt = m.text ?? '';
        const d = m.dur ?? Math.max(0.4, txt.length * 0.012);
        const n = Math.floor(seg(t, start, start + d) * txt.length + 1e-6);
        streaming = t < (m.done ?? start + d + 0.25);
        content = txt.slice(0, n);
      }
      const doneAt = m.done ?? (m.words ? m.words[m.words.length - 1].s + 0.3 : start + (m.dur ?? 0.5) + 0.25);
      const showActions = typeof m.actions === 'number' ? t >= m.actions : m.actions ? !streaming : false;
      const actA = typeof m.actions === 'number' ? clamp((t - m.actions) / 0.2) : clamp((t - doneAt) / 0.25);
      const thumbK = m.thumbsAt !== undefined ? clamp((t - m.thumbsAt) / 0.12) : m.thumbs ? 1 : 0;
      const iconS = 18 * z;
      const iconBox = (node: React.ReactNode, key: string, active = false, hover = false) => (
        <div
          key={key}
          style={{
            width: 30 * z,
            height: 30 * z,
            borderRadius: 7 * z,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hover || active ? th.bubble : 'transparent',
            transform: active ? `scale(${1 + 0.35 * Math.exp(-Math.max(0, t - (m.thumbsAt ?? 0)) / 0.15)})` : undefined,
          }}
        >
          {node}
        </div>
      );
      return (
        <MsgWrap key={i} t={t} at={start - 0.05}>
          <div style={{width: colW, fontFamily: F.sans, fontSize: fs * 1.04 * (m.size ?? 1), lineHeight: 1.61, color: m.color ?? th.text}}>
            <div>{content}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 4 * z, marginTop: 10 * z, height: 32 * z}}>
              <div style={{width: 30 * z, display: 'flex', justifyContent: 'center'}}>
                <MessageSpark t={t} size={11 * z} streaming={streaming} doneAt={doneAt} />
              </div>
              {showActions ? (
                <div style={{display: 'flex', gap: 2 * z, opacity: actA}}>
                  {iconBox(<ICopy size={iconS} color={th.muted} />, 'c', false, m.hover === 'copy')}
                  {iconBox(<IThumbUp size={iconS} color={m.thumbs === 'up' && thumbK > 0 ? C.clay : th.muted} fill={m.thumbs === 'up' && thumbK > 0 ? C.clay : 'none'} />, 'u', m.thumbs === 'up' && thumbK > 0, m.hover === 'up')}
                  {iconBox(<IThumbDown size={iconS} color={m.thumbs === 'down' && thumbK > 0 ? C.clay : th.muted} />, 'd', m.thumbs === 'down' && thumbK > 0, m.hover === 'down')}
                  {iconBox(<IRetry size={iconS} color={th.muted} />, 'r')}
                </div>
              ) : null}
            </div>
          </div>
        </MsgWrap>
      );
    }
    if (m.kind === 'tool') {
      const done = m.doneAt !== undefined && t >= m.doneAt;
      return (
        <MsgWrap key={i} t={t} at={m.at}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10 * z,
              fontFamily: F.sans,
              fontSize: 14 * z,
              color: m.error && done ? C.red : th.muted,
              border: `${1 * z}px solid ${th.hair}`,
              borderRadius: 10 * z,
              padding: `${8 * z}px ${12 * z}px`,
            }}
          >
            <ICode size={16 * z} color={m.error && done ? C.red : th.muted} />
            <span>{m.label}</span>
            {done ? <span style={{color: m.error ? C.red : C.green}}>{m.error ? '✕' : '✓'}</span> : <Flower size={7 * z} spin={t * 200} shade={null} />}
          </div>
        </MsgWrap>
      );
    }
    if (m.kind === 'artifact') {
      return (
        <MsgWrap key={i} t={t} at={m.at}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12 * z,
              width: colW * 0.6,
              border: `${1 * z}px solid ${th.hair2}`,
              borderRadius: 12 * z,
              padding: `${10 * z}px ${12 * z}px`,
              background: th.raised,
              fontFamily: F.sans,
            }}
          >
            <div style={{width: 40 * z, height: 40 * z, borderRadius: 8 * z, background: th.bubble, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <IArtifact size={20 * z} color={th.text2} />
            </div>
            <div>
              <div style={{fontSize: 15 * z, color: th.text, fontWeight: 500}}>{m.title}</div>
              <div style={{fontSize: 13 * z, color: th.muted}}>{m.type}</div>
            </div>
          </div>
        </MsgWrap>
      );
    }
    return (
      <MsgWrap key={i} t={t} at={m.at} align={m.align}>
        {m.node}
      </MsgWrap>
    );
  };

  const navItem = (icon: React.ReactNode, label: string, key: string, extra?: React.CSSProperties) => (
    <div key={key} style={{display: 'flex', alignItems: 'center', gap: 12 * z, padding: `${7 * z}px ${10 * z}px`, borderRadius: 8 * z, color: th.text, fontSize: 15 * z, ...extra}}>
      {icon}
      <span>{label}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        background: th.page,
        overflow: 'hidden',
        borderRadius: radius,
        fontFamily: F.sans,
        ...style,
      }}
    >
      {/* sidebar */}
      {sidebar > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 264 * z,
            height,
            transform: `translateX(${-(1 - clamp(sidebar)) * 264 * z}px)`,
            background: th.sidebar,
            borderRight: `${1 * z}px solid ${th.hair}`,
            padding: `${14 * z}px ${12 * z}px`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${4 * z}px ${8 * z}px ${14 * z}px`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8 * z}}>
              <IGeminiSpark size={21 * z} />
              <div style={{fontFamily: F.sans, fontSize: 20 * z, color: th.text, fontWeight: 500, letterSpacing: '-0.02em'}}>Gemini</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10 * z}}>
              <ISearch size={18 * z} color={th.muted} />
              <ISidebar size={18 * z} color={th.muted} />
            </div>
          </div>
          {navItem(<IPencil size={17 * z} color={home ? th.text : th.text2} />, 'New chat', 'n', {
            background: home ? th.bubble : 'transparent',
            borderRadius: 999 * z,
            fontWeight: 500,
            padding: `${6.5 * z}px ${10 * z}px`,
            fontSize: 14 * z,
          })}
          {navItem(<IArtifact size={17 * z} color={th.text2} />, 'Collections', 'p', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          {navItem(<IImage size={17 * z} color={th.text2} />, 'Images', 'im', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          {navItem(<IClock size={17 * z} color={th.text2} />, 'Scheduled', 'sc', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          {navItem(<ICustomize size={17 * z} color={th.text2} />, 'Customize', 'cu', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          {navItem(<IVideo size={17 * z} color={th.text2} />, 'Video', 'vd', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          <div style={{fontSize: 11.5 * z, color: th.muted, padding: `${12 * z}px ${10 * z}px ${4 * z}px`, fontWeight: 500}}>Notebook</div>
          {navItem(<IPlus size={16 * z} color={th.text2} />, 'New notebook', 'nb', {padding: `${6 * z}px ${10 * z}px`, fontSize: 14 * z})}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 * z, color: th.muted, padding: `${12 * z}px ${10 * z}px ${6 * z}px`, fontWeight: 500}}>
            <span>All</span>
            <IFilter size={13 * z} color={th.muted} />
          </div>
          <div style={{position: 'relative', height: Math.max(90 * z, height - 535 * z), overflow: 'hidden'}}>
            <div style={{transform: `translateY(${-recentsOffset}px)`}}>
              {recents.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: `${6 * z}px ${12 * z}px`,
                    fontSize: 13 * z,
                    color: r.startsWith('§') ? th.muted : i === 0 && !home ? th.text : th.text2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderRadius: 999 * z,
                    background: i === 0 && !home && !r.startsWith('§') ? th.bubble : 'transparent',
                    fontWeight: r.startsWith('§') || (i === 0 && !home) ? 500 : 400,
                    marginTop: r.startsWith('§') ? 8 * z : 1 * z,
                  }}
                >
                  {r.replace('§', '')}
                </div>
              ))}
            </div>
          </div>
          <div style={{position: 'absolute', left: 12 * z, right: 12 * z, bottom: 14 * z, display: 'flex', alignItems: 'center', gap: 10 * z, padding: `${8 * z}px ${8 * z}px`, borderTop: `${1 * z}px solid ${th.hair}`}}>
            <div style={{width: 30 * z, height: 30 * z, borderRadius: 15 * z, background: C.blue, color: '#fff', fontSize: 13.5 * z, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Y</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 13.5 * z, color: th.text, fontWeight: 500}}>You</div>
              <div style={{fontSize: 11.5 * z, color: th.muted}}>Google AI Ultra</div>
            </div>
            <IGear size={16 * z} color={th.muted} />
          </div>
          {sidebarOverlay}
        </div>
      ) : null}

      {/* main */}
      <div style={{position: 'absolute', left: sbW, top: 0, width: mainW, height}}>
        {style?.background !== 'transparent' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                dark > 0.5
                  ? 'radial-gradient(ellipse 62% 52% at 50% 48%, rgba(44,74,178,0.28) 0%, rgba(20,33,82,0.14) 44%, rgba(11,13,20,0) 76%)'
                  : 'radial-gradient(ellipse 68% 54% at 50% 46%, rgba(66,133,244,0.065) 0%, rgba(138,180,248,0.02) 48%, rgba(255,255,255,0) 74%)',
            }}
          />
        ) : null}
        {home && header > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              right: 22 * z,
              top: 14 * z,
              display: 'flex',
              alignItems: 'center',
              gap: 8 * z,
              opacity: header,
            }}
          >
            <div
              style={{
                borderRadius: 999 * z,
                background: th.chip,
                border: `${1 * z}px solid ${th.hair}`,
                padding: `${6 * z}px ${14 * z}px`,
                fontSize: 12.5 * z,
                color: th.text2,
                fontWeight: 500,
              }}
            >
              Gemini Pro
            </div>
          </div>
        ) : null}
        {!home && header > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 56 * z,
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${20 * z}px`,
              opacity: header,
              color: th.text,
              fontSize: 15 * z,
              gap: 8 * z,
            }}
          >
            <IGeminiSpark size={18 * z} />
            <span style={{fontWeight: 500}}>{title}</span>
            <IChevron size={14 * z} color={th.muted} />
            <div style={{flex: 1}} />
            <div style={{border: `${1 * z}px solid ${th.hair2}`, borderRadius: 999 * z, padding: `${5 * z}px ${14 * z}px`, fontSize: 13 * z, color: th.text2}}>Share</div>
          </div>
        ) : null}
        {home ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14 * z, opacity: greetingOpacity, marginBottom: 28 * z}}>
              {hideGreetFlower ? <div style={{width: 40 * z, height: 40 * z}} /> : greetFlower ?? <IGeminiSpark size={34 * z} />}
              <div style={{fontFamily: F.sans, fontSize: 38 * z, fontWeight: 400, color: th.text, letterSpacing: '-0.02em'}}>{greeting}</div>
            </div>
            {composerNode}
            <div style={{display: 'flex', gap: 10 * z, marginTop: 18 * z, opacity: composerOpacity, alignItems: 'center'}}>
              {['Chat', 'Tasks'].map((c, ci) => (
                <div
                  key={c}
                  style={{
                    background: ci === 0 ? th.chip : 'transparent',
                    border: `${1 * z}px solid ${ci === 0 ? th.hair : 'transparent'}`,
                    borderRadius: 999 * z,
                    padding: `${7 * z}px ${18 * z}px`,
                    fontSize: 13.5 * z,
                    fontWeight: ci === 0 ? 500 : 400,
                    color: ci === 0 ? th.text : th.text2,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                left: (mainW - colW) / 2,
                width: colW,
                bottom: 150 * z,
                top: 56 * z,
                overflow: 'hidden',
                opacity: messagesOpacity,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                maskImage: `linear-gradient(to bottom, transparent 0, black ${40 * z}px)`,
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', gap: 22 * z, transform: `translateY(${-scrollY}px)`}}>{messages.map(renderMsg)}</div>
            </div>
            <div style={{position: 'absolute', left: (mainW - colW) / 2, bottom: 42 * z}}>{composerNode}</div>
            {disclaimer ? (
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 10 * z, textAlign: 'center', fontSize: 11.5 * z, color: th.muted, opacity: composerOpacity}}>
                Gemini is AI and can make mistakes. Please double-check responses.
              </div>
            ) : null}
          </>
        )}
        {children}
      </div>
    </div>
  );
};
