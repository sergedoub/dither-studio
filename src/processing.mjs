import { clamp, dither, hexRGB } from "./algorithms.mjs";
export const defaults = {
  algorithm: "Floyd–Steinberg",
  mode: "Tonal",
  dpi: 72,
  sourceDpi: 300,
  resampling: "Nearest neighbor",
  angle: 0,
  patternSize: 6,
  amount: 1,
  serpentine: true,
  brightness: 0,
  contrast: 0,
  gamma: 1,
  black: 0,
  white: 255,
  blur: 0,
  sharpen: 0,
  sharpenRadius: 1,
  denoise: 0,
  noise: 0,
  bleed: 0,
  rounding: 0,
  sampler: false,
  transparent: false,
  invert: false,
  rgbLevels: 2,
  colorCount: 8,
  shadow: "#101310",
  midtone: "#697959",
  highlight: "#dbebb9",
  paletteName: "Moss",
  tonalSteps: 2,
};
export function boxBlur(data, w, h, r) {
  if (r < 1) return new Float32Array(data);
  r = Math.round(r);
  const tmp = new Float32Array(data.length),
    out = new Float32Array(data.length);
  for (let y = 0; y < h; y++)
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let dx = -r; dx <= r; dx++)
        sum += data[(y * w + clamp(dx, 0, w - 1)) * 4 + c];
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 4 + c] = sum / (2 * r + 1);
        sum +=
          data[(y * w + clamp(x + r + 1, 0, w - 1)) * 4 + c] -
          data[(y * w + clamp(x - r, 0, w - 1)) * 4 + c];
      }
    }
  for (let x = 0; x < w; x++)
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++)
        sum += tmp[(clamp(dy, 0, h - 1) * w + x) * 4 + c];
      for (let y = 0; y < h; y++) {
        out[(y * w + x) * 4 + c] = sum / (2 * r + 1);
        sum +=
          tmp[(clamp(y + r + 1, 0, h - 1) * w + x) * 4 + c] -
          tmp[(clamp(y - r, 0, h - 1) * w + x) * 4 + c];
      }
    }
  for (let i = 3; i < data.length; i += 4) out[i] = data[i];
  return out;
}
export function adjust(data, w, h, s) {
  let a = new Float32Array(data);
  if (s.denoise) {
    const sm = boxBlur(a, w, h, 1),
      weight = s.denoise / 100;
    for (let i = 0; i < a.length; i++)
      if (i % 4 !== 3 && Math.abs(a[i] - sm[i]) < 40)
        a[i] = a[i] * (1 - weight) + sm[i] * weight;
  }
  if (s.blur) a = boxBlur(a, w, h, s.blur);
  if (s.sharpen) {
    const sm = boxBlur(a, w, h, s.sharpenRadius);
    for (let i = 0; i < a.length; i++)
      if (i % 4 !== 3) a[i] = clamp(a[i] + ((a[i] - sm[i]) * s.sharpen) / 100);
  }
  const out = new Uint8ClampedArray(a.length),
    contrast = 2 ** (s.contrast / 50);
  for (let i = 0; i < a.length; i += 4) {
    const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * s.noise;
    for (let c = 0; c < 3; c++) {
      let v = clamp(
        (a[i + c] - s.black) / Math.max(1, s.white - s.black),
        0,
        1,
      );
      v = Math.pow(v, 1 / s.gamma);
      v = (v - 0.5) * contrast + 0.5 + s.brightness / 100;
      out[i + c] = clamp((s.invert ? 1 - v : v) * 255 + noise);
    }
    out[i + 3] = a[i + 3];
  }
  return out;
}
export function paletteFor(s, custom) {
  if (s.mode === "Mono") return ["#000000", "#ffffff"];
  if (s.mode === "Indexed") return custom;
  if (s.tonalSteps === 3) return [s.shadow, s.midtone, s.highlight];
  return [s.shadow, s.highlight];
}
export function processPixels(data, w, h, s, palette) {
  return dither(adjust(data, w, h, s), w, h, s, paletteFor(s, palette));
}
export function expandPixels(data, w, h, W, H, s) {
  // Nearest-neighbor expansion preserves the exact ink colors. Optional morphology shapes the ink boundary.
  let out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4,
        j =
          (Math.min(h - 1, Math.floor((y * h) / H)) * w +
            Math.min(w - 1, Math.floor((x * w) / W))) *
          4;
      out.set(data.subarray(j, j + 4), i);
    }
  if (s.bleed || s.rounding) {
    const base = out,
      ink = hexRGB(s.shadow),
      radius = Math.min(4, Math.ceil(Math.abs(s.bleed) + s.rounding)),
      result = new Uint8ClampedArray(base);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let best = (y * W + x) * 4,
          score = s.bleed >= 0 ? Infinity : -Infinity;
        let r = 0,
          g = 0,
          b = 0,
          al = 0,
          n = 0;
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const i =
                (clamp(y + dy, 0, H - 1) * W + clamp(x + dx, 0, W - 1)) * 4,
              lum = base[i] + base[i + 1] + base[i + 2];
            if (s.bleed >= 0 ? lum < score : lum > score) {
              score = lum;
              best = i;
            }
            r += base[i];
            g += base[i + 1];
            b += base[i + 2];
            al += base[i + 3];
            n++;
          }
        const i = (y * W + x) * 4;
        if (s.bleed) result.set(base.subarray(best, best + 4), i);
        if (s.rounding) {
          const blend = Math.min(1, s.rounding / 3);
          [r, g, b, al].forEach(
            (v, c) =>
              (result[i + c] = result[i + c] * (1 - blend) + (v / n) * blend),
          );
        }
      }
    out = result;
  }
  return out;
}
