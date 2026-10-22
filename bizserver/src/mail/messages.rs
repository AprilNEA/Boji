//! Authentication messages and the Better Auth senders that deliver them.
//!
//! Input: users, URLs and tokens from Better Auth.
//! Output: one [`Email`] per message, delivered through [`Mailer`].
//! Pos: the only place that holds mail copy. The lifetimes below configure
//! the plugins in `auth.rs`, so the copy and the real lifetimes stay equal.

use async_trait::async_trait;
use better_auth::FieldValue;
use better_auth::email::EmailProvider;
use better_auth::error::{AuthError, AuthResult};
use better_auth::plugins::user_management::SendDeleteAccountVerification;
use better_auth::plugins::{SendChangeEmailConfirmation, SendResetPassword, SendVerificationEmail};
use better_auth::prelude::AuthRequest;

use super::{MailFailure, Mailer};

/// Lifetime of an email-verification link, in hours.
pub const VERIFICATION_LINK_HOURS: i64 = 1;
/// Lifetime of a password-reset link, in hours.
pub const PASSWORD_RESET_LINK_HOURS: i64 = 1;
/// Lifetime of an account-deletion code, in minutes.
pub const DELETE_ACCOUNT_CODE_MINUTES: i64 = 15;

/// One message before delivery.
#[derive(Debug, PartialEq, Eq)]
pub struct Email {
    /// Subject line.
    pub subject: &'static str,
    /// Plain-text body.
    pub text: String,
    /// HTML body. Every inserted value is escaped.
    pub html: String,
}

/// Verification of a new or changed email address.
pub fn verification(url: &str) -> Email {
    let hours = VERIFICATION_LINK_HOURS;
    let link = escape(url);
    Email {
        subject: "验证薄肌邮箱",
        text: format!(
            "请在 {hours} 小时内打开以下链接，验证你的薄肌邮箱：\n{url}\n\n\
             验证后请返回 App。如果你没有在薄肌使用这个邮箱，请忽略此邮件。"
        ),
        html: format!(
            "<p>请在 {hours} 小时内打开以下链接，验证你的薄肌邮箱：</p>\
             <p><a href=\"{link}\">验证邮箱</a></p>\
             <p>验证后请返回 App。如果你没有在薄肌使用这个邮箱，请忽略此邮件。</p>"
        ),
    }
}

/// Password reset.
pub fn password_reset(url: &str) -> Email {
    let hours = PASSWORD_RESET_LINK_HOURS;
    let link = escape(url);
    Email {
        subject: "重置薄肌密码",
        text: format!(
            "请在 {hours} 小时内打开以下链接，重置薄肌密码：\n{url}\n\n\
             如果不是你发起的请求，请忽略此邮件。"
        ),
        html: format!(
            "<p>请在 {hours} 小时内打开以下链接，重置薄肌密码：</p>\
             <p><a href=\"{link}\">重置密码</a></p>\
             <p>如果不是你发起的请求，请忽略此邮件。</p>"
        ),
    }
}

/// Code that confirms an account deletion.
///
/// The message holds no link, because the deletion needs the signed-in App.
pub fn delete_account(code: &str) -> Email {
    let minutes = DELETE_ACCOUNT_CODE_MINUTES;
    let escaped = escape(code);
    Email {
        subject: "确认注销薄肌账号",
        text: format!(
            "你正在注销薄肌账号。请在 App 中输入以下确认码，完成注销：\n\n{code}\n\n\
             确认码在 {minutes} 分钟内有效。注销后，账号、会员卡和训练记录会被永久删除，无法恢复。\n\n\
             如果不是你发起的请求，请忽略此邮件，并尽快修改密码。"
        ),
        html: format!(
            "<p>你正在注销薄肌账号。请在 App 中输入以下确认码，完成注销：</p>\
             <p><code>{escaped}</code></p>\
             <p>确认码在 {minutes} 分钟内有效。注销后，账号、会员卡和训练记录会被永久删除，无法恢复。</p>\
             <p>如果不是你发起的请求，请忽略此邮件，并尽快修改密码。</p>"
        ),
    }
}

/// Confirmation of an email change, sent to the current address.
pub fn change_email_confirmation(new_email: &str, url: &str) -> Email {
    let hours = VERIFICATION_LINK_HOURS;
    let address = escape(new_email);
    let link = escape(url);
    Email {
        subject: "确认更换薄肌邮箱",
        text: format!(
            "你的薄肌账号申请把登录邮箱改为 {new_email}。\
             如果是你本人操作，请在 {hours} 小时内打开以下链接确认：\n{url}\n\n\
             确认后，新邮箱会收到一封验证邮件。新邮箱通过验证后，更换才会生效。\n\n\
             如果不是你发起的请求，请不要打开链接，并尽快修改密码。"
        ),
        html: format!(
            "<p>你的薄肌账号申请把登录邮箱改为 {address}。\
             如果是你本人操作，请在 {hours} 小时内打开以下链接确认：</p>\
             <p><a href=\"{link}\">确认更换邮箱</a></p>\
             <p>确认后，新邮箱会收到一封验证邮件。新邮箱通过验证后，更换才会生效。</p>\
             <p>如果不是你发起的请求，请不要打开链接，并尽快修改密码。</p>"
        ),
    }
}

/// Escape text for an HTML element or a quoted attribute.
fn escape(value: &str) -> String {
    let mut escaped = String::with_capacity(value.len());
    for character in value.chars() {
        match character {
            '&' => escaped.push_str("&amp;"),
            '<' => escaped.push_str("&lt;"),
            '>' => escaped.push_str("&gt;"),
            '"' => escaped.push_str("&quot;"),
            '\'' => escaped.push_str("&#39;"),
            _ => escaped.push(character),
        }
    }
    escaped
}

/// Returns the `email` property of a Better Auth user, or `None` when it is not a string.
fn user_email(user: &FieldValue) -> Option<String> {
    user.model_property("email")
        .ok()
        .and_then(|email| email.decode::<Option<String>>().ok())
        .flatten()
}

async fn deliver(mailer: &Mailer, to: Option<&str>, email: Email) -> AuthResult<()> {
    let to = to
        .filter(|value| !value.is_empty())
        .ok_or_else(|| AuthError::internal(MailFailure::MissingRecipient.to_string()))?;
    mailer
        .send(to, email.subject, &email.html, &email.text)
        .await
}

/// Code that verifies a school email address for the `school` affiliation.
///
/// The message holds no link, because the code is entered in the signed-in
/// App. The lifetime comes from `domain::organization::policy::CODE_LIFETIME`.
pub fn school_verification(code: &str) -> Email {
    let minutes = crate::domain::organization::policy::CODE_LIFETIME.num_minutes();
    let escaped = escape(code);
    Email {
        subject: "薄肌学校认证验证码",
        text: format!(
            "你正在用这个学校邮箱认证你在薄肌的学校。请在 App 中输入以下验证码：\n\n{code}\n\n\
             验证码在 {minutes} 分钟内有效。薄肌不保存完整的邮箱地址。\n\n\
             如果不是你发起的请求，请忽略此邮件。"
        ),
        html: format!(
            "<p>你正在用这个学校邮箱认证你在薄肌的学校。请在 App 中输入以下验证码：</p>\
             <p><code>{escaped}</code></p>\
             <p>验证码在 {minutes} 分钟内有效。薄肌不保存完整的邮箱地址。</p>\
             <p>如果不是你发起的请求，请忽略此邮件。</p>"
        ),
    }
}

/// Send a [`affiliation_verification`] message to an organization address.
pub async fn send_school_verification(mailer: &Mailer, to: &str, code: &str) -> AuthResult<()> {
    deliver(mailer, Some(to), school_verification(code)).await
}

/// Sends [`verification`] messages.
#[derive(Clone, Debug)]
pub struct VerificationEmailSender {
    mailer: Mailer,
}

impl VerificationEmailSender {
    /// Creates a sender that uses `mailer`.
    pub fn new(mailer: Mailer) -> Self {
        Self { mailer }
    }
}

#[async_trait]
impl SendVerificationEmail for VerificationEmailSender {
    async fn send(&self, user: &FieldValue, url: &str, _token: &str) -> AuthResult<()> {
        deliver(&self.mailer, user_email(user).as_deref(), verification(url)).await
    }
}

/// Sends [`password_reset`] messages.
#[derive(Clone, Debug)]
pub struct PasswordResetEmailSender {
    mailer: Mailer,
}

impl PasswordResetEmailSender {
    /// Creates a sender that uses `mailer`.
    pub fn new(mailer: Mailer) -> Self {
        Self { mailer }
    }
}

#[async_trait]
impl SendResetPassword for PasswordResetEmailSender {
    async fn send(&self, user: &serde_json::Value, url: &str, _token: &str) -> AuthResult<()> {
        let to = user.get("email").and_then(serde_json::Value::as_str);
        deliver(&self.mailer, to, password_reset(url)).await
    }
}

/// Sends [`delete_account`] messages.
#[derive(Clone, Debug)]
pub struct DeleteAccountEmailSender {
    mailer: Mailer,
}

impl DeleteAccountEmailSender {
    /// Creates a sender that uses `mailer`.
    pub fn new(mailer: Mailer) -> Self {
        Self { mailer }
    }
}

#[async_trait]
impl SendDeleteAccountVerification for DeleteAccountEmailSender {
    async fn send(
        &self,
        user: &FieldValue,
        _url: &str,
        token: &str,
        _request: Option<&AuthRequest>,
    ) -> AuthResult<()> {
        deliver(
            &self.mailer,
            user_email(user).as_deref(),
            delete_account(token),
        )
        .await
    }
}

/// Sends [`change_email_confirmation`] messages to the current address.
#[derive(Clone, Debug)]
pub struct ChangeEmailConfirmationSender {
    mailer: Mailer,
}

impl ChangeEmailConfirmationSender {
    /// Creates a sender that uses `mailer`.
    pub fn new(mailer: Mailer) -> Self {
        Self { mailer }
    }
}

#[async_trait]
impl SendChangeEmailConfirmation for ChangeEmailConfirmationSender {
    async fn send(
        &self,
        user: &FieldValue,
        new_email: &str,
        url: &str,
        _token: &str,
    ) -> AuthResult<()> {
        let email = change_email_confirmation(new_email, url);
        deliver(&self.mailer, user_email(user).as_deref(), email).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn html_bodies_escape_inserted_values() {
        let email = change_email_confirmation(
            "\"<b>\"@example.com",
            "https://example.com/verify?token=a&callbackURL=x",
        );
        assert!(email.html.contains("&quot;&lt;b&gt;&quot;@example.com"));
        assert!(email.html.contains("token=a&amp;callbackURL=x"));
        assert!(email.text.contains("token=a&callbackURL=x"));
    }

    #[test]
    fn copy_states_the_configured_lifetimes() {
        assert!(verification("u").text.contains("1 小时内"));
        assert!(password_reset("u").text.contains("1 小时内"));
        assert!(
            change_email_confirmation("a@example.com", "u")
                .text
                .contains("1 小时内")
        );
        let deletion = delete_account("0123abcd");
        assert!(deletion.text.contains("15 分钟内"));
        assert!(deletion.text.contains("0123abcd") && deletion.html.contains("0123abcd"));
        assert!(!deletion.html.contains("href"));
        let organization = school_verification("012345");
        assert!(organization.text.contains("10 分钟内"));
        assert!(organization.text.contains("012345") && organization.html.contains("012345"));
        assert!(!organization.html.contains("href"));
    }
}
