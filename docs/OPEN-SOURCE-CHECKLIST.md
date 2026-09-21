# Dither Studio open-source release checklist

Release preparation record, September 21, 2026. Checked items were completed for the public release; verification evidence and explicit limitations are in [release verification](release-verification.md). This is not a claim of a comprehensive security audit or live cloud certification.

Goal: publish a small, understandable project that someone else can run, modify, and contribute to without access to the maintainer's accounts.

## Current baseline

- [x] Source is in a local Git repository with a lockfile.
- [x] Desktop and web entry points exist.
- [x] Algorithm and cloud/server tests exist.
- [x] README documents independent implementation and known approximations.
- [x] Environment variable example and ignore rules exist.
- [x] Public GitHub repository and remote configured.
- [x] Open-source license selected and included.
- [x] Public contribution, security, and release process established.

The current build has 19 passing tests. Optional cloud integration is explicitly experimental. No hosted-service availability or authenticated cloud verification is claimed.

## 1. Identity, license, and attribution — before publication

- [x] Use `dither-studio` as the proposed repository name; verify the intended GitHub account and name availability.
- [x] Choose the license deliberately. MIT is a candidate for a simple permissive project; decide whether permissive reuse matches the maintainer's intention before adding license text.
- [x] Add `LICENSE` with the chosen standard text and correct copyright holder/year; add matching package metadata.
- [x] Check licenses and required notices for dependencies and any redistributed assets; include applicable notices in source and desktop releases.
- [x] Audit tracked files and Git history for third-party screenshots, artwork, fonts, copied code, and other material whose redistribution has not been established.
- [x] Credit Dithertone Pro as inspiration and clearly state that Dither Studio is independent and unaffiliated.
- [x] Keep public claims accurate: 41 independently implemented choices, documented approximations, no promise of proprietary algorithm equivalence or pixel-identical output.

## 2. Public repository hygiene — before publication

- [x] Scan the full Git history and proposed release artifacts for secrets, credentials, private images, local paths, logs, and unintended personal data. Ignore rules alone are insufficient.
- [x] Replace account-specific infrastructure instructions with portable examples. Existing Railway workspace/service IDs and project references are not passwords, but are unnecessary in the generic deployment guide.
- [x] Keep the public demo URL only if it remains supported and accurately described.
- [x] Ensure a new clone never points at the maintainer's cloud resources by default.
- [x] Audit the Electron packaging file list. Its current broad source-directory packaging needs explicit exclusion of `.env` files, Git metadata, cloud configuration, and unrelated web tooling.
- [x] Inspect both the actual desktop bundle contents and the container build context.
- [x] Keep `private: true` in package.json unless publishing an npm package is intentional; it does not prevent open-sourcing the GitHub repository.

## 3. First-use documentation — before publication

- [x] Rewrite the README opening for a new visitor: purpose, owned screenshot, main capabilities, supported platforms, and limitations.
- [x] Provide separate copy-paste quickstarts for web and desktop with supported Node/npm versions.
- [x] Verify each quickstart in a fresh temporary clone. Current `npm test` includes an HTTP test that expects `dist-web`, so document or automate the required web build first.
- [x] Distinguish source installation from downloading a release; the current README points to an ignored local `dist/` artifact that a clone will not contain.
- [x] Document local editing/export without an account as the default path.
- [x] Document optional self-hosted cloud storage separately: required configuration, schema setup, authentication redirects, email delivery, storage limits, and data deletion.
- [x] Reconcile test counts and clearly label historical verification versus checks run for the release.
- [x] Include an owned before/after example with useful alt text. Current `docs/*.png` ignore rules need an explicit exception or a separate tracked examples directory.
- [x] State that desktop binaries are unsigned/unnotarized unless that changes; do not advertise untested operating systems as supported.
- [x] List known limitations, including no image-processing API yet, no PSD/video export, memory limits, and browser-dependent resampling.

## 4. Contribution and maintenance structure — before inviting contributions

- [x] Add `CONTRIBUTING.md`: setup, file map, commands, coding conventions, meaningful tests, bug reproduction, and PR scope.
- [x] Add `SECURITY.md` with an actual monitored private reporting route and supported versions. Avoid promising response times the maintainer cannot sustain.
- [x] Add `CODE_OF_CONDUCT.md` with a usable enforcement contact.
- [x] Add concise issue forms for bugs and feature requests; require app version, operating system/browser, expected/actual behavior, and a non-sensitive reproduction.
- [x] Add a small PR template covering problem, change, verification, and UI screenshots when relevant.
- [x] State the maintenance model: personal project, best-effort support, what contributions are welcome, and whether larger changes should be discussed first.
- [x] Add a short roadmap separating committed work from ideas. Cloud completion and a programmatic API should not appear as shipped features.

## 5. Reproducibility and CI — before the first release

- [x] Add GitHub Actions for clean dependency installation, web build, tests, and the chosen formatting check on PRs and the default branch.
- [x] Run CI without production credentials, administrator keys, or access to the maintainer's cloud projects.
- [x] Give workflow tokens only required permissions; do not execute untrusted PR code in a privileged deployment workflow.
- [x] Add a macOS packaging smoke check and document the architecture actually tested.
- [x] Run a dependency vulnerability review, triage findings, and configure dependency update PRs at a manageable cadence.
- [x] Run desktop and browser smoke tests for image import, algorithm switching, transparency, presets, PNG, batch ZIP, and color separations.
- [x] Verify exported dimensions, metadata, and representative pixels independently of the UI's success toast.
- Not applicable to the production feature set: live cloud authentication/isolation remains unverified and the adapter is explicitly experimental, with local editing fully usable.
- [x] Otherwise label cloud integration experimental and keep local functionality fully usable.

## 6. GitHub publication and release

- [x] Verify the signed-in GitHub identity and create the repository under the intended account.
- [x] Publish only after the license, provenance, repository hygiene, and clean-clone gates above are complete.
- [x] Set a useful description, relevant topics, default branch, and README links. Link the demo only after checking its current behavior.
- [x] Enable available private vulnerability reporting and secret scanning; configure branch protections/rules appropriate for a solo maintainer without making maintenance impractical.
- [x] Run CI on the published commit and verify clone/build instructions from the public repository URL.
- [x] Choose a release version that reflects maturity; align tag, package version, and visible app version.
- [ ] Create release notes with capabilities, known issues, supported platform/architecture, and signing status.
- [ ] If distributing binaries, attach builds from the tagged source and checksums. Do not silently reuse an older local binary.
- [ ] Verify release download links and ensure no account-specific configuration is bundled.

## Suggested structure

Keep the current source layout; publishing does not require a framework rewrite or monorepo.

```text
.github/
  workflows/ci.yml
  ISSUE_TEMPLATE/bug.yml
  ISSUE_TEMPLATE/feature.yml
  pull_request_template.md
  dependabot.yml
LICENSE
README.md
CONTRIBUTING.md
SECURITY.md
CODE_OF_CONDUCT.md
CHANGELOG.md
.env.example
docs/
  architecture.md
  self-hosting.md
  roadmap.md
  OPEN-SOURCE-CHECKLIST.md
examples/                 # Owned, redistributable example images
src/                      # Existing editor and processing engine
web/                      # Existing static server
supabase/migrations/      # Existing optional cloud schema
tests/
main.cjs
preload.cjs
Dockerfile
package.json
package-lock.json
```

## Scope for the first public version

Ship the working local web/desktop editor with clear limitations, a license, reproducible setup, basic CI, and a practical contribution path. A public API, additional platforms, signed installers, and a fully operated cloud service can follow independently. Do not promise a support SLA or add a contributor license agreement, plugin architecture, or elaborate governance without a concrete need.
