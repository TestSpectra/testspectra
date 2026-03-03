use axum::{
    body::{Body, Bytes},
    extract::State,
    http::{header, HeaderMap, HeaderValue, Request, StatusCode},
    response::{IntoResponse, Response},
    Router,
};
use serde::Deserialize;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower::util::ServiceExt;
use tower_http::services::ServeDir;
use url::Url;

#[derive(Debug, Clone)]
pub struct InspectorState {
    pub client_dir: PathBuf,
    pub target_host: Arc<tokio::sync::RwLock<Option<String>>>,
}

#[derive(Debug, Deserialize)]
pub struct ProxyQuery {
    url: String,
}

#[derive(Clone)]
pub struct InspectorServer {
    pub state: Arc<InspectorState>,
    pub shutdown_tx: broadcast::Sender<()>,
}

impl InspectorServer {
    pub fn new(client_dir: PathBuf) -> Self {
        let (shutdown_tx, _) = broadcast::channel(1);
        let state = Arc::new(InspectorState {
            client_dir,
            target_host: Arc::new(tokio::sync::RwLock::new(None)),
        });

        Self {
            state,
            shutdown_tx,
        }
    }

    pub async fn start(
        self,
        port: u16,
    ) -> Result<(SocketAddr, broadcast::Sender<()>), Box<dyn std::error::Error + Send + Sync>> {
        let app = Router::new()
            .fallback(fallback_handler)
            .with_state(self.state.clone());

        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        log::info!("🚀 Starting Inspector Server at http://{}", addr);

        let listener = tokio::net::TcpListener::bind(addr).await?;
        let local_addr = listener.local_addr()?;
        let shutdown_tx = self.shutdown_tx.clone();
        let mut shutdown_rx = shutdown_tx.subscribe();

        tokio::spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(async move {
                    shutdown_rx.recv().await.ok();
                })
                .await
                .ok();
        });

        Ok((local_addr, shutdown_tx))
    }
}

async fn fallback_handler(
    State(state): State<Arc<InspectorState>>,
    req: Request<Body>,
) -> Response {
    let mut static_req_parts = Request::new(Body::empty());
    *static_req_parts.uri_mut() = req.uri().clone();
    *static_req_parts.method_mut() = req.method().clone();
    *static_req_parts.headers_mut() = req.headers().clone();

    match ServeDir::new(state.client_dir.clone())
        .append_index_html_on_directories(true)
        .oneshot(static_req_parts)
        .await
    {
        Ok(res) => {
            if res.status() != StatusCode::NOT_FOUND {
                return res.into_response();
            }
        }
        Err(e) => {
            log::error!("ServeDir error: {}", e);
        }
    }

    proxy_handler(State(state), req).await.into_response()
}

async fn proxy_handler(
    State(state): State<Arc<InspectorState>>,
    req: Request<Body>,
) -> Result<Response, StatusCode> {
    let mut target_url_base: Option<String> = None;

    if let Some(query_str) = req.uri().query() {
        if let Ok(query) = serde_urlencoded::from_str::<ProxyQuery>(query_str) {
            let parsed_url = Url::parse(&query.url).map_err(|_| StatusCode::BAD_REQUEST)?;
            let host = format!("{}://{}", parsed_url.scheme(), parsed_url.host_str().unwrap_or(""));
            
            let mut target_host_lock = state.target_host.write().await;
            *target_host_lock = Some(host.clone());
            target_url_base = Some(host);
        }
    }

    if target_url_base.is_none() {
        if let Some(referer) = req.headers().get(header::REFERER) {
            if let Ok(referer_str) = referer.to_str() {
                if let Ok(referer_url) = Url::parse(referer_str) {
                    if let Some(query_str) = referer_url.query() {
                         if let Ok(query) = serde_urlencoded::from_str::<ProxyQuery>(query_str) {
                            let parsed_url = Url::parse(&query.url).map_err(|_| StatusCode::BAD_REQUEST)?;
                            let host = format!("{}://{}", parsed_url.scheme(), parsed_url.host_str().unwrap_or(""));
                            target_url_base = Some(host);
                         }
                    }
                }
            }
        }
    }
    
    if target_url_base.is_none() {
        let target_host_lock = state.target_host.read().await;
        target_url_base = target_host_lock.clone();
    }

    let base = match target_url_base {
        Some(url) => Url::parse(&url).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        None => {
            log::warn!("Proxy request for '{}' but no target host is set.", req.uri().path());
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let path = req.uri().path();
    let mut full_target_url = base.join(path).map_err(|_| StatusCode::BAD_REQUEST)?;
    full_target_url.set_query(req.uri().query());

    log::info!("Proxying request to: {}", full_target_url);

    let client = reqwest::Client::new();
    let (parts, body) = req.into_parts();
    let body_bytes = body_to_bytes(body).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = client
        .request(parts.method, full_target_url)
        .headers(clone_headers_for_proxy(&parts.headers))
        .body(body_bytes)
        .send()
        .await
        .map_err(|e| {
            log::error!("Proxy request failed: {}", e);
            StatusCode::BAD_GATEWAY
        })?;

    let mut response_builder = Response::builder().status(response.status());
    let headers = response_builder.headers_mut().unwrap();
    
    for (key, value) in response.headers().iter() {
        if key != "content-security-policy"
            && key != "x-frame-options"
            && key != "content-security-policy-report-only"
            && key != "cross-origin-embedder-policy"
        {
            headers.insert(key.clone(), value.clone());
        }
    }
    
    headers.insert("x-frame-options", HeaderValue::from_static("ALLOWALL"));

    let body = Body::from_stream(response.bytes_stream());
    Ok(response_builder.body(body).unwrap())
}

fn clone_headers_for_proxy(headers: &HeaderMap) -> HeaderMap {
    let mut new_headers = HeaderMap::new();
    for (key, value) in headers.iter() {
        if key != header::HOST {
            new_headers.insert(key.clone(), value.clone());
        }
    }
    new_headers
}

async fn body_to_bytes(body: Body) -> Result<Bytes, axum::Error> {
    axum::body::to_bytes(body, usize::MAX).await
}
