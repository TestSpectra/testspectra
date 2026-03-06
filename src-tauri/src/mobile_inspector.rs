use crate::app_state::AppState;
use crate::dependencies::{
    check_system_dependencies, install_appium, install_appium_inspector_plugin,
};
use std::process::Command;
use tauri::{AppHandle, Emitter, Manager, WebviewWindowBuilder};

#[derive(Clone, serde::Serialize)]
pub struct MobileInspectorStatus {
    pub running: bool,
    pub url: Option<String>,
    pub port: Option<u16>,
}

#[derive(Debug, serde::Deserialize)]
pub struct AppiumCapabilities {
    #[serde(rename = "platformName")]
    pub platform_name: String,
    #[serde(rename = "platformVersion")]
    pub platform_version: String,
    #[serde(rename = "deviceName")]
    pub device_name: String,
    #[serde(rename = "automationName")]
    pub automation_name: String,
    #[serde(rename = "appPackage")]
    pub app_package: String,
    #[serde(rename = "autoGrantPermissions")]
    pub auto_grant_permissions: bool,
    #[serde(rename = "noReset")]
    pub no_reset: bool,
}

#[tauri::command]
pub async fn start_appium_server(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<MobileInspectorStatus, String> {
    let mut process_lock = state.appium_process.lock().await;
    if process_lock.is_some() {
        return Ok(MobileInspectorStatus {
            running: true,
            url: Some("http://127.0.0.1:4723/inspector".to_string()),
            port: Some(4723),
        });
    }

    // Check system dependencies
    // Emit initial progress
    let _ = app.emit(
        "mobile-install-progress",
        &crate::app_state::InstallProgress {
            dependency: "System Check".to_string(),
            status: "checking".to_string(),
            progress: 0.0,
            message: "Checking system dependencies...".to_string(),
        },
    );

    let system_check = check_system_dependencies(Some("mobile".to_string())).await?;

    let appium_missing = system_check
        .dependencies
        .iter()
        .any(|d| !d.installed && d.name == "Appium");
    let plugin_missing = system_check
        .dependencies
        .iter()
        .any(|d| !d.installed && d.name == "Appium Inspector Plugin");

    // Calculate total steps:
    // 1 step for System Check (already passed, but we count it in total)
    // + 1 step for Appium install (if missing)
    // + 1 step for Plugin install (if missing)
    // + 1 step for Starting Server
    let mut total_steps = 2.0; // System Check + Start Server
    if appium_missing {
        total_steps += 1.0;
    }
    if plugin_missing {
        total_steps += 1.0;
    }

    let mut current_step = 1.0; // System Check done

    if appium_missing {
        log::info!("Appium missing, attempting auto-installation...");
        let start_progress = current_step / total_steps;
        let end_progress = (current_step + 1.0) / total_steps;

        let progress = crate::app_state::InstallProgress {
            dependency: "Appium".to_string(),
            status: "checking".to_string(),
            progress: start_progress,
            message: "Appium missing. Starting auto-installation...".to_string(),
        };
        let _ = app.emit("mobile-install-progress", &progress);

        install_appium(
            &app,
            &state,
            start_progress,
            end_progress,
            "mobile-install-progress",
        )
        .await?;
        current_step += 1.0;
    }

    if plugin_missing {
        log::info!("Appium Inspector Plugin missing, attempting auto-installation...");
        let start_progress = current_step / total_steps;
        let end_progress = (current_step + 1.0) / total_steps;

        let progress = crate::app_state::InstallProgress {
            dependency: "Appium Inspector Plugin".to_string(),
            status: "checking".to_string(),
            progress: start_progress,
            message: "Inspector Plugin missing. Starting auto-installation...".to_string(),
        };
        let _ = app.emit("mobile-install-progress", &progress);

        install_appium_inspector_plugin(
            &app,
            &state,
            start_progress,
            end_progress,
            "mobile-install-progress",
        )
        .await?;
        current_step += 1.0;
    }

    // Update progress for Starting Server
    let start_server_progress = current_step / total_steps;
    let _ = app.emit(
        "mobile-install-progress",
        &crate::app_state::InstallProgress {
            dependency: "Appium Server".to_string(),
            status: "starting".to_string(),
            progress: start_server_progress,
            message: "Starting Appium server...".to_string(),
        },
    );

    // Kill any process using port 4723
    log::info!("Ensuring port 4723 is free...");

    // Simple port killer for Unix-like systems
    #[cfg(unix)]
    {
        // Ignore errors, maybe no process is running
        let _ = Command::new("sh")
            .arg("-c")
            .arg("lsof -ti:4723 | xargs kill -9")
            .output();
    }

    // Simple port killer for Windows
    #[cfg(windows)]
    {
        // This is a bit tricky on windows without powershell or complex cmd parsing
        // We'll skip for now or use a simpler approach if possible.
        // Or just let it fail if port is in use.
    }

    // Start Appium with Inspector Plugin and CORS allowed
    log::info!("Starting Appium server...");

    // We use "appium" command directly as it should be in PATH or installed via npm
    // On macOS/Linux, it's usually in /usr/local/bin or via nvm
    // We can try to resolve it or just run "appium"

    let mut cmd = Command::new("appium");
    cmd.args(&[
        "--use-plugins=inspector",
        "--allow-cors",
        "--port",
        "4723",
        "--base-path",
        "/", // Standard WDIO config usually expects /
    ]);

    let child = cmd.spawn().map_err(|e| {
        log::error!("Failed to start Appium: {}", e);
        e.to_string()
    })?;

    *process_lock = Some(child);

    // Give it a moment to start
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

    Ok(MobileInspectorStatus {
        running: true,
        url: Some("http://127.0.0.1:4723/inspector".to_string()),
        port: Some(4723),
    })
}

#[tauri::command]
pub async fn stop_appium_server(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut process_lock = state.appium_process.lock().await;
    if let Some(mut child) = process_lock.take() {
        log::info!("Stopping Appium server...");

        // Try graceful shutdown
        #[cfg(unix)]
        {
            let _ = Command::new("kill")
                .arg("-TERM")
                .arg(child.id().to_string())
                .output();
            std::thread::sleep(std::time::Duration::from_millis(1000));
        }

        let _ = child.kill();
        let _ = child.wait();
        log::info!("Appium server stopped.");
    }
    Ok(())
}

#[tauri::command]
pub async fn open_mobile_inspector_window(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    capabilities: Option<AppiumCapabilities>,
) -> Result<(), String> {
    // Ensure server is running
    let _ = start_appium_server(app.clone(), state).await?;

    let mut session_id = None;

    // Automatically start session if capabilities are provided
    if let Some(caps) = capabilities {
        log::info!("Starting Appium session automatically for inspector...");

        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "capabilities": {
                "alwaysMatch": {
                    "platformName": caps.platform_name,
                    "appium:options": {
                        "platformVersion": caps.platform_version,
                        "deviceName": caps.device_name,
                        "automationName": caps.automation_name,
                        "appPackage": caps.app_package,
                        "autoGrantPermissions": caps.auto_grant_permissions,
                        "noReset": caps.no_reset,
                        "newCommandTimeout": 3600,
                        "connectHardwareKeyboard": true
                    }
                }
            }
        });

        // Try to start session with retries as server might still be booting
        let mut retry_count = 0;
        while retry_count < 5 {
            match client
                .post("http://127.0.0.1:4723/session")
                .json(&body)
                .send()
                .await
            {
                Ok(resp) => {
                    if resp.status().is_success() {
                        let json: serde_json::Value =
                            resp.json().await.map_err(|e| e.to_string())?;
                        if let Some(sid) = json["value"]["sessionId"].as_str() {
                            session_id = Some(sid.to_string());
                            log::info!("Appium session started: {}", sid);
                            break;
                        }
                    } else {
                        let err_text = resp
                            .text()
                            .await
                            .unwrap_or_else(|_| "Unknown error".to_string());
                        log::error!("Appium session start failed: {}", err_text);
                    }
                }
                Err(e) => {
                    log::warn!(
                        "Waiting for Appium server to accept session ({}): {}",
                        retry_count,
                        e
                    );
                }
            }
            retry_count += 1;
            tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
        }
    }

    let url = if let Some(sid) = session_id {
        format!("/mobile-inspector?sessionId={}", sid)
    } else {
        "/mobile-inspector".to_string()
    };

    log::info!("Opening mobile inspector window: {}", url);

    // Create/Show the window
    if let Some(window) = app.get_webview_window("mobile_inspector") {
        let _ = window.navigate(url.parse().unwrap());
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        let config = app.config();
        let window_config = config
            .app
            .windows
            .iter()
            .find(|w| w.label == "mobile_inspector");

        if let Some(win_config) = window_config {
            let mut win_config = win_config.clone();
            win_config.url = tauri::WebviewUrl::App(url.parse().unwrap());

            let win_builder =
                WebviewWindowBuilder::from_config(&app, &win_config).map_err(|e| e.to_string())?;

            let _ = win_builder.build().map_err(|e| e.to_string())?;
        } else {
            return Err("Mobile Inspector window configuration not found".to_string());
        }
    }

    Ok(())
}
