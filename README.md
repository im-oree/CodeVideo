# CodeStudio — beautiful code snippet → video maker

A fully client-side studio that turns code into gorgeous, customizable,
animatable code windows and exports them as **video (WebM / MP4)** or
**images (PNG / JPG)**. Nothing is uploaded — rendering, animating, and
recording all happen live in your browser (DOM → canvas → MediaRecorder).

## Run it
```bash
cd codestudio
npm install
npm run dev      # open the printed localhost URL
```
A live preview is already running for this workspace.

## What it does
- **30+ languages** (JS, TS/JSX/TSX, Python, Java, C, C++, C#, Go, Rust,
  Ruby, PHP, Swift, Kotlin, Dart, SQL, JSON, YAML, Bash, PowerShell, CSS,
  SCSS, Less, GraphQL, HTML/XML, TOML, INI, Dockerfile, Nginx, Plain…),
  each with realistic one-click sample code, highlighted with Prism.
- **13 syntax themes** (Dracula, One Dark, Tokyo Night, Nord, Synthwave,
  Monokai, Material, GitHub light/dark, Solarized, Gruvbox, Atom, and more)
  plus an independent **accent color** with glow/tint controls.
- **Typography**: JetBrains Mono or Fira Code, size, line-height, ligatures.
- **Window chrome**: macOS/Windows-style dots, file name, language badge,
  line numbers, corner radius, padding.
- **Typewriter animation**: on/off, typing speed (chars/sec), block or bar
  caret, caret blink interval, lead-in delay, end pause, loop.
- **Scene**: optional gradient/mesh/flat backdrop, color pair, edge margin,
  aspect ratio (Auto / 16:9 / 4:3 / 1:1 / 9:16 / 21:9).
- **App chrome itself is themeable**: dark (default) or light app theme, plus
  an app accent — separate from the code accent.

## Export
- **PNG / JPG** — the code window at 1×–4× resolution scale.
- **Video WebM** (universal) and **MP4** (muxing is browser dependent —
  works in Chrome 126+/Safari 18+, which support MP4 in `MediaRecorder`).
- Each export is rendered to a real canvas via `html2canvas` and encoded live.

> Tip: WebM is the safe default. Choose MP4 when you specifically need a
> `.mp4` container — Chrome/Safari support it natively.

## Notes
- WebM + PNG exports are fully supported everywhere. MP4 support depends on
  the browser exposing an MP4-capable `MediaRecorder`.
- Fonts are bundled so exports are identical to the preview.
