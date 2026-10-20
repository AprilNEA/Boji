//! Private local mail delivery for development and controlled deployments.
//!
//! This provider never writes mail content to logs. It stores each message in a
//! user-owned directory with restrictive Unix permissions instead.

use std::path::{Path, PathBuf};

use async_trait::async_trait;
use better_auth::email::EmailProvider;
use better_auth::error::{AuthError, AuthResult};
use better_auth::plugins::{SendResetPassword, SendVerificationEmail};
use better_auth::prelude::UserView;
use thiserror::Error;
use uuid::Uuid;

/// Errors returned while configuring or writing private mail files.
#[derive(Debug, Error)]
pub enum MailFailure {
    /// The configured directory is not an absolute local path.
    #[error("private mail output directory must be an absolute path")]
    RelativeDirectory,
    /// A private mail filesystem operation failed.
    #[error("private mail output operation failed")]
    Io(#[source] std::io::Error),
    /// A password-reset user did not include a valid email address.
    #[error("password reset recipient is unavailable")]
    MissingRecipient,
}

/// An [`EmailProvider`] that stores messages in a private local directory.
///
/// The resulting files contain recipient addresses and verification URLs. The
/// provider therefore creates the directory with mode `0700` and each message
/// with mode `0600` on Unix systems. It does not log recipients, tokens, or
/// message bodies.
#[derive(Clone, Debug)]
pub struct PrivateFileEmailProvider {
    directory: PathBuf,
}

impl PrivateFileEmailProvider {
    /// Creates a provider that writes messages below `directory`.
    pub fn new(directory: impl Into<PathBuf>) -> Result<Self, MailFailure> {
        let directory = directory.into();
        if !directory.is_absolute() {
            return Err(MailFailure::RelativeDirectory);
        }
        Ok(Self { directory })
    }

    async fn write_message(
        &self,
        to: &str,
        subject: &str,
        html: &str,
        text: &str,
    ) -> Result<(), MailFailure> {
        tokio::fs::create_dir_all(&self.directory)
            .await
            .map_err(MailFailure::Io)?;
        set_private_directory_permissions(&self.directory)
            .await
            .map_err(MailFailure::Io)?;

        let path = self.directory.join(format!("{}.eml", Uuid::new_v4()));
        let message = format!(
            "To: {to}\nSubject: {subject}\nContent-Type: text/plain; charset=utf-8\n\n{text}\n\n-- HTML --\n{html}\n"
        );
        tokio::fs::write(&path, message)
            .await
            .map_err(MailFailure::Io)?;
        set_private_file_permissions(&path)
            .await
            .map_err(MailFailure::Io)
    }
}

#[async_trait]
impl EmailProvider for PrivateFileEmailProvider {
    async fn send(&self, to: &str, subject: &str, html: &str, text: &str) -> AuthResult<()> {
        self.write_message(to, subject, html, text)
            .await
            .map_err(|_| AuthError::internal("private email delivery failed"))
    }
}

/// Email-verification sender that delegates delivery to [`PrivateFileEmailProvider`].
#[derive(Clone, Debug)]
pub struct VerificationEmailSender {
    provider: PrivateFileEmailProvider,
}

impl VerificationEmailSender {
    /// Creates an email-verification sender that uses `provider`.
    pub fn new(provider: PrivateFileEmailProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl SendVerificationEmail for VerificationEmailSender {
    async fn send(&self, user: &UserView, url: &str, _token: &str) -> AuthResult<()> {
        let email = user
            .email
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| AuthError::internal(MailFailure::MissingRecipient.to_string()))?;
        let text =
            format!("请在 24 小时内打开以下链接验证 Boji 邮箱：\n{url}\n\n验证后请返回 App 登录。");
        let html = format!(
            "<p>请在 24 小时内打开以下链接验证 Boji 邮箱：</p><p><a href=\"{url}\">验证邮箱</a></p><p>验证后请返回 App 登录。</p>"
        );
        self.provider
            .send(email, "验证 Boji 邮箱", &html, &text)
            .await
    }
}

/// Password-reset sender that delegates delivery to [`PrivateFileEmailProvider`].
#[derive(Clone, Debug)]
pub struct PasswordResetEmailSender {
    provider: PrivateFileEmailProvider,
}

impl PasswordResetEmailSender {
    /// Creates a password-reset sender that uses `provider`.
    pub fn new(provider: PrivateFileEmailProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl SendResetPassword for PasswordResetEmailSender {
    async fn send(&self, user: &serde_json::Value, url: &str, _token: &str) -> AuthResult<()> {
        let email = user
            .get("email")
            .and_then(serde_json::Value::as_str)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| AuthError::internal(MailFailure::MissingRecipient.to_string()))?;
        let text = format!(
            "请在 1 小时内打开以下链接重置 Boji 密码：\n{url}\n\n如果不是你发起的请求，请忽略此邮件。"
        );
        let html = format!(
            "<p>请在 1 小时内打开以下链接重置 Boji 密码：</p><p><a href=\"{url}\">重置密码</a></p><p>如果不是你发起的请求，请忽略此邮件。</p>"
        );
        self.provider
            .send(email, "重置 Boji 密码", &html, &text)
            .await
    }
}

#[cfg(unix)]
async fn set_private_directory_permissions(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    tokio::fs::set_permissions(path, std::fs::Permissions::from_mode(0o700)).await
}

#[cfg(not(unix))]
async fn set_private_directory_permissions(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

#[cfg(unix)]
async fn set_private_file_permissions(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    tokio::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600)).await
}

#[cfg(not(unix))]
async fn set_private_file_permissions(_path: &Path) -> std::io::Result<()> {
    Ok(())
}
