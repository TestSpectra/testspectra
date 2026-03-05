use std::process::{Child, Command};
use std::sync::Arc;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tokio::sync::Mutex;

#[derive(Clone, serde::Serialize)]
pub struct InspectorStatus {
    running: bool,
    url: Option<String>,
    port: Option<u16>,
}

#[derive(Clone, serde::Serialize)]
pub struct DependencyStatus {
    name: String,
    installed: bool,
    version: Option<String>,
    required: bool,
}

#[derive(Clone, serde::Serialize)]
pub struct SystemCheckResult {
    all_ready: bool,
    dependencies: Vec<DependencyStatus>,
    missing_count: usize,
}

#[derive(Clone, serde::Serialize)]
pub struct InstallProgress {
    dependency: String,
    status: String, // "checking", "downloading", "installing", "completed", "failed"
    progress: f32,  // 0.0 to 1.0
    message: String,
}

pub struct AppState {
    inspector_process: Arc<Mutex<Option<Child>>>,
    install_progress: Arc<Mutex<Option<InstallProgress>>>,
}

#[tauri::command]
async fn check_system_dependencies() -> Result<SystemCheckResult, String> {
    log::info!("Starting system dependency check...");
    let mut dependencies = Vec::new();
    let mut missing_count = 0;

    // Check Node.js
    log::info!("Checking Node.js status...");
    let node_status = check_nodejs().await;
    if !node_status.installed {
        log::warn!("Node.js is not installed or not in PATH");
        missing_count += 1;
    } else {
        log::info!(
            "Node.js detected: {}",
            node_status.version.as_deref().unwrap_or("unknown")
        );
    }
    dependencies.push(node_status);

    // Check npm
    log::info!("Checking npm status...");
    let npm_status = check_npm().await;
    if !npm_status.installed {
        log::warn!("npm is not installed or not in PATH");
        missing_count += 1;
    } else {
        log::info!(
            "npm detected: {}",
            npm_status.version.as_deref().unwrap_or("unknown")
        );
    }
    dependencies.push(npm_status);

    // Check WebDriverIO
    log::info!("Checking WebDriverIO status...");
    let wdio_status = check_webdriverio().await;
    if !wdio_status.installed {
        log::warn!("WebDriverIO is not installed globally");
        missing_count += 1;
    } else {
        log::info!(
            "WebDriverIO detected: {}",
            wdio_status.version.as_deref().unwrap_or("unknown")
        );
    }
    dependencies.push(wdio_status);

    log::info!(
        "System dependency check completed. Missing: {}",
        missing_count
    );
    Ok(SystemCheckResult {
        all_ready: missing_count == 0,
        dependencies,
        missing_count,
    })
}

async fn check_nodejs() -> DependencyStatus {
    log::debug!("Executing 'node --version'...");
    match Command::new("node").arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                DependencyStatus {
                    name: "Node.js".to_string(),
                    installed: true,
                    version: Some(version),
                    required: true,
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                log::error!(
                    "Node.js version check failed with status: {}. Error: {}",
                    output.status,
                    stderr
                );
                DependencyStatus {
                    name: "Node.js".to_string(),
                    installed: false,
                    version: None,
                    required: true,
                }
            }
        }
        Err(e) => {
            log::error!("Failed to execute 'node': {}", e);
            DependencyStatus {
                name: "Node.js".to_string(),
                installed: false,
                version: None,
                required: true,
            }
        }
    }
}

async fn check_npm() -> DependencyStatus {
    log::debug!("Executing 'npm --version'...");
    match Command::new("npm").arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                DependencyStatus {
                    name: "npm".to_string(),
                    installed: true,
                    version: Some(version),
                    required: true,
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                log::error!(
                    "npm version check failed with status: {}. Error: {}",
                    output.status,
                    stderr
                );
                DependencyStatus {
                    name: "npm".to_string(),
                    installed: false,
                    version: None,
                    required: true,
                }
            }
        }
        Err(e) => {
            log::error!("Failed to execute 'npm': {}", e);
            DependencyStatus {
                name: "npm".to_string(),
                installed: false,
                version: None,
                required: true,
            }
        }
    }
}

async fn check_webdriverio() -> DependencyStatus {
    log::debug!("Checking for global WebDriverIO installation...");
    // Check if webdriverio is installed globally
    match Command::new("npm")
        .args(&["list", "-g", "webdriverio", "--depth=0"])
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            log::debug!("npm list output: {}", output_str);
            if output_str.contains("webdriverio@") {
                // Extract version
                let version = output_str
                    .lines()
                    .find(|line| line.contains("webdriverio@"))
                    .and_then(|line| line.split("webdriverio@").nth(1))
                    .and_then(|v| v.split_whitespace().next())
                    .map(|v| v.to_string());

                DependencyStatus {
                    name: "WebDriverIO".to_string(),
                    installed: true,
                    version,
                    required: true,
                }
            } else {
                log::debug!("WebDriverIO not found in global npm packages");
                DependencyStatus {
                    name: "WebDriverIO".to_string(),
                    installed: false,
                    version: None,
                    required: true,
                }
            }
        }
        Err(e) => {
            log::error!("Failed to execute 'npm list -g webdriverio': {}", e);
            DependencyStatus {
                name: "WebDriverIO".to_string(),
                installed: false,
                version: None,
                required: true,
            }
        }
    }
}

#[tauri::command]
async fn install_missing_dependencies(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Check what's missing first
    let system_check = check_system_dependencies().await?;

    for dep in system_check.dependencies {
        if !dep.installed {
            match dep.name.as_str() {
                "WebDriverIO" => {
                    log::info!("Missing WebDriverIO, attempting to install...");
                    install_webdriverio(&app, &state).await?;
                }
                "Node.js" => {
                    log::error!("Node.js is missing but cannot be auto-installed.");
                    return Err("Node.js is not installed. Please install Node.js manually from https://nodejs.org/".to_string());
                }
                "npm" => {
                    log::error!("npm is missing but cannot be auto-installed.");
                    return Err("npm is not installed. Please install npm (it usually comes with Node.js) manually.".to_string());
                }
                _ => {
                    log::warn!("Missing unknown dependency: {}", dep.name);
                }
            }
        }
    }

    Ok(())
}

async fn install_webdriverio(
    app: &AppHandle,
    state: &tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Update progress
    let progress = InstallProgress {
        dependency: "WebDriverIO".to_string(),
        status: "installing".to_string(),
        progress: 0.0,
        message: "Installing WebDriverIO globally...".to_string(),
    };

    {
        let mut progress_lock = state.install_progress.lock().await;
        *progress_lock = Some(progress.clone());
    }

    // Emit progress event
    let _ = app.emit("install-progress", &progress);

    // Install WebDriverIO globally
    log::info!("Installing WebDriverIO globally via npm... this may take a while.");
    let output = Command::new("npm")
        .args(&["install", "-g", "webdriverio"])
        .output()
        .map_err(|e| {
            log::error!("Failed to execute npm install: {}", e);
            format!("Failed to run npm install: {}", e)
        })?;

    if output.status.success() {
        log::info!("WebDriverIO installed successfully");
        let progress = InstallProgress {
            dependency: "WebDriverIO".to_string(),
            status: "completed".to_string(),
            progress: 1.0,
            message: "WebDriverIO installed successfully!".to_string(),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);

        // Clear progress after a delay
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = None;
        }

        Ok(())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        let progress = InstallProgress {
            dependency: "WebDriverIO".to_string(),
            status: "failed".to_string(),
            progress: 0.0,
            message: format!("Installation failed: {}", error_msg),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);

        Err(format!("Failed to install WebDriverIO: {}", error_msg))
    }
}

#[tauri::command]
async fn get_install_progress(
    state: tauri::State<'_, AppState>,
) -> Result<Option<InstallProgress>, String> {
    let progress_lock = state.install_progress.lock().await;
    Ok(progress_lock.clone())
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

    // Check system dependencies first
    let system_check = check_system_dependencies().await?;
    if !system_check.all_ready {
        return Err(format!(
            "Missing dependencies: {}. Please install them first.",
            system_check
                .dependencies
                .iter()
                .filter(|d| !d.installed)
                .map(|d| d.name.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }

    // Get the web-inspector JS file path from resources
    let inspector_js_path = app
        .path()
        .resolve("resources/web-inspector.js", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    log::info!("Inspector JS path: {:?}", inspector_js_path);
    if !inspector_js_path.exists() {
        return Err(format!(
            "Inspector JS file not found at: {:?}",
            inspector_js_path
        ));
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
        install_progress: Arc::new(Mutex::new(None)),
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
            check_system_dependencies,
            install_missing_dependencies,
            get_install_progress,
            start_web_inspector,
            stop_web_inspector,
            open_inspector_browser,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
