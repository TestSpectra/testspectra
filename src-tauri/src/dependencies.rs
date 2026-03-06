use crate::app_state::{AppState, InstallProgress};
use std::process::Command;
use tauri::{AppHandle, Emitter};

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
pub async fn check_system_dependencies(scope: Option<String>) -> Result<SystemCheckResult, String> {
    log::info!("Starting system dependency check with scope: {:?}", scope);
    let mut dependencies = Vec::new();
    let mut missing_count = 0;

    // Check Node.js and npm (Always required)
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

    let check_all = scope.is_none() || scope.as_deref() == Some("all");
    let check_web = check_all || scope.as_deref() == Some("web");
    let check_mobile = check_all || scope.as_deref() == Some("mobile");

    // Check WebDriverIO (Web Scope)
    if check_web {
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
    }

    // Check Appium & Inspector Plugin (Mobile Scope)
    if check_mobile {
        log::info!("Checking Appium status...");
        let appium_status = check_appium().await;
        if !appium_status.installed {
            log::warn!("Appium is not installed globally");
            missing_count += 1;
        } else {
            log::info!(
                "Appium detected: {}",
                appium_status.version.as_deref().unwrap_or("unknown")
            );
        }
        dependencies.push(appium_status);

        log::info!("Checking Appium Inspector Plugin status...");
        let inspector_status = check_appium_inspector_plugin().await;
        if !inspector_status.installed {
            log::warn!("Appium Inspector Plugin is not installed");
            missing_count += 1;
        } else {
            log::info!(
                "Appium Inspector Plugin detected: {}",
                inspector_status.version.as_deref().unwrap_or("unknown")
            );
        }
        dependencies.push(inspector_status);
    }

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

async fn check_appium() -> DependencyStatus {
    log::debug!("Executing 'appium --version'...");
    match Command::new("appium").arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                DependencyStatus {
                    name: "Appium".to_string(),
                    installed: true,
                    version: Some(version),
                    required: true,
                }
            } else {
                DependencyStatus {
                    name: "Appium".to_string(),
                    installed: false,
                    version: None,
                    required: true,
                }
            }
        }
        Err(_) => DependencyStatus {
            name: "Appium".to_string(),
            installed: false,
            version: None,
            required: true,
        },
    }
}

async fn check_appium_inspector_plugin() -> DependencyStatus {
    log::debug!("Checking for Appium Inspector plugin...");

    // We need to capture both stdout and stderr, as some versions might print to stderr
    // Also, we need to handle ANSI color codes that might be present in output
    // NOTE: appium CLI might not support --no-color flag in some versions or subcommands.
    // Based on user feedback, --no-color caused unrecognized argument error.
    // We will just use --json which should be cleaner.
    match Command::new("appium")
        .args(&["plugin", "list", "--installed", "--json"])
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            log::debug!("Appium plugin check output: {}", output_str);

            // Try to parse JSON first if supported
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&output_str) {
                if let Some(plugins) = json.as_object() {
                    if let Some(inspector_data) = plugins.get("inspector") {
                        // Get version if available
                        let version = inspector_data
                            .get("version")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());

                        return DependencyStatus {
                            name: "Appium Inspector Plugin".to_string(),
                            installed: true,
                            version,
                            required: true,
                        };
                    }
                }
            }

            // Fallback to string check
            if output_str.contains("inspector") {
                DependencyStatus {
                    name: "Appium Inspector Plugin".to_string(),
                    installed: true,
                    version: None,
                    required: true,
                }
            } else {
                DependencyStatus {
                    name: "Appium Inspector Plugin".to_string(),
                    installed: false,
                    version: None,
                    required: true,
                }
            }
        }
        Err(e) => {
            log::warn!("Failed to execute appium plugin list: {}", e);
            DependencyStatus {
                name: "Appium Inspector Plugin".to_string(),
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
    scope: Option<String>,
) -> Result<(), String> {
    // Check what's missing first
    let system_check = check_system_dependencies(scope.clone()).await?;

    // Filter dependencies based on scope
    let target_dependencies = match scope.as_deref() {
        Some("web") => vec!["WebDriverIO"],
        Some("mobile") => vec!["Appium", "Appium Inspector Plugin"],
        _ => vec!["WebDriverIO", "Appium", "Appium Inspector Plugin"],
    };

    // Count total missing installable dependencies
    let missing_installable: Vec<&DependencyStatus> = system_check
        .dependencies
        .iter()
        .filter(|d| !d.installed && target_dependencies.contains(&d.name.as_str()))
        .collect();

    let total_missing = missing_installable.len();
    log::info!(
        "Missing installable dependencies (scope: {:?}): {}",
        scope,
        total_missing
    );

    if total_missing == 0 {
        return Ok(());
    }

    for (index, dep) in missing_installable.iter().enumerate() {
        log::info!(
            "Installing dependency {} of {}: {}",
            index + 1,
            total_missing,
            dep.name
        );

        let current_progress_base = index as f32 / total_missing as f32;
        let next_progress_base = (index + 1) as f32 / total_missing as f32;

        // Pass progress range to installer functions
        match dep.name.as_str() {
            "WebDriverIO" => {
                log::info!("Missing WebDriverIO, attempting to install...");
                install_webdriverio(&app, &state, current_progress_base, next_progress_base)
                    .await?;
            }
            "Appium" => {
                log::info!("Missing Appium, attempting to install...");
                install_appium(&app, &state, current_progress_base, next_progress_base).await?;
            }
            "Appium Inspector Plugin" => {
                log::info!("Missing Appium Inspector Plugin, attempting to install...");
                install_appium_inspector_plugin(
                    &app,
                    &state,
                    current_progress_base,
                    next_progress_base,
                )
                .await?;
            }
            _ => {
                // Should be filtered out already
            }
        }
    }

    // Check for non-installable missing dependencies
    for dep in system_check.dependencies {
        if !dep.installed {
            match dep.name.as_str() {
                "Node.js" => {
                    log::error!("Node.js is missing but cannot be auto-installed.");
                    return Err("Node.js is not installed. Please install Node.js manually from https://nodejs.org/".to_string());
                }
                "npm" => {
                    log::error!("npm is missing but cannot be auto-installed.");
                    return Err("npm is not installed. Please install npm (it usually comes with Node.js) manually.".to_string());
                }
                _ => {}
            }
        }
    }

    Ok(())
}

pub async fn install_webdriverio(
    app: &AppHandle,
    state: &tauri::State<'_, AppState>,
    start_progress: f32,
    end_progress: f32,
) -> Result<(), String> {
    install_global_package(
        app,
        state,
        "WebDriverIO",
        "webdriverio",
        start_progress,
        end_progress,
    )
    .await
}

pub async fn install_appium(
    app: &AppHandle,
    state: &tauri::State<'_, AppState>,
    start_progress: f32,
    end_progress: f32,
) -> Result<(), String> {
    install_global_package(app, state, "Appium", "appium", start_progress, end_progress).await
}

pub async fn install_appium_inspector_plugin(
    app: &AppHandle,
    state: &tauri::State<'_, AppState>,
    start_progress: f32,
    end_progress: f32,
) -> Result<(), String> {
    // Update progress
    let progress = InstallProgress {
        dependency: "Appium Inspector Plugin".to_string(),
        status: "installing".to_string(),
        progress: start_progress,
        message: "Installing Appium Inspector Plugin...".to_string(),
    };

    {
        let mut progress_lock = state.install_progress.lock().await;
        *progress_lock = Some(progress.clone());
    }

    let _ = app.emit("install-progress", &progress);

    log::info!("Installing Appium Inspector Plugin...");

    // The plugin installation instruction is `appium plugin install --source=npm appium-inspector-plugin`
    // This command handles the npm install internally into appium's directory.

    // First, check if it's already installed but maybe disabled or something, although check_system_dependencies should have caught it.
    // If we are here, it means check_system_dependencies said it's NOT installed.
    // But maybe it IS installed and the check logic is flawed?
    // The check logic looks for "inspector" in `appium plugin list --installed`.

    // Let's try to update if install fails with "already installed"

    let status = Command::new("appium")
        .args(&[
            "plugin",
            "install",
            "--source=npm",
            "appium-inspector-plugin",
        ])
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .status()
        .map_err(|e| {
            log::error!("Failed to execute appium plugin install: {}", e);
            format!("Failed to run appium plugin install: {}", e)
        })?;

    if status.success() {
        log::info!("Appium Inspector Plugin installed successfully");
        let progress = InstallProgress {
            dependency: "Appium Inspector Plugin".to_string(),
            status: "completed".to_string(),
            progress: end_progress,
            message: "Appium Inspector Plugin installed successfully!".to_string(),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);

        // Only clear if we reached 100% (or close to it)
        if end_progress >= 0.99 {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            {
                let mut progress_lock = state.install_progress.lock().await;
                *progress_lock = None;
            }
        }
        Ok(())
    } else {
        // Can't check "already installed" easily with inherit stdio, but user will see it.
        // We can assume if it fails, it might be already installed or actual error.
        // But for better UX let's assume failure needs attention.
        let error_msg = "Installation failed. Check terminal output for details.";

        let progress = InstallProgress {
            dependency: "Appium Inspector Plugin".to_string(),
            status: "failed".to_string(),
            progress: start_progress,
            message: error_msg.to_string(),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);
        Err(format!(
            "Failed to install Appium Inspector Plugin: {}",
            error_msg
        ))
    }
}

async fn install_global_package(
    app: &AppHandle,
    state: &tauri::State<'_, AppState>,
    name: &str,
    package: &str,
    start_progress: f32,
    end_progress: f32,
) -> Result<(), String> {
    // Update progress
    let progress = InstallProgress {
        dependency: name.to_string(),
        status: "installing".to_string(),
        progress: start_progress,
        message: format!("Installing {} globally...", name),
    };

    {
        let mut progress_lock = state.install_progress.lock().await;
        *progress_lock = Some(progress.clone());
    }

    // Emit progress event
    let _ = app.emit("install-progress", &progress);

    // Install globally
    log::info!("Installing {} globally via npm...", name);

    // Use spawn instead of output to stream logs to stdout/stderr
    // But since we need to wait for completion, we'll use status() which inherits stdio by default or can be configured
    // However, Command::new in std::process by default inherits nothing if not specified?
    // Actually std::process::Command inherits from parent if not piped.
    // Let's explicitly set stdout/stderr to inherit to be sure it shows in the terminal where tauri dev is running.

    let status = Command::new("npm")
        .args(&["install", "-g", package])
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .status()
        .map_err(|e| {
            log::error!("Failed to execute npm install: {}", e);
            format!("Failed to run npm install: {}", e)
        })?;

    if status.success() {
        log::info!("{} installed successfully", name);
        let progress = InstallProgress {
            dependency: name.to_string(),
            status: "completed".to_string(),
            progress: end_progress,
            message: format!("{} installed successfully!", name),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);

        // Only clear if we reached 100% (or close to it)
        if end_progress >= 0.99 {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            {
                let mut progress_lock = state.install_progress.lock().await;
                *progress_lock = None;
            }
        }

        Ok(())
    } else {
        // Since we are inheriting stdout/stderr, we can't capture the error message easily.
        // But the user will see it in the terminal.
        let error_msg = "Installation failed. Check terminal output for details.";

        let progress = InstallProgress {
            dependency: name.to_string(),
            status: "failed".to_string(),
            progress: start_progress,
            message: error_msg.to_string(),
        };

        {
            let mut progress_lock = state.install_progress.lock().await;
            *progress_lock = Some(progress.clone());
        }

        let _ = app.emit("install-progress", &progress);

        Err(format!("Failed to install {}: {}", name, error_msg))
    }
}

#[tauri::command]
pub async fn get_install_progress(
    state: tauri::State<'_, AppState>,
) -> Result<Option<InstallProgress>, String> {
    let progress_lock = state.install_progress.lock().await;
    Ok(progress_lock.clone())
}
