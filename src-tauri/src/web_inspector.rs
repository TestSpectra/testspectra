use crate::app_state::AppState;
use crate::dependencies::{check_system_dependencies, install_webdriverio};
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
pub struct InspectorStatus {
    pub running: bool,
    pub url: Option<String>,
    pub port: Option<u16>,
}

fn detect_global_node_path() -> Option<String> {
    log::info!("Attempting to detect global node_modules path...");
    match std::process::Command::new("npm")
        .args(&["root", "-g"])
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    log::info!("Found global node_modules at: {}", path);
                    return Some(path);
                }
            }
        }
        Err(e) => {
            log::warn!("Failed to execute npm root -g: {}", e);
        }
    }
    None
}

#[tauri::command]
pub async fn start_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut process_lock = state.inspector_process.lock().await;
    // If process is running, kill it and restart
    if let Some(mut child) = process_lock.take() {
        log::info!("Inspector server is already running, stopping it to restart...");
        let _ = child.kill();
        let _ = child.wait();
    }

    // Emit initial progress
    let _ = app.emit("web-install-progress", &crate::app_state::InstallProgress {
        dependency: "System Check".to_string(),
        status: "checking".to_string(),
        progress: 0.0,
        message: "Checking system dependencies...".to_string(),
    });

    // Check system dependencies first
    let system_check = check_system_dependencies(Some("web".to_string())).await?;

    // Check critical dependencies that cannot be auto-installed
    let critical_missing: Vec<&str> = system_check
        .dependencies
        .iter()
        .filter(|d| !d.installed && (d.name == "Node.js" || d.name == "npm"))
        .map(|d| d.name.as_str())
        .collect();

    if !critical_missing.is_empty() {
        return Err(format!(
            "Missing critical dependencies: {}. Please install them manually.",
            critical_missing.join(", ")
        ));
    }

    // Check if WebDriverIO needs installation
    let wdio_missing = system_check
        .dependencies
        .iter()
        .any(|d| !d.installed && d.name == "WebDriverIO");

    // Calculate total steps:
    // 1 step for System Check
    // + 1 step for WebDriverIO install (if missing)
    // + 1 step for Starting Server
    let mut total_steps = 2.0; // System Check + Start Server
    if wdio_missing { total_steps += 1.0; }

    let mut current_step = 1.0; // System Check done

    if wdio_missing {
        log::info!("WebDriverIO missing, attempting auto-installation...");
        let start_progress = current_step / total_steps;
        let end_progress = (current_step + 1.0) / total_steps;

        // Emit initial progress event so UI knows we are starting installation
        let progress = crate::app_state::InstallProgress {
            dependency: "WebDriverIO".to_string(),
            status: "checking".to_string(),
            progress: start_progress,
            message: "WebDriverIO missing. Starting auto-installation...".to_string(),
        };
        let _ = app.emit("web-install-progress", &progress);

        // This function handles the installation and emits progress events
        // Note: install_webdriverio currently emits "install-progress"
        // We need to update it to support custom event name or update it to use the new event structure
        // For now, let's assume install_webdriverio will be updated to take an event name
        install_webdriverio(&app, &state, start_progress, end_progress, "web-install-progress").await?;
        current_step += 1.0;
    }

    // Update progress for Starting Server
    let start_server_progress = current_step / total_steps;
    let _ = app.emit("web-install-progress", &crate::app_state::InstallProgress {
        dependency: "Web Inspector Server".to_string(),
        status: "starting".to_string(),
        progress: start_server_progress,
        message: "Starting Web Inspector server...".to_string(),
    });

    // Kill any process using port 8888 (Web Inspector default port)
    log::info!("Ensuring port 8888 is free...");
    #[cfg(unix)]
    {
        let _ = Command::new("sh")
            .arg("-c")
            .arg("lsof -ti:8888 | xargs kill -9")
            .output();
    }
    #[cfg(windows)]
    {
        // Placeholder for windows port killing
    }

    // Get the web-inspector JS file path from resources
    let inspector_js_path = app
        .path()
        .resolve(
            "resources/web-inspector/bin/web-inspector.js",
            BaseDirectory::Resource,
        )
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
pub async fn stop_web_inspector(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<InspectorStatus, String> {
    let mut process_lock = state.inspector_process.lock().await;
    if let Some(mut child) = process_lock.take() {
        // Try to stop gracefully first
        let inspector_js_path = app
            .path()
            .resolve(
                "resources/web-inspector/bin/web-inspector.js",
                BaseDirectory::Resource,
            )
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

    // Kill the browser process if it exists
    let mut browser_lock = state.browser_process.lock().await;
    if let Some(mut child) = browser_lock.take() {
        log::info!("Stopping inspector browser...");

        // Try graceful shutdown first with SIGTERM
        #[cfg(unix)]
        {
            let _ = Command::new("kill")
                .arg("-TERM")
                .arg(child.id().to_string())
                .output();

            // Give it a moment to cleanup
            std::thread::sleep(std::time::Duration::from_millis(1000));
        }

        // Force kill if still running
        let _ = child.kill();
        let _ = child.wait();
        log::info!("Inspector browser stopped.");
    }

    Ok(InspectorStatus {
        running: false,
        url: None,
        port: None,
    })
}

#[tauri::command]
pub async fn open_inspector_browser(
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
        .resolve(
            "resources/web-inspector/bin/web-inspector.js",
            BaseDirectory::Resource,
        )
        .map_err(|e| e.to_string())?;

    // Use the CLI to open inspector with WebDriver
    let mut cmd = Command::new("node");
    cmd.arg(&inspector_js_path)
        .arg("open")
        .arg("http://127.0.0.1:8888/__/inspector");

    // Add NODE_PATH if we can find it to support global installations (e.g. nvm)
    if let Some(node_path) = detect_global_node_path() {
        cmd.env("NODE_PATH", node_path);
    }

    let child = cmd.spawn().map_err(|e| {
        log::error!("Failed to open inspector browser: {}", e);
        e.to_string()
    })?;

    // Store the browser process handle
    {
        let mut browser_lock = state.browser_process.lock().await;
        *browser_lock = Some(child);
    }

    log::info!("Inspector browser opened via CLI");
    Ok(())
}
