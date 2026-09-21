# Release verification

Verified September 21, 2026 for the first public release. Repository: https://github.com/sergedoub/dither-studio.

## Source and reproducibility

- GitHub recognizes the MIT license. All published commit email metadata uses the maintainer's GitHub no-reply identity. A local backup of unpublished history was retained before removing private email metadata.
- Clean source installation, web build, all 19 tests, and formatting pass. `npm test` includes its prerequisite web build.
- GitHub CI passes both Linux tests and macOS packaging for the packaging fix: [run 35662255191](https://github.com/sergedoub/dither-studio/actions/runs/35662255191). Subsequent commits must also pass the same workflow.
- `npm audit` reported zero known vulnerabilities at verification time. This is a point-in-time database check, not a guarantee.
- Gitleaks 8.30.1 reported zero findings in published source history, the release source export, and the extracted application archive. Reports used redaction. These scans do not prove the absence of every possible secret.
- Runtime dependency license texts are preserved in THIRD_PARTY_NOTICES.md. The app archive also includes the MIT license and fflate's license. Electron and Chromium notices are copied from the target runtime into the `.app` resources.
- The README example is reproducible with `node scripts/generate-example.mjs`. It is original procedural artwork; no product-reference screenshots are distributed.

## Desktop and browser checks

- The newly built macOS Apple Silicon `.app` launched from its ASAR archive and rendered the demo.
- Native PNG, grayscale-mask, separation ZIP, batch ZIP, and settings exports completed.
- Independent Pillow decoding verified a 1200×1200 PNG at approximately 300 DPI with the expected two-color palette.
- Independent recomposition of exported ink layers exactly matched both the ZIP composite and the separately exported PNG.
- Grayscale mask channels and batch PNG dimensions/DPI were independently checked.
- Browser checks covered a transparent 480×320 fixture, Bayer algorithm selection, split preview, transparency, and importing settings exported by the desktop app. Settings restored Floyd–Steinberg successfully. No console warnings/errors were observed during these checks.
- The browser automation environment did not expose download events reliably, so independent file decoding used the native exports from the shared rendering/export implementation. No claim of exhaustive browser compatibility is made.
- Desktop packaging uses an explicit allowlist; `npm run verify:package` inspected 24 archive entries, required imports, prohibited directories, and runtime notices. The bundled icon matches the source icon checksum.

## Hosting and repository settings

- Docker build passed. Running the image returned HTTP 200 for `/healthz`, `/`, `/LICENSE`, and `/THIRD_PARTY_NOTICES.md`.
- The container runs as the unprivileged Node user and includes compiled web assets and the static server, not source credentials or a database administrator key.
- GitHub private vulnerability reporting, dependency alerts, secret scanning, and push protection are enabled.
- Main requires the `test` and `mac-package` checks. Force pushes and deletion are disabled; the solo repository administrator retains an emergency bypass. Normal contributions should use PRs.
- Dependency update PRs run monthly. Existing update suggestions are reviewed separately; they are not automatically merged into this release.

## Explicit limits

- Cloud storage is experimental. Live authenticated save/reload, cross-user policy enforcement, account recovery, and user-facing deletion remain follow-up work. Mocked client tests do not certify live RLS.
- The desktop release is unsigned and not notarized. Only macOS Apple Silicon packaging has been verified.
- No Photoshop plugin code or purchased assets are included. Some algorithms/effects approximate public descriptions; proprietary parity is not claimed.
- A programmatic processing API, other desktop platforms, and a managed cloud-service SLA are not included.

See the published release notes and attached checksums for the exact downloadable artifact. Source tags identify each release independently of later documentation or maintenance commits.
