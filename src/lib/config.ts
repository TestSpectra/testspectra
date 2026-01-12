import { invoke } from "@tauri-apps/api/core";

let apiUrlCache: string | null = null;

/**
 * Get API URL from Tauri backend (runtime config)
 * Priority:
 * 1. Tauri desktop: ENV variable TEST_SPECTRA_API_URL (read in Rust backend)
 * 2. Pure web build / fallback: VITE_API_URL from Vite env
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
    console.log("Falling back to VITE_API_URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
}

/**
 * Clear cache - useful if user changes config and restarts app
 */
export function clearApiUrlCache() {
  apiUrlCache = null;
}
