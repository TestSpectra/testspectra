use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
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

pub struct AppState {
    inspector_server: Arc<Mutex<Option<InspectorServer>>>,
}

#[tauri::command]
async fn start_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut server_lock = state.inspector_server.lock().await;
    if server_lock.is_some() {
        return Err("Inspector server is already running".to_string());
    }

    let inspector_dist_path = app
        .path()
        .resolve("resources/inspector", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    log::info!("Inspector client path: {:?}", inspector_dist_path);
    if !inspector_dist_path.exists() {
        return Err(format!("Inspector client directory not found at: {:?}", inspector_dist_path));
    }

    let server = InspectorServer::new(inspector_dist_path);
    let server_clone = server.clone();
    
    let (addr, _shutdown_tx) = server.start(8888).await.map_err(|e| e.to_string())?;
    
    *server_lock = Some(server_clone);

    let status = InspectorStatus {
        running: true,
        url: Some(format!("http://{}/__inspector", addr)),
        port: Some(addr.port()),
    };

    Ok(status)
}

#[tauri::command]
async fn stop_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut server_lock = state.inspector_server.lock().await;
    if let Some(server) = server_lock.take() {
        if let Some(window) = app.get_webview_window("inspector") {
            let _ = window.close();
        }
        // Sending shutdown signal
        let _ = server.shutdown_tx.send(());
        log::info!("Inspector server stopped.");
    }

    Ok(InspectorStatus {
        running: false,
        url: None,
        port: None,
    })
}

#[tauri::command]
async fn open_inspector_window(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("inspector") {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Check if server is running before opening window
    let server_lock = state.inspector_server.lock().await;
    if server_lock.is_none() {
        return Err("Inspector server is not running. Please start it first.".to_string());
    }
    
    // This part assumes the server is running on a known port (e.g., 8888)
    let url = "http://127.0.0.1:8888/__inspector".to_string();

    // Find the inspector window config from tauri.conf.json
    let mut window_config = app
        .config()
        .app
        .windows
        .iter()
        .find(|w| w.label == "inspector")
        .cloned()
        .ok_or_else(|| "Inspector window config not found".to_string())?;
    
    // Override the URL with the actual server URL
    window_config.url = tauri::WebviewUrl::External(url.parse().unwrap());

    // Build the window from the loaded config
    WebviewWindowBuilder::from_config(&app, &window_config)
        .map_err(|e| e.to_string())?
        .initialization_script(
            r#"
                if (navigator.serviceWorker) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for(let registration of registrations) {
                            registration.unregister();
                        }
                    });
                }
            "#,
        )
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn log_frontend_event(message: String) {
    log::info!("[frontend] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        inspector_server: Arc::new(Mutex::new(None)),
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
        .invoke_handler(tauri::generate_handler![
            log_frontend_event,
            start_web_inspector,
            stop_web_inspector,
            open_inspector_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
