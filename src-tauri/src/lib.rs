use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use std::sync::Arc;
use tokio::sync::Mutex;

mod inspector;

use inspector::InspectorServer;

#[derive(Clone, serde::Serialize)]
pub struct InspectorStatus {
    running: bool,
    url: Option<String>,
    port: Option<u16>,
}

// Global state for inspector server
pub struct AppState {
    pub inspector_server: Arc<Mutex<Option<InspectorServer>>>,
    pub inspector_status: Arc<Mutex<InspectorStatus>>,
}

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
async fn start_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    log::info!("[inspector] Starting web inspector server...");

    // Get client directory - use absolute path as fallback
    let client_dir = match app
        .path()
        .resolve("tools/inspector/web-inspector/client", BaseDirectory::Resource)
    {
        Ok(path) => {
            log::info!("[inspector] Resource path resolved: {:?}", path);
            if path.exists() {
                path
            } else {
                // Try absolute path fallback
                let abs_path = std::path::Path::new("/Volumes/DATA/testspectra/src-tauri/resources/tools/inspector/web-inspector/client");
                log::info!("[inspector] Using absolute fallback path: {:?}", abs_path);
                abs_path.to_path_buf()
            }
        },
        Err(e) => {
            log::warn!("[inspector] Resource path failed: {}, using absolute fallback", e);
            // Try absolute path fallback
            let abs_path = std::path::Path::new("/Volumes/DATA/testspectra/src-tauri/resources/tools/inspector/web-inspector/client");
            log::info!("[inspector] Using absolute fallback path: {:?}", abs_path);
            abs_path.to_path_buf()
        }
    };

    if !client_dir.exists() {
        return Err(format!("Client directory does not exist: {:?}", client_dir));
    }

    log::info!("[inspector] Final client directory: {:?}", client_dir);

    // Create inspector server
    let server = InspectorServer::new(8888, client_dir);
    let server_clone = server.clone();
    
    // Start server
    let (addr, _shutdown_tx) = server.start().await.map_err(|e| {
        log::error!("[inspector] Failed to start server: {}", e);
        format!("Failed to start server: {}", e)
    })?;

    // Update state
    {
        let mut inspector_server = state.inspector_server.lock().await;
        *inspector_server = Some(server_clone);
    }

    let status = InspectorStatus {
        running: true,
        url: Some(format!("http://{}", addr)),
        port: Some(addr.port()),
    };

    {
        let mut inspector_status = state.inspector_status.lock().await;
        *inspector_status = status.clone();
    }

    log::info!("[inspector] Server started successfully at http://{}", addr);
    Ok(status)
}

#[tauri::command]
async fn stop_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    log::info!("[inspector] Stopping web inspector server...");

    // Close inspector window if it exists
    if let Some(window) = app.get_webview_window("inspector") {
        log::info!("[inspector] Closing inspector window");
        let _ = window.close();
    }

    // Stop server
    {
        let mut inspector_server = state.inspector_server.lock().await;
        if let Some(server) = inspector_server.take() {
            // Send shutdown signal
            let _ = server.shutdown_tx.send(());
        }
    }

    // Update status
    let status = InspectorStatus {
        running: false,
        url: None,
        port: None,
    };

    {
        let mut inspector_status = state.inspector_status.lock().await;
        *inspector_status = status.clone();
    }

    log::info!("[inspector] Server stopped");
    Ok(status)
}

#[tauri::command]
async fn get_inspector_status(
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let status = state.inspector_status.lock().await;
    Ok(status.clone())
}

#[tauri::command]
async fn open_inspector_window(
    app: AppHandle,
) -> Result<String, String> {
    if let Some(window) = app.get_webview_window("inspector") {
        window
            .set_focus()
            .map_err(|e| format!("Failed to focus inspector window: {}", e))?;
        log::info!("[inspector] Focused existing inspector window");
        return Ok("inspector.html".to_string());
    }

    let mut conf = app
        .config()
        .app
        .windows
        .iter()
        .find(|w| w.label == "inspector")
        .cloned()
        .ok_or_else(|| "Inspector window config not found".to_string())?;

    let builder = tauri::WebviewWindowBuilder::from_config(&app, &conf)
        .map_err(|e| format!("Failed to create inspector window builder: {}", e))?;

    builder
        .build()
        .map_err(|e| format!("Failed to create inspector window: {}", e))?;

    log::info!("[inspector] Opened inspector window from config");
    Ok("inspector.html".to_string())
}

#[tauri::command]
fn log_frontend_event(message: String) {
    log::info!("[frontend] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize app state
    let app_state = AppState {
        inspector_server: Arc::new(Mutex::new(None)),
        inspector_status: Arc::new(Mutex::new(InspectorStatus {
            running: false,
            url: None,
            port: None,
        })),
    };

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
        .manage(app_state)
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
        .invoke_handler(tauri::generate_handler![
            get_api_url,
            log_frontend_event,
            start_web_inspector,
            stop_web_inspector,
            get_inspector_status,
            open_inspector_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
