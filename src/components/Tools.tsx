import { useState } from 'react';
import { Globe, Smartphone, Play, Square, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ToolStatus {
  running: boolean;
  loading: boolean;
  url?: string;
  port?: number;
}

export function Tools() {
  const [webInspector, setWebInspector] = useState<ToolStatus>({
    running: false,
    loading: false,
  });

  const [appiumInspector, setAppiumInspector] = useState<ToolStatus>({
    running: false,
    loading: false,
  });

  const handleStartWebInspector = async () => {
    setWebInspector({ ...webInspector, loading: true });
    
    // Simulate starting server
    setTimeout(() => {
      setWebInspector({
        running: true,
        loading: false,
        url: 'http://localhost:9222',
        port: 9222,
      });
    }, 2000);
  };

  const handleStopWebInspector = () => {
    setWebInspector({
      running: false,
      loading: false,
    });
  };

  const handleStartAppiumInspector = async () => {
    setAppiumInspector({ ...appiumInspector, loading: true });
    
    // Simulate starting server
    setTimeout(() => {
      setAppiumInspector({
        running: true,
        loading: false,
        url: 'http://localhost:4723',
        port: 4723,
      });
    }, 2500);
  };

  const handleStopAppiumInspector = () => {
    setAppiumInspector({
      running: false,
      loading: false,
    });
  };

  const handleOpenInspector = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Tools Module</h1>
        <p className="text-slate-400">Launch and manage inspection tools for testing</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Web Inspector */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2>Web Inspector</h2>
                {webInspector.running && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Chrome DevTools Protocol inspector for web automation testing
              </p>
            </div>
          </div>

          {webInspector.loading && (
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-300">Starting Web Inspector server...</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          )}

          {webInspector.running && !webInspector.loading && (
            <div className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Server is running</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">URL:</span>
                  <span className="text-slate-200 font-mono">{webInspector.url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Port:</span>
                  <span className="text-slate-200 font-mono">{webInspector.port}</span>
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
                  onClick={() => handleOpenInspector(webInspector.url!)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Inspector
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
                <span>Debug automation scripts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Appium Inspector */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2>Mobile App Inspector</h2>
                {appiumInspector.running && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Appium Inspector for mobile application automation testing
              </p>
            </div>
          </div>

          {appiumInspector.loading && (
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                  <span className="text-sm text-slate-300">Starting Appium server...</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-teal-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          )}

          {appiumInspector.running && !appiumInspector.loading && (
            <div className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Server is running</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">URL:</span>
                  <span className="text-slate-200 font-mono">{appiumInspector.url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Port:</span>
                  <span className="text-slate-200 font-mono">{appiumInspector.port}</span>
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
                  onClick={() => handleOpenInspector(appiumInspector.url!)}
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
              <li>Click "Start Web Inspector" to launch the local server</li>
              <li>Wait for the server to initialize (usually 2-3 seconds)</li>
              <li>Click "Open Inspector" to launch Chrome DevTools in your browser</li>
              <li>Connect to your running web application to inspect elements</li>
              <li>Use the inspector to find selectors for your test automation</li>
            </ol>
          </div>
          <div>
            <h3 className="text-sm text-slate-200 mb-3">Mobile App Inspector</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Ensure you have an Android emulator or iOS simulator running</li>
              <li>Click "Start Appium Inspector" to launch the Appium server</li>
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
