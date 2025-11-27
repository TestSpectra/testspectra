use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[tauri::command]
fn get_api_url(app: AppHandle) -> String {
  // 1. Try to read from ENV variable
  if let Ok(url) = std::env::var("API_URL") {
    return url;
  }

  // 2. Try to read from config file
  if let Some(config_path) = get_config_file_path(&app) {
    if let Ok(content) = std::fs::read_to_string(&config_path) {
      if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(api_url) = json.get("api_url").and_then(|v| v.as_str()) {
          return api_url.to_string();
        }
      }
    }
  }

  // 3. Fallback to default from ENV or hardcoded
  if let Ok(url) = std::env::var("API_URL") {
    return url;
  }
  "".to_string()
}

fn get_config_file_path(app: &tauri::AppHandle) -> Option<PathBuf> {
  // Get app data directory: ~/Library/Application Support/TestSpectra on macOS
  if let Ok(mut path) = app.path().app_data_dir() {
    // Ensure directory exists
    let _ = std::fs::create_dir_all(&path);
    path.push("config.json");
    return Some(path);
  }
  None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_api_url])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
