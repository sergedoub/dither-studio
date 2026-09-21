# Implementation and limitations

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
