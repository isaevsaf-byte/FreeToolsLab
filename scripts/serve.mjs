// Tiny static server. No cache, no network. Used by dev/preview/check/og.
//   node scripts/serve.mjs [dir] [--port N]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { c, freePort, isMain, log, ROOT, toolDirs } from "./lib.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json",
};

export function serve(dir, port) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let pathname = decodeURIComponent(url.pathname);
    let file = path.normalize(path.join(root, pathname));
    if (!file.startsWith(root)) return send(res, 403, "Forbidden");

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { Location: pathname + "/" + url.search });
        return res.end();
      }
      const index = path.join(file, "index.html");
      if (fs.existsSync(index)) file = index;
      else return send(res, 200, listing(file, pathname), "text/html; charset=utf-8");
    }
    if (!fs.existsSync(file)) {
      // repo-root dev server: root-level assets (favicons) live in public/
      const pub = path.join(root, "public", pathname);
      if (root === ROOT && fs.existsSync(pub) && fs.statSync(pub).isFile()) file = pub;
      // static-export convention: /x -> /x.html, else 404.html
      else if (fs.existsSync(file + ".html")) file = file + ".html";
      else {
        const nf = path.join(root, "404.html");
        return fs.existsSync(nf)
          ? send(res, 404, fs.readFileSync(nf), "text/html; charset=utf-8")
          : send(res, 404, "Not found");
      }
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    send(res, 200, fs.readFileSync(file), type);
  });

  return new Promise((resolve, reject) => {
    (port ? Promise.resolve(port) : freePort()).then((p) => {
      server.on("error", reject);
      server.listen(p, "127.0.0.1", () => {
        resolve({ port: p, url: `http://127.0.0.1:${p}`, close: () => new Promise((r) => server.close(r)) });
      });
    });
  });
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function listing(dir, pathname) {
  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => `<li><a href="${pathname}${d.name}${d.isDirectory() ? "/" : ""}">${d.name}${d.isDirectory() ? "/" : ""}</a></li>`)
    .join("");
  return `<!doctype html><meta charset="utf-8"><title>${pathname}</title><body style="font-family:ui-monospace,monospace;background:#0A0D14;color:#E6EAF0;padding:2rem"><h1>${pathname}</h1><ul>${items}</ul>`;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--")) || ".";
  const pi = args.indexOf("--port");
  const port = pi >= 0 ? Number(args[pi + 1]) : 4173;
  serve(dir, port).then(({ url }) => {
    log.ok(`serving ${c.cyan(path.resolve(dir))} at ${c.bold(url)}`);
    if (path.resolve(dir) === ROOT) {
      for (const slug of toolDirs()) log.info(`${url}/tools/${slug}/`);
      log.info(`site (Next.js): npm run dev:site`);
    }
  });
}
