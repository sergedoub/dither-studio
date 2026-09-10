import { zipSync, strToU8 } from "../node_modules/fflate/esm/browser.js";
import { hexRGB } from "./algorithms.mjs";
export function crc32(data) {
  let crc = 0xffffffff;
  for (const b of data) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function withDpi(bytes, dpi) {
  const payload = new Uint8Array(13),
    view = new DataView(payload.buffer);
  payload.set([112, 72, 89, 115]);
  view.setUint32(4, Math.round(dpi / 0.0254));
  view.setUint32(8, Math.round(dpi / 0.0254));
  payload[12] = 1;
  const chunk = new Uint8Array(21),
    cv = new DataView(chunk.buffer);
  cv.setUint32(0, 9);
  chunk.set(payload, 4);
  cv.setUint32(17, crc32(payload));
  const out = new Uint8Array(bytes.length + 21);
  out.set(bytes.subarray(0, 33));
  out.set(chunk, 33);
  out.set(bytes.subarray(33), 54);
  return out;
}
export async function pngBytes(canvas, dpi) {
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("PNG encoding failed"))),
      "image/png",
    ),
  );
  return withDpi(new Uint8Array(await blob.arrayBuffer()), dpi);
}
export async function save(name, bytes) {
  if (window.desktop) return window.desktop.save({ name, bytes });
  const url = URL.createObjectURL(new Blob([bytes]));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export const zip = (files) => zipSync(files, { level: 6 });
export const jsonBytes = (data) => strToU8(JSON.stringify(data, null, 2));
export function separate(data, palette) {
  const colors = palette.map(hexRGB),
    layers = colors.map(() => new Uint8ClampedArray(data.length));
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    let best = Infinity,
      idx = 0;
    colors.forEach((c, j) => {
      const d = c.reduce((sum, v, k) => sum + (v - data[i + k]) ** 2, 0);
      if (d < best) {
        best = d;
        idx = j;
      }
    });
    layers[idx].set([...colors[idx], data[i + 3]], i);
  }
  return layers;
}
