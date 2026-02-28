import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const PORT = 8888;
const CLIENT_DIR = path.join(__dirname, "..", "client");

// Store the last proxied target URL for resources without referer
let lastTargetUrl: string | null = null;

const mimeTypes: { [key: string]: string } = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const reqUrl = req.url || "";
  console.log(`request ${reqUrl}`);

  // Proxy Handler
  if (reqUrl.startsWith("/proxy")) {
    const query = url.parse(reqUrl, true).query;
    const targetUrl = query.url as string;

    if (!targetUrl) {
      res.writeHead(400);
      res.end("Missing url parameter");
      return;
    }

    // Store this as the last target URL for resources without referer
    lastTargetUrl = targetUrl;

    const parsedTarget = url.parse(targetUrl);
    const protocol = parsedTarget.protocol === "https:" ? https : http;

    const proxyReq = protocol.request(
      targetUrl,
      {
        headers: {
          ...req.headers,
          host: parsedTarget.host || undefined,
          referer: targetUrl,
          "accept-encoding": "identity", // Request uncompressed content
        },
      },
      (proxyRes) => {
        // Strip blocking headers
        const headers = { ...proxyRes.headers };
        delete headers["x-frame-options"];
        delete headers["content-security-policy"];
        delete headers["frame-options"];
        delete headers["content-encoding"];
        delete headers["content-length"]; // Will be recalculated

        const contentType = proxyRes.headers["content-type"] || "";

        // For HTML, we need to rewrite URLs to go through the proxy
        if (contentType.includes("text/html")) {
          let body = "";
          proxyRes.on("data", (chunk) => {
            body += chunk.toString();
          });

          proxyRes.on("end", () => {
            // Don't inject base tag as it causes infinite loops
            // Instead, the browser's security settings (--disable-web-security)
            // will allow cross-origin resource loading

            res.writeHead(proxyRes.statusCode || 200, {
              ...headers,
              "content-length": Buffer.byteLength(body),
            });
            res.end(body);
          });
        } else {
          // For non-HTML, just pipe through
          res.writeHead(proxyRes.statusCode || 200, headers);
          proxyRes.pipe(res);
        }
      }
    );

    proxyReq.on("error", (err) => {
      console.error("Proxy Error:", err);
      res.writeHead(500);
      res.end(`Proxy Error: ${err.message}`);
    });

    req.pipe(proxyReq);
    return;
  }

  // Static File Handler
  const parsedUrl = new URL(reqUrl, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  if (pathname === "/") {
    pathname = "index.html";
  }

  let filePath = path.join(CLIENT_DIR, pathname);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(
    filePath,
    (error: NodeJS.ErrnoException | null, content: Buffer) => {
      if (error) {
        if (error.code === "ENOENT") {
          // File not found locally - try to proxy it from the target site
          const refererHeader = req.headers.referer || req.headers.referrer;
          const referer = Array.isArray(refererHeader)
            ? refererHeader[0]
            : refererHeader;
          const isResourceRequest =
            /\.(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(
              pathname
            );

          console.log(`File not found: ${pathname}`);
          console.log(`Referer: ${referer}`);
          console.log(`Is resource request: ${isResourceRequest}`);

          // Try to proxy if it's a resource request and we have either a referer or a stored target URL
          if (
            isResourceRequest &&
            (referer?.includes("localhost:8888") || lastTargetUrl)
          ) {
            let targetUrl: string | null = null;

            if (referer && referer.includes("localhost:8888")) {
              try {
                const refererUrl = new URL(referer);
                targetUrl = refererUrl.searchParams.get("url");

                if (!targetUrl && referer.includes("/proxy?url=")) {
                  const proxyMatch = referer.match(/\/proxy\?url=([^&]+)/);
                  if (proxyMatch) {
                    targetUrl = decodeURIComponent(proxyMatch[1]);
                  }
                }
              } catch (e) {
                console.error("Error parsing referer:", e);
              }
            }

            // Fallback to last target URL if we couldn't extract from referer
            if (!targetUrl && lastTargetUrl) {
              targetUrl = lastTargetUrl;
              console.log(`Using fallback target URL: ${targetUrl}`);
            }

            if (targetUrl) {
              const parsedTarget = url.parse(targetUrl);
              const resourceUrl = `${parsedTarget.protocol}//${parsedTarget.host}${pathname}`;

              console.log(`Proxying resource: ${resourceUrl}`);

              const protocol =
                parsedTarget.protocol === "https:" ? https : http;
              const proxyReq = protocol.request(
                resourceUrl,
                {
                  headers: {
                    ...req.headers,
                    host: parsedTarget.host || undefined,
                    referer: targetUrl,
                  },
                },
                (proxyRes) => {
                  res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                  proxyRes.pipe(res);
                }
              );

              proxyReq.on("error", (err) => {
                console.error("Resource proxy error:", err);
                res.writeHead(404);
                res.end("Resource not found");
              });

              proxyReq.end();
              return;
            }
          }

          res.writeHead(404);
          res.end("File not found");
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content, "utf-8");
      }
    }
  );
});

server.listen(PORT, () => {
  console.log(`Inspector Server running at http://localhost:${PORT}/`);
});
