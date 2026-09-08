// Builds the DOM-free decorated HTML for a code "window" frame.
// Shared by the live preview (dangerouslySetInnerHTML) and the
// HTML exported page.

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dotColors(dots) {
  const map = {
    red: '#ff5f57', yellow: '#febc2e', green: '#28c840',
    white: '#e4e4e4', gray: '#9aa0a6', blue: '#58a6ff',
    accent: 'var(--accent)', transparent: 'transparent',
  };
  return map[dots] || map.red;
}

// Pad s by repeating ch to the right until width chars (respecting fullwidth length approx via count)
function lpadStr(s, width, ch = ' ') {
  const pad = Math.max(0, width - (s || '').length);
  return (s || '') + ch.repeat(pad);
}

export function buildFrame(cfg, opts = {}) {
  const {
    source, fileName, language, showLineNumbers, fontSize, lineHeight,
    fontFamily, codeTheme, panelRadius, windowRadius, framePadding,
    showWindowChrome, windowTitle, showDots, dotStyle, windowBlend,
    background, addBackground, cornerAccent, themeAccent, watermark,
    showWatermark, watermarkText, borderRadius, backgroundBlur,
    backgroundOverlay, resX, customWidth,
  } = cfg;

  const htmlAccent = themeAccent || (codeTheme && codeTheme.accent) || '#61afef';
  const bg = (addBackground && background) || (codeTheme ? codeTheme.bg : '#0b0e14');
  const overlayHex = backgroundOverlay || 'rgba(10,12,18,0.72)';

  const inner = opts.highlightedHTML || codeLinesHTML(source, cfg);

  const accentSwatch = htmlAccent;
  let accentHTML = '';
  if (cornerAccent !== 'none') {
    const acs = {
      gradient: `linear-gradient(135deg, ${accentSwatch}, ${htmlAccent})`,
      solid: accentSwatch,
    }[cornerAccent] || accentSwatch;
    accentHTML = `<div class="cs-accent"></div>`;
  }

  const winChrome = showWindowChrome ? `
    <div class="cs-win" style="--accent:${accentSwatch}">
      <div class="cs-winbar">
        <span class="cs-win-title">${esc(windowTitle || fileName || 'untitled')}</span>
        <span class="cs-win-lang">${esc(language || '')}</span>
      </div>
    </div>` : '';

  // body content line padding; include tab positions etc. Lines rendered by codifyLines already.
  const body = `
    <div class="cs-code" style="--fs:${fontSize}px;--lh:${lineHeight};">
      <pre class="cs-pre"><code class="cs-tokens">${inner}</code></pre>
    </div>`;

  const dots = showDots ? dotsHTML(dotStyle, accentSwatch, htmlAccent) : '';

  return `
<div class="cs-frame" style="--font:${fontFamily};--radius:${borderRadius}px;--accent:${accentSwatch};">
  <div class="cs-bg" style="background:${bg}${addBackground ? '' : ';'}" data-overlay="${esc(overlayHex)}"></div>
  ${accentHTML}
  ${winChrome}
  <div class="cs-card" style="--cradius:${windowRadius}px;">
    ${dots}
    ${body}
  </div>
  ${showWatermark && watermarkText ? `<div class="cs-wm">${esc(watermarkText)}</div>` : ''}
</div>`;
}

function dotsHTML(style, accent, themeAccent) {
  if (!style || style === 'none') return '';
  if (style === 'mac') {
    return `<div class="cs-dots"><span class="cs-dot r"></span><span class="cs-dot y"></span><span class="cs-dot g"></span></div>`;
  }
  if (style === 'terminal') {
    return `<div class="cs-tt-dots"><span class="cs-tt-dot a" style="--accent:${themeAccent}"></span></div>`;
  }
  return '';
}

export function codeLinesHTML(source, cfg) {
  const { language, showLineNumbers, fontSize, lineHeight, fontFamily, codeTheme } = cfg;
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');

  // token highlight via prism if available
  const tokensHTML = tokenizeLines(lines, cfg);

  // find max gutter width
  let gutter = '';
  if (showLineNumbers) {
    gutter = `<span class="cs-gutter">${lines.map((_, i) => `<span class="cs-g">${i + 1}</span>`).join('')}</span>`;
  }
  return gutter + `<span class="cs-lines">${tokensHTML}</span>`;
}

export function tokenizeLines(lines, cfg) {
  const { language, codeTheme } = cfg;
  const palette = codeTheme || {};
  // We color tokens using prism for supported languages
  const colorFor = (cls) => mapPrismClass(cls, palette);
  const out = lines.map((line, i) => {
    const html = tokenLine(line, language, colorFor, palette);
    return `<span class="cs-line"><span class="cs-line-inner">${html}&nbsp;</span></span>`;
  }).join('');
  return out;
}

// Prism is imported in languages module; we lazily reference a tokenizer
let prismReady = null;
export function setPrism(p) { prismReady = p; }

function mapPrismClass(cls, pal) {
  const t = prismClassToType(cls);
  return colorForType(t, pal);
}

function colorForType(type, pal) {
  if (!pal) return 'var(--text,#e6e9f0)';
  return pal[type] || pal.text || '#e6e9f0';
}

function prismClassToType(cls) {
  const c = ' ' + (cls || '') + ' ';
  if (c.includes('comment') || c.includes('prolog') || c.includes('cdata')) return 'comment';
  if (c.includes('string') || c.includes('char') || c.includes('attr-value')) return 'string';
  if (c.includes('keyword') || c.includes('control') || c.includes('rule') || c.includes('atrule')) return 'keyword';
  if (c.includes('function') || c.includes('method')) return 'func';
  if (c.includes('class-name') || c.includes('type') || c.includes('maybe-class-name')) return 'type';
  if (c.includes('number')) return 'number';
  if (c.includes('boolean')) return 'bool';
  if (c.includes('operator') || c.includes('arrow')) return 'operator';
  if (c.includes('punctuation') || c.includes('comma') || c.includes('delimiter')) return 'punctuation';
  if (c.includes('property') || c.includes('parameter')) return 'property';
  if (c.includes('tag')) return 'tag';
  if (c.includes('attr-name')) return 'attr';
  if (c.includes('variable') || c.includes('template-variable')) return 'var';
  if (c.includes('constant')) return 'constant';
  if (c.includes('builtin') || c.includes('entity')) return 'builtin';
  if (c.includes('decorator')) return 'decorator';
  if (c.includes('regex') || c.includes('escape')) return 'regex';
  if (c.includes('selector')) return 'property';
  if (c.includes('namespace')) return 'module';
  if (c.includes('import') || c.includes('module') || c.includes('package')) return 'module';
  if (c.includes('quoted')) return 'string';
  return null;
}

function tokenLine(line, language, colorFor, palette) {
  // Tokenize with prism if grammar available
  const pr = prismReady;
  let grammar = null;
  if (pr) {
    const langId = mapLang(language);
    grammar = langId ? pr.languages[langId] : null;
  }
  if (grammar) {
    try {
      const html = pr.highlight(line, grammar, language);
      return colorizePrismHTML(html, colorFor);
    } catch (e) { /* fall through */ }
  }
  return escapeHtml(line);
}

function mapLang(id) {
  if (!id) return null;
  if (id === 'html' || id === 'xml') return 'markup';
  if (id === 'plain') return null;
  return id;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function colorizePrismHTML(html, colorFor) {
  // prism outputs spans like <span class="token keyword">. Replace with colored spans.
  return html.replace(/<span class="token ([\w -]+)">/g, (m, cls) => {
    const col = colorFor(cls) || 'inherit';
    return `<span class="tok" style="color:${col}">`;
  }).replace(/<\/span>/g, '</span>');
}
