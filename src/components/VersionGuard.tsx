import { useEffect, useState } from 'react';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { versionService, APP_VERSION } from '../services/version-service';
import { Button } from './ui/button';

interface VersionGuardProps {
  children: React.ReactNode;
}

export function VersionGuard({ children }: VersionGuardProps) {
  const [isCompatible, setIsCompatible] = useState(true);
  const [serverVersion, setServerVersion] = useState<string>('');
  const [minClientVersion, setMinClientVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkVersion();
    
    // Start periodic version check (every 5 minutes)
    versionService.startPeriodicCheck(() => {
      checkVersion();
    }, 300000);

    return () => {
      versionService.stopPeriodicCheck();
    };
  }, []);

  const checkVersion = async () => {
    setIsChecking(true);
    try {
      const versionInfo = await versionService.checkVersion();
      setIsCompatible(versionInfo.compatible);
      setServerVersion(versionInfo.version);
      setMinClientVersion(versionInfo.minClientVersion);
    } catch (error) {
      console.error('Version check failed:', error);
      // On error, assume compatible
      setIsCompatible(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleDownload = () => {
    // For Tauri app, open download page
    if ((window as any).__TAURI__) {
      window.open('https://github.com/your-repo/releases', '_blank');
    } else {
      // For web, just reload to get latest version
      window.location.reload();
    }
  };

  // Show loading state briefly
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking version compatibility...</p>
        </div>
      </div>
    );
  }

  // Show incompatible version modal
  if (!isCompatible) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-slate-900 rounded-xl border border-red-500/50 p-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl text-center mb-4 text-red-400">
              Update Required
            </h1>

            {/* Message */}
            <div className="space-y-4 mb-6">
              <p className="text-slate-300 text-center">
                Your application version is no longer compatible with the server.
              </p>
              
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Your Version:</span>
                  <span className="text-red-400 font-mono">{APP_VERSION}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Version:</span>
                  <span className="text-green-400 font-mono">{minClientVersion}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Version:</span>
                  <span className="text-blue-400 font-mono">{serverVersion}</span>
                </div>
              </div>

              <p className="text-slate-400 text-sm text-center">
                Please update your application to continue using TestSpectra.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {(window as any).__TAURI__ ? 'Download Update' : 'Reload Application'}
              </Button>
              
              <Button
                onClick={handleReload}
                variant="outline"
                className="w-full border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-slate-500 text-center mt-6">
              This check ensures compatibility between client and server versions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Version is compatible, render children
  return <>{children}</>;
}
