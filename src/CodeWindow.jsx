import { useMemo } from 'react';
import { resolve } from './lib/geom';
import { withAlpha } from './lib/geom';
import { mix, readableOn } from './lib/color';

const measureCache = new Map();
export function measureAdvance(font) {
  if (measureCache.has(font)) return measureCache.get(font);
  const c = document.createElement('canvas').getContext('2d');
  c.font = `16px ${font}`;
  const a = c.measureText('WWWWWWWWWWWWWWWWWWWW').width / 20 / 16;
  measureCache.set(font, a || 0.6);
  return measureCache.get(font);
}
export function clearFontMeasure() { measureCache.clear(); }

function distribute(charsRows, typed) {
  const reveal = charsRows.map(() => 0);
  let rem = Math.max(0, typed);
  for (let i = 0; i < charsRows.length; i++) {
    if (rem <= 0) break;
    reveal[i] = Math.min(charsRows[i].length, rem);
    rem -= reveal[i];
  }
  let caretRow = 0, caretCol = 0, consumed = 0;
  for (let i = 0; i < charsRows.length; i++) {
    if (typed <= consumed) { caretRow = i; caretCol = 0; break; }
    const on = Math.min(charsRows[i].length, typed - consumed);
    caretRow = i; caretCol = on;
    consumed += charsRows[i].length;
    if (typed === consumed && i < charsRows.length) {
      // caret moves to next line start when current line completes
    }
  }
  return { reveal, caretRow, caretCol };
}

export default function CodeWindow({ model, typed, cfg, accentHex, animateCaret, caretPhase }) {
  const {
    fontFamily = "'JetBrains Mono Variable', monospace",
    fontSize = 16, lineHeight = 1.65, fontLigatures = true,
    lineNumbers = true, windowChrome = true, controls = 'mac',
    fileName = 'untitled', langLabel = '',
    panel = {}, width = 640,
  } = cfg;

  const charsRows = model.lines.map((l) => l.chars);
  const { reveal, caretRow, caretCol } = useMemo(
    () => distribute(charsRows, typed),
    [charsRows, typed]
  );

  const cw = measureAdvance(fontFamily) * fontSize;
  const lhPx = Math.round(fontSize * lineHeight);
  const charAdv = Math.round(cw * 100) / 100;

  const maxChars = useMemo(() => charsRows.reduce((m, r) => Math.max(m, r.length), 0), [charsRows]);
  const numLines = Math.max(charsRows.length, 1);
  const digits = String(numLines).length;

  const textColor = paletteOf(cfg).text || '#e6e9f0';
  const panelBg = cfg.panel.background || '#0d1117';
  const gutterW = lineNumbers ? (digits * charAdv + charAdv * 1.6) : 0;
  const contentW = maxChars * charAdv;
  const padX = Math.max(10, Math.round((cfg.panel.padding || 22)));
  const padY = Math.round((cfg.panel.padding || 22) * 0.62);
  const chromeH = windowChrome ? Math.max(38, Math.round(fontSize * 2.7)) : 0;
  const bodyH = numLines * lhPx;

  const minW = gutterW + contentW + padX * 2 + 2;
  const totalW = Math.max(Math.round(Number(width) || minW), Math.round(minW));
  const totalH = chromeH + bodyH + padY * 2 + 2;

  const accent = accentHex || accentFallback(paletteOf(cfg));

  const chromeBg = mix(paletteOf(cfg).bg2 || '#161b22', accent, cfg.tint ? 0.06 : 0);

  const dotColors = { mac: ['#ff5f57', '#febc2e', '#28c840'], none: [] }[controls] || ['#ff5f57', '#febc2e', '#28c840'];
  const showDots = controls === 'mac';
  const radius = cfg.panel.radius ?? 18;

  const bodyText = textColor;

  function rowSpans(rowIdx) {
    const chars = charsRows[rowIdx];
    const n = reveal[rowIdx];
    if (n <= 0) return null;
    const spans = [];
    let i = 0;
    while (i < n) {
      const type = chars[i].type;
      let j = i;
      while (j < n && chars[j].type === type) j++;
      const col = resolve(paletteOf(cfg), type, { text: bodyText });
      const str = chars.slice(i, j).map((x) => x.ch).join('');
      spans.push(<span key={i} style={{ color: col }}>{str}</span>);
      i = j;
    }
    return spans;
  }

  const caretStyle = cfg.caretStyle === 'block';
  const caretOn = animateCaret && (caretPhase === 1);
  const caretColL = Math.min(caretCol, charsRows[caretRow] ? charsRows[caretRow].length : 0);

  return (
    <div
      data-cs-stage
      style={{
        width: totalW, height: totalH, boxSizing: 'border-box',
        borderRadius: cfg.rounded === false ? 0 : radius,
        background: panelBg,
        boxShadow: `0 24px 60px -18px rgba(0,0,0,.6), 0 0 0 1px ${withAlpha(cfg.frameLine || '#ffffff', cfg.frameLineOpacity ?? 0.07)}`,
        overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
        fontFamily,
      }}
    >
      {cfg.bgAccent && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(140% 140% at 0% 0%, ${withAlpha(accent, 0.20)}, transparent 55%)`,
        }} />
      )}
      {windowChrome && (
        <div style={{
          height: chromeH, flexShrink: 0, background: chromeBg, position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', padding: `0 ${Math.round(padX * 0.8)}px`,
          borderBottom: '1px solid ' + withAlpha('#ffffff', 0.07),
          borderTopLeftRadius: radius, borderTopRightRadius: cfg.rounded === false ? 0 : radius,
        }}>
          {showDots && (
            <div style={{ display: 'flex', gap: Math.round(fontSize * 0.5) }}>
              {dotColors.map((c, i) => (
                <span key={i} style={{
                  width: Math.round(fontSize * 0.7), height: Math.round(fontSize * 0.7),
                  borderRadius: '50%', background: c, display: 'block',
                }} />
              ))}
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'center', fontSize: fontSize * 0.85, color: withAlpha(textColor, 0.72), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
            {fileName}
          </div>
          {langLabel && (
            <div style={{
              fontSize: fontSize * 0.66, padding: `3px ${Math.round(fontSize * 0.6)}px`,
              borderRadius: 999, background: withAlpha(accent, 0.16), color: accent, whiteSpace: 'nowrap',
            }}>{langLabel}</div>
          )}
        </div>
      )}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1, display: 'flex',
        padding: `${padY}px ${padX}px`, background: cfg.panel.background || '#0d1117',
        borderBottomLeftRadius: cfg.rounded === false ? 0 : radius,
        borderBottomRightRadius: cfg.rounded === false ? 0 : radius,
      }}>
        {lineNumbers && (
          <div style={{
            width: gutterW, flexShrink: 0, marginRight: Math.round(charAdv * 1.4),
            textAlign: 'right', fontSize, lineHeight: `${lhPx}px`, whiteSpace: 'pre',
            color: withAlpha(textColor, 0.32), userSelect: 'none',
          }}>
            {model.lines.map((_, i) => (
              <div key={i} style={{ height: lhPx }}>{i + 1}</div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize, lineHeight: `${lhPx}px`, whiteSpace: 'pre', overflow: 'hidden', fontVariantLigatures: fontLigatures ? 'normal' : 'none' }}>
            {model.lines.map((_, i) => (
              <div key={i} style={{ height: lhPx }}>{rowSpans(i)}</div>
            ))}
          </div>
          {caretOn && (
            <div style={{
              position: 'absolute', top: caretRow * lhPx + lhPx * 0.12,
              left: (caretColL) * charAdv,
              height: lhPx * 0.76,
              width: caretStyle ? charAdv : Math.max(2, Math.round(fontSize * 0.09)),
              background: caretStyle ? withAlpha(accent, 0.45) : accent,
              borderRadius: 2, pointerEvents: 'none', transition: 'left .02s linear',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function paletteOf(cfg) { return cfg.palette || {}; }
function accentFallback(p) { return p.accent || '#61afef'; }
