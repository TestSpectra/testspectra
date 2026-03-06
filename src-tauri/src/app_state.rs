use std::sync::Arc;
use std::process::Child;
use tokio::sync::Mutex;

#[derive(Clone, serde::Serialize)]
pub struct InstallProgress {
    pub dependency: String,
    pub status: String, // "checking", "downloading", "installing", "completed", "failed"
    pub progress: f32,  // 0.0 to 1.0
    pub message: String,
}

pub struct AppState {
    pub inspector_process: Arc<Mutex<Option<Child>>>,
    pub browser_process: Arc<Mutex<Option<Child>>>,
    pub appium_process: Arc<Mutex<Option<Child>>>,
    pub install_progress: Arc<Mutex<Option<InstallProgress>>>,
}
