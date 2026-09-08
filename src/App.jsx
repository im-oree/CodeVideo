import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2, Palette, Type, Film, Play, Pause, RotateCcw, Download, Image as ImgIcon,
  Sun, Moon, Wand2, Braces, Sparkles, Clapperboard, Maximize2, Scan,
  FileText, Eye, X, XCircle, Image as ImageIcon, PanelLeftClose,
} from 'lucide-react';
import CodeWindow, { clearFontMeasure } from './CodeWindow';
import { buildModel, langLabel, langFileExt, grammarExists } from './lib/model';
import { sampleFor, LANGUAGES } from './lib/languages';
import { codeThemes } from './lib/themes';
import { mix, toRgba } from './lib/color';
import { Panel, Slider, Switch, Segmented, Swatches, ColorField, TextField, Btn } from './ui/Controls';
import { capturePNG, captureJPG, startRecording, pickMime } from './lib/capture';

const FONTS = {
  jetbrains: { css: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace", label: 'JetBrains Mono' },
  fira: { css: "'Fira Code', ui-monospace, monospace", label: 'Fira Code' },
};
const ACCENTS = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#ef4444','#f97316','#f59e0b','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#e11d48','#fbbf24'];
const BACKDROPS = [
  { key: 'grad', name: 'Gradient', css: (f, t) => `linear-gradient(135deg, ${f}, ${t})` },
  { key: 'mesh', name: 'Mesh', css: (f, t) => `radial-gradient(120% 160% at 0% 0%, ${t}, transparent 55%), radial-gradient(130% 140% at 100% 100%, ${f}, transparent 55%), ${f}` },
  { key: 'plain', name: 'Flat', css: (f) => f },
];
const ASPECTS = { auto: 0, '16:9': 16/9, '4:3': 4/3, '1:1': 1, '9:16': 9/16, '21:9': 21/9 };

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 800);
}

const defaultCode = [
  '// A tiny reactive store — no frameworks needed',
  'const createStore = (initial) => {',
  '  let state = initial;',
  '  const listeners = new Set();',
  '',
  '  const getState = () => state;',
  '  const setState = (patch) => {',
  '    state = { ...state, ...patch };',
  '    listeners.forEach((fn) => fn(state));',
  '  };',
  '  const subscribe = (fn) => {',
  '    listeners.add(fn);',
  '    return () => listeners.delete(fn);',
  '  };',
  '  return { getState, setState, subscribe };',
  '};',
  '',
  "const store = createStore({ count: 0, name: 'Arena' });",
  'store.subscribe((s) => console.log("updated", s));',
  'export { store, createStore };',
].join('\n');

export default function App({ appTheme = 'dark', accentHex = '#6366f1', onAppSettings }) {
  const [cfg, setCfg] = useState({
    language: 'javascript', code: defaultCode, fileName: 'store.js',
    font: 'jetbrains', fontSize: 17, lineHeight: 1.7, ligatures: true,
    lineNumbers: true, chrome: true, controls: 'mac', rounded: true,
    padding: 26, radius: 20,
    paletteKey: 'dracula', outputAccent: '#bd93f9',
    bgAccent: true, tint: 0.05, frameLine: '#ffffff', frameLineOpacity: 0.09,
    backdrop: true, backdropKind: 'grad', bgFrom: '#0d1020', bgTo: '#15233c',
    backdropMargin: 96, aspect: 'auto',
    instant: false, cps: 16, caretOn: true, caretStyle: 'block',
    caretBlink: true, blinkMs: 440, startDelay: 800, endPause: 2000, loop: true,
  });
  const [ex, setEx] = useState({ videoFormat: 'webm', resScale: 2 });
  const [active, setActive] = useState(null);   // which inspector section is open (null = all collapsed)
  const [menu, setMenu] = useState(null);        // open dropdown menu
  const ACTIVITY = [
    { id: 'code', icon: <Braces size={19} />, tip: 'Code' },
    { id: 'style', icon: <Palette size={19} />, tip: 'Theme & style' },
    { id: 'motion', icon: <Sparkles size={19} />, tip: 'Animation' },
    { id: 'scene', icon: <Clapperboard size={19} />, tip: 'Scene & output' },
  ];

  const palette = codeThemes[cfg.paletteKey];
  const langLabelS = langLabel(cfg.language);
  const model = useMemo(() => buildModel(cfg.code, cfg.language), [cfg.code, cfg.language]);
  const total = useMemo(() => model.lines.reduce((s, l) => s + l.chars.length, 0), [model]);

  // animation state
  const [typed, setTyped] = useState(() => total);
  const [caretPhase, setCaretPhase] = useState(1);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const stopRef = useRef(false);
  const liveTyped = playing ? typed : total;

  // ---- font load remeasure ----
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    const on = setTimeout(() => { clearFontMeasure(); setFontTick((t) => t + 1); }, 450);
    return () => clearTimeout(on);
  }, []);
  useEffect(() => { setTyped(total); }, [total]);

  // ---- refs for the scene + offscreen capture copy ----
  const capScene = useRef(null);
  const capCard = useRef(null);
  const viewRef = useRef(null);
  const [view, setView] = useState({ w: 900, h: 600 });
  const [cardDims, setCardDims] = useState(null);

  const sceneGeom = useMemo(() => {
    if (!cardDims) return null;
    const m = cfg.backdropMargin;
    const sideA = cardDims.w + m * 2;
    const sideB = cardDims.h + m * 2;
    const A = ASPECTS[cfg.aspect];
    let boxw, boxh;
    if (!A) { boxw = sideA; boxh = sideB; }
    else { boxh = Math.max(sideB, sideA / A); boxw = boxh * A; }
    return { boxw: Math.round(boxw), boxh: Math.round(boxh), cardw: cardDims.w, cardh: cardDims.h };
  }, [cardDims, cfg.backdropMargin, cfg.aspect]);

  function measureCard() {
    const el = capCard.current && capCard.current.querySelector('[data-cs-stage]');
    if (el && (el.offsetWidth !== (cardDims && cardDims.w))) setCardDims({ w: el.offsetWidth, h: el.offsetHeight });
    else if (el && !cardDims) setCardDims({ w: el.offsetWidth, h: el.offsetHeight });
  }
  useEffect(() => { measureCard(); }, [cfg, model, fontTick, total]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const el = viewRef.current;
      if (el) setView({ w: el.clientWidth, h: el.clientHeight });
    });
    if (viewRef.current) { setView({ w: viewRef.current.clientWidth, h: viewRef.current.clientHeight }); ro.observe(viewRef.current); }
    return () => ro.disconnect();
  }, []);

  // zoom is a natural-pixel scale (1 = true code size). We do NOT auto-shrink
  // large content: it scrolls. "Fit" shrinks-to-fit on demand.
  const [zoom, setZoom] = useState(1);
  const setZoomClamped = (z) => setZoom(Math.max(0.08, Math.min(4, Math.round(z * 100) / 100)));
  const fitScale = useMemo(() => {
    if (!sceneGeom) return 1;
    return Math.max(0.02, Math.min((view.w - 64) / sceneGeom.boxw, (view.h - 64) / sceneGeom.boxh));
  }, [sceneGeom, view]);
  const zoomDisplay = Math.round(zoom * 100);

  // scroll content to top-left whenever zoom/scene geometry changes (keeps position stable)
  useEffect(() => {
    const el = viewRef.current;
    if (el) { el.scrollTop = 0; el.scrollLeft = 0; }
  }, [zoom, sceneGeom && sceneGeom.boxw, sceneGeom && sceneGeom.boxh]);

  const accent = cfg.outputAccent;
  const fontCss = FONTS[cfg.font].css;

  // caret visible = blink ? blink on phase : always on
  const caretVisible = cfg.caretOn && (cfg.caretBlink ? caretPhase === 1 : true);

  const upd = (patch) => setCfg((c) => ({ ...c, ...patch }));

  function pickSample() {
    const s = sampleFor(cfg.language);
    if (!s) return;
    upd({ code: s, fileName: `sample.${langFileExt(cfg.language)}` });
  }

  // ---- animation engine ----
  function stopAnim() {
    stopRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
  }
  function beginPlay(opts = {}) {
    const { onEnd, noLoop } = opts;
    const c = cfg;
    stopRef.current = false;
    setTyped(0); setCaretPhase(1); setPlaying(true);
    const msPer = c.instant ? 0 : (1000 / c.cps);
    const lead = c.startDelay;
    const typingEnd = c.instant ? 0 : lead + total * msPer;
    const doneT = typingEnd + c.endPause;
    const loopOk = c.loop && !noLoop;

    function frame(now, base) {
      if (stopRef.current) return;
      const t = now - base;
      let p = 0;
      if (c.instant) p = total;
      else if (t >= lead) p = Math.min(total, Math.floor((t - lead) / (msPer || 1)));
      setTyped(p);
      const phaseStart = c.instant ? 0 : typingEnd;
      if (now - base >= doneT) {
        if (loopOk) { setTyped(0); setCaretPhase(1); rafRef.current = requestAnimationFrame((n2) => frame(n2, performance.now())); return; }
        setTyped(total); setPlaying(false); if (onEnd) onEnd(); return;
      }
      if (c.caretBlink && now - base >= phaseStart) {
        const k = Math.floor((now - base - phaseStart) / c.blinkMs);
        setCaretPhase(k % 2 === 0 ? 1 : 0);
      }
      rafRef.current = requestAnimationFrame((n2) => frame(n2, base));
    }
    rafRef.current = requestAnimationFrame((n) => frame(n, performance.now()));
  }

  // idle caret blink
  useEffect(() => {
    if (playing || !cfg.caretBlink) { setCaretPhase(1); return; }
    const id = setInterval(() => setCaretPhase((p) => (p === 1 ? 0 : 1)), cfg.blinkMs);
    return () => clearInterval(id);
  }, [playing, cfg.caretBlink, cfg.blinkMs]);

  // ---- export ----
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 3400); };

  async function doPNG() {
    const node = capCard.current && capCard.current.querySelector('[data-cs-stage]');
    if (!node) return notify('Nothing to export');
    setBusy('png');
    try {
      const out = await capturePNG(node, { scale: ex.resScale, background: palette.bg });
      const f = (out.width > 2000 || out.height > 2000) ? Math.min(1, 2000 / Math.max(out.width, out.height)) : 1;
      const blob = f < 1 ? await shrink(out.canvas, f) : out.blob;
      downloadBlob(blob, `${stem(cfg.fileName)}.png`);
      notify(`PNG saved · ${out.width}×${out.height}px`);
    } catch (e) { console.error(e); notify('PNG export failed'); }
    setBusy(null);
  }
  async function doJPG() {
    const node = capCard.current && capCard.current.querySelector('[data-cs-stage]');
    if (!node) return notify('Nothing to export');
    setBusy('jpg');
    try {
      const out = await captureJPG(node, { scale: ex.resScale, background: palette.bg });
      downloadBlob(out.blob, `${stem(cfg.fileName)}.jpg`);
      notify(`JPG saved · ${out.width}×${out.height}px`);
    } catch (e) { console.error(e); notify('JPG export failed'); }
    setBusy(null);
  }
  function shrink(canvas, f) {
    const c = document.createElement('canvas');
    c.width = Math.round(canvas.width * f); c.height = Math.round(canvas.height * f);
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  async function doVideo() {
    const node = capScene.current;
    if (!node || !sceneGeom) return notify('Nothing to export');
    const mime = pickMime(ex.videoFormat);
    if (!mime) return notify('Video recording is not supported in this browser. Try Chrome.');
    setBusy('video');
    const rec = startRecording(node, { scale: ex.resScale, fps: 30, mime, background: null });
    await new Promise((r) => setTimeout(r, 250));
    rec.started();
    const est = (cfg.startDelay + (cfg.instant ? 300 : (total / cfg.cps) * 1000 + 300) + cfg.endPause + 2000);
    const ended = await new Promise((resolve) => {
      let done = false;
      beginPlay({ noLoop: true, onEnd: () => { if (!done) { done = true; resolve(true); } } });
      setTimeout(() => { if (!done) { done = true; resolve(false); } }, est + 6000);
    });
    const blob = await rec.stop();
    setBusy(null);
    setTyped(total); setPlaying(false);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    downloadBlob(blob, `${stem(cfg.fileName)}-video.${ext}`);
    notify(`${ended ? '' : '⚠ '}Video saved · ${rec.W}×${rec.H} · .${ext.toUpperCase()}`);
  }

  // shared scene props
  const cwProps = {
    model, typed: liveTyped, accentHex: accent,
    animateCaret: cfg.caretOn,
    caretPhase: caretVisible ? 1 : 0,
    cfg: {
      ...cfg,
      fontFamily: fontCss, langLabel: langLabelS,
      panel: { padding: cfg.padding, radius: cfg.radius, background: palette.bg },
      fontLigatures: cfg.ligatures, windowChrome: cfg.chrome, controls: cfg.controls,
      lineNumbers: cfg.lineNumbers, rounded: cfg.rounded, accent, palette,
    },
  };
  const sceneStyle = useMemo(() => {
    if (!sceneGeom) return null;
    return {
      width: cfg.backdrop ? sceneGeom.boxw : sceneGeom.cardw,
      height: cfg.backdrop ? sceneGeom.boxh : sceneGeom.cardh,
      background: cfg.backdrop ? backdropCSS(cfg) : 'transparent',
    };
  }, [sceneGeom, cfg.backdrop, cfg.backdropKind, cfg.bgFrom, cfg.bgTo]);

  const sceneInner = (cardWrapRef, sceneRefCb) => (
    <div ref={sceneRefCb} style={sceneStyle || undefined}>
      {cfg.backdrop && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(130% 140% at 20% 0%, rgba(255,255,255,.06), transparent 45%)',
        }} />
      )}
      {cfg.backdrop && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 180px rgba(0,0,0,.5)', pointerEvents: 'none' }} />}
      <div ref={cardWrapRef} style={{
        position: 'absolute',
        left: (cfg.backdrop && sceneGeom) ? (sceneGeom.boxw - sceneGeom.cardw) / 2 : 0,
        top: (cfg.backdrop && sceneGeom) ? (sceneGeom.boxh - sceneGeom.cardh) / 2 : 0,
      }}>
        <CodeWindow {...cwProps} />
      </div>
    </div>
  );

  return (
    <div className={`app theme-${appTheme}`} style={{ '--accent': accentHex, '--accent-strong': mix(accentHex, '#ffffff', 0.16), '--accent-contrast': readable(accentHex), '--accent-soft': rgba(accentHex, 0.16), '--accent-soft-2': rgba(accentHex, 0.12) }}>
      <div className="app-backdrop" />

      {/* ====== MENU BAR ====== */}
      <header className="app-header">
        <div className="brand"><div className="logo">{'</>'}</div><span>CodeStudio <small>snippet video</small></span></div>

        <div className="sep" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

        {/* transport */}
        <div className="playctl">
          <button className="pri" onClick={() => { if (playing) stopAnim(); else beginPlay(); }} title={playing ? 'Pause' : 'Play'}>
            {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <button onClick={() => { stopAnim(); setTyped(total); setCaretPhase(1); }} title="Reset preview">
            <RotateCcw size={14} />
          </button>
        </div>

          <div className="zoompill" style={{ marginLeft: 6 }}>
            <button title="Zoom out" onClick={() => setZoom(Math.max(0.2, +(zoom - 0.1).toFixed(2)))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button title="Zoom in" onClick={() => setZoom(Math.min(4, +(zoom + 0.1).toFixed(2)))}>+</button>
          </div>
        <button className="mbtn" title="Fit whole window in the preview" onClick={() => setZoom(fitScale)}><Maximize2 size={13} /> Fit</button>
        <button className="mbtn" title="Actual size (1:1)" onClick={() => setZoom(1)}><Scan size={13} /> 100%</button>

        <div className="sep" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

        {/* File menu */}
        <div style={{ position: 'relative' }}>
          <button className={`mbtn ${menu === 'file' ? 'open' : ''}`} onClick={() => setMenu(menu === 'file' ? null : 'file')}><FileText size={13} /> File</button>
          {menu === 'file' && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 75 }} onClick={() => setMenu(null)} />
              <div className="dropdown">
                <div className="dlabel">Snippet</div>
                <button className="ditem" onClick={() => { setMenu(null); pickSample(); }}><span className="mi"><Wand2 size={14} /></span> New sample<small>{langLabelS}</small></button>
                <button className="ditem" onClick={() => { setMenu(null); upd({ code: '' }); }}><span className="mi"><XCircle size={14} /></span> Clear code</button>
                <div className="dsep" />
                <div className="dlabel">Image</div>
                <button className="ditem" onClick={() => { setMenu(null); doPNG(); }}><span className="mi"><ImgIcon size={14} /></span> Export PNG</button>
                <button className="ditem" onClick={() => { setMenu(null); doJPG(); }}><span className="mi"><Download size={14} /></span> Export JPG</button>
              </div>
            </>
          )}
        </div>

        {/* View menu */}
        <div style={{ position: 'relative' }}>
          <button className={`mbtn ${menu === 'view' ? 'open' : ''}`} onClick={() => setMenu(menu === 'view' ? null : 'view')}><Eye size={13} /> View</button>
          {menu === 'view' && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 75 }} onClick={() => setMenu(null)} />
              <div className="dropdown">
                <div className="dlabel">Preview</div>
                <button className="ditem" onClick={() => { setMenu(null); setZoom(1); }}><span className="mi"><Scan size={14} /></span> Actual size (100%)</button>
                <button className="ditem" onClick={() => { setMenu(null); setZoom(fitScale); }}><span className="mi"><Maximize2 size={14} /></span> Fit to window</button>
                <div className="dsep" />
                <div className="dlabel">App theme</div>
                <button className="ditem" onClick={() => { setMenu(null); onAppSettings && onAppSettings({ appTheme: 'dark' }); }}><span className="mi"><Moon size={14} /></span> Dark theme{appTheme === 'dark' && <small>✓</small>}</button>
                <button className="ditem" onClick={() => { setMenu(null); onAppSettings && onAppSettings({ appTheme: 'light' }); }}><span className="mi"><Sun size={14} /></span> Light theme{appTheme === 'light' && <small>✓</small>}</button>
              </div>
            </>
          )}
        </div>

        <div className="sep" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

        <span className="status" style={{ fontSize: 11, padding: '3px 8px' }}>
          <span className="dot" style={{ background: busy ? '#f59e0b' : playing ? '#34d399' : 'var(--muted)' }} />
          {busy ? (busy === 'video' ? 'Rendering…' : 'Generating…') : playing ? 'Playing' : 'Ready'}
        </span>

        <div style={{ flex: 1 }} />

        {/* Export */}
        <div style={{ position: 'relative' }}>
          <button className={`mbtn primary ${menu === 'export' ? 'open' : ''}`} disabled={!!busy} onClick={() => setMenu(menu === 'export' ? null : 'export')}>
            <Download size={14} /> Export ▾
          </button>
          {menu === 'export' && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 75 }} onClick={() => setMenu(null)} />
              <div className="dropdown" style={{ right: 0, left: 'auto' }}>
                <div className="dlabel">Video</div>
                <button className="ditem" onClick={() => { setMenu(null); setEx((x) => ({ ...x, videoFormat: 'webm' })); setTimeout(doVideo, 20); }}><span className="mi"><Film size={14} /></span> WebM video<small>✓ best</small></button>
                <button className="ditem" onClick={() => { setMenu(null); setEx((x) => ({ ...x, videoFormat: 'mp4' })); setTimeout(doVideo, 20); }}><span className="mi"><Film size={14} /></span> MP4 video</button>
                <div className="dsep" />
                <div className="dlabel">Image</div>
                <button className="ditem" onClick={() => { setMenu(null); doPNG(); }}><span className="mi"><ImgIcon size={14} /></span> PNG image</button>
                <button className="ditem" onClick={() => { setMenu(null); doJPG(); }}><span className="mi"><ImageIcon size={14} /></span> JPG image</button>
                <div className="dsep" />
                <div style={{ padding: '6px 9px' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Scale</span>
                    <span className="ctl-val">{ex.resScale}×</span>
                  </div>
                  <input type="range" className="slider" min={1} max={4} step={1} value={ex.resScale} onChange={(e) => setEx((x) => ({ ...x, resScale: +e.target.value }))} />
                </div>
                {sceneGeom && <div className="hint" style={{ padding: '0 9px 6px' }}>Output ≈ {Math.round(sceneGeom.boxw * ex.resScale)}×{Math.round(sceneGeom.boxh * ex.resScale)} px</div>}
              </div>
            </>
          )}
        </div>

        <div className="hdr-group" title="App theme">
          <button className={appTheme === 'light' ? 'on' : ''} onClick={() => onAppSettings && onAppSettings({ appTheme: 'light' })}><Sun size={15} /></button>
          <button className={appTheme === 'dark' ? 'on' : ''} onClick={() => onAppSettings && onAppSettings({ appTheme: 'dark' })}><Moon size={15} /></button>
        </div>
        <div className="hdr-group" title="App accent">
          {ACCENTS.slice(0, 6).map((c) => (
            <button key={c} className={accentHex.toLowerCase() === c ? 'on' : ''} onClick={() => onAppSettings && onAppSettings({ accentHex: c })}>
              <span className="chip" style={{ background: c, outline: accentHex.toLowerCase() === c ? '1.5px solid #fff' : 'none', outlineOffset: 1 }} />
            </button>
          ))}
        </div>
      </header>

      {/* ====== MAIN ====== */}
      <div className="app-main">
        {/* Activity sidebar (collapsed by default) */}
        <aside className="activity">
          {ACTIVITY.map((a) => (
            <button key={a.id} className={`abtn ${active === a.id ? 'on' : ''}`}
              onClick={() => setActive(active === a.id ? null : a.id)}>
              <span className="dotline" />{a.icon}<span className="tip">{a.tip}</span>
            </button>
          ))}
          <div className="sp" />
          <button className="abtn" title="Hide / show inspector" onClick={() => setActive(null)}><PanelLeftClose size={18} /></button>
        </aside>

        {/* Inspector */}
        <div className={`inspector ${active ? 'open' : ''}`}>
          {active && <div className="insp-pad">
            <div className="insp-head">
              <span style={{ color: 'var(--accent)' }}>{ACTIVITY.find((a) => a.id === active)?.icon}</span>
              <span className="t">{ACTIVITY.find((a) => a.id === active)?.tip}</span>
              <button className="btn ghost sm" onClick={() => setActive(null)}><X size={14} /></button>
            </div>
            {active === 'code' && (<>
              <div className="row">
                <select className="txt" style={{ flex: 1 }} value={cfg.language} onChange={(e) => upd({ language: e.target.value, fileName: `sample.${langFileExt(e.target.value)}` })}>
                  {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
              <div className="row">
                <Btn className="sm ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={pickSample}><Wand2 size={13} /> Sample</Btn>
                <Btn className="sm ghost danger" onClick={() => upd({ code: '' })}>Clear</Btn>
              </div>
              <textarea className="txt code-editor" rows={16} value={cfg.code} spellCheck={false} onChange={(e) => upd({ code: e.target.value })} />
              <div className="row"><TextField label="File name" value={cfg.fileName} onChange={(v) => upd({ fileName: v })} /></div>
              {!grammarExists(cfg.language) && <div className="hint">No highlighter — showing plain text.</div>}
            </>)}
            {active === 'style' && (<>
              <div className="insp-sec-title">Syntax theme</div>
              <div className="pal-grid">
                {Object.entries(codeThemes).map(([k, t]) => (
                  <div key={k} className={`pal ${cfg.paletteKey === k ? 'sel' : ''}`} onClick={() => upd({ paletteKey: k })}>
                    <div className="pal-swatch"><i style={{ background: t.keyword }} /><i style={{ background: t.string }} /><i style={{ background: t.func }} /><i style={{ background: t.number }} /></div>
                    <div className="pal-name">{t.name}</div>
                  </div>
                ))}
              </div>
              <div className="insp-sec-title">Accent</div>
              <ColorField label="Accent color" value={accent} swatches={ACCENTS} onChange={(v) => upd({ outputAccent: v })} />
              <Switch label="Accent glow" checked={cfg.bgAccent} onChange={(v) => upd({ bgAccent: v })} />
              <Slider label="Accent tint" value={Math.round(cfg.tint * 100)} min={0} max={25} onChange={(v) => upd({ tint: v / 100 })} suffix="%" />

              <div className="insp-sec-title">Typography</div>
              <Segmented value={cfg.font} onChange={(v) => upd({ font: v })} options={Object.entries(FONTS).map(([k, f]) => ({ value: k, label: f.label }))} />
              <Slider label="Font size" value={cfg.fontSize} min={10} max={34} onChange={(v) => upd({ fontSize: v })} suffix="px" />
              <Slider label="Line height" value={cfg.lineHeight} min={1.2} max={2.4} step={0.05} onChange={(v) => upd({ lineHeight: v })} fmt={(v) => v.toFixed(2)} />
              <Switch label="Ligatures" checked={cfg.ligatures} onChange={(v) => upd({ ligatures: v })} />

              <div className="insp-sec-title">Window chrome</div>
              <Switch label="Window chrome" checked={cfg.chrome} onChange={(v) => upd({ chrome: v })} />
              <Switch label="Line numbers" checked={cfg.lineNumbers} onChange={(v) => upd({ lineNumbers: v })} />
              {cfg.chrome && <Segmented options={[{ value: 'mac', label: 'macOS dots' }, { value: 'none', label: 'No dots' }]} value={cfg.controls} onChange={(v) => upd({ controls: v })} />}
              <Slider label="Corner radius" value={cfg.radius} min={0} max={40} onChange={(v) => upd({ radius: v })} suffix="px" />
              <Slider label="Content padding" value={cfg.padding} min={8} max={60} onChange={(v) => upd({ padding: v })} suffix="px" />
              <Switch label="Rounded corners" checked={cfg.rounded} onChange={(v) => upd({ rounded: v })} />
            </>)}
            {active === 'motion' && (<>
              <Switch label="Typewriter reveal" checked={!cfg.instant} onChange={(v) => upd({ instant: !v })} />
              {!cfg.instant && <Slider label="Typing speed" value={cfg.cps} min={3} max={120} onChange={(v) => upd({ cps: v })} fmt={(v) => `${v} chars/s`} />}
              <Switch label="Caret" checked={cfg.caretOn} onChange={(v) => upd({ caretOn: v })} />
              {cfg.caretOn && <>
                <Segmented options={[{ value: 'block', label: 'Block' }, { value: 'bar', label: 'Bar' }]} value={cfg.caretStyle} onChange={(v) => upd({ caretStyle: v })} />
                <Switch label="Blink" checked={cfg.caretBlink} onChange={(v) => upd({ caretBlink: v })} />
                {cfg.caretBlink && <Slider label="Blink interval" value={cfg.blinkMs} min={150} max={1500} onChange={(v) => upd({ blinkMs: v })} suffix="ms" />}
              </>}
              <Slider label="Lead-in delay" value={cfg.startDelay} min={0} max={4000} step={50} onChange={(v) => upd({ startDelay: v })} suffix="ms" />
              <Slider label="End pause" value={cfg.endPause} min={0} max={6000} step={100} onChange={(v) => upd({ endPause: v })} suffix="ms" />
              <Switch label="Loop preview" checked={cfg.loop} onChange={(v) => upd({ loop: v })} />
              <div className="row" style={{ gap: 6 }}>
                <Btn className="primary sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => beginPlay()}><Play size={13} /> Preview</Btn>
              </div>
            </>)}
            {active === 'scene' && (<>
              <Switch label="Backdrop around code" checked={cfg.backdrop} onChange={(v) => upd({ backdrop: v })} />
              {cfg.backdrop && <>
                <Segmented options={BACKDROPS.map((b) => ({ value: b.key, label: b.name }))} value={cfg.backdropKind} onChange={(v) => upd({ backdropKind: v })} />
                <ColorField label="From" value={cfg.bgFrom} swatches={['#0b0f19','#0d1117','#101d33','#1b1030','#000000']} onChange={(v) => upd({ bgFrom: v })} />
                <ColorField label="To" value={cfg.bgTo} swatches={['#15233c','#0e2430','#1d1b2f','#301030','#0f3d3e']} onChange={(v) => upd({ bgTo: v })} />
                <Slider label="Edge margin" value={cfg.backdropMargin} min={30} max={260} onChange={(v) => upd({ backdropMargin: v })} suffix="px" />
              </>}
              <div className="insp-sec-title">Output frame</div>
              <div className="ctl"><div className="caption">Aspect ratio</div></div>
              <Segmented cols={3} options={Object.keys(ASPECTS).map((k) => ({ value: k, label: k === 'auto' ? 'Auto' : k }))} value={cfg.aspect} onChange={(v) => upd({ aspect: v })} />
              <Slider label="Resolution scale" value={ex.resScale} min={1} max={4} step={1} onChange={(v) => setEx((x) => ({ ...x, resScale: v }))} suffix="×" />
              {sceneGeom && <div className="hint">Video ≈ {Math.round(sceneGeom.boxw * ex.resScale)}×{Math.round(sceneGeom.boxh * ex.resScale)} px<br />Image ≈ {Math.round(sceneGeom.cardw * ex.resScale)}×{Math.round(sceneGeom.cardh * ex.resScale)} px</div>}
            </>)}
          </div>}
        </div>

        {/* Stage / fixed preview */}
        <main className="stage">
          <div className="preview-wrap">
            <div className="preview" ref={viewRef}>
              {!sceneGeom ? (
                <div className="hint" style={{ margin: 20 }}>Preparing preview…</div>
              ) : (
                <div className="canvas-holder" style={{ width: sceneGeom.boxw * zoom, height: sceneGeom.boxh * zoom }}>
                  <div style={{ width: sceneGeom.boxw, height: sceneGeom.boxh, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                    {sceneInner(() => {}, () => {})}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* offscreen capture copies (not transformed / hidden) */}
      <div style={{ position: 'fixed', left: -30000, top: 0, pointerEvents: 'none', zIndex: -1 }}>
        {sceneInner((el) => { capCard.current = el; }, (el) => { capScene.current = el; })}
      </div>

      {busy && (
        <div className="thumb-scroll"><div className="btn primary" style={{ pointerEvents: 'none' }}>
          {busy === 'video' ? <><Film size={14} /> Rendering video…</> : <><ImgIcon size={14} /> Generating…</>}
        </div></div>
      )}
      {toast && <div className="toast-wrap"><div className="toast"><b>✓</b> {toast}</div></div>}
    </div>
  );
}

function stem(f) { return String(f).replace(/\.[^.]+$/, '') || 'code'; }
function backdropCSS(cfg) { const b = BACKDROPS.find((x) => x.key === cfg.backdropKind) || BACKDROPS[0]; return b.css(cfg.bgFrom, cfg.bgTo); }
function readable(hex) { const { r, g, b } = toRgba(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#0f172a' : '#fff'; }
function rgba(hex, a) { const { r, g, b } = toRgba(hex); return `rgba(${r},${g},${b},${a})`; }
