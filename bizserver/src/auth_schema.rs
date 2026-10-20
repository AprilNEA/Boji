//! Application-owned SeaORM entities used by Better Auth.
//!
//! The table names intentionally match the existing Boji authentication schema:
//! `user`, `session`, `account`, and `verification`.

pub mod account;
pub mod session;
pub mod user;
pub mod verification;

/// The Better Auth schema that binds Boji's application-owned SeaORM entities.
#[derive(Debug, Clone, Copy)]
pub struct BojiAuthSchema;

impl better_auth::AuthSchema for BojiAuthSchema {
    type User = user::Model;
    type Session = session::Model;
    type Account = account::Model;
    type Verification = verification::Model;
}
