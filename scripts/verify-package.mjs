import { listPackage, extractFile } from "@electron/asar";
import { access } from "node:fs/promises";
import assert from "node:assert/strict";
const resource =
  "dist/Dither Studio-darwin-arm64/Dither Studio.app/Contents/Resources/";
const files = listPackage(resource + "app.asar").map((p) =>
  p.replace(/^\//, ""),
);
for (const file of files) {
  assert(
    !/(^|\/)(\.env[^/]*|\.git|reference|supabase|web|docs|tests|cloud\.mjs|cloud-store\.mjs|cloud\.css)(\/|$)/.test(
      file,
    ),
    `Unexpected package file: ${file}`,
  );
  assert(
    /^(src|node_modules)(\/|$)/.test(file) ||
      [
        "index.html",
        "main.cjs",
        "preload.cjs",
        "LICENSE",
        "THIRD_PARTY_NOTICES.md",
        "package.json",
      ].includes(file),
    `Not allowlisted: ${file}`,
  );
}
for (const file of [
  "index.html",
  "src/worker.mjs",
  "src/app.mjs",
  "node_modules/fflate/esm/browser.js",
  "node_modules/fflate/LICENSE",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
])
  assert(files.includes(file), `Missing ${file}`);
assert.equal(
  JSON.parse(extractFile(resource + "app.asar", "package.json")).version,
  "1.0.0",
);
await access(
  "dist/Dither Studio-darwin-arm64/Dither Studio.app/Contents/Resources/LICENSES.chromium.html",
);
console.log(
  `Verified ${files.length} archive entries, runtime dependencies, and Chromium notices.`,
);
