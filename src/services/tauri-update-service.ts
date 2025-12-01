import { check, DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  body?: string;
}

export class TauriUpdateService {
  private static instance: TauriUpdateService;
  private isUpdating = false;

  private constructor() {}

  static getInstance(): TauriUpdateService {
    if (!TauriUpdateService.instance) {
      TauriUpdateService.instance = new TauriUpdateService();
    }
    return TauriUpdateService.instance;
  }

  /**
   * Check for updates from GitHub releases
   */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      // Only works in Tauri environment
      if (!(window as any).__TAURI__) {
        return null;
      }

      const update = await check();
      
      if (update) {
        return {
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          body: update.body,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Download and install update
   * @param onProgress - Callback for download progress (0-100)
   */
  async downloadAndInstall(
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    if (this.isUpdating) {
      console.warn('Update already in progress');
      return false;
    }

    try {
      this.isUpdating = true;

      const update = await check();
      
      if (update == null) {
        console.log('No update available');
        return false;
      }

      console.log(`Downloading update ${update.version}...`);

      let contentLength: number | undefined = 1

      // Download and install the update
      await update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            console.log(`Started downloading ${event.data.contentLength} bytes`);
            contentLength = event.data.contentLength;
            onProgress?.(0);
            break;
          case 'Progress':
            const progress = (event.data.chunkLength / (contentLength ?? 1)) * 100;
            console.log(`Downloaded ${event.data.chunkLength} of ${contentLength}`);
            onProgress?.(progress);
            break;
          case 'Finished':
            console.log('Download finished');
            onProgress?.(100);
            break;
        }
      });

      console.log('Update installed, restarting...');
      
      // Restart the app to apply the update
      await relaunch();
      
      return true;
    } catch (error) {
      console.error('Failed to download and install update:', error);
      return false;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Check if running in Tauri environment
   */
  isTauriApp(): boolean {
    return !!(window as any).__TAURI__;
  }
}

export const tauriUpdateService = TauriUpdateService.getInstance();
