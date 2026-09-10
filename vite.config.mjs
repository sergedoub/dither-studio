import { defineConfig } from "vite";
export default defineConfig({
  build: { outDir: "dist-web", emptyOutDir: true },
  worker: { format: "es" },
  plugins: [
    {
      name: "web-shell",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return html
            .replace(
              /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
              "",
            )
            .replace("STANDALONE", "WEB EDITION")
            .replace(
              "OFFLINE · NO PHOTOSHOP REQUIRED",
              "BROWSER PROCESSING · PRIVATE CLOUD LIBRARY",
            )
            .replace(
              "Your files stay on this computer.",
              "Images are processed on your device. Save to cloud uploads the original, result, and settings to your private library.",
            )
            .replace(
              "</body>",
              '<script type="module" src="/src/cloud.mjs"></script></body>',
            );
        },
      },
    },
  ],
});
