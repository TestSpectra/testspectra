import { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { tauriUpdateService } from '../services/tauri-update-service';
import { APP_VERSION } from '../services/version-service';

interface UpdateNotificationProps {
  onDismiss?: () => void;
  forceShow?: boolean;
  isChecking?: boolean;
}

export function UpdateNotification({ onDismiss, forceShow = false, isChecking = false }: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    if (!tauriUpdateService.isTauriApp()) return;

    try {
      const updateInfo = await tauriUpdateService.checkForUpdate();
      if (updateInfo?.available) {
        setUpdateAvailable(true);
        setLatestVersion(updateInfo.latestVersion || '');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(0);

    const success = await tauriUpdateService.downloadAndInstall((progress) => {
      setUpdateProgress(progress);
    });

    if (!success) {
      setIsUpdating(false);
      // Fallback to manual download
      window.open('https://github.com/TestSpectra/testspectra/releases', '_blank');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Show if: checking, forceShow (manual check), or update available
  // Hide if: dismissed and not forced
  if (isDismissed && !forceShow) {
    return null;
  }
  
  // Only show if checking, forced, or update available
  if (!isChecking && !forceShow && !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <div className="bg-slate-900 border border-blue-500/50 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              {isChecking ? (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-200 mb-1">
                {isChecking ? 'Checking for Updates...' : updateAvailable ? 'Update Available' : 'No Updates'}
              </h3>
              <p className="text-xs text-slate-400 wrap-break-word">
                {isChecking ? 'Please wait...' : updateAvailable ? `Version ${latestVersion} is ready` : 'You are up to date'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isChecking && (
              <span className="text-xs text-slate-400 font-mono">{APP_VERSION}</span>
            )}
            {!isUpdating && !isChecking && (
              <button
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Version Info - Only show when update available */}
        {!isChecking && updateAvailable && (
          <div className="bg-slate-800/50 rounded p-2 my-3 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Current:</span>
              <span className="text-slate-300 font-mono">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Latest:</span>
              <span className="text-green-400 font-mono">{latestVersion}</span>
            </div>
          </div>
        )}

        {/* Progress Bar (when updating) */}
        {isUpdating && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Downloading...</span>
              <span>{Math.round(updateProgress)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!isChecking && updateAvailable && (
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  Update Now
                </>
              )}
            </button>
            {!isUpdating && (
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Later
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
