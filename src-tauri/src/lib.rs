use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
use tauri_plugin_log::{Target, TargetKind};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::process::{Child, Command};

#[derive(Clone, serde::Serialize)]
pub struct InspectorStatus {
    running: bool,
    url: Option<String>,
    port: Option<u16>,
}

pub struct AppState {
    inspector_process: Arc<Mutex<Option<Child>>>,
}

#[tauri::command]
async fn start_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut process_lock = state.inspector_process.lock().await;
    if process_lock.is_some() {
        return Err("Inspector server is already running".to_string());
    }

    // Get the web-inspector JS file path from resources
    let inspector_js_path = app
        .path()
        .resolve("resources/web-inspector.js", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    log::info!("Inspector JS path: {:?}", inspector_js_path);
    if !inspector_js_path.exists() {
        return Err(format!("Inspector JS file not found at: {:?}", inspector_js_path));
    }

    // Start the web-inspector using Node.js
    let mut cmd = Command::new("node");
    cmd.arg(&inspector_js_path);
    cmd.arg("start");
    
    let child = cmd.spawn().map_err(|e| {
        log::error!("Failed to start web-inspector: {}", e);
        e.to_string()
    })?;

    *process_lock = Some(child);

    // Give it a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

    let status = InspectorStatus {
        running: true,
        url: Some("http://127.0.0.1:8888/__/inspector".to_string()),
        port: Some(8888),
    };

    Ok(status)
}

#[tauri::command]
async fn stop_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut process_lock = state.inspector_process.lock().await;
    if let Some(mut child) = process_lock.take() {
        if let Some(window) = app.get_webview_window("inspector") {
            let _ = window.close();
        }
        
        // Try to stop gracefully first
        let inspector_js_path = app
            .path()
            .resolve("resources/web-inspector.js", BaseDirectory::Resource)
            .map_err(|e| e.to_string())?;
            
        let _ = Command::new("node")
            .arg(&inspector_js_path)
            .arg("stop")
            .output();
        
        // Force kill if still running
        let _ = child.kill();
        let _ = child.wait();
        
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
    let process_lock = state.inspector_process.lock().await;
    if process_lock.is_none() {
        return Err("Inspector server is not running. Please start it first.".to_string());
    }
    
    let url = "http://127.0.0.1:8888/__/inspector".to_string();

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
async fn open_inspector_browser(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Check if server is running before opening browser
    let process_lock = state.inspector_process.lock().await;
    if process_lock.is_none() {
        return Err("Inspector server is not running. Please start it first.".to_string());
    }
    drop(process_lock);

    // Get the web-inspector JS file path from resources
    let inspector_js_path = app
        .path()
        .resolve("resources/web-inspector.js", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    // Use the CLI to open inspector with WebDriver
    let _output = Command::new("node")
        .arg(&inspector_js_path)
        .arg("open")
        .arg("http://127.0.0.1:8888/__/inspector")
        .spawn()
        .map_err(|e| {
            log::error!("Failed to open inspector browser: {}", e);
            e.to_string()
        })?;

    log::info!("Inspector browser opened via CLI");
    Ok(())
}

#[tauri::command]
fn log_frontend_event(message: String) {
    log::info!("[frontend] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        inspector_process: Arc::new(Mutex::new(None)),
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
            open_inspector_browser,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
