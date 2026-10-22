//! Update notifications for registered passes.
//!
//! When a pass changes, Wallet must learn it from APNs: the server sends an
//! empty notification to each push token of the pass, with the Pass Type ID as
//! the topic. The device then asks the web service which passes changed.
//! Apple delivers pass notifications through the production APNs only.

use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use sea_orm::DatabaseConnection;
use thiserror::Error;
use uuid::Uuid;

use super::{PassSigner, SigningError};
use crate::domain::wallet as store;

/// The production APNs origin. Pass notifications do not use the sandbox.
pub const APNS_ORIGIN: &str = "https://api.push.apple.com";

/// The result of one notification.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PushOutcome {
    /// APNs accepted the notification.
    Delivered,
    /// APNs reported that the token is no longer valid.
    Unregistered,
    /// The notification failed for another reason. The server does not retry.
    Failed,
}

/// Sends one update notification to one device.
#[async_trait]
pub trait PushSender: Send + Sync + std::fmt::Debug {
    /// Notify the device of `push_token`. Never log the token.
    async fn send(&self, push_token: &str) -> PushOutcome;
}

/// The APNs client could not be built.
#[derive(Debug, Error)]
pub enum PushSetupError {
    /// The signing material could not be encoded.
    #[error("the APNs client identity could not be encoded")]
    Identity(#[from] SigningError),
    /// The HTTP client rejected the identity or its settings.
    #[error("the APNs client could not be built")]
    Client(#[from] reqwest::Error),
}

/// Sends notifications to APNs with the Pass Type ID certificate.
#[derive(Debug)]
pub struct ApnsSender {
    client: reqwest::Client,
    origin: String,
    topic: String,
}

impl ApnsSender {
    /// Use the certificate and the key of `signer` against production APNs.
    pub fn new(signer: &PassSigner) -> Result<Self, PushSetupError> {
        Self::with_origin(signer, APNS_ORIGIN)
    }

    /// Use another origin. Tests use this with a local server.
    pub fn with_origin(signer: &PassSigner, origin: &str) -> Result<Self, PushSetupError> {
        let identity = reqwest::Identity::from_pem(&signer.client_identity_pem()?)?;
        let client = reqwest::Client::builder()
            .use_rustls_tls()
            .identity(identity)
            .http2_prior_knowledge()
            .timeout(Duration::from_secs(10))
            .build()?;
        Ok(Self {
            client,
            origin: origin.trim_end_matches('/').to_owned(),
            topic: signer.pass_type_identifier().to_owned(),
        })
    }
}

#[async_trait]
impl PushSender for ApnsSender {
    async fn send(&self, push_token: &str) -> PushOutcome {
        // The web service accepts only hexadecimal tokens, so the token is
        // safe in the path.
        let url = format!("{}/3/device/{push_token}", self.origin);
        let response = self
            .client
            .post(url)
            .header("apns-topic", &self.topic)
            .header("apns-priority", "5")
            .header(reqwest::header::CONTENT_TYPE, "application/json")
            .body("{}")
            .send()
            .await;
        let Ok(response) = response else {
            return PushOutcome::Failed;
        };
        let status = response.status();
        if status.is_success() {
            return PushOutcome::Delivered;
        }
        if status == reqwest::StatusCode::GONE {
            return PushOutcome::Unregistered;
        }
        if status == reqwest::StatusCode::BAD_REQUEST {
            let reason = response.text().await.unwrap_or_default();
            if reason.contains("BadDeviceToken") {
                return PushOutcome::Unregistered;
            }
        }
        tracing::warn!(event = "wallet_push_rejected", status = status.as_u16());
        PushOutcome::Failed
    }
}

/// The outcome of the notifications for one pass change.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct NotifySummary {
    /// Notifications that APNs accepted.
    pub delivered: usize,
    /// Tokens that APNs rejected as invalid. Their registrations are removed.
    pub unregistered: usize,
    /// Notifications that failed for another reason.
    pub failed: usize,
}

/// Tells registered devices that a pass changed.
#[derive(Clone)]
pub struct PassUpdates {
    db: DatabaseConnection,
    sender: Option<Arc<dyn PushSender>>,
}

impl PassUpdates {
    /// Notify through `sender`. `None` records changes but sends nothing.
    pub fn new(db: DatabaseConnection, sender: Option<Arc<dyn PushSender>>) -> Self {
        Self { db, sender }
    }

    /// Notify the devices of the pass in the background. Call it after the
    /// transaction that called `domain::wallet::touch` commits.
    pub fn pass_changed(&self, membership_id: Uuid) {
        if self.sender.is_none() {
            return;
        }
        let updates = self.clone();
        tokio::spawn(async move {
            updates.notify(membership_id).await;
        });
    }

    /// Notify the devices of the pass and wait for the result.
    pub async fn notify(&self, membership_id: Uuid) -> NotifySummary {
        let mut summary = NotifySummary::default();
        let Some(sender) = &self.sender else {
            return summary;
        };
        let tokens = match store::push_tokens(&self.db, membership_id).await {
            Ok(tokens) => tokens,
            Err(_) => {
                tracing::error!(event = "wallet_push_tokens_failed");
                return summary;
            }
        };
        for token in tokens {
            match sender.send(&token).await {
                PushOutcome::Delivered => summary.delivered += 1,
                PushOutcome::Unregistered => {
                    summary.unregistered += 1;
                    if store::forget_push_token(&self.db, &token).await.is_err() {
                        tracing::error!(event = "wallet_forget_push_token_failed");
                    }
                }
                PushOutcome::Failed => summary.failed += 1,
            }
        }
        if summary.failed > 0 {
            tracing::warn!(
                event = "wallet_push_failed",
                failed = summary.failed,
                delivered = summary.delivered
            );
        }
        summary
    }
}
