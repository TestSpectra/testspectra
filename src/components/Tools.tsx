import { useState } from "react";
import {
  Globe,
  Smartphone,
  Play,
  Square,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface ToolStatus {
  running: boolean;
  loading: boolean;
  opening?: boolean;
  url?: string;
  port?: number;
  error?: string;
}

interface InspectorStatus {
  running: boolean;
  url?: string;
  port?: number;
}

interface InstallProgress {
  dependency: string;
  status: string;
  progress: number;
  message: string;
}

export function Tools() {
  const [webInspector, setWebInspector] = useState<ToolStatus>({
    running: false,
    loading: false,
    opening: false,
  });
  const [installProgress, setInstallProgress] =
    useState<InstallProgress | null>(null);

  const [appiumInspector, setAppiumInspector] = useState<ToolStatus>({
    running: false,
    loading: false,
  });

  const handleStartWebInspector = async () => {
    setWebInspector({ ...webInspector, loading: true, error: undefined });
    setInstallProgress(null);

    let unlisten: (() => void) | undefined;

    try {
      unlisten = await listen<InstallProgress>("install-progress", (event) => {
        setInstallProgress(event.payload);
      });

      // Pass scope explicitly if needed, although start_web_inspector handles its own deps
      // But if start_web_inspector calls install_missing_dependencies internally without scope...
      // Wait, start_web_inspector calls check_system_dependencies and then manually calls install_webdriverio if missing.
      // It does NOT call install_missing_dependencies. So it is fine.

      const status: InspectorStatus = await invoke("start_web_inspector");
      setWebInspector({
        running: status.running,
        loading: false,
        opening: false,
        url: status.url,
        port: status.port,
        error: undefined,
      });
    } catch (error) {
      console.error("Failed to start web inspector:", error);
      setWebInspector({
        ...webInspector,
        loading: false,
        error:
          typeof error === "string" ? error : "Failed to start web inspector",
      });
    } finally {
      if (unlisten) {
        unlisten();
      }
      setInstallProgress(null);
    }
  };

  const handleStopWebInspector = async () => {
    try {
      const status: InspectorStatus = await invoke("stop_web_inspector");
      setWebInspector({
        running: status.running,
        loading: false,
        opening: false,
        url: status.url,
        port: status.port,
      });
    } catch (error) {
      console.error("Failed to stop web inspector:", error);
    }
  };

  const handleOpenInspectorWindow = async () => {
    setWebInspector((prev) => ({ ...prev, opening: true }));
    try {
      await invoke("open_inspector_browser");
    } catch (error) {
      console.error("Failed to open inspector browser:", error);
      // Fallback to opening URL directly
      if (webInspector.url) {
        window.open(webInspector.url, "_blank");
      }
    } finally {
      setWebInspector((prev) => ({ ...prev, opening: false }));
    }
  };

  const handleOpenInspector = (url: string) => {
    window.open(url, "_blank");
  };

  const handleStartAppiumInspector = async () => {
    setAppiumInspector({ ...appiumInspector, loading: true, error: undefined });
    setInstallProgress({
      progress: 0.1,
      status: "checking",
      dependency: "Appium",
      message: "Starting Appium server...",
    });

    let unlisten: (() => void) | undefined;

    try {
      unlisten = await listen<InstallProgress>("install-progress", (event) => {
        setInstallProgress(event.payload);
      });

      const status: InspectorStatus = await invoke("start_appium_server");
      setAppiumInspector({
        running: status.running,
        loading: false,
        url: status.url,
        port: status.port,
        error: undefined,
      });
    } catch (error) {
      console.error("Failed to start Appium server:", error);
      setAppiumInspector({
        ...appiumInspector,
        loading: false,
        error:
          typeof error === "string" ? error : "Failed to start Appium server",
      });
    } finally {
      if (unlisten) {
        unlisten();
      }
      setInstallProgress(null);
    }
  };

  const handleStopAppiumInspector = async () => {
    try {
      await invoke("stop_appium_server");
      setAppiumInspector({
        running: false,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to stop Appium server:", error);
    }
  };

  const handleOpenAppiumInspectorWindow = async () => {
    try {
      await invoke("open_mobile_inspector_window");
    } catch (error) {
      console.error("Failed to open mobile inspector window:", error);
    }
  };

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Tools Module</h1>
        <p className="text-slate-400">
          Launch and manage inspection tools for testing
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Web Inspector */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2>Web Inspector</h2>
                {webInspector.running && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/30 border"
                  >
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Chrome DevTools Protocol inspector for web automation testing
              </p>
            </div>
          </div>

          {(webInspector.loading ||
            (installProgress &&
              installProgress.dependency === "WebDriverIO")) && (
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-300">
                    {installProgress
                      ? installProgress.message
                      : "Starting Web Inspector..."}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: installProgress
                        ? `${Math.max(5, installProgress.progress * 100)}%`
                        : "60%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {webInspector.error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3">
              <div className="text-red-400 mt-0.5">⚠️</div>
              <div className="text-sm text-red-200">{webInspector.error}</div>
            </div>
          )}

          {webInspector.running && !webInspector.loading && (
            <div className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">
                  Server is running
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">URL:</span>
                  <span className="text-slate-200 font-mono">
                    {webInspector.url}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Port:</span>
                  <span className="text-slate-200 font-mono">
                    {webInspector.port}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!webInspector.running && !webInspector.loading && (
              <Button
                onClick={handleStartWebInspector}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Web Inspector
              </Button>
            )}

            {webInspector.running && !webInspector.loading && (
              <>
                <Button
                  onClick={handleOpenInspectorWindow}
                  disabled={webInspector.opening}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {webInspector.opening ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  {webInspector.opening
                    ? "Opening Browser..."
                    : "Open Inspector"}
                </Button>
                <Button
                  onClick={handleStopWebInspector}
                  variant="outline"
                  className="w-full border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Server
                </Button>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <h3 className="text-sm mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Inspect web elements in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Generate reliable selectors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Record interactions as WebDriverIO scripts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Cross-origin navigation support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Appium Inspector */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2>Mobile App Inspector</h2>
                {appiumInspector.running && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/30 border"
                  >
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Appium Inspector for mobile application automation testing
              </p>
            </div>
          </div>

          {(appiumInspector.loading ||
            (installProgress &&
              (installProgress.dependency === "Appium" ||
                installProgress.dependency === "Appium Inspector Plugin"))) && (
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                  <span className="text-sm text-slate-300">
                    {installProgress
                      ? installProgress.message
                      : "Starting Appium server..."}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: installProgress
                        ? `${Math.max(5, installProgress.progress * 100)}%`
                        : "60%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {appiumInspector.running && !appiumInspector.loading && (
            <div className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">
                  Server is running
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">URL:</span>
                  <span className="text-slate-200 font-mono">
                    {appiumInspector.url}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Port:</span>
                  <span className="text-slate-200 font-mono">
                    {appiumInspector.port}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!appiumInspector.running && !appiumInspector.loading && (
              <Button
                onClick={handleStartAppiumInspector}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Appium Inspector
              </Button>
            )}

            {appiumInspector.running && !appiumInspector.loading && (
              <>
                <Button
                  onClick={handleOpenAppiumInspectorWindow}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Inspector
                </Button>
                <Button
                  onClick={handleStopAppiumInspector}
                  variant="outline"
                  className="w-full border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Server
                </Button>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <h3 className="text-sm mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Inspect iOS and Android apps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Record mobile interactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Generate mobile test scripts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="mb-4">Using the Inspectors</h2>
        <div className="grid grid-cols-2 gap-6 text-sm text-slate-400">
          <div>
            <h3 className="text-sm text-slate-200 mb-3">Web Inspector</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Click "Start Web Inspector" to launch the proxy server</li>
              <li>Wait for the server to initialize (usually 1-2 seconds)</li>
              <li>Click "Open Inspector" to launch Chrome with WebDriver</li>
              <li>Enter a URL to start inspecting elements</li>
              <li>Use inspect mode to generate selectors</li>
            </ol>
          </div>
          <div>
            <h3 className="text-sm text-slate-200 mb-3">
              Mobile App Inspector
            </h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>
                Ensure you have an Android emulator or iOS simulator running
              </li>
              <li>
                Click "Start Appium Inspector" to launch the Appium server
              </li>
              <li>Wait for the server to be ready</li>
              <li>Click "Open Inspector" to launch the Appium Inspector UI</li>
              <li>Configure your desired capabilities and start the session</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
