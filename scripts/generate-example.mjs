import { writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { processPixels, defaults } from "../src/processing.mjs";
import { crc32 } from "../src/export.mjs";
const w = 320,
  h = 320,
  input = new Uint8ClampedArray(w * h * 4);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const u = (x - w / 2) / 110,
      v = (y - h / 2) / 110,
      r = u * u + v * v;
    const value =
      r < 1
        ? 30 + 210 * Math.max(0, -0.45 * u - 0.55 * v + 0.72 * Math.sqrt(1 - r))
        : 20 + (35 * y) / h;
    input.set([value * 0.94, value, value * 0.89, 255], (y * w + x) * 4);
  }
const output = processPixels(input, w, h, defaults, ["#101310", "#dbebb9"]);
const width = w * 2 + 16,
  raw = Buffer.alloc((width * 4 + 1) * h);
for (let y = 0; y < h; y++)
  for (let x = 0; x < width; x++) {
    const p = y * (width * 4 + 1) + 1 + x * 4;
    const data = x < w ? input : x >= w + 16 ? output : null;
    const i = (y * w + (x >= w + 16 ? x - w - 16 : x)) * 4;
    raw.set(data ? data.subarray(i, i + 4) : [16, 18, 16, 255], p);
  }
function chunk(type, data) {
  const t = Buffer.from(type),
    out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  t.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([t, data])), data.length + 8);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width);
ihdr.writeUInt32BE(h, 4);
ihdr.set([8, 6, 0, 0, 0], 8);
await writeFile(
  "examples/before-after.png",
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]),
);
