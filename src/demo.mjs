export function demoCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(1200, 1200);
  for (let y = 0; y < 1200; y++)
    for (let x = 0; x < 1200; x++) {
      const u = (x - 600) / 400,
        v = (y - 550) / 400,
        r = u * u + v * v,
        i = (y * 1200 + x) * 4;
      let b = 20 + (35 * y) / 1200;
      const frame =
        x > 135 &&
        x < 1065 &&
        y > 130 &&
        y < 1070 &&
        (x < 170 || x > 1030 || y < 165 || y > 1035);
      if (frame) b = 130 + (x + y) / 22;
      const shadow = Math.exp(
        -((u - 0.18) ** 2 / 0.7 + (v - 1.13) ** 2 / 0.055),
      );
      b *= 1 - shadow * 0.85;
      if (r < 1) {
        const z = Math.sqrt(1 - r),
          lit = Math.max(0, -0.45 * u - 0.55 * v + 0.72 * z),
          grain =
            Math.sin(x * 0.18 + Math.sin(y * 0.042) * 6) *
            Math.cos(y * 0.17) *
            3;
        b = 28 + 210 * lit + grain;
      }
      image.data.set([b * 0.94, b, b * 0.89, 255], i);
    }
  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = "#babfac";
  ctx.font = "15px monospace";
  ctx.fillText("FORM STUDY — 001", 175, 100);
  ctx.fillText("LIGHT / MATTER / SIGNAL", 175, 1122);
  ctx.textAlign = "right";
  ctx.fillText("DS", 1030, 1122);
  return canvas;
}
