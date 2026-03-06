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
    // We can keep this for backward compatibility or generic install, 
    // but maybe we don't need it if we emit directly.
    // However, storing state is good for polling.
    // Let's split it? Or just rely on event emission with different event names.
    // Ideally we should have separate progress state if we want to support get_install_progress for both simultaneously.
    pub install_progress: Arc<Mutex<Option<InstallProgress>>>,
    pub web_install_progress: Arc<Mutex<Option<InstallProgress>>>,
    pub mobile_install_progress: Arc<Mutex<Option<InstallProgress>>>,
}
