import { processPixels, expandPixels } from "./processing.mjs";
self.onmessage = ({
  data: { id, pixels, width, height, outWidth, outHeight, settings, palette },
}) => {
  try {
    const start = performance.now(),
      small = processPixels(pixels, width, height, settings, palette);
    const output = expandPixels(
      small,
      width,
      height,
      outWidth,
      outHeight,
      settings,
    );
    self.postMessage(
      {
        id,
        pixels: output,
        width: outWidth,
        height: outHeight,
        ms: performance.now() - start,
      },
      [output.buffer],
    );
  } catch (e) {
    self.postMessage({ id, error: e.message });
  }
};
