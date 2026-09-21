# Dither Studio open-source release checklist

Prepared September 21, 2026 from the local repository. This is a release plan, not a completed security audit or verification of the current hosted service.

Goal: publish a small, understandable project that someone else can run, modify, and contribute to without access to the maintainer's accounts.

## Current baseline

- [x] Source is in a local Git repository with a lockfile.
- [x] Desktop and web entry points exist.
- [x] Algorithm and cloud/server tests exist.
- [x] README documents independent implementation and known approximations.
- [x] Environment variable example and ignore rules exist.
- [ ] Public GitHub repository and remote configured.
- [ ] Open-source license selected and included.
- [ ] Public contribution, security, and release process established.

These checked items describe files inspected, not a fresh test pass. The deployment notes record 19 tests from the earlier build; README still says 13. Cloud connection verification is recorded as pending.

## 1. Identity, license, and attribution — before publication

- [ ] Use `dither-studio` as the proposed repository name; verify the intended GitHub account and name availability.
- [ ] Choose the license deliberately. MIT is a candidate for a simple permissive project; decide whether permissive reuse matches the maintainer's intention before adding license text.
- [ ] Add `LICENSE` with the chosen standard text and correct copyright holder/year; add matching package metadata.
- [ ] Check licenses and required notices for dependencies and any redistributed assets; include applicable notices in source and desktop releases.
- [ ] Audit tracked files and Git history for third-party screenshots, artwork, fonts, copied code, and other material whose redistribution has not been established.
- [ ] Credit Dithertone Pro as inspiration and clearly state that Dither Studio is independent and unaffiliated.
- [ ] Keep public claims accurate: 41 independently implemented choices, documented approximations, no promise of proprietary algorithm equivalence or pixel-identical output.

## 2. Public repository hygiene — before publication

- [ ] Scan the full Git history and proposed release artifacts for secrets, credentials, private images, local paths, logs, and unintended personal data. Ignore rules alone are insufficient.
- [ ] Replace account-specific infrastructure instructions with portable examples. Existing Railway workspace/service IDs and project references are not passwords, but are unnecessary in the generic deployment guide.
- [ ] Keep the public demo URL only if it remains supported and accurately described.
- [ ] Ensure a new clone never points at the maintainer's cloud resources by default.
- [ ] Audit the Electron packaging file list. Its current broad source-directory packaging needs explicit exclusion of `.env` files, Git metadata, cloud configuration, and unrelated web tooling.
- [ ] Inspect both the actual desktop bundle contents and the container build context.
- [ ] Keep `private: true` in package.json unless publishing an npm package is intentional; it does not prevent open-sourcing the GitHub repository.

## 3. First-use documentation — before publication

- [ ] Rewrite the README opening for a new visitor: purpose, owned screenshot, main capabilities, supported platforms, and limitations.
- [ ] Provide separate copy-paste quickstarts for web and desktop with supported Node/npm versions.
- [ ] Verify each quickstart in a fresh temporary clone. Current `npm test` includes an HTTP test that expects `dist-web`, so document or automate the required web build first.
- [ ] Distinguish source installation from downloading a release; the current README points to an ignored local `dist/` artifact that a clone will not contain.
- [ ] Document local editing/export without an account as the default path.
- [ ] Document optional self-hosted cloud storage separately: required configuration, schema setup, authentication redirects, email delivery, storage limits, and data deletion.
- [ ] Reconcile test counts and clearly label historical verification versus checks run for the release.
- [ ] Include an owned before/after example with useful alt text. Current `docs/*.png` ignore rules need an explicit exception or a separate tracked examples directory.
- [ ] State that desktop binaries are unsigned/unnotarized unless that changes; do not advertise untested operating systems as supported.
- [ ] List known limitations, including no image-processing API yet, no PSD/video export, memory limits, and browser-dependent resampling.

## 4. Contribution and maintenance structure — before inviting contributions

- [ ] Add `CONTRIBUTING.md`: setup, file map, commands, coding conventions, meaningful tests, bug reproduction, and PR scope.
- [ ] Add `SECURITY.md` with an actual monitored private reporting route and supported versions. Avoid promising response times the maintainer cannot sustain.
- [ ] Add `CODE_OF_CONDUCT.md` with a usable enforcement contact.
- [ ] Add concise issue forms for bugs and feature requests; require app version, operating system/browser, expected/actual behavior, and a non-sensitive reproduction.
- [ ] Add a small PR template covering problem, change, verification, and UI screenshots when relevant.
- [ ] State the maintenance model: personal project, best-effort support, what contributions are welcome, and whether larger changes should be discussed first.
- [ ] Add a short roadmap separating committed work from ideas. Cloud completion and a programmatic API should not appear as shipped features.

## 5. Reproducibility and CI — before the first release

- [ ] Add GitHub Actions for clean dependency installation, web build, tests, and the chosen formatting check on PRs and the default branch.
- [ ] Run CI without production credentials, administrator keys, or access to the maintainer's cloud projects.
- [ ] Give workflow tokens only required permissions; do not execute untrusted PR code in a privileged deployment workflow.
- [ ] Add a macOS packaging smoke check and document the architecture actually tested.
- [ ] Run a dependency vulnerability review, triage findings, and configure dependency update PRs at a manageable cadence.
- [ ] Run desktop and browser smoke tests for image import, algorithm switching, transparency, presets, PNG, batch ZIP, and color separations.
- [ ] Verify exported dimensions, metadata, and representative pixels independently of the UI's success toast.
- [ ] If cloud storage is advertised as working, test authenticated save/reload, signed-out denial, cross-user isolation, and failure cleanup against a dedicated test environment.
- [ ] Otherwise label cloud integration experimental and keep local functionality fully usable.

## 6. GitHub publication and release

- [ ] Verify the signed-in GitHub identity and create the repository under the intended account.
- [ ] Publish only after the license, provenance, repository hygiene, and clean-clone gates above are complete.
- [ ] Set a useful description, relevant topics, default branch, and README links. Link the demo only after checking its current behavior.
- [ ] Enable available private vulnerability reporting and secret scanning; configure branch protections/rules appropriate for a solo maintainer without making maintenance impractical.
- [ ] Run CI on the published commit and verify clone/build instructions from the public repository URL.
- [ ] Choose a release version that reflects maturity; align tag, package version, and visible app version.
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
