//! Private local mail files for development and tests.

use std::path::{Path, PathBuf};

use async_trait::async_trait;
use better_auth::email::EmailProvider;
use better_auth::error::AuthResult;
use uuid::Uuid;

use super::MailFailure;

/// An [`EmailProvider`] that stores messages in a private local directory.
///
/// The files contain recipient addresses and verification URLs. The provider
/// therefore creates the directory with mode `0700` and each message with mode
/// `0600` on Unix systems.
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
        set_permissions(&self.directory, 0o700)
            .await
            .map_err(MailFailure::Io)?;

        let path = self.directory.join(format!("{}.eml", Uuid::new_v4()));
        let message = format!(
            "To: {to}\nSubject: {subject}\nContent-Type: text/plain; charset=utf-8\n\n{text}\n\n-- HTML --\n{html}\n"
        );
        tokio::fs::write(&path, message)
            .await
            .map_err(MailFailure::Io)?;
        set_permissions(&path, 0o600).await.map_err(MailFailure::Io)
    }
}

#[async_trait]
impl EmailProvider for PrivateFileEmailProvider {
    async fn send(&self, to: &str, subject: &str, html: &str, text: &str) -> AuthResult<()> {
        self.write_message(to, subject, html, text)
            .await
            .map_err(|_| {
                tracing::error!(event = "mail_delivery_failed", transport = "files");
                super::delivery_failed()
            })
    }
}

#[cfg(unix)]
async fn set_permissions(path: &Path, mode: u32) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    tokio::fs::set_permissions(path, std::fs::Permissions::from_mode(mode)).await
}

#[cfg(not(unix))]
async fn set_permissions(_path: &Path, _mode: u32) -> std::io::Result<()> {
    Ok(())
}
