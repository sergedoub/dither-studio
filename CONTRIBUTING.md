# Contributing

Dither Studio is a personal project maintained by @sergedoub on a best-effort basis. Bug fixes, accessible controls, reproducible algorithm corrections, and documentation improvements are welcome. Discuss larger features in an issue first; the roadmap is not a delivery commitment.

## Setup

Use Node 22.12+ within the Node 22 line. Run `npm ci`, then `npm start` for Electron or `npm run dev:web` for Vite. The desktop build currently targets macOS Apple Silicon. For production web behavior use `npm run build:web && npm run start:web`.

Before submitting a change:

```sh
npm test
npm run format:check
```

Use `npm run format` to apply formatting. For desktop packaging changes also run `npm run package && npm run verify:package`. CI must not require cloud credentials. Optional cloud work needs a separate test project and evidence for signed-out and cross-user denial before being advertised as production-ready.

## Changes

Keep modules focused and use the existing vanilla JavaScript/ES module style. See [architecture](docs/architecture.md). Add meaningful regression tests for algorithm, export, security, and failure-handling changes. Do not replace expected output with implementation-generated expectations. Include screenshots for visual changes and independently inspect representative exports.

Describe the problem, resulting behavior, and verification in each PR. Keep unrelated changes separate. Use short commit subjects such as `fix: preserve alpha in export`. Contributions are made under the repository's MIT license; do not submit code or images you lack permission to distribute. AI-assisted contributions are welcome and have the same review, provenance, and testing requirements as other contributions.

For bug reports include version/commit, browser or OS, reproduction steps, and expected versus actual behavior. Use a synthetic or redistributable sample; never upload private customer images, access tokens, or credentials. Security reports belong in the private channel described in SECURITY.md.
