import { packager } from "@electron/packager";
import { mkdtemp, cp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const root = process.cwd(),
  stage = await mkdtemp(path.join(tmpdir(), "dither-package-"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
try {
  for (const file of [
    "index.html",
    "main.cjs",
    "preload.cjs",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
  ])
    await cp(file, path.join(stage, file));
  await mkdir(path.join(stage, "src"));
  for (const file of [
    "app.mjs",
    "algorithms.mjs",
    "processing.mjs",
    "worker.mjs",
    "export.mjs",
    "export-util.mjs",
    "demo.mjs",
    "style.css",
  ])
    await cp(path.join("src", file), path.join(stage, "src", file));
  await mkdir(path.join(stage, "node_modules/fflate"), { recursive: true });
  for (const file of ["esm", "LICENSE", "package.json"])
    await cp(
      path.join("node_modules/fflate", file),
      path.join(stage, "node_modules/fflate", file),
      { recursive: true },
    );
  await writeFile(
    path.join(stage, "package.json"),
    JSON.stringify(
      {
        name: pkg.name,
        version: pkg.version,
        main: pkg.main,
        license: pkg.license,
        author: pkg.author,
      },
      null,
      2,
    ),
  );
  const result = await packager({
    dir: stage,
    name: "Dither Studio",
    platform: "darwin",
    arch: "arm64",
    out: path.join(root, "dist"),
    overwrite: true,
    prune: false,
    asar: true,
    electronVersion: pkg.devDependencies.electron,
    appBundleId: "com.serge.ditherstudio",
    icon: path.join(root, "assets/icon.icns"),
  });
  for (const directory of result) {
    for (const notice of ["LICENSE", "LICENSES.chromium.html"]) {
      await cp(
        path.join(directory, notice),
        path.join(directory, "Dither Studio.app/Contents/Resources", notice),
      );
    }
  }
  console.log(result.join("\n"));
} finally {
  await rm(stage, { recursive: true, force: true });
}
