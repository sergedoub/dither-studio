import { copyFile } from "node:fs/promises";
for (const file of ["LICENSE", "THIRD_PARTY_NOTICES.md"])
  await copyFile(file, `dist-web/${file}`);
