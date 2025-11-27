use tauri::AppHandle;
use tauri_plugin_log::{Target, TargetKind};

#[tauri::command]
fn get_api_url(_app: AppHandle) -> String {
  if let Ok(url) = std::env::var("TEST_SPECTRA_API_URL") {
    log::info!("get_api_url: using TEST_SPECTRA_API_URL from env: {}", url);
    return url;
  }

  log::error!(
    "get_api_url: TEST_SPECTRA_API_URL is not set; please configure it before starting the app",
  );
  "".to_string()
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
