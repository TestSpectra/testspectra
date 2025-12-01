import { getApiUrl } from '../lib/config';
import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  minClientVersion: string;
  compatible: boolean;
}

export const APP_VERSION = packageJson.version;

export class VersionService {
  private static instance: VersionService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  async checkVersion(): Promise<VersionInfo> {
    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }

      const data = await response.json();
      
      return {
        version: data.version,
        minClientVersion: data.minClientVersion || '0.1.0',
        compatible: this.isVersionCompatible(APP_VERSION, data.minClientVersion || '0.1.0'),
      };
    } catch (error) {
      console.error('Version check failed:', error);
      // If version check fails, assume compatible to avoid blocking users
      return {
        version: 'unknown',
        minClientVersion: '0.1.0',
        compatible: true,
      };
    }
  }

  private isVersionCompatible(clientVersion: string, minVersion: string): boolean {
    const parseVersion = (v: string) => {
      const parts = v.split('-')[0].split('.').map(Number);
      return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0,
      };
    };

    const client = parseVersion(clientVersion);
    const min = parseVersion(minVersion);

    // Major version must match
    if (client.major !== min.major) {
      return client.major > min.major;
    }

    // Minor version must be >= min
    if (client.minor < min.minor) {
      return false;
    }

    // If minor matches, patch must be >= min
    if (client.minor === min.minor && client.patch < min.patch) {
      return false;
    }

    return true;
  }

  startPeriodicCheck(onIncompatible: () => void, intervalMs: number = 300000) {
    // Check every 5 minutes by default
    this.stopPeriodicCheck();
    
    this.checkInterval = setInterval(async () => {
      const versionInfo = await this.checkVersion();
      if (!versionInfo.compatible) {
        onIncompatible();
      }
    }, intervalMs);
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const versionService = VersionService.getInstance();
