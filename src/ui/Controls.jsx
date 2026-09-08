import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export function Panel({ icon, title, open, onToggle, children }) {
  return (
    <div className="cp">
      <div className={`cp-h ${open ? 'open' : ''}`} onClick={onToggle}>
        <span className="ic">{icon}</span>
        <span>{title}</span>
        <span className="chev"><ChevronRight size={14} /></span>
      </div>
      {open && <div className="cp-b">{children}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, suffix = '', fmt }) {
  return (
    <div className="ctl">
      <div className="ctl-head">
        <span>{label}</span>
        <span className="ctl-val">{fmt ? fmt(value) : value}{suffix}</span>
      </div>
      <input type="range" className="slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <div className="sw" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <div className={`sw-track ${checked ? 'on' : ''}`} />
    </div>
  );
}

export function Segmented({ options, value, onChange, cols }) {
  return (
    <div className={`seg cols-${cols || options.length}`}>
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}>
          {o.icon && <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Swatches({ colors, value, onChange, size = '' }) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <div key={c} className={`swatch ${size} ${value === c ? 'sel' : ''}`}
          style={{ background: c }} onClick={() => onChange(c)} title={c} />
      ))}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, mono, rows }) {
  const cls = `txt ${mono ? 'code-editor' : ''}`;
  return (
    <div className="ctl">
      {label && <div className="caption">{label}</div>}
      {rows ? (
        <textarea className={cls} rows={rows} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      ) : (
        <input type="text" className={cls} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      )}
    </div>
  );
}

export function ColorField({ label, value, swatches, onChange }) {
  return (
    <div className="ctl">
      {label && <div className="caption">{label}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input type="color" className="col" value={value} onChange={(e) => onChange(e.target.value)}
            style={{ width: 40, height: 32 }} />
        </div>
        <div style={{ flex: 1 }}>
          <Swatches colors={swatches} value={value.toLowerCase()} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

export function Btn({ children, ...rest }) {
  return <button className="btn" {...rest}>{children}</button>;
}

export function useStateToggle() {
  return useState(true);
}
