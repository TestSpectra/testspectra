import * as http from "http";
import * as https from "https";
import * as tls from "tls";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

import { fileURLToPath } from "url";

export const PORT = 8888;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.join(__dirname, "../client");

// ============================================================
// 1. MIME TYPES
// ============================================================
const mimeTypes: { [key: string]: string } = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// ============================================================
// 2. GENERATE SELF-SIGNED CERTIFICATE
//    RSA 2048 + SHA-256, compatible dengan Chrome modern
// ============================================================
function generateCert(): { key: string; cert: string } {
  console.log("🔐 Generating self-signed certificate...");

  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wdio-inspector-"));
  const keyFile = path.join(tmpDir, "key.pem");
  const certFile = path.join(tmpDir, "cert.pem");

  fs.writeFileSync(keyFile, privateKey);

  execSync(
    `openssl req -new -x509 -key "${keyFile}" -out "${certFile}" ` +
      `-days 365 -subj "/CN=WDIO Inspector Proxy" ` +
      `-addext "subjectAltName=DNS:*,DNS:localhost,IP:127.0.0.1"`,
    { stdio: "pipe" },
  );

  const cert = fs.readFileSync(certFile, "utf8");
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log("✅ Certificate generated");
  return { key: privateKey, cert };
}

const { key, cert } = generateCert();

// ============================================================
// 3. SERVE STATIC FILES (inspector UI assets)
// ============================================================
function serveStaticFile(filePath: string, res: http.ServerResponse): boolean {
  if (!fs.existsSync(filePath)) return false;

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";
  const content = fs.readFileSync(filePath);

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
  return true;
}

// ============================================================
// 4. SERVE INSPECTOR HTML
//    Reads index.html from client dir, injects host info
// ============================================================
function serveInspectorHtml(
  host: string,
  protocol: string,
  res: http.ServerResponse,
): void {
  console.log(`[INSPECTOR] Serving inspector UI for ${protocol}://${host}`);

  const htmlPath = path.join(CLIENT_DIR, "index.html");
  let html = fs.existsSync(htmlPath)
    ? fs.readFileSync(htmlPath, "utf8")
    : "<h1>Inspector UI not found</h1>";

  // Inject target host into the page as a global variable
  // so app.js knows which host is being proxied
  const injection = `<script>
    window.__INSPECTOR_HOST__ = "${host}";
    window.__INSPECTOR_PROTOCOL__ = "${protocol}";
    window.__INSPECTOR_TARGET__ = "${protocol}://${host}";
  </script>`;
  html = html.replace("</head>", `${injection}\n</head>`);

  res.writeHead(200, {
    "Content-Type": "text/html",
    "Content-Security-Policy":
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
  });
  res.end(html);
}

// ============================================================
// 5. PROXY TO TARGET
// ============================================================
function proxyToTarget(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  host: string,
  protocol: string,
  cleanUrl: string,
): void {
  const targetUrl = `${protocol}://${host}${cleanUrl}`;
  console.log(`[PROXY] ${req.method} ${targetUrl}`);

  const requestOptions = {
    method: req.method,
    headers: {
      ...req.headers,
      host: host,
      "accept-encoding": "identity", // disable compression for easier handling
    },
    rejectUnauthorized: false,
  };

  const onResponse = (proxyRes: http.IncomingMessage) => {
    // Strip headers that block iframing or interfere with our proxy
    const headers = { ...proxyRes.headers } as Record<string, any>;
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    delete headers["frame-options"];
    delete headers["content-encoding"];
    delete headers["content-length"]; // will be recalculated if needed

    res.writeHead(proxyRes.statusCode || 200, headers);
    proxyRes.pipe(res);
  };

  const onError = (err: Error) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end(`Proxy Error: ${err.message}`);
    }
  };

  let proxyReq: http.ClientRequest;
  if (protocol === "https") {
    proxyReq = https.request(targetUrl, requestOptions, onResponse);
  } else {
    proxyReq = http.request(targetUrl, requestOptions, onResponse);
  }

  proxyReq.on("error", onError);
  req.pipe(proxyReq);
}

// ============================================================
// 6. HANDLE REQUEST (shared by HTTP & HTTPS)
// ============================================================
function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  host: string,
  protocol: string,
): void {
  let cleanUrl = req.url || "/";

  // Normalize absolute URLs (from HTTP proxy mode)
  if (cleanUrl.startsWith("http")) {
    const urlObj = new URL(cleanUrl);
    cleanUrl = urlObj.pathname + urlObj.search;
  }

  // ── INSPECTOR ROUTE ──────────────────────────────────────
  // Intercept /__/inspector and serve the inspector UI
  if (cleanUrl.includes("/__/inspector")) {
    serveInspectorHtml(host, protocol, res);
    return;
  }

  // ── STATIC ASSETS (from inspector UI) ───────────────────
  // Assets like style.css and app.js are relative to /__/inspector,
  // so the browser requests them as /__/style.css and /__/app.js.
  // Strip the /__/ prefix to find them in CLIENT_DIR.
  const INSPECTOR_PREFIX = "/__/";
  const assetName = cleanUrl.startsWith(INSPECTOR_PREFIX)
    ? cleanUrl.slice(INSPECTOR_PREFIX.length) // e.g. "/__/app.js" → "app.js"
    : cleanUrl.replace(/^\//, ""); // e.g. "/app.js" → "app.js"

  const staticPath = path.join(CLIENT_DIR, assetName);
  if (
    !assetName.includes("..") &&
    fs.existsSync(staticPath) &&
    fs.statSync(staticPath).isFile()
  ) {
    console.log(`[STATIC] Serving ${assetName}`);
    serveStaticFile(staticPath, res);
    return;
  }

  // ── PROXY ────────────────────────────────────────────────
  proxyToTarget(req, res, host, protocol, cleanUrl);
}

// ============================================================
// 7. BUILD THE SERVER
// ============================================================

// HTTP server — handles plain HTTP requests and CONNECT tunnels
export const server = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    const host = req.headers.host || "localhost";
    handleRequest(req, res, host, "http");
  },
);

// Handle CONNECT for HTTPS MITM
// When Chrome uses --proxy-server, HTTPS requests come as CONNECT tunnels
server.on(
  "connect",
  (req: http.IncomingMessage, clientSocket: any, head: Buffer) => {
    const [hostname, port] = (req.url || "").split(":");
    console.log(`[CONNECT] ${hostname}:${port} - Creating MITM TLS connection`);

    // Confirm tunnel is established
    clientSocket.write(
      "HTTP/1.1 200 Connection Established\r\n" +
        "Proxy-Agent: WDIO-Inspector-Proxy\r\n" +
        "\r\n",
    );

    // Wrap client socket in TLS — we are the "server" presenting our cert
    const tlsSocket = new tls.TLSSocket(clientSocket, {
      isServer: true,
      key: key,
      cert: cert,
    });

    tlsSocket.on("error", (err: Error) => {
      // Silently ignore parse errors from non-HTTP protocols (e.g. QUIC, SPDY)
      if (!err.message.includes("Parse Error")) {
        console.error(`[TLS ERROR] ${hostname}: ${err.message}`);
      }
    });

    // Spin up a mini HTTP server on top of the TLS socket so we can parse
    // normal HTTP/1.1 requests coming through the encrypted tunnel
    const internalServer = http.createServer(
      (req: http.IncomingMessage, res: http.ServerResponse) => {
        handleRequest(req, res, hostname, "https");
      },
    );

    // Feed the decrypted socket into the internal HTTP server
    internalServer.emit("connection", tlsSocket);

    if (head && head.length > 0) {
      tlsSocket.unshift(head);
    }
  },
);

server.on("error", (err: Error) => {
  console.error(`[SERVER ERROR] ${err.message}`);
});

// ============================================================
// 8. START SERVER
// ============================================================
server.listen(PORT, () => {
  console.log(`🚀 Inspector Proxy running on http://127.0.0.1:${PORT}`);
  console.log(`   Supports: HTTP & HTTPS (MITM)`);
  console.log(`   Inspector path: /__/inspector`);
});
