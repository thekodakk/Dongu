"use strict";

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PORT = 5187;
const HOST = "127.0.0.1";
const APP = "dongu-local-v1";
const ADDRESS = `http://${HOST}:${PORT}`;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function probeIdentity(port = PORT) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const req = http.get(
      {
        hostname: HOST,
        port,
        path: "/__dongu_health",
        timeout: 1500,
        agent: false,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
          if (body.length > 4096) {
            done("other");
            req.destroy();
          }
        });
        res.on("end", () => {
          try {
            done(
              res.statusCode === 200 && JSON.parse(body).app === APP
                ? "dongu"
                : "other",
            );
          } catch {
            done("other");
          }
        });
        res.on("error", () => done("other"));
      },
    );
    req.on("timeout", () => {
      done("other");
      req.destroy();
    });
    req.on("error", (error) =>
      done(error.code === "ECONNREFUSED" ? "free" : "other"),
    );
  });
}

function createServer(directory) {
  const root = path.resolve(directory);
  const inside = (file) => file === root || file.startsWith(root + path.sep);
  return http.createServer(async (req, res) => {
    const reply = (status, body, type = "text/plain; charset=utf-8") => {
      res.writeHead(status, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    };
    if (!["GET", "HEAD"].includes(req.method)) {
      reply(405, "Method not allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      reply(400, "Invalid URL");
      return;
    }
    if (pathname === "/__dongu_health") {
      reply(200, JSON.stringify({ app: APP }), MIME[".json"]);
      return;
    }
    if (
      pathname.includes("\0") ||
      pathname.includes(":") ||
      pathname.split(/[\\/]/).includes("..")
    ) {
      reply(403, "Forbidden");
      return;
    }
    let file = path.resolve(root, "." + pathname.replaceAll("\\", "/"));
    if (!inside(file)) {
      reply(403, "Forbidden");
      return;
    }
    try {
      let stat;
      try {
        stat = await fsp.stat(file);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (stat?.isDirectory()) file = path.join(file, "index.html");
      else if (!stat) {
        if (path.extname(pathname)) {
          reply(404, "Not found");
          return;
        }
        file = path.join(root, "index.html");
      }
      const realFile = await fsp.realpath(file);
      if (!inside(realFile)) {
        reply(403, "Forbidden");
        return;
      }
      const data = await fsp.readFile(realFile);
      reply(
        200,
        data,
        MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      );
    } catch (error) {
      reply(
        error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 500,
        "File unavailable",
      );
    }
  });
}

function openBrowser() {
  const child = spawn(
    "rundll32.exe",
    ["url.dll,FileProtocolHandler", ADDRESS],
    { windowsHide: true, detached: true, stdio: "ignore" },
  );
  child.on("error", (error) =>
    reportError(
      `Tarayici acilamadi. ${ADDRESS} adresini tarayicinizda acin. ${error.message}`,
    ),
  );
  child.unref();
}

function reportError(message) {
  try {
    fs.appendFileSync(
      path.join(__dirname, ".dongu-server.log"),
      `${new Date().toISOString()} ${message}\n`,
    );
  } catch {}
  const script =
    '$null = Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($env:DONGU_ERROR, "Dongu", "OK", "Error")';
  const child = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-Command",
      script,
    ],
    {
      windowsHide: true,
      detached: true,
      stdio: "ignore",
      env: { ...process.env, DONGU_ERROR: message },
    },
  );
  child.on("error", () => {});
  child.unref();
}

async function launch() {
  const identity = await probeIdentity();
  if (identity === "dongu") {
    openBrowser();
    return;
  }
  if (identity === "other") {
    reportError(
      "5187 numarali port baska bir uygulama tarafindan kullaniliyor. O uygulamayi kapatip Dongu kisayolunu yeniden acin.",
    );
    return;
  }
  const directory = path.join(__dirname, "dist");
  if (!fs.existsSync(path.join(directory, "index.html"))) {
    reportError(
      "Uygulama dosyalari bulunamadi: dist/index.html. Proje klasorunu ve derleme dosyalarini kontrol edin.",
    );
    return;
  }
  const server = createServer(directory);
  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE" && (await probeIdentity()) === "dongu")
      openBrowser();
    else reportError(`Dongu baslatilamadi: ${error.message}`);
  });
  server.listen(PORT, HOST, openBrowser);
}

module.exports = { createServer, probeIdentity };
if (require.main === module)
  launch().catch((error) => reportError(error.message));
