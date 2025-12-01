import { useCallback, useEffect, useState } from 'react';
import { tauriUpdateService } from '../services/tauri-update-service';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  isPatchUpdate: boolean;
}

export function useUpdateManager() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (!tauriUpdateService.isTauriApp()) return;

    setIsChecking(true);
    try {
      const tauriUpdate = await tauriUpdateService.checkForUpdate();
      
      if (tauriUpdate?.available) {
        const currentVersion = tauriUpdate.currentVersion;
        const latestVersion = tauriUpdate.latestVersion || '';
        
        // Check if it's a patch update (same major.minor, different patch)
        const isPatch = isPatchUpdate(currentVersion, latestVersion);

        setUpdateInfo({
          available: true,
          currentVersion,
          latestVersion,
          isPatchUpdate: isPatch,
        });
      } else {
        setUpdateInfo(null);
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateInfo(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check on mount
    checkForUpdates();

    // Check periodically (every 30 minutes)
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return {
    updateInfo,
    isChecking,
    checkForUpdates,
  };
}

// Helper to determine if update is a patch update
function isPatchUpdate(current: string, latest: string): boolean {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^v/, '').split('-')[0].split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  };

  const curr = parseVersion(current);
  const lat = parseVersion(latest);

  // Same major.minor, different patch = patch update
  return curr.major === lat.major && 
         curr.minor === lat.minor && 
         curr.patch !== lat.patch;
}
