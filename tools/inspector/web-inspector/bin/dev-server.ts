#!/usr/bin/env node
import { spawn, ChildProcess } from "child_process";
import * as chokidar from "chokidar";

let proxyProcess: ChildProcess | null = null;
let isRebuilding = false;

const log = (msg: string) => {
  console.log(`[DEV] ${new Date().toLocaleTimeString()} - ${msg}`);
};

const killProxy = () => {
  if (proxyProcess) {
    log("Stopping proxy server...");
    proxyProcess.kill();
    proxyProcess = null;
  }
};

const startProxy = () => {
  killProxy();
  log("Starting proxy server...");
  
  proxyProcess = spawn("node", ["./dist/bin/web-inspector.js", "__internal-server"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  proxyProcess.on("error", (err) => {
    log(`Proxy error: ${err.message}`);
  });

  proxyProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      log(`Proxy exited with code ${code}`);
    }
  });
};

const buildClient = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    log("Building client...");
    const build = spawn("pnpm", ["run", "build:client"], {
      stdio: "pipe",
      cwd: process.cwd(),
    });

    build.on("close", (code) => {
      if (code === 0) {
        log("✅ Client build complete");
        resolve();
      } else {
        log("❌ Client build failed");
        reject(new Error(`Client build failed with code ${code}`));
      }
    });
  });
};

const buildCli = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    log("Building CLI...");
    const build = spawn("pnpm", ["run", "build:cli"], {
      stdio: "pipe", 
      cwd: process.cwd(),
    });

    build.on("close", (code) => {
      if (code === 0) {
        log("✅ CLI build complete");
        resolve();
      } else {
        log("❌ CLI build failed");
        reject(new Error(`CLI build failed with code ${code}`));
      }
    });
  });
};

const rebuild = async () => {
  if (isRebuilding) return;
  isRebuilding = true;

  try {
    killProxy();
    await Promise.all([buildClient(), buildCli()]);
    startProxy();
    log("🚀 Development server restarted");
  } catch (err) {
    log(`❌ Rebuild failed: ${err}`);
  } finally {
    isRebuilding = false;
  }
};

const startDevelopment = async () => {
  log("🔧 Starting development mode...");
  
  // Initial build
  await rebuild();

  // Watch for changes
  const watcher = chokidar.watch(["src/**/*", "bin/**/*"], {
    ignored: /node_modules/,
    persistent: true,
  });

  watcher.on("change", (filePath) => {
    log(`File changed: ${filePath}`);
    rebuild();
  });

  watcher.on("add", (filePath) => {
    log(`File added: ${filePath}`);
    rebuild();
  });

  watcher.on("unlink", (filePath) => {
    log(`File deleted: ${filePath}`);
    rebuild();
  });

  log("🌐 Proxy server running on http://127.0.0.1:8888");
  log("👉 Open browser with: node ./dist/bin/web-inspector.js open [url]");
  log("Press Ctrl+C to stop");

  // Graceful shutdown
  process.on("SIGINT", () => {
    log("Shutting down...");
    killProxy();
    watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    log("Shutting down...");
    killProxy();
    watcher.close();
    process.exit(0);
  });
};

startDevelopment().catch((err) => {
  console.error("Failed to start development server:", err);
  process.exit(1);
});