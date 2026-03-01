use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, HeaderValue, Method, StatusCode, Uri},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyQuery {
    url: String,
}

#[derive(Debug, Clone)]
pub struct InspectorState {
    pub client_dir: PathBuf,
    pub last_target_url: Arc<RwLock<Option<String>>>,
}

#[derive(Clone)]
pub struct InspectorServer {
    pub state: InspectorState,
    addr: SocketAddr,
    pub shutdown_tx: tokio::sync::broadcast::Sender<()>,
}

impl InspectorServer {
    pub fn new(port: u16, client_dir: PathBuf) -> Self {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let (shutdown_tx, _) = tokio::sync::broadcast::channel(1);

        let state = InspectorState {
            client_dir,
            last_target_url: Arc::new(RwLock::new(None)),
        };

        Self {
            state,
            addr,
            shutdown_tx,
        }
    }

    pub async fn start(self) -> Result<(SocketAddr, tokio::sync::broadcast::Sender<()>), Box<dyn std::error::Error + Send + Sync>> {
        let shutdown_tx = self.shutdown_tx.clone();
        let state = self.state.clone();

        // CORS layer
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
            .allow_headers(Any)
            .allow_origin(Any);

        // Router setup
        let app = Router::new()
            .route("/", get(serve_index))
            .route("/proxy", get(proxy_handler))
            .nest_service("/static", ServeDir::new(&state.client_dir))
            .fallback(serve_static_files)
            .layer(
                ServiceBuilder::new()
                    .layer(cors)
            )
            .with_state(state);

        log::info!("🚀 Starting Inspector Server at http://{}", self.addr);

        let listener = tokio::net::TcpListener::bind(self.addr).await?;
        let addr = listener.local_addr()?;

        // Start the server
        let _server_handle = tokio::spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(shutdown_signal(shutdown_tx.subscribe()))
                .await
                .map_err(|e| log::error!("Server error: {}", e))
        });

        Ok((addr, self.shutdown_tx))
    }
}

async fn serve_index(State(state): State<InspectorState>) -> impl IntoResponse {
    let index_path = state.client_dir.join("index.html");
    log::info!("[inspector] Looking for index.html at: {:?}", index_path);
    
    match tokio::fs::read_to_string(&index_path).await {
        Ok(content) => {
            log::info!("[inspector] Successfully loaded index.html ({} bytes)", content.len());
            Html(content).into_response()
        },
        Err(e) => {
            log::error!("[inspector] Failed to read index.html: {}", e);
            let error_html = r#"
<!DOCTYPE html>
<html>
<head><title>Inspector - Not Found</title></head>
<body>
    <h1>Inspector Client Not Found</h1>
    <p>The inspector client files could not be found.</p>
    <p>Looking for: index.html</p>
</body>
</html>
            "#;
            Html(error_html).into_response()
        }
    }
}

async fn proxy_handler(
    State(state): State<InspectorState>,
    Query(query): Query<ProxyQuery>,
) -> impl IntoResponse {
    let target_url = match Url::parse(&query.url) {
        Ok(url) => url,
        Err(_) => {
            return (StatusCode::BAD_REQUEST, "Invalid URL").into_response();
        }
    };

    // Store this as the last target URL
    {
        let mut last_url = state.last_target_url.write().await;
        *last_url = Some(query.url.clone());
    }

    log::info!("Proxying request to: {}", target_url);

    // Create HTTP client
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build() {
        Ok(client) => client,
        Err(e) => {
            log::error!("Failed to create HTTP client: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create HTTP client").into_response();
        }
    };

    // Make the request
    let method = reqwest::Method::GET;
    let request = client.request(method, target_url.as_str());

    match request.send().await {
        Ok(response) => {
            let status_code = response.status().as_u16();
            let status = StatusCode::from_u16(status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            
            // Convert response to bytes to avoid borrowing issues
            let body_bytes = match response.bytes().await {
                Ok(bytes) => bytes,
                Err(e) => {
                    log::error!("Failed to read response body: {}", e);
                    return (StatusCode::BAD_GATEWAY, "Failed to read response").into_response();
                }
            };

            // Simple response without complex headers for now
            (status, body_bytes.to_vec()).into_response()
        }
        Err(e) => {
            log::error!("Proxy request failed: {}", e);
            (StatusCode::BAD_GATEWAY, format!("Proxy request failed: {}", e)).into_response()
        }
    }
}

async fn serve_static_files(
    State(state): State<InspectorState>,
    uri: Uri,
) -> impl IntoResponse {
    let path = uri.path();
    let file_path = state.client_dir.join(&path[1..]); // Remove leading '/'

    if file_path.exists() && file_path.is_file() {
        match tokio::fs::read(&file_path).await {
            Ok(contents) => {
                let mime_type = get_mime_type(&file_path);

                let mut headers = HeaderMap::new();
                if let Ok(value) = HeaderValue::from_str(&mime_type) {
                    headers.insert(header::CONTENT_TYPE, value);
                }

                (headers, contents).into_response()
            }
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "File read error").into_response(),
        }
    } else {
        (StatusCode::NOT_FOUND, "File not found").into_response()
    }
}

fn get_mime_type(file_path: &PathBuf) -> String {
    let path_str = file_path.to_string_lossy();
    
    if path_str.ends_with(".html") {
        "text/html".to_string()
    } else if path_str.ends_with(".css") {
        "text/css".to_string()
    } else if path_str.ends_with(".js") {
        "application/javascript".to_string()
    } else if path_str.ends_with(".png") {
        "image/png".to_string()
    } else if path_str.ends_with(".jpg") || path_str.ends_with(".jpeg") {
        "image/jpeg".to_string()
    } else if path_str.ends_with(".gif") {
        "image/gif".to_string()
    } else if path_str.ends_with(".svg") {
        "image/svg+xml".to_string()
    } else if path_str.ends_with(".json") {
        "application/json".to_string()
    } else {
        "application/octet-stream".to_string()
    }
}

async fn shutdown_signal(mut shutdown_rx: tokio::sync::broadcast::Receiver<()>) {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
        _ = shutdown_rx.recv() => {},
    }
}
