import { listen } from "@tauri-apps/api/event";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import loaderSvg from "../assets/images/loader.svg";

interface MobileInspectorEvent {
  status: "creating-session" | "session-ready" | "error";
  payload?: any;
}

export function MobileInspector() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Preparing Appium Inspector session...",
  );
  const [error, setError] = useState<string | null>(null);
  const [inspectorUrl, setInspectorUrl] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<MobileInspectorEvent>(
        "mobile-inspector-status",
        (event) => {
          console.log("Mobile Inspector Event:", event.payload);
          const { status, payload } = event.payload;
          if (status === "session-ready") {
            const sid = payload.session_id;
            const url = `http://127.0.0.1:4723/inspector?state=${JSON.stringify(
              {
                attachSessId: sid,
              },
            )}&autoStart=1`;
            setInspectorUrl(url);
            setLoadingMessage("Loading Appium Inspector session...");
          } else if (status === "error") {
            setError(payload);
            setLoading(false);
          }
        },
      );
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 p-8 text-center text-slate-200">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-3 bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Inspector Error
        </h3>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <img src={loaderSvg} alt="Loading..." className="w-24 h-24" />
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium bg-linear-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent animate-pulse whitespace-nowrap">
                {loadingMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {inspectorUrl && (
        <iframe
          src={inspectorUrl}
          className="w-full h-full border-none flex-1 transition-opacity duration-700 ease-in-out"
          style={{ opacity: loading ? 0 : 1 }}
          title="Appium Inspector"
          onLoad={() => setLoading(false)}
        />
      )}

      {!loading && !inspectorUrl && !error && (
        <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 p-8 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mb-4 border border-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-xs font-mono text-green-500 uppercase tracking-tighter">
              Ready
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-200 mb-2">
            Inspector Ready
          </p>
          <p className="text-sm max-w-xs leading-relaxed">
            The Appium server is responsive. Please initiate a session to start
            inspecting.
          </p>
        </div>
      )}
    </div>
  );
}
