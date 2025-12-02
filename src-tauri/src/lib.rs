use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};

#[tauri::command]
fn read_api_url_from_file(app: &AppHandle) -> Option<String> {
    let mut path = app.path().app_data_dir().ok()?;
    let _ = std::fs::create_dir_all(&path);
    path.push("config.env");

    let content = std::fs::read_to_string(&path).ok()?;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some(rest) = line.strip_prefix("TEST_SPECTRA_API_URL=") {
            return Some(rest.trim().trim_matches('"').to_string());
        }
    }

    None
}

#[tauri::command]
fn get_api_url(app: AppHandle) -> String {
    if let Ok(url) = std::env::var("TEST_SPECTRA_API_URL") {
        log::info!("get_api_url: using TEST_SPECTRA_API_URL from env: {}", url);
        return url;
    }

    if let Some(url) = read_api_url_from_file(&app) {
        log::info!(
            "get_api_url: using TEST_SPECTRA_API_URL from config.env in app data dir: {}",
            url
        );
        return url;
    }

    log::error!(
    "get_api_url: TEST_SPECTRA_API_URL is not set (env or config.env); please configure it before starting the app",
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
        .plugin(tauri_plugin_os::init())
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if let Ok(dir) = app.path().app_log_dir() {
                log::info!("Tauri log directory: {}", dir.display());
            }

            // Ensure user config.env exists (copied from bundled default-config.env if missing)
            if let Ok(mut cfg_dir) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&cfg_dir);
                cfg_dir.push("config.env");

                if !cfg_dir.exists() {
                    if let Ok(resource_path) = app
                        .path()
                        .resolve("resources/default-config.env", BaseDirectory::Resource)
                    {
                        match std::fs::copy(&resource_path, &cfg_dir) {
                            Ok(_) => log::info!(
                                "Created default config.env at {} from resource {}",
                                cfg_dir.display(),
                                resource_path.display()
                            ),
                            Err(e) => log::error!(
                                "Failed to copy default-config.env from {} to {}: {}",
                                resource_path.display(),
                                cfg_dir.display(),
                                e
                            ),
                        }
                    } else {
                        log::warn!(
              "default-config.env resource not found; config.env will not be created automatically"
            );
                    }
                }

                log::info!("Config file path: {}", cfg_dir.display());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_api_url, log_frontend_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
