import Prism from 'prismjs';
import { LANGUAGES } from './languages';

// Turn prism class name into our normalized color key.
function typeOf(cls) {
  const c = ' ' + (cls || '') + ' ';
  if (/\scomment\s/.test(c) || /\sprolog\s/.test(c) || /\scdata\s/.test(c) || /\sdoctype\s/.test(c)) return 'comment';
  if (/\s(?:string|char|attr-value|quoted|plain-text)\s/.test(c) || /\stemplate-string\s/.test(c)) return 'string';
  if (/\skeyword\s/.test(c) || /\s(?:rule|atrule|control|directive)\s/.test(c)) return 'keyword';
  if (/\s(?:function|method)\s/.test(c)) return 'func';
  if (/\s(?:class-name|maybe-class-name|type)\s/.test(c)) return 'class';
  if (/\snumber\s/.test(c)) return 'number';
  if (/\sboolean\s/.test(c)) return 'bool';
  if (/\s(?:operator|arrow)\s/.test(c)) return 'operator';
  if (/\s(?:punctuation|comma|delimiter|important|bracket)\s/.test(c)) return 'punctuation';
  if (/\s(?:property|parameter|attr-name|selector)\s/.test(c)) return 'property';
  if (/\s(?:tag|doctype-tag)\s/.test(c)) return 'tag';
  if (/\s(?:variable|template-variable)\s/.test(c)) return 'var';
  if (/\sconstant\s/.test(c)) return 'constant';
  if (/\s(?:builtin|entity|function-variable)\s/.test(c)) return 'builtin';
  if (/\s(?:decorator|annotation)\s/.test(c)) return 'decorator';
  if (/\s(?:regex|escape|char-escape)\s/.test(c)) return 'regex';
  if (/\s(?:namespace|module|import)\s/.test(c)) return 'module';
  if (/\s(?:boolean)\s/.test(c)) return 'bool';
  return null;
}

function decode(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

// Convert a single highlighted line's HTML into segments [{text,type}].
function segmentsFromHTML(html) {
  const segs = [];
  let cur = { text: '', type: null };
  const push = () => { if (cur.text) { segs.push(cur); cur = { text: '', type: null }; } };
  const re = /<span class="([^"]*)">|<\/span>|([^<]+)/g;
  let m, depth = 0, type = null;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      if (m[1].includes('token')) {
        const open = m[1].indexOf(' ') >= 0 ? m[1].slice(m[1].indexOf(' ') + 1) : '';
        depth++;
        if (depth === 1) type = typeOf(open);
      } else {
        // other tag (non token) - treat open
        depth++;
      }
    } else if (m[0] === '</span>') {
      depth = Math.max(0, depth - 1);
      if (depth === 0) type = null;
    } else {
      const txt = decode(m[0]);
      // merge consecutive same-type
      const key = type || null;
      if (cur.type === key) cur.text += txt;
      else { push(); cur.type = key; cur.text = txt; }
    }
  }
  push();
  return segs.filter((s) => s.text.length);
}

export function prismGrammar(langId) {
  const gid = { html: 'markup', xml: 'markup', docker: 'docker', plain: null }[langId] || langId;
  return gid ? Prism.languages[gid] : null;
}

export function grammarExists(langId) {
  return !!prismGrammar(langId);
}

export function langLabel(langId) {
  const l = LANGUAGES.find((x) => x.id === langId);
  return l ? l.label : langId;
}

// Returns array of lines; each line is { text, segments:[{text,type}], widthChars }
export function buildModel(source, langId) {
  const raw = String(source).replace(/\t/g, '    ');
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const grammar = prismGrammar(langId);
  const result = lines.map((line) => {
    let segments;
    if (grammar) {
      try {
        const html = Prism.highlight(line, grammar, langId);
        segments = segmentsFromHTML(html);
      } catch (e) {
        segments = [{ text: line, type: null }];
      }
    } else {
      segments = [{ text: line, type: null }];
    }
    const chars = [];
    for (const seg of segments) {
      for (const ch of seg.text) chars.push({ ch, type: seg.type });
    }
    return { text: line, segments, chars, widthChars: line.length };
  });
  return { lines: result };
}

export function langFileExt(langId) {
  const map = {
    javascript: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx', python: 'py',
    java: 'java', c: 'c', cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs',
    ruby: 'rb', php: 'php', swift: 'swift', kotlin: 'kt', scala: 'scala',
    dart: 'dart', sql: 'sql', json: 'json', yaml: 'yaml', bash: 'sh',
    powershell: 'ps1', markdown: 'md', css: 'css', scss: 'scss', less: 'less',
    graphql: 'graphql', html: 'html', xml: 'xml', toml: 'toml', ini: 'ini',
    docker: 'Dockerfile', nginx: 'conf', haskell: 'hs', lua: 'lua', perl: 'pl',
    elixir: 'ex', r: 'r', regex: 'regex', csv: 'csv', plain: 'txt',
  };
  return map[langId] || langId;
}
