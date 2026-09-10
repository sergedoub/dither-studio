# Dither Studio

An offline standalone macOS image-dithering app inspired by the public Dithertone Pro panel. Open `dist/Dither Studio-darwin-arm64/Dither Studio.app`. No Photoshop, Node installation, account, or server is needed to run the packaged app.

## Using the app

1. Open or drop PNG, JPEG, WebP, BMP, or GIF images. GIF imports use the first frame.
2. Pick an algorithm and Mono, Tonal, Indexed, or RGB mode.
3. Tune the sampling scale, levels, sharpening, denoise, blur, ink colors, and edge treatment.
4. Export a full-resolution PNG, grayscale mask, separated ink ZIP, or batch ZIP.

Dither DPI controls sampling relative to Source DPI. At 72/300, a 1200-pixel image is dithered on a 288-pixel grid and expanded back to 1200 pixels. Source DPI is a manual print-density setting; imported metadata is not auto-detected. Exports embed PNG pHYs metadata. Preview is capped at 1000 pixels and is an approximation of the final full-resolution render.

Indexed mode supports built-in palettes, individual color editing, and median-cut extraction of up to 64 colors from the current image or another local image. “Extract colors” controls the next extraction; solid-color images may yield fewer colors. RGB supports 2–4 levels per channel (8–64 colors). Settings can be saved and loaded as JSON.

Remove the demo from the queue before exporting a batch if you do not want it included. Numbered image sequences are supported as ordinary batch inputs; filenames in the exported ZIP are prefixed in queue order.

Shortcuts: Command-O open, Command-S export, Space temporarily show original, plus/minus zoom, zero fit. The split-view divider can be dragged.

## Faithfulness and limits

The boxed control groups, live effects, four rendering modes, palettes, DPI scaling, transparency, and separated output follow the public product reference. This is an independent implementation, with separate branding and original demo artwork. No plugin code or purchased assets were used. Reference files are excluded from the app bundle.

The public feature list advertises 40+ algorithms but only explicitly names Floyd–Steinberg, Bayer, and Modulation. This app implements 41 choices independently; it does not claim the same complete proprietary algorithm roster or pixel-identical output.

- Twelve conventional error-diffusion kernels and five dispersed Bayer matrix sizes.
- Twenty-four other threshold/pattern choices, including round/diamond/square/ellipse halftones, line screens, modulation, noise, grids, and threshold.
- Modulation and procedural patterns are visual approximations, not reverse-engineered implementations.
- Denoise is a low-contrast selective blur. Blur is a box filter; sharpening is an unsharp mask. Bleed is morphology; rounding softens edges. These differ from undocumented plugin internals.
- Nearest neighbor and browser low/high-quality smoothing implement resampling; the high-quality “Bicubic” setting is browser-controlled and not guaranteed to match Photoshop's bicubic filter.
- Screen angle affects ordered and pattern algorithms. Serpentine scan affects diffusion algorithms. Tonal midtones are used only with three-color mapping.
- Transparency removes the first palette ink (black in RGB). Original alpha is retained, subject to sampling/edge treatment.
- Separation ZIPs contain colored transparent PNG layers, a composite, and manifest. Hard palette layers recompose exactly. Rounded/interpolated colors are assigned to the nearest ink. These are RGB spot-color assets, not ICC-managed CMYK press files or layered PSDs.
- No Photoshop layer stack, editable PSD, native video timeline, or video codec export. Export a frame sequence externally and use batch mode for animation frames.
- Input images are limited to 40 megapixels; sampling and multi-ink exports have additional memory limits. Large batches accumulate their ZIP in memory.
- macOS Apple Silicon build only has been packaged and tested. It is a local development build, not Developer ID signed/notarized for public distribution.

## Development

The browser edition and dedicated Railway/Supabase infrastructure are documented in [Web deployment](docs/WEB-DEPLOYMENT.md). Build it with `npm run build:web`, then run `npm run start:web`. Cloud saves are optional; image processing stays in the browser.

```sh
npm ci
npm start
npm test
npm run package
```

Electron shell uses a sandboxed renderer, context isolation, a restricted preload bridge and a native save dialog. Processing happens in disposable local Web Workers; superseded previews are cancelled. The desktop edition uses no network services.

- `src/algorithms.mjs`: diffusion kernels, ordered screens, palette extraction
- `src/processing.mjs`: image adjustments, palette mapping, pixel expansion
- `src/worker.mjs`: worker transport
- `src/app.mjs`: editor UI and import/export orchestration
- `src/export.mjs`: PNG density metadata, ZIPs, ink separation
- `main.cjs` / `preload.cjs`: desktop window and save bridge
- `tests/engine.test.mjs`: processing regression tests

## Verification

13 tests pass: all 41 algorithms, known diffusion output, Bayer matrix ranks/order, monotonic tonal patterns, RGB quantization, zero dither amount, alpha, palette extraction, identity adjustments, pixel expansion, separated layers, and PNG DPI checksums.

Native UI verification covered opening a transparent color fixture, PNG export, two-image batch export, and separation ZIP export. Saved files were decoded independently: original dimensions, approximately 300 DPI, transparency and pixel-exact recomposition of hard-ink layers passed. Browser UI checks covered palette extraction, RGB controls, and split comparison.

## References

- [Dithertone Pro product page](https://www.doronsupply.com/product/dithertone-pro)
- [Public panel screenshot](https://cdn.shopify.com/s/files/1/0553/3469/9198/files/aLi-rWGNHVfTOnyJ_DTP3G1.webp?v=1767738677)
- [Electron packaging documentation](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
