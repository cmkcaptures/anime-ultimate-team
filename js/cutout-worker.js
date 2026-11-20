// Background worker: decodes a card's art and removes the white background off the main thread.
const MAXSIDE = 1100
function cut(p, w, h) {
  const white = i => p[i] > 228 && p[i + 1] > 228 && p[i + 2] > 228
  const seen = new Uint8Array(w * h), q = []
  for (let i = 0; i < w; i++) q.push(i, (h - 1) * w + i)
  for (let j = 0; j < h; j++) q.push(j * w, j * w + w - 1)
  while (q.length) { const k = q.pop(); if (seen[k]) continue; seen[k] = 1; if (!white(k * 4)) continue; p[k * 4 + 3] = 0; const X = k % w, Y = (k / w) | 0; if (X > 0) q.push(k - 1); if (X < w - 1) q.push(k + 1); if (Y > 0) q.push(k - w); if (Y < h - 1) q.push(k + w) }
  for (let k = 0; k < w * h; k++) { if (p[k * 4 + 3] === 0) continue; let n = 0; for (const o of [-1, 1, -w, w]) { const kk = k + o; if (kk >= 0 && kk < w * h && p[kk * 4 + 3] === 0) n++ } if (n) { const lum = (p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2]) / 3; if (lum > 190) p[k * 4 + 3] = Math.max(0, 255 - (lum - 190) * 4) } }
}
self.onmessage = async ({ data: { id, url, nocut } }) => {
  try {
    const blob = await (await fetch(url)).blob(), src = await createImageBitmap(blob)
    const sc = Math.min(1, MAXSIDE / Math.max(src.width, src.height)), w = Math.round(src.width * sc), h = Math.round(src.height * sc)
    const cv = new OffscreenCanvas(w, h), x = cv.getContext('2d'); x.drawImage(src, 0, 0, w, h); src.close()
    if (!nocut) { const d = x.getImageData(0, 0, w, h); cut(d.data, w, h); x.putImageData(d, 0, 0) }
    const out = await cv.convertToBlob({ type: 'image/webp', quality: .9 }), bmp = cv.transferToImageBitmap()
    self.postMessage({ id, bmp, blob: out }, [bmp])
  } catch (e) { self.postMessage({ id, err: String(e) }) }
}
