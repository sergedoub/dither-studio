# Architecture

The same vanilla-JavaScript editor powers the browser and Electron editions. No framework or server-side image processor is required.

- `src/app.mjs`: editor state, controls, imports, presets, preview orchestration, and exports.
- `src/algorithms.mjs`: diffusion kernels, ordered/procedural screens, palette extraction.
- `src/processing.mjs`: adjustment pipeline, palette mapping, pixel expansion.
- `src/worker.mjs`: disposable worker transport; superseded previews are cancelled.
- `src/export.mjs`: PNG density metadata, ZIPs, and ink separation.
- `src/demo.mjs`: original procedural demo artwork.
- `main.cjs` and `preload.cjs`: sandboxed Electron window and native save bridge.
- `web/server.mjs`: static assets, security headers, health endpoint, public cloud configuration.
- `src/cloud.mjs` and `src/cloud-store.mjs`: optional auth/library adapter, absent from desktop packages.

Vite injects the cloud adapter only into the web build. `/api/config` returns an enabled flag and, if configured, a project URL and publishable key. No privileged server key is required. The server rejects secret and service-role configuration.

Preview rendering is capped; exports render at original dimensions with explicit sampling/memory limits. ZIP output accumulates in memory. The built-in server is an asset server, not a public image-processing API.

Desktop packaging stages an explicit file allowlist before creating an ASAR archive. CI inspects the archive for expected dependencies and prohibited configuration/source directories. Keep this boundary explicit when adding files.
