import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function publicConfig(env = process.env) {
  const url = env.SUPABASE_URL || "",
    key = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url && !key) return { enabled: false };
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    throw Error("SUPABASE_URL must be a Supabase HTTPS project URL");
  let valid = key.startsWith("sb_publishable_");
  if (!valid && key.split(".").length === 3) {
    try {
      valid =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role === "anon";
    } catch {}
  }
  if (!valid)
    throw Error(
      "Only a Supabase publishable or anon key may be exposed to the browser",
    );
  return { enabled: true, url, key };
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};
export function createServer({
  root = path.resolve("dist-web"),
  env = process.env,
} = {}) {
  const config = publicConfig(env),
    origin = config.enabled ? config.url : "";
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: ${origin}; connect-src 'self' ${origin}; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
    );
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }
    let route;
    try {
      route = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (route === "/api/config" || route === "/healthz") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      return res.end(
        JSON.stringify(
          route === "/api/config"
            ? config
            : { ok: true, cloudConfigured: config.enabled },
        ),
      );
    }
    if (route === "/robots.txt") {
      res.setHeader("Content-Type", "text/plain");
      return res.end("User-agent: *\nDisallow: /\n");
    }
    const relative = route === "/" ? "index.html" : route.slice(1);
    if (
      relative.includes("..") ||
      relative.startsWith(".") ||
      relative.includes("\\") ||
      relative.includes("\0")
    ) {
      res.writeHead(404);
      return res.end();
    }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(404);
      return res.end();
    }
    try {
      const info = await stat(file);
      if (!info.isFile()) throw Error();
      const data = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader(
        "Cache-Control",
        route.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
      res.setHeader("Content-Length", data.length);
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createServer();
  server.listen(Number(process.env.PORT || 4782), "0.0.0.0", () =>
    console.log("Dither Studio web server ready"),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => server.close(() => process.exit(0)));
}
