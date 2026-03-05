#!/usr/bin/env node
import { cac } from "cac";
import { spawn } from "child_process";
import * as path from "path";
import * as net from "net";
import * as fs from "fs";
import * as os from "os";

if (process.argv[2] === "__internal-server") {
  import("./proxy-server.ts");
} else {
  const cli = cac("web-inspector");
  const PROXY_PORT = 8888;
  const PID_FILE = path.join(os.tmpdir(), "web-inspector-proxy.pid");

  const isPortInUse = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", (err: any) => {
        resolve(err.code === "EADDRINUSE");
      });
      server.once("listening", () => {
        server.close();
        resolve(false);
      });
      server.listen(port);
    });
  };

  cli.command("start", "Start proxy server").action(async () => {
    if (await isPortInUse(PROXY_PORT)) {
      console.log(`ℹ️  Inspector proxy already running on port ${PROXY_PORT}`);

      const stopCommand = cli.commands.find((c) => c.name === "stop");
      stopCommand?.commandAction?.();
    }

    console.log("🚀 Starting Web Inspector Proxy Server...");

    // Spawn the cli itself with the internal server command
    const serverProcess = spawn(
      process.execPath,
      [process.argv[1], "__internal-server"],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    if (serverProcess.pid) {
      fs.writeFileSync(PID_FILE, serverProcess.pid.toString());
      serverProcess.unref();
      console.log(
        `✅ Inspector proxy started in background (PID: ${serverProcess.pid})`,
      );
    } else {
      console.error("❌ Failed to start proxy server process");
    }
  });

  cli.command("stop", "Stop proxy server").action(async () => {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8"), 10);
      try {
        process.kill(pid);
        console.log(`✅ Proxy server (PID: ${pid}) stopped.`);
      } catch (e: any) {
        console.error(
          `❌ Failed to stop server. It might not be running: ${e.message}`,
        );
      }
      fs.unlinkSync(PID_FILE);
    } else {
      // Fallback: check if something is on the port and prompt
      if (await isPortInUse(PROXY_PORT)) {
        console.log(
          `ℹ️  No PID file found, but port ${PROXY_PORT} is in use. Please kill the process manually.`,
        );
      } else {
        console.log("ℹ️  Proxy server is not running.");
      }
    }
  });

  cli
    .command("open [url]", "Open inspector with wdio")
    .action(async (url?: string) => {
      let remote;
      try {
        const wdio = await import("webdriverio");
        remote = wdio.remote;
      } catch (e) {
        console.error(
          "❌ webdriverio is not installed. Please install it using 'npm install webdriverio' to use the 'open' command.",
        );
        process.exit(1);
      }

      if (!(await isPortInUse(PROXY_PORT))) {
        console.warn(
          `⚠️  Proxy server does not seem to be running on port ${PROXY_PORT}.`,
        );
        console.warn(
          `⚠️  Run 'web-inspector start' first, or the browser won't load the inspector UI!`,
        );
      }

      const capabilities: WebdriverIO.Capabilities = {
        browserName: "chrome",
        "goog:chromeOptions": {
          excludeSwitches: ["enable-automation"],
          args: [
            `--proxy-server=http://127.0.0.1:${PROXY_PORT}`,
            "--ignore-certificate-errors",
            "--disable-web-security",
            "--allow-running-insecure-content",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-site-isolation-trials",
            "--test-type",
            "--window-size=1200,800",
          ],
        },
      };

      console.log("🌐 Opening Browser...");
      const browser = await remote({
        capabilities: capabilities,
        logLevel: "error",
      });

      // Try to center the window based on screen resolution
      try {
        const screen = await browser.execute(() => {
          return {
            width: window.screen.availWidth,
            height: window.screen.availHeight,
          };
        });
        const x = Math.max(0, Math.floor((screen.width - 1200) / 2));
        const y = Math.max(0, Math.floor((screen.height - 800) / 2));
        await browser.setWindowRect(x, y, 1200, 800);
      } catch (err) {
        // ignore if fails to center
      }

      let targetOrigin;
      try {
        if (url) {
          targetOrigin = new URL(url).origin;
        } else {
          // Default to localhost proxy directly if no URL is provided
          targetOrigin = `http://127.0.0.1:${PROXY_PORT}`;
        }
      } catch (e) {
        console.error(`❌ Invalid URL provided: ${url}`);
        process.exit(1);
      }

      const inspectorUrl = `${targetOrigin}/__/inspector`;
      console.log(`👉 Opening Inspector at: ${inspectorUrl}`);

      await browser.url(inspectorUrl);

      console.log("\n✅ Inspector Ready!");
      console.log("👉 INSTRUCTIONS:");
      console.log("1. The browser window shows the Inspector UI.");
      console.log("2. The target site is loaded in the iframe on the right.");
      console.log('3. Toggle "Inspect Mode" to enable element highlighting.');
      console.log("4. Click elements to generate WDIO selectors.");
      console.log(
        '5. Toggle "Record Mode" to record interactions as a script.',
      );
      console.log("6. Press Ctrl+C to exit.\n");

      // Keeping the process alive
      setInterval(() => {}, 1000);
    });

  cli.help();
  cli.version("0.0.1");
  cli.parse();
}
