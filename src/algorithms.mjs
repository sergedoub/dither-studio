// Published error diffusion kernels. Weights are [dx, dy, numerator].
const kernel = (div, rows) => ({ div, rows });
export const kernels = {
  "Floyd–Steinberg": kernel(16, [
    [1, 0, 7],
    [-1, 1, 3],
    [0, 1, 5],
    [1, 1, 1],
  ]),
  Atkinson: kernel(8, [
    [1, 0, 1],
    [2, 0, 1],
    [-1, 1, 1],
    [0, 1, 1],
    [1, 1, 1],
    [0, 2, 1],
  ]),
  "Jarvis–Judice–Ninke": kernel(48, [
    [1, 0, 7],
    [2, 0, 5],
    [-2, 1, 3],
    [-1, 1, 5],
    [0, 1, 7],
    [1, 1, 5],
    [2, 1, 3],
    [-2, 2, 1],
    [-1, 2, 3],
    [0, 2, 5],
    [1, 2, 3],
    [2, 2, 1],
  ]),
  Stucki: kernel(42, [
    [1, 0, 8],
    [2, 0, 4],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 8],
    [1, 1, 4],
    [2, 1, 2],
    [-2, 2, 1],
    [-1, 2, 2],
    [0, 2, 4],
    [1, 2, 2],
    [2, 2, 1],
  ]),
  Burkes: kernel(32, [
    [1, 0, 8],
    [2, 0, 4],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 8],
    [1, 1, 4],
    [2, 1, 2],
  ]),
  Sierra: kernel(32, [
    [1, 0, 5],
    [2, 0, 3],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 5],
    [1, 1, 4],
    [2, 1, 2],
    [-1, 2, 2],
    [0, 2, 3],
    [1, 2, 2],
  ]),
  "Two-row Sierra": kernel(16, [
    [1, 0, 4],
    [2, 0, 3],
    [-2, 1, 1],
    [-1, 1, 2],
    [0, 1, 3],
    [1, 1, 2],
    [2, 1, 1],
  ]),
  "Sierra Lite": kernel(4, [
    [1, 0, 2],
    [-1, 1, 1],
    [0, 1, 1],
  ]),
  "Shiau–Fan": kernel(8, [
    [1, 0, 4],
    [-2, 1, 1],
    [-1, 1, 1],
    [0, 1, 2],
  ]),
  "Shiau–Fan 2": kernel(16, [
    [1, 0, 8],
    [-3, 1, 1],
    [-2, 1, 1],
    [-1, 1, 2],
    [0, 1, 4],
  ]),
  Fan: kernel(16, [
    [1, 0, 7],
    [-2, 1, 1],
    [-1, 1, 3],
    [0, 1, 5],
  ]),
  "False Floyd–Steinberg": kernel(8, [
    [1, 0, 3],
    [0, 1, 3],
    [1, 1, 2],
  ]),
};
export const patterns = [
  "Bayer 2×2",
  "Bayer 4×4",
  "Bayer 8×8",
  "Bayer 16×16",
  "Bayer 32×32",
  "Halftone · round",
  "Halftone · diamond",
  "Halftone · square",
  "Halftone · ellipse",
  "Horizontal lines",
  "Vertical lines",
  "Diagonal lines",
  "Crosshatch",
  "Grid",
  "Checkerboard",
  "Spiral",
  "Concentric rings",
  "Wave",
  "Modulation",
  "Modulation · vertical",
  "Modulation · cross",
  "Dot screen",
  "Brick",
  "Weave",
  "Zigzag",
  "Honeycomb",
  "Random noise",
  "Interleaved noise",
  "Threshold",
];
export const algorithms = [...Object.keys(kernels), ...patterns];
export const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));
export function bayer(x, y, n) {
  let v = 0;
  for (let s = 1; s < n; s *= 2) {
    const a = Math.floor(x / s) % 2,
      b = Math.floor(y / s) % 2;
    v =
      v * 4 +
      [
        [0, 2],
        [3, 1],
      ][b][a];
  }
  return (v + 0.5) / (n * n);
}
const fract = (x) => x - Math.floor(x);
export function threshold(name, x, y, s) {
  const angle = (s.angle * Math.PI) / 180,
    u = x * Math.cos(angle) + y * Math.sin(angle),
    v = -x * Math.sin(angle) + y * Math.cos(angle),
    period = s.patternSize || 6;
  const a = fract(u / period) - 0.5,
    b = fract(v / period) - 0.5;
  if (name.startsWith("Bayer")) {
    const n = Number(name.match(/\d+/)[0]);
    return bayer(
      ((Math.floor(u) % n) + n) % n,
      ((Math.floor(v) % n) + n) % n,
      n,
    );
  }
  switch (name) {
    case "Halftone · round":
      return Math.min(1, Math.PI * (a * a + b * b));
    case "Halftone · diamond":
      return Math.abs(a) + Math.abs(b);
    case "Halftone · square":
      return 4 * Math.max(a * a, b * b);
    case "Halftone · ellipse":
      return Math.min(1, (4 * (a * a + 2 * b * b)) / 1.5);
    case "Horizontal lines":
      return Math.abs(b) * 2;
    case "Vertical lines":
      return Math.abs(a) * 2;
    case "Diagonal lines":
      return fract((u + v) / period);
    case "Crosshatch":
      return Math.min(Math.abs(a + b), Math.abs(a - b)) * 2;
    case "Grid":
      return Math.min(Math.abs(a), Math.abs(b)) * 4;
    case "Checkerboard":
      return (
        ((((Math.floor(u / period) + Math.floor(v / period)) % 2) + 2) % 2) *
          0.7 +
        0.15
      );
    case "Spiral":
      return fract(Math.hypot(u, v) / period + Math.atan2(v, u) / Math.PI / 2);
    case "Concentric rings":
      return fract(Math.hypot(u, v) / period);
    case "Wave":
      return 0.5 + 0.5 * Math.sin((u / period) * 6.28 + Math.sin(v / period));
    case "Modulation":
      return 0.5 + 0.5 * Math.sin((u / period) * 6.28 + s.luminance * 9);
    case "Modulation · vertical":
      return 0.5 + 0.5 * Math.sin((v / period) * 6.28 + s.luminance * 9);
    case "Modulation · cross":
      return (
        0.5 +
        0.25 *
          (Math.sin((u / period) * 6.28 + s.luminance * 9) +
            Math.sin((v / period) * 6.28 + s.luminance * 9))
      );
    case "Dot screen":
      return (
        0.5 +
        0.25 * (Math.cos((u / period) * 6.28) + Math.cos((v / period) * 6.28))
      );
    case "Brick":
      return (
        fract((u + ((Math.floor(v / period) % 2) * period) / 2) / period) *
          0.7 +
        Math.abs(b) * 0.6
      );
    case "Weave":
      return fract(Math.floor(u / period) % 2 ? v / period : u / period);
    case "Zigzag":
      return fract(v / period + Math.abs(a) * 2);
    case "Honeycomb":
      return clamp(
        Math.hypot(
          fract(u / period + (Math.floor(v / period) % 2) / 2) - 0.5,
          b,
        ) * 1.7,
        0,
        1,
      );
    case "Random noise":
      return fract(Math.sin(x * 127.1 + y * 311.7 + 13.4) * 43758.5453);
    case "Interleaved noise":
      return fract(52.9829189 * fract(0.06711056 * x + 0.00583715 * y));
    default:
      return 0.5;
  }
}
export const hexRGB = (h) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgbHex = (c) =>
  "#" +
  c.map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("");
export const luma = (c) =>
  (c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722) / 255;
export function extractPalette(data, count) {
  const samples = [];
  const step = Math.max(1, Math.floor(data.length / 4 / 16000));
  for (let i = 0; i < data.length; i += step * 4)
    if (data[i + 3] > 127) samples.push([data[i], data[i + 1], data[i + 2]]);
  if (!samples.length) return ["#000000", "#ffffff"];
  const boxes = [samples];
  while (boxes.length < count) {
    let chosen = -1,
      best = -1,
      axis = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255,
          hi = 0;
        for (const p of box) {
          lo = Math.min(lo, p[c]);
          hi = Math.max(hi, p[c]);
        }
        const score = (hi - lo) * Math.sqrt(box.length);
        if (score > best && hi > lo) {
          best = score;
          chosen = i;
          axis = c;
        }
      }
    });
    if (chosen < 0) break;
    const box = boxes.splice(chosen, 1)[0].sort((a, b) => a[axis] - b[axis]),
      mid = Math.floor(box.length / 2);
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return [
    ...new Set(
      boxes.map((b) =>
        rgbHex(
          b
            .reduce((a, p) => a.map((v, i) => v + p[i]), [0, 0, 0])
            .map((v) => v / b.length),
        ),
      ),
    ),
  ].sort((a, b) => luma(hexRGB(a)) - luma(hexRGB(b)));
}
export function dither(data, w, h, s, palette) {
  const colors = palette.map(hexRGB),
    out = new Uint8ClampedArray(data.length),
    work = new Float32Array(data),
    k = kernels[s.algorithm];
  for (let y = 0; y < h; y++) {
    const dir = s.serpentine && y % 2 ? -1 : 1;
    for (let t = 0; t < w; t++) {
      const x = dir === 1 ? t : w - 1 - t,
        i = (y * w + x) * 4,
        alpha = data[i + 3];
      if (!alpha) continue;
      let c = [work[i], work[i + 1], work[i + 2]],
        lum = luma(c);
      let q;
      s.luminance = lum;
      const th = k ? 0.5 : threshold(s.algorithm, x, y, s);
      if (s.mode === "RGB") {
        const levels = s.rgbLevels || 2;
        q = c.map((v) => {
          const z = (clamp(v) / 255) * (levels - 1),
            base = Math.floor(z);
          return clamp(
            ((base + (z - base > 0.5 + (th - 0.5) * s.amount ? 1 : 0)) * 255) /
              (levels - 1),
          );
        });
      } else {
        if (s.mode === "Mono" || s.mode === "Tonal")
          c = [lum * 255, lum * 255, lum * 255];
        let best = Infinity,
          second = Infinity,
          bi = 0,
          si = 0;
        colors.forEach((p, j) => {
          const target =
            s.mode === "Mono" || s.mode === "Tonal"
              ? (j / (colors.length - 1)) * 255
              : null;
          const d = c.reduce(
            (sum, v, ch) => sum + (v - (target ?? p[ch])) ** 2,
            0,
          );
          if (d < best) {
            second = best;
            si = bi;
            best = d;
            bi = j;
          } else if (d < second) {
            second = d;
            si = j;
          }
        });
        if (
          !k &&
          best > 1e-8 &&
          s.algorithm !== "Threshold" &&
          second < Infinity
        ) {
          // Anchor ordered thresholds to the darker endpoint so the pattern
          // grows continuously through the midpoint rather than flipping polarity.
          const first = s.mode === "Indexed" ? luma(colors[bi]) : bi;
          const next = s.mode === "Indexed" ? luma(colors[si]) : si;
          if (first > next) [bi, si] = [si, bi];
          const p = colors[bi],
            r = colors[si];
          let numer = 0,
            denom = 0;
          for (let ch = 0; ch < 3; ch++) {
            const a =
                s.mode === "Indexed" ? p[ch] : (bi / (colors.length - 1)) * 255,
              b =
                s.mode === "Indexed" ? r[ch] : (si / (colors.length - 1)) * 255;
            numer += (c[ch] - a) * (b - a);
            denom += (b - a) ** 2;
          }
          if (clamp(numer / (denom || 1), 0, 1) > 0.5 + (th - 0.5) * s.amount)
            bi = si;
        }
        q = colors[bi];
        if (k) {
          const target =
            s.mode === "Mono" || s.mode === "Tonal"
              ? Array(3).fill((bi / (colors.length - 1)) * 255)
              : q;
          for (const [dx, dy, weight] of k.rows) {
            const nx = x + dx * dir,
              ny = y + dy;
            if (nx < 0 || nx >= w || ny >= h) continue;
            const ni = (ny * w + nx) * 4;
            if (!data[ni + 3]) continue;
            for (let ch = 0; ch < 3; ch++)
              work[ni + ch] +=
                (((c[ch] - target[ch]) * weight) / k.div) * s.amount;
          }
        }
      }
      if (k && s.mode === "RGB")
        for (const [dx, dy, weight] of k.rows) {
          const nx = x + dx * dir,
            ny = y + dy;
          if (nx < 0 || nx >= w || ny >= h) continue;
          for (let ch = 0; ch < 3; ch++)
            work[(ny * w + nx) * 4 + ch] +=
              (((c[ch] - q[ch]) * weight) / k.div) * s.amount;
        }
      out.set(q, i);
      out[i + 3] =
        s.transparent &&
        q.every((v, j) => v === (s.mode === "RGB" ? 0 : colors[0][j]))
          ? 0
          : alpha;
    }
  }
  return out;
}
