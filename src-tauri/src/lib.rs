pub mod app_state;
pub mod dependencies;
pub mod web_inspector;
pub mod mobile_inspector;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri_plugin_log::{Target, TargetKind};
use app_state::AppState;
use dependencies::{
    check_system_dependencies, install_missing_dependencies, get_install_progress
};
use web_inspector::{
    start_web_inspector, stop_web_inspector, open_inspector_browser
};
use mobile_inspector::{
    start_appium_server, stop_appium_server, open_mobile_inspector_window
};

#[tauri::command]
fn log_frontend_event(message: String) {
    log::info!("[frontend] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        inspector_process: Arc::new(Mutex::new(None)),
        browser_process: Arc::new(Mutex::new(None)),
        appium_process: Arc::new(Mutex::new(None)),
        install_progress: Arc::new(Mutex::new(None)),
        web_install_progress: Arc::new(Mutex::new(None)),
        mobile_install_progress: Arc::new(Mutex::new(None)),
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
            start_appium_server,
            stop_appium_server,
            open_mobile_inspector_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
