import html2canvas from 'html2canvas';

export const VIDEO_TYPES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=vp9',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export function pickMime(prefer) {
  const list = prefer === 'mp4'
    ? VIDEO_TYPES.filter((t) => t.includes('mp4')).concat(VIDEO_TYPES.filter((t) => t.includes('webm')))
    : VIDEO_TYPES.filter((t) => t.includes('webm')).concat(VIDEO_TYPES.filter((t) => t.includes('mp4')));
  for (const t of list) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) {}
  }
  return null;
}

export async function toCanvas(element, { scale = 1, background = null, width, height } = {}) {
  // measure natural layout box
  const w = width || element.offsetWidth;
  const h = height || element.offsetHeight;
  const c = await html2canvas(element, {
    scale,
    backgroundColor: background === 'transparent' ? null : (background || null),
    width: width ? width / scale : undefined,
    height: height ? height / scale : undefined,
    useCORS: true,
    logging: false,
    windowWidth: document.documentElement.clientWidth,
  });
  return c;
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((res) => canvas.toBlob((b) => res(b), type));
}

export async function capturePNG(element, opts) {
  const canvas = await toCanvas(element, opts);
  const blob = await canvasToBlob(canvas, 'image/png');
  return { blob, canvas, width: canvas.width, height: canvas.height };
}

export async function captureJPG(element, opts) {
  const canvas = await toCanvas(element, opts);
  const blob = await canvasToBlob(canvas, 'image/jpeg');
  return { blob, canvas, width: canvas.width, height: canvas.height };
}

// Record element by sampling frames onto a canvas feed.
export function startRecording(element, {
  scale = 2, background = '#0a0d14', fps = 30, mime = 'video/webm',
} = {}) {
  const W = Math.round(element.offsetWidth * scale);
  const H = Math.round(element.offsetHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream(fps);
  const mediaRec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 20_000_000 });
  const chunks = [];
  mediaRec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  let stopping = false;
  let frame = 0;
  const blobPromise = new Promise((resolve) => {
    mediaRec.onstop = () => {
      resolve(new Blob(chunks, { type: mime.split(';')[0] }));
    };
  });

  const ext = mime.includes('mp4') ? 'mp4' : 'webm';

  async function pump() {
    const snap = await toCanvas(element, { scale, background });
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(snap, 0, 0);
    frame++;
  }

  // self-scheduling async pump loop
  let stopFlag = false;
  async function loop() {
    let last = performance.now();
    while (!stopFlag) {
      const t0 = performance.now();
      try { await pump(); } catch (e) { console.error('frame err', e); }
      const took = performance.now() - t0;
      const wait = Math.max(0, (1000 / fps) - took);
      // align roughly to fps
      const start = performance.now();
      while (performance.now() - start < wait) await new Promise((r) => setTimeout(r, 8));
      last = t0;
    }
  }

  const started = () => {
    try { mediaRec.start(200); } catch (e) { mediaRec.start(); }
    loop();
  };

  return {
    started,
    get frames() { return frame; },
    async stop() {
      stopFlag = true;
      try { await pump(); } catch (e) {}
      if (mediaRec.state !== 'inactive') mediaRec.stop();
      return blobPromise;
    },
    canvas, ext, W, H,
  };
}
