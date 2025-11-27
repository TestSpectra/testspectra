import { invoke } from "@tauri-apps/api/core";

let apiUrlCache: string | null = null;

/**
 * Get API URL from Tauri backend (runtime config)
 * Priority:
 * 1. ENV variable API_URL
 * 2. Config file ~/Library/Application Support/TestSpectra/config.json
 * 3. Default: https://testspectra.mrndev.me/api
 */
export async function getApiUrl(): Promise<string> {
  if (apiUrlCache) {
    return apiUrlCache;
  }
  
  try {
    apiUrlCache = await invoke<string>("get_api_url");
    return apiUrlCache;
  } catch (error) {
    console.error("Failed to get API URL from Tauri:", error);
    return import.meta.env.VITE_API_URL;
  }
}

/**
 * Clear cache - useful if user changes config and restarts app
 */
export function clearApiUrlCache() {
  apiUrlCache = null;
}
