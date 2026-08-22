use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
pub struct EventMetadata {
    pub id: String,
    pub name: String,
    pub date: String,
    pub venue: String,
    pub description: String,
    pub organizer_address: String,
    pub blockchain_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateEventRequest {
    pub name: String,
    pub date: String,
    pub venue: String,
    pub description: String,
    pub organizer_address: String,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateEventRequest {
    pub blockchain_id: String,
}

type AppState = Arc<RwLock<HashMap<String, EventMetadata>>>;

#[tokio::main]
async fn main() {
    let state: AppState = Arc::new(RwLock::new(HashMap::new()));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/events", get(list_events).post(create_event))
        .route("/api/events/:id", get(get_event).patch(update_event))
        .route("/api/health", get(health_check))
        .with_state(state)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!(
        "Backend server listening on {}",
        listener.local_addr().unwrap()
    );
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok"
    }))
}

async fn list_events(State(state): State<AppState>) -> impl IntoResponse {
    let map = state.read().await;
    let events: Vec<EventMetadata> = map.values().cloned().collect();
    Json(events)
}

async fn create_event(
    State(state): State<AppState>,
    Json(payload): Json<CreateEventRequest>,
) -> impl IntoResponse {
    let mut map = state.write().await;

    // We use a UUID for off-chain metadata to keep it decoupled.
    // The frontend will save this UUID into the Soroban contract event string.
    let id = Uuid::new_v4().to_string();

    let event = EventMetadata {
        id: id.clone(),
        name: payload.name,
        date: payload.date,
        venue: payload.venue,
        description: payload.description,
        organizer_address: payload.organizer_address,
        blockchain_id: None,
    };

    map.insert(id, event.clone());

    (StatusCode::CREATED, Json(event))
}

async fn get_event(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let map = state.read().await;
    match map.get(&id) {
        Some(event) => (StatusCode::OK, Json(event.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "Event not found").into_response(),
    }
}

async fn update_event(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateEventRequest>,
) -> impl IntoResponse {
    let mut map = state.write().await;
    if let Some(event) = map.get_mut(&id) {
        event.blockchain_id = Some(payload.blockchain_id);
        (StatusCode::OK, Json(event.clone())).into_response()
    } else {
        (StatusCode::NOT_FOUND, "Event not found").into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_create_and_list_events() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/events", get(list_events).post(create_event))
            .route("/api/events/:id", get(get_event))
            .with_state(state.clone());

        let payload = CreateEventRequest {
            name: "Test Event".into(),
            date: "2026-08-08".into(),
            venue: "Test Venue".into(),
            description: "Test Desc".into(),
            organizer_address: "GABC...".into(),
        };

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/events")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let created_event: EventMetadata = serde_json::from_slice(&body).unwrap();
        assert_eq!(created_event.name, "Test Event");

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/events")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let events: Vec<EventMetadata> = serde_json::from_slice(&body).unwrap();

        assert_eq!(events.len(), 1);
        assert_eq!(events[0].id, created_event.id);
    }

    #[tokio::test]
    async fn test_health_check() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/health", get(health_check))
            .with_state(state);

        let request = Request::builder()
            .uri("/api/health")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();

        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["status"], "ok");
    }

    #[tokio::test]
    async fn test_get_event_by_id() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/events", get(list_events).post(create_event))
            .route("/api/events/:id", get(get_event))
            .with_state(state.clone());

        let payload = CreateEventRequest {
            name: "Single Event Test".into(),
            date: "2026-08-08".into(),
            venue: "Test Venue".into(),
            description: "Test Description".into(),
            organizer_address: "GABC...".into(),
        };

        // Create an event first
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/events")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let created_event: EventMetadata = serde_json::from_slice(&body).unwrap();

        // Fetch the event using its ID
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/events/{}", created_event.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let fetched_event: EventMetadata = serde_json::from_slice(&body).unwrap();

        assert_eq!(fetched_event.id, created_event.id);
        assert_eq!(fetched_event.name, "Single Event Test");
    }

    #[tokio::test]
    async fn test_get_event_not_found() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/events/:id", get(get_event))
            .with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/events/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_event() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/events", get(list_events).post(create_event))
            .route("/api/events/:id", get(get_event).patch(update_event))
            .with_state(state.clone());

        let payload = CreateEventRequest {
            name: "Update Test Event".into(),
            date: "2026-08-08".into(),
            venue: "Test Venue".into(),
            description: "Test Description".into(),
            organizer_address: "GABC...".into(),
        };

        // Create an event first
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/events")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let created_event: EventMetadata = serde_json::from_slice(&body).unwrap();

        // Update the event with its blockchain ID
        let update_payload = UpdateEventRequest {
            blockchain_id: "test-blockchain-id".into(),
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/api/events/{}", created_event.id))
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&update_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let updated_event: EventMetadata = serde_json::from_slice(&body).unwrap();

        assert_eq!(
            updated_event.blockchain_id,
            Some("test-blockchain-id".into())
        );
        assert_eq!(updated_event.name, "Update Test Event");
        assert_eq!(updated_event.date, "2026-08-08");
        assert_eq!(updated_event.venue, "Test Venue");
        assert_eq!(updated_event.description, "Test Description");
        assert_eq!(updated_event.organizer_address, "GABC...");
    }

    #[tokio::test]
    async fn test_update_event_not_found() {
        let state: AppState = Arc::new(RwLock::new(HashMap::new()));

        let app = Router::new()
            .route("/api/events/:id", get(get_event).patch(update_event))
            .with_state(state);

        let update_payload = UpdateEventRequest {
            blockchain_id: "test-blockchain-id".into(),
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri("/api/events/non-existent-id")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&update_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
