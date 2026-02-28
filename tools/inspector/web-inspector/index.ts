import { spawn } from "child_process";
import * as path from "path";

import * as net from "net";

(async () => {
  console.log("\n🚀 Launching Web Inspector...");

  // 1. Start the Inspector Server if not running
  const port = 8888;
  const isPortInUse = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      server.once("listening", () => {
        server.close();
        resolve(false);
      });
      server.listen(port);
    });
  };

  let serverProcess;
  if (await isPortInUse(port)) {
    console.log(`ℹ️  Inspector server already running on port ${port}`);
  } else {
    const serverPath = path.join(__dirname, "server", "index.ts");
    serverProcess = spawn("tsx", [serverPath], {
      stdio: "inherit",
      shell: true,
    });
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 2. Prepare Capabilities with Security Flags Disabled
  // const capabilities = {
  //   ...config.capabilities[0],
  //   "goog:chromeOptions": {
  //     args: [
  //       "--disable-web-security",
  //       "--disable-site-isolation-trials",
  //       "--disable-features=IsolateOrigins,site-per-process",
  //     ],
  //   },
  // };

  // // 3. Launch Browser
  // console.log("🌐 Opening Browser...");
  // const browser = await remote({
  //   capabilities: capabilities,
  //   logLevel: "error",
  // });

  // const inspectorUrl = `http://localhost:8888?url=${encodeURIComponent(
  //   config.baseUrl
  // )}`;
  // console.log(`👉 Opening Inspector at: ${inspectorUrl}`);

  // await browser.url(inspectorUrl);

  // console.log("\n✅ Inspector Ready!");
  // console.log("👉 INSTRUCTIONS:");
  // console.log("1. The browser window shows your custom Inspector UI.");
  // console.log("2. The target site is loaded in the iframe.");
  // console.log('3. Click "Inspect Mode" to toggle highlighting.');
  // console.log("4. Click elements to generate selectors.");
  // console.log("5. Press Ctrl+C to exit.\n");

  // // Keep session alive
  // // We use a long pause or debug. Debug is better as it keeps the process running.
  // await browser.debug();

  // // Cleanup
  // await browser.deleteSession();
  // if (serverProcess) {
  //   serverProcess.kill();
  // }
  // process.exit();
})();
