use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};

#[tauri::command]
fn get_api_url(app: AppHandle) -> String {
  // 1. Try to read from ENV variable
  if let Ok(url) = std::env::var("API_URL") {
    log::info!("get_api_url: using API_URL from env: {}", url);
    return url;
  }

  // 2. Try to read from config file
  if let Some(config_path) = get_config_file_path(&app) {
    if let Ok(content) = std::fs::read_to_string(&config_path) {
      if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(api_url) = json.get("api_url").and_then(|v| v.as_str()) {
          log::info!(
            "get_api_url: using api_url from config file {}: {}",
            config_path.display(),
            api_url
          );
          return api_url.to_string();
        }
      }
    }
  }

  // 3. Fallback to default from ENV or hardcoded
  if let Ok(url) = std::env::var("API_URL") {
    log::warn!("get_api_url: falling back to env API_URL after config lookup: {}", url);
    return url;
  }

  log::error!("get_api_url: no API URL found, returning empty string");
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

#[tauri::command]
fn log_frontend_event(message: String) {
  log::info!("[frontend] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .targets([
          Target::new(TargetKind::Stdout),
          Target::new(TargetKind::LogDir { file_name: None }),
        ])
        .level(if cfg!(debug_assertions) {
          log::LevelFilter::Debug
        } else {
          log::LevelFilter::Info
        })
        .build(),
    )
    .setup(|app| {
      if let Ok(dir) = app.path().app_log_dir() {
        log::info!("Tauri log directory: {}", dir.display());
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_api_url, log_frontend_event])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
