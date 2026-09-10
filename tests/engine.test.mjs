import test from "node:test";
import assert from "node:assert/strict";
import {
  algorithms,
  bayer,
  dither,
  extractPalette,
} from "../src/algorithms.mjs";
import { defaults, adjust, expandPixels } from "../src/processing.mjs";
import { withDpi, crc32, separate } from "../src/export.mjs";
const gradient = (w = 64, h = 64) => {
  const p = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      p.set(
        [(x / (w - 1)) * 255, (x / (w - 1)) * 255, (x / (w - 1)) * 255, 255],
        i,
      );
    }
  return p;
};
test("all 41 algorithms yield only palette colors, preserve alpha, and respond to luminance", () => {
  assert.equal(algorithms.length, 41);
  for (const algorithm of algorithms) {
    const p = gradient(),
      s = { ...defaults, mode: "Mono", algorithm },
      out = dither(p, 64, 64, s, ["#000000", "#ffffff"]);
    let black = 0,
      white = 0;
    for (let i = 0; i < out.length; i += 4) {
      assert.ok(out[i] === 0 || out[i] === 255, algorithm);
      assert.equal(out[i], out[i + 1]);
      assert.equal(out[i + 3], 255);
      if (out[i]) white++;
      else black++;
    }
    assert.ok(black > 100 && white > 100, algorithm);
    assert.equal(out[0], 0, algorithm);
    assert.equal(out[63 * 4], 255, algorithm);
  }
});
test("Floyd Steinberg first row matches known 4-pixel diffusion", () => {
  const p = new Uint8ClampedArray([
    100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100,
    255,
  ]);
  const r = dither(p, 4, 1, { ...defaults, mode: "Mono" }, [
    "#000000",
    "#ffffff",
  ]);
  assert.deepEqual([r[0], r[4], r[8], r[12]], [0, 255, 0, 0]);
});
test("Bayer matrices contain each threshold exactly once", () => {
  for (const n of [2, 4, 8, 16, 32]) {
    const values = new Set();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) values.add(bayer(x, y, n));
    assert.equal(values.size, n * n);
    assert.ok([...values].every((v) => v > 0 && v < 1));
  }
});
test("transparent input remains transparent", () => {
  const p = gradient(8, 8);
  p[3] = 0;
  for (const algorithm of algorithms) {
    const out = dither(p, 8, 8, { ...defaults, algorithm }, [
      "#101310",
      "#dbebb9",
    ]);
    assert.equal(out[3], 0);
  }
});
test("palette extraction ignores transparent pixels and returns actual solid colors", () => {
  const p = new Uint8ClampedArray([
    255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 0,
  ]);
  assert.deepEqual(
    new Set(extractPalette(p, 8)),
    new Set(["#ff0000", "#0000ff"]),
  );
});
test("identity adjustments do not change input and brightness changes output", () => {
  const p = gradient(8, 8);
  assert.deepEqual(adjust(p, 8, 8, defaults), p);
  const light = adjust(p, 8, 8, { ...defaults, brightness: 20 });
  assert.ok(light[0] > p[0]);
});
test("RGB mode quantizes to exact levels", () => {
  const p = gradient(16, 16);
  for (const rgbLevels of [2, 3, 4]) {
    const out = dither(p, 16, 16, { ...defaults, mode: "RGB", rgbLevels }, [
      "#000000",
      "#ffffff",
    ]);
    const valid = new Set(
      Array.from({ length: rgbLevels }, (_, i) =>
        Math.round((i * 255) / (rgbLevels - 1)),
      ),
    );
    for (let i = 0; i < out.length; i++)
      if (i % 4 !== 3) assert.ok(valid.has(out[i]));
  }
});
test("expansion preserves dimensions and alpha", () => {
  const p = new Uint8ClampedArray([0, 0, 0, 0, 255, 255, 255, 255]);
  const r = expandPixels(p, 2, 1, 4, 2, defaults);
  assert.equal(r.length, 32);
  assert.deepEqual(
    [...r.slice(0, 16)],
    [0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255],
  );
});
test("separated ink layers recompose exactly for a hard palette", () => {
  const p = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 127, 0, 0, 0, 0]);
  const layers = separate(p, ["#ff0000", "#0000ff"]);
  assert.equal(layers[0][3], 255);
  assert.equal(layers[1][7], 127);
  assert.equal(layers[0][7], 0);
  assert.equal(layers[1][11], 0);
});
test("PNG DPI chunk has correct density and checksum", () => {
  const raw = new Uint8Array(50),
    out = withDpi(raw, 300),
    dv = new DataView(out.buffer);
  assert.equal(dv.getUint32(33), 9);
  assert.equal(dv.getUint32(41), 11811);
  assert.equal(dv.getUint32(45), 11811);
  assert.equal(out[49], 1);
  assert.equal(dv.getUint32(50), crc32(out.slice(37, 50)));
});
test("Bayer 4 by 4 follows the dispersed ordered matrix", () => {
  const expected = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      assert.equal(bayer(x, y, 4), (expected[y][x] + 0.5) / 16);
});
test("ordered tonal screens grow monotonically as a flat field brightens", () => {
  let prior;
  for (const level of [0, 32, 64, 96, 128, 160, 192, 224, 255]) {
    const p = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < p.length; i += 4) p.set([level, level, level, 255], i);
    const r = dither(
      p,
      16,
      16,
      { ...defaults, mode: "Mono", algorithm: "Bayer 4×4" },
      ["#000000", "#ffffff"],
    );
    if (prior)
      for (let i = 0; i < r.length; i += 4) assert.ok(r[i] >= prior[i]);
    prior = r;
  }
});
test("zero RGB dither amount becomes nearest-level quantization", () => {
  const p = gradient(64, 4);
  const a = dither(
    p,
    64,
    4,
    { ...defaults, mode: "RGB", algorithm: "Bayer 8×8", amount: 0 },
    ["#000000", "#ffffff"],
  );
  const b = dither(
    p,
    64,
    4,
    { ...defaults, mode: "RGB", algorithm: "Threshold", amount: 0 },
    ["#000000", "#ffffff"],
  );
  assert.deepEqual(a, b);
});
