pub mod app_state;
pub mod dependencies;
pub mod mobile_inspector;
pub mod web_inspector;

use app_state::AppState;
use dependencies::{check_system_dependencies, get_install_progress, install_missing_dependencies};
use mobile_inspector::{open_mobile_inspector_window, start_appium_server, stop_appium_server};
use std::sync::Arc;
use tauri_plugin_log::{Target, TargetKind};
use tokio::sync::Mutex;
use web_inspector::{open_inspector_browser, start_web_inspector, stop_web_inspector};

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
        .register_uri_scheme_protocol("appium-inspector", move |_app, request| {
            let path = request.uri().path();
            let query = request.uri().query().unwrap_or("");
            let url = if query.is_empty() {
                format!("http://127.0.0.1:4723{}", path)
            } else {
                format!("http://127.0.0.1:4723{}?{}", path, query)
            };

            log::debug!("Proxying Appium Inspector request to: {}", url);

            // Synchronous block to handle the request (Tauri protocols expect a response)
            let client = reqwest::blocking::Client::new();
            let response_builder = tauri::http::Response::builder();

            match client.get(&url).send() {
                Ok(resp) => {
                    let status = resp.status();
                    let content_type = resp
                        .headers()
                        .get(reqwest::header::CONTENT_TYPE)
                        .and_then(|v| v.to_str().ok())
                        .unwrap_or("application/octet-stream")
                        .to_string();

                    let mut body = resp.bytes().unwrap_or_default().to_vec();

                    // If it's HTML, inject our custom theme CSS
                    if content_type.contains("text/html") {
                        if let Ok(html_str) = String::from_utf8(body.clone()) {
                            let theme_css = r#"
<style>
/* TestSpectra Theme Injection */
:root {
  --ts-bg: #020617;
  --ts-bg-header: #0f172a;
  --ts-primary: #2563eb;
  --ts-accent: #2dd4bf;
  --ts-border: rgba(255, 255, 255, 0.1);
}

.ant-layout, 
.css-var-_r_0_.ant-layout,
.ant-layout-sider,
.ant-splitter-panel,
.ant-layout-content,
.ant-layout-footer {
    background: var(--ts-bg) !important;
    --ant-layout-color-bg-header: var(--ts-bg-header) !important;
    --ant-layout-color-bg-body: var(--ts-bg) !important;
    --ant-layout-body-bg: var(--ts-bg) !important;
    --ant-layout-header-bg: var(--ts-bg-header) !important;
    --ant-layout-sider-bg: var(--ts-bg-header) !important;
    color: #f8fafc !important;
}

.css-var-_r_0_ {
    --ant-color-bg-container: var(--ts-bg) !important;
    --ant-btn-bg-color: var(--ts-bg) !important;
    --ant-table-header-bg: var(--ts-bg-header) !important;
    --ant-table-row-hover-bg: var(--ts-bg-header) !important;
    --ant-table-footer-bg: var(--ts-bg-header) !important;
    --ant-table-border-color: var(--ts-border) !important;
    --ant-color-border-secondary: var(--ts-border) !important;
}

.ant-layout-header {
    background: var(--ts-bg-header) !important;
    border-bottom: 1px solid var(--ts-border) !important;
    height: 54px !important;
    line-height: 54px !important;
    padding: 0 20px !important;
    display: none !important; /* Hide original header as we have TitleBar */
}

/* Custom Scrollbars */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--ts-bg); }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #334155; }

/* Modal and Drawers */
.ant-modal-content, .ant-drawer-content {
    background-color: #0f172a !important;
    color: #f8fafc !important;
}

/* Fix for the specific class mentioned by user */
.css-var-_r_0_.ant-layout {
    --ant-layout-color-bg-header: var(--ts-bg-header) !important;
    --ant-layout-color-bg-body: var(--ts-bg) !important;
    --ant-layout-body-bg: var(--ts-bg) !important;
    --ant-layout-header-bg: var(--ts-bg-header) !important;
    --ant-layout-footer-bg: var(--ts-bg) !important;
    --ant-layout-sider-bg: var(--ts-bg-header) !important;
    --ant-layout-light-sider-bg: var(--ts-bg-header) !important;
    --ant-layout-light-trigger-bg: var(--ts-bg-header) !important;
}

/* Accent colors for buttons */
.ant-btn-primary {
    background-color: var(--ts-primary) !important;
    border-color: var(--ts-primary) !important;
}
</style>
"#;
                            let new_html =
                                html_str.replace("</head>", &format!("{}{}", theme_css, "</head>"));
                            body = new_html.into_bytes();
                        }
                    }

                    response_builder
                        .status(status.as_u16())
                        .header("Content-Type", content_type)
                        .header("Access-Control-Allow-Origin", "*")
                        .body(body)
                        .unwrap()
                }
                Err(e) => response_builder
                    .status(500)
                    .body(format!("Proxy Error: {}", e).into_bytes())
                    .unwrap(),
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
