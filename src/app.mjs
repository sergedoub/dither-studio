import {
  algorithms,
  kernels,
  extractPalette,
  hexRGB,
  rgbHex,
} from "./algorithms.mjs";
import { defaults, paletteFor } from "./processing.mjs";
import { pngBytes, save, zip, jsonBytes, separate } from "./export.mjs";
import { demoCanvas } from "./demo.mjs";
const $ = (id) => document.getElementById(id);
let settings = { ...defaults },
  palette = ["#101310", "#344b38", "#6a8653", "#dbebb9"],
  images = [],
  current = 0,
  mode = "processed",
  zoom = "fit",
  split = 50,
  renderID = 0,
  timer,
  busy = false,
  last = null;
const palettes = {
  Moss: ["#101310", "#344b38", "#6a8653", "#dbebb9"],
  "Black & white": ["#000000", "#ffffff"],
  Amber: ["#120e08", "#713c10", "#d99221", "#f9dda6"],
  "Game Boy": ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  "Nostalg-OS": [
    "#000000",
    "#7f7f7f",
    "#c0c0c0",
    "#ffffff",
    "#800000",
    "#ff0000",
    "#808000",
    "#ffff00",
    "#008000",
    "#00ff00",
    "#008080",
    "#00ffff",
    "#000080",
    "#0000ff",
    "#800080",
    "#ff00ff",
  ],
  Pastel: [
    "#343044",
    "#856a93",
    "#c597af",
    "#ecb7a7",
    "#f4dfbf",
    "#96b6a1",
    "#93a5c9",
    "#eee8dc",
  ],
  CMYK: ["#141414", "#00b5c9", "#e7428f", "#ffe44f", "#ffffff"],
};
const select = (id, label, options) =>
  `<div class="row"><label for="${id}">${label}</label><select id="${id}" data-setting="${id}">${options.map((o) => `<option value="${o}">${o}</option>`).join("")}</select></div>`;
const range = (id, label, min, max, step = 1) =>
  `<div class="row"><label for="${id}">${label}</label><input id="${id}Number" aria-label="${label} value" type="number" min="${min}" max="${max}" step="${step}" data-number="${id}"><input id="${id}" aria-label="${label}" data-setting="${id}" type="range" min="${min}" max="${max}" step="${step}"></div>`;
const check = (id, label) =>
  `<label class="checkrow"><input type="checkbox" id="${id}" data-setting="${id}">${label}</label>`;
const color = (id, label) =>
  `<div class="row"><label for="${id}">${label}</label><input id="${id}" type="color" data-setting="${id}"><span class="hex" id="${id}Hex"></span></div>`;
$("controls").innerHTML =
  `<fieldset><legend>Dither settings ▦</legend>${range("dpi", "Dither DPI", 12, 300)}${range("sourceDpi", "Source DPI", 72, 600)}${select("resampling", "Resampling", ["Nearest neighbor", "Bilinear", "Bicubic"])}${select("algorithm", "Algorithm", algorithms)}${select("mode", "Render mode", ["Mono", "Tonal", "Indexed", "RGB"])}${select("angle", "Screen angle", [0, 22.5, 45, 90])}${range("patternSize", "Pattern size", 2, 24)}${range("amount", "Dither amount", 0, 1, 0.05)}${check("serpentine", "Serpentine scan · alternating rows")}</fieldset><fieldset><legend>Effect controls ✳</legend>${range("black", "Black point", 0, 254)}${range("white", "White point", 1, 255)}${range("gamma", "Midpoint / γ", 0.2, 3, 0.05)}${range("brightness", "Brightness", -100, 100)}${range("contrast", "Contrast", -100, 100)}${range("sharpen", "Sharpen strength", 0, 200)}${range("sharpenRadius", "Sharpen radius", 1, 5)}${range("denoise", "Denoise", 0, 100)}${range("noise", "Noise", 0, 60)}${range("blur", "Blur", 0, 5)}${check("invert", "Invert input luminance")}</fieldset><fieldset id="tonalControls"><legend>Tonal controls ◐</legend>${select("tonalSteps", "Tonal mapping", [2, 3])}${color("highlight", "Highlights")}${color("midtone", "Midtones")}${color("shadow", "Shadows")}</fieldset><fieldset id="indexedControls"><legend>Palette controls ◩</legend>${select("paletteName", "Palette", Object.keys(palettes))}${range("colorCount", "Extract colors", 2, 64)}<div class="swatches" id="swatches"></div><div class="smallbuttons"><button id="extract">Extract from image</button><button id="importPalette">Import palette image</button></div><p class="hint">Click a swatch to edit its ink color.</p></fieldset><fieldset id="rgbControls"><legend>RGB controls ⊞</legend>${range("rgbLevels", "Channel levels", 2, 4)}<p class="hint">2–4 levels per channel produce 8–64 colors.</p></fieldset><fieldset><legend>Output controls ⌗</legend>${range("bleed", "Ink bleed", -3, 3, 0.5)}${range("rounding", "Edge rounding", 0, 3, 0.5)}${check("sampler", "2× sampler · smoother input sampling")}${check("transparent", "Transparent background / remove first ink")}<p class="hint">PNG exports retain original dimensions. Rounding adds soft edges; leave at 0 for exact ink colors.</p></fieldset>`;
function sync() {
  document.querySelectorAll("[data-setting]").forEach((el) => {
    const key = el.dataset.setting;
    if (el.type === "checkbox") el.checked = settings[key];
    else el.value = settings[key];
    if ($(key + "Number")) $(key + "Number").value = settings[key];
    if ($(key + "Hex"))
      $(key + "Hex").textContent = settings[key].toUpperCase();
  });
  $("tonalControls").hidden = settings.mode !== "Tonal";
  $("indexedControls").hidden = settings.mode !== "Indexed";
  $("rgbControls").hidden = settings.mode !== "RGB";
  $("algorithmFooter").textContent =
    (kernels[settings.algorithm] ? "ERROR DIFFUSION" : "ORDERED / PROCEDURAL") +
    " / " +
    settings.algorithm.toUpperCase();
  renderSwatches();
}
function renderSwatches() {
  $("swatches").replaceChildren(
    ...palette.map((c, i) => {
      const el = document.createElement("input");
      el.type = "color";
      el.value = c;
      el.title = `Ink ${i + 1}`;
      el.setAttribute("aria-label", `Ink ${i + 1}`);
      el.oninput = () => {
        palette[i] = el.value;
        schedule();
      };
      return el;
    }),
  );
}
function onSetting(el) {
  const key = el.dataset.setting || el.dataset.number,
    ref = $(key);
  let value =
    el.type === "checkbox"
      ? el.checked
      : typeof defaults[key] === "number"
        ? Number(el.value)
        : el.value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return;
    value = Math.min(
      Number(ref.max || Infinity),
      Math.max(Number(ref.min || -Infinity), value),
    );
  }
  settings[key] = value;
  if (key === "black" && settings.black >= settings.white)
    settings.white = settings.black + 1;
  if (key === "white" && settings.white <= settings.black)
    settings.black = settings.white - 1;
  if (key === "paletteName") palette = [...palettes[value]];
  $("preset").value = "custom";
  sync();
  schedule();
}
document
  .querySelectorAll("[data-setting],[data-number]")
  .forEach((el) => el.addEventListener("input", () => onSetting(el)));
function toast(text) {
  $("toast").textContent = text;
  $("toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").style.display = "none"), 4000);
}
function schedule() {
  clearTimeout(timer);
  $("renderStatus").textContent = "Updating preview…";
  timer = setTimeout(render, 90);
}
function sample(image, s, preview = true) {
  const scale = preview
    ? Math.min(1, 1000 / Math.max(image.width, image.height))
    : 1;
  const W = Math.max(1, Math.round(image.width * scale)),
    H = Math.max(1, Math.round(image.height * scale));
  const w = Math.max(
      1,
      Math.round(((image.width * s.dpi) / s.sourceDpi) * scale),
    ),
    h = Math.max(1, Math.round(((image.height * s.dpi) / s.sourceDpi) * scale));
  if (w * h > 24000000 || W * H > 40000000)
    throw Error(
      "Image too large at this DPI. Lower Dither DPI or resize below 40 megapixels.",
    );
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = s.resampling !== "Nearest neighbor";
  ctx.imageSmoothingQuality = s.resampling === "Bicubic" ? "high" : "low";
  if (s.sampler) {
    const c2 = document.createElement("canvas");
    c2.width = w * 2;
    c2.height = h * 2;
    const cctx = c2.getContext("2d");
    cctx.drawImage(image, 0, 0, c2.width, c2.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(c2, 0, 0, w, h);
  } else ctx.drawImage(image, 0, 0, w, h);
  return {
    pixels: ctx.getImageData(0, 0, w, h).data,
    width: w,
    height: h,
    outWidth: W,
    outHeight: H,
  };
}
let previewWorker;
function work(image, s, p, preview = true) {
  const args = sample(image, s, preview),
    worker = new Worker(new URL("./worker.mjs", import.meta.url), {
      type: "module",
    });
  if (preview) {
    if (previewWorker) {
      previewWorker.cancel();
    }
    previewWorker = worker;
  }
  return new Promise((resolve, reject) => {
    worker.cancel = () => {
      worker.terminate();
      reject(new Error("Superseded"));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(Error(e.message));
    };
    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (previewWorker === worker) previewWorker = null;
      data.error ? reject(Error(data.error)) : resolve(data);
    };
    worker.postMessage(
      { ...args, id: ++renderID, settings: { ...s }, palette: [...p] },
      [args.pixels.buffer],
    );
  });
}
function canvasOf(result) {
  const c = document.createElement("canvas");
  c.width = result.width;
  c.height = result.height;
  c.getContext("2d").putImageData(
    new ImageData(result.pixels, result.width, result.height),
    0,
    0,
  );
  return c;
}
async function render() {
  try {
    const item = images[current];
    if (!item) return;
    const r = await work(item.image, settings, palette);
    last = r;
    const c = $("output");
    c.width = r.width;
    c.height = r.height;
    c.getContext("2d").putImageData(
      new ImageData(r.pixels, r.width, r.height),
      0,
      0,
    );
    const original = $("sourcePreview");
    original.width = r.width;
    original.height = r.height;
    original.getContext("2d").drawImage(item.image, 0, 0, r.width, r.height);
    $("renderStatus").textContent =
      `● Preview ready · ${Math.round(r.ms)} ms · ${r.width} × ${r.height}`;
    layout();
  } catch (e) {
    if (e.message !== "Superseded") {
      toast(e.message);
      $("renderStatus").textContent = "Preview failed";
    }
  }
}
function layout() {
  if (!last) return;
  const fit = Math.min(
    ($("viewport").clientWidth - 90) / last.width,
    ($("viewport").clientHeight - 65) / last.height,
  );
  const scale = zoom === "fit" ? fit : zoom;
  Object.assign($("canvasWrap").style, {
    width: last.width * scale + "px",
    height: last.height * scale + "px",
  });
  $("zoomLabel").textContent = Math.round(scale * 100) + "%";
}
function setMode(value) {
  mode = value;
  ["processed", "original", "compare"].forEach((id) =>
    $(id).classList.toggle("active", id === mode),
  );
  $("sourcePreview").style.display = mode === "processed" ? "none" : "block";
  $("sourcePreview").style.clipPath =
    mode === "compare" ? `inset(0 ${100 - split}% 0 0)` : "none";
  $("splitHandle").style.display = mode === "compare" ? "block" : "none";
  $("previewTag").textContent =
    mode === "processed"
      ? "DITHERED"
      : mode === "original"
        ? "ORIGINAL"
        : "ORIGINAL / DITHERED";
}
["processed", "original", "compare"].forEach(
  (id) => ($(id).onclick = () => setMode(id)),
);
$("splitHandle").onpointerdown = (e) => {
  e.target.setPointerCapture(e.pointerId);
  e.target.onpointermove = (ev) => {
    const rect = $("canvasWrap").getBoundingClientRect();
    split = Math.max(
      0,
      Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100),
    );
    $("splitHandle").style.left = split + "%";
    setMode("compare");
  };
  e.target.onpointerup = () => (e.target.onpointermove = null);
};
$("zoomIn").onclick = () => {
  zoom =
    (zoom === "fit" ? parseInt($("zoomLabel").textContent) / 100 : zoom) * 1.25;
  layout();
};
$("zoomOut").onclick = () => {
  zoom =
    (zoom === "fit" ? parseInt($("zoomLabel").textContent) / 100 : zoom) / 1.25;
  layout();
};
$("fit").onclick = () => {
  zoom = "fit";
  layout();
};
window.addEventListener("resize", layout);
function queue() {
  const area = $("queue");
  area.replaceChildren(
    ...images.map((item, i) => {
      const b = document.createElement("button");
      b.className = "thumb" + (i === current ? " active" : "");
      b.title = item.name;
      const img = document.createElement("img");
      img.alt = item.name;
      img.src = item.thumb;
      const caption = document.createElement("span");
      caption.textContent = item.name;
      b.append(img, caption);
      b.onclick = () => {
        current = i;
        queue();
        render();
      };
      return b;
    }),
  );
  $("filename").textContent = images[current].name;
  $("dimensions").textContent =
    `${images[current].image.width} × ${images[current].image.height}`;
}
async function decode(file) {
  if (!file.type.startsWith("image/"))
    throw Error(`Unsupported file: ${file.name}`);
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 40000000) {
    bitmap.close();
    throw Error("Maximum image size is 40 megapixels.");
  }
  return bitmap;
}
async function loadFiles(files) {
  if (busy) return toast("Wait for export to finish.");
  let added = 0;
  for (const f of files) {
    try {
      const image = await decode(f),
        thumb = document.createElement("canvas");
      thumb.width = 80;
      thumb.height = 80;
      thumb.getContext("2d").drawImage(image, 0, 0, 80, 80);
      images.push({ name: f.name, image, thumb: thumb.toDataURL() });
      added++;
    } catch (e) {
      toast(e.message);
    }
  }
  if (added) {
    current = images.length - added;
    queue();
    render();
  }
}
$("open").onclick = () => $("files").click();
$("files").onchange = (e) => {
  loadFiles(e.target.files);
  e.target.value = "";
};
window.ondragover = (e) => {
  e.preventDefault();
  $("viewport").classList.add("dragover");
};
window.ondragleave = (e) => {
  if (!e.relatedTarget) $("viewport").classList.remove("dragover");
};
window.ondrop = (e) => {
  e.preventDefault();
  $("viewport").classList.remove("dragover");
  loadFiles(e.dataTransfer.files);
};
$("preset").onchange = (e) => {
  const v = e.target.value;
  settings = { ...defaults };
  palette = [...palettes.Moss];
  if (v === "classic") Object.assign(settings, { mode: "Mono", dpi: 100 });
  if (v === "amber")
    Object.assign(settings, {
      highlight: "#f9ba59",
      shadow: "#130e07",
      algorithm: "Atkinson",
      dpi: 60,
    });
  if (v === "print")
    Object.assign(settings, {
      mode: "Mono",
      algorithm: "Halftone · round",
      dpi: 180,
      angle: 45,
      patternSize: 6,
    });
  if (v === "retro") {
    Object.assign(settings, {
      mode: "Indexed",
      algorithm: "Bayer 4×4",
      dpi: 90,
      paletteName: "Nostalg-OS",
    });
    palette = [...palettes["Nostalg-OS"]];
  }
  if (v === "wave")
    Object.assign(settings, {
      algorithm: "Modulation",
      dpi: 160,
      patternSize: 7,
      highlight: "#c6bdea",
      shadow: "#151021",
    });
  sync();
  render();
};
$("reset").onclick = () => {
  settings = { ...defaults };
  palette = [...palettes.Moss];
  $("preset").value = "moss";
  sync();
  render();
};
function extract(image) {
  const c = document.createElement("canvas");
  const ratio = Math.min(1, 256 / Math.max(image.width, image.height));
  c.width = Math.max(1, Math.round(image.width * ratio));
  c.height = Math.max(1, Math.round(image.height * ratio));
  c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
  palette = extractPalette(
    c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
    settings.colorCount,
  );
  renderSwatches();
  schedule();
  toast(`Extracted ${palette.length} colors`);
}
$("extract").onclick = () => extract(images[current].image);
$("importPalette").onclick = () => $("paletteFile").click();
$("paletteFile").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (file) {
      const image = await decode(file);
      extract(image);
      image.close();
    }
  } catch (e) {
    toast(e.message);
  }
  e.target.value = "";
};
$("savePreset").onclick = async () => {
  try {
    if (
      await save(
        "dither-settings.json",
        jsonBytes({ version: 1, settings, palette }),
      )
    )
      toast("Settings saved");
  } catch (e) {
    toast(e.message);
  }
};
$("loadPreset").onclick = () => $("settingsFile").click();
function validatePreset(value) {
  if (
    value.version !== 1 ||
    !value.settings ||
    !Array.isArray(value.palette) ||
    value.palette.length < 1 ||
    value.palette.length > 64 ||
    value.palette.some((c) => !/^#[\da-f]{6}$/i.test(c))
  )
    throw Error("Invalid settings file");
  const s = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (!(key in value.settings)) continue;
    const v = value.settings[key];
    if (typeof v !== typeof defaults[key]) throw Error(`Invalid ${key}`);
    const el = $(key);
    if (
      typeof v === "number" &&
      (!Number.isFinite(v) ||
        (el?.min && v < Number(el.min)) ||
        (el?.max && v > Number(el.max)))
    )
      throw Error(`Invalid ${key}`);
    if (
      el?.tagName === "SELECT" &&
      ![...el.options].some((o) => o.value === String(v))
    )
      throw Error(`Invalid ${key}`);
    if (el?.type === "color" && !/^#[\da-f]{6}$/i.test(v))
      throw Error(`Invalid ${key}`);
    s[key] = v;
  }
  if (s.black >= s.white) throw Error("White point must exceed black point");
  return s;
}
$("settingsFile").onchange = async (e) => {
  try {
    if (!e.target.files[0]) return;
    const v = JSON.parse(await e.target.files[0].text());
    settings = validatePreset(v);
    palette = v.palette;
    sync();
    render();
    toast("Settings loaded");
  } catch (e) {
    toast(e.message);
  }
  e.target.value = "";
};
const basename = (name) =>
  name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
async function exporting(fn) {
  if (busy) return;
  busy = true;
  document
    .querySelectorAll("button,input,select")
    .forEach((e) => (e.disabled = true));
  try {
    await fn();
  } catch (e) {
    toast(`Export failed: ${e.message}`);
  } finally {
    busy = false;
    document
      .querySelectorAll("button,input,select")
      .forEach((e) => (e.disabled = false));
    $("renderStatus").textContent = "● Ready";
  }
}
$("export").onclick = () =>
  exporting(async () => {
    const item = images[current];
    $("renderStatus").textContent = "Rendering full-resolution PNG…";
    const r = await work(item.image, settings, palette, false);
    if (
      await save(
        basename(item.name) + "-dither.png",
        await pngBytes(canvasOf(r), settings.sourceDpi),
      )
    )
      toast(`Exported ${r.width} × ${r.height} PNG`);
  });
$("batch").onclick = () =>
  exporting(async () => {
    const files = {};
    for (let i = 0; i < images.length; i++) {
      $("renderStatus").textContent =
        `Rendering image ${i + 1} of ${images.length}…`;
      const r = await work(images[i].image, settings, palette, false);
      files[
        String(i + 1).padStart(4, "0") + "-" + basename(images[i].name) + ".png"
      ] = await pngBytes(canvasOf(r), settings.sourceDpi);
    }
    files["settings.json"] = jsonBytes({ version: 1, settings, palette });
    if (await save("dither-batch.zip", zip(files)))
      toast(`Exported ${images.length} images`);
  });
$("mask").onclick = () =>
  exporting(async () => {
    const r = await work(images[current].image, settings, palette, false);
    const data = new Uint8ClampedArray(r.pixels);
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.round(
        ((data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) *
          data[i + 3]) /
          255,
      );
      data.set([v, v, v, 255], i);
    }
    if (
      await save(
        basename(images[current].name) + "-mask.png",
        await pngBytes(canvasOf({ ...r, pixels: data }), settings.sourceDpi),
      )
    )
      toast("Exported grayscale mask");
  });
$("separations").onclick = () =>
  exporting(async () => {
    const item = images[current];
    $("renderStatus").textContent = "Rendering color separations…";
    const r = await work(item.image, settings, palette, false);
    let inks = paletteFor(settings, palette);
    if (settings.mode === "RGB") {
      inks = [];
      for (let a = 0; a < settings.rgbLevels; a++)
        for (let b = 0; b < settings.rgbLevels; b++)
          for (let c = 0; c < settings.rgbLevels; c++)
            inks.push(
              rgbHex(
                [a, b, c].map((v) => (v * 255) / (settings.rgbLevels - 1)),
              ),
            );
    }
    if (r.width * r.height * inks.length > 150000000)
      throw Error(
        "Too many full-resolution ink layers. Reduce the color count or image size.",
      );
    const files = {
        "composite.png": await pngBytes(canvasOf(r), settings.sourceDpi),
      },
      layers = separate(r.pixels, inks);
    for (let i = 0; i < layers.length; i++)
      files[`ink-${String(i + 1).padStart(2, "0")}-${inks[i].slice(1)}.png`] =
        await pngBytes(
          canvasOf({ ...r, pixels: layers[i] }),
          settings.sourceDpi,
        );
    files["manifest.json"] = jsonBytes({
      inks,
      dpi: settings.sourceDpi,
      width: r.width,
      height: r.height,
      settings,
    });
    if (await save(basename(item.name) + "-separations.zip", zip(files)))
      toast(`Exported ${inks.length} ink layers + composite`);
  });
$("remove").onclick = () => {
  if (images.length === 1) return toast("Keep at least one image open.");
  images[current].image.close?.();
  images.splice(current, 1);
  current = Math.min(current, images.length - 1);
  queue();
  render();
};
$("help").onclick = () => $("helpDialog").showModal();
$("closeHelp").onclick = () => $("helpDialog").close();
let heldMode = null;
window.onkeydown = (e) => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) || busy)
    return;
  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) {
      heldMode = mode;
      setMode("original");
    }
  }
  if (e.key === "0") $("fit").click();
  if (e.key === "+" || e.key === "=") $("zoomIn").click();
  if (e.key === "-") $("zoomOut").click();
  if ((e.metaKey || e.ctrlKey) && e.key === "o") {
    e.preventDefault();
    $("open").click();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    $("export").click();
  }
};
window.onkeyup = (e) => {
  if (e.code === "Space" && heldMode) {
    setMode(heldMode);
    heldMode = null;
  }
};
window.onblur = () => {
  if (heldMode) {
    setMode(heldMode);
    heldMode = null;
  }
};
window.desktop?.onAction((action) => $(action)?.click());
const demo = demoCanvas();
images.push({
  name: "Sculpted light · demo",
  image: demo,
  thumb: demo.toDataURL(),
});
sync();
queue();
render();

// Web-only adapter. The desktop shell loads the same editor without cloud code.
export async function captureProject() {
  if (busy) throw Error("Wait for the current export to finish.");
  const item = images[current],
    savedSettings = { ...settings },
    savedPalette = [...palette];
  const source = document.createElement("canvas");
  source.width = item.image.width;
  source.height = item.image.height;
  source.getContext("2d").drawImage(item.image, 0, 0);
  const sourceBytes = await pngBytes(source, savedSettings.sourceDpi);
  const result = await work(source, savedSettings, savedPalette, false);
  const outputBytes = await pngBytes(canvasOf(result), savedSettings.sourceDpi);
  return {
    name: item.name,
    source: new Blob([sourceBytes], { type: "image/png" }),
    output: new Blob([outputBytes], { type: "image/png" }),
    settings: savedSettings,
    palette: savedPalette,
    width: source.width,
    height: source.height,
  };
}
export async function openCloudProject({ file, preset }) {
  if (busy) throw Error("Wait for the current export to finish.");
  const restored = validatePreset(preset),
    image = await decode(file),
    thumb = document.createElement("canvas");
  thumb.width = 80;
  thumb.height = 80;
  thumb.getContext("2d").drawImage(image, 0, 0, 80, 80);
  images.push({ name: file.name, image, thumb: thumb.toDataURL() });
  current = images.length - 1;
  settings = restored;
  palette = [...preset.palette];
  $("preset").value = "custom";
  sync();
  queue();
  render();
}
