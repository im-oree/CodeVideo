// Layout math shared by live preview, capture, and PNG export.
export const CHAR_RATIO = 0.6; // advance / em for JetBrains Mono & Fira Code

export function charW(fs) { return fs * CHAR_RATIO; }

// Colors for normalized token types from a palette
export function resolve(palette, type, theme) {
  const text = theme && theme.isDark === false ? theme.text : (palette.text || '#e6e9f0');
  return palette[type] || text;
}

export function withAlpha(hex, a) {
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
  return hex;
}
