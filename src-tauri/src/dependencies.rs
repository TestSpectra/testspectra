use std::process::Command;
use tauri::{AppHandle, Emitter};
use crate::app_state::{AppState, InstallProgress};

#[derive(Clone, serde::Serialize)]
pub struct DependencyStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub required: bool,
}

#[derive(Clone, serde::Serialize)]
pub struct SystemCheckResult {
    pub all_ready: bool,
    pub dependencies: Vec<DependencyStatus>,
    pub missing_count: usize,
}

#[tauri::command]
pub async fn check_system_dependencies() -> Result<SystemCheckResult, String> {
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
pub async fn install_missing_dependencies(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Check what's missing first
    let system_check = check_system_dependencies().await?;
    log::info!("Dependency missing: {:?}", system_check.dependencies.len());

    for dep in system_check.dependencies {
        log::info!("Checking dependency: {:?}", dep.name.as_str());
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

pub async fn install_webdriverio(
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
pub async fn get_install_progress(
    state: tauri::State<'_, AppState>,
) -> Result<Option<InstallProgress>, String> {
    let progress_lock = state.install_progress.lock().await;
    Ok(progress_lock.clone())
}
