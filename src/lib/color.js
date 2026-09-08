// RGBA helpers for drawing gradients / blending.

export function hexToRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToCss({ r, g, b }) {
  return `rgb(${r},${g},${b})`;
}

// Mix two colors (hex or rgba strings) by t in [0,1]; supports alpha.
export function mix(c1, c2, t) {
  t = Math.max(0, Math.min(1, t));
  const a = toRgba(c1);
  const b = toRgba(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  const al = a.a + (b.a - a.a) * t;
  return `rgba(${r},${g},${bl},${al})`;
}

export function toRgba(color) {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 };
  if (color.startsWith('#') || color.length === 3 || color.length === 4) {
    const { r, g, b } = hexToRgb(color);
    return { r, g, b, a: color.length === 4 ? 1 : 1 };
  }
  const m = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  const m2 = color.match(/^([\da-f]{6})$/i);
  if (m2) {
    const { r, g, b } = hexToRgb(color);
    return { r, g, b, a: 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function readableOn(bg) {
  const { r, g, b } = toRgba(bg);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#111827' : '#ffffff';
}

export function alpha(color, a) {
  const { r, g, b } = toRgba(color);
  return `rgba(${r},${g},${b},${a})`;
}
