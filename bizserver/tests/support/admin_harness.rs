//! Private real-HTTP and PostgreSQL fixture support for admin contract tests.

use axum::Router;
use boji_bizserver::{
    app, auth,
    auth_schema::{session, user},
    entities::{entitlement, membership_entitlement},
    migrations,
};
use chrono::{DateTime, Utc};
use reqwest::{Client, Response, StatusCode};
use sea_orm::sea_query::Expr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectOptions, ConnectionTrait, Database, DatabaseConnection,
    DbBackend, EntityTrait, QueryFilter, Set, Statement,
};
use serde_json::{Value, json};
use std::{env, time::Duration};
use tempfile::TempDir;
use tokio::{sync::oneshot, task::JoinHandle};
use uuid::Uuid;

pub struct Harness {
    pub client: Client,
    pub database: DatabaseConnection,
    pub origin: String,
    control: DatabaseConnection,
    mail: TempDir,
    schema: String,
    server: Option<JoinHandle<()>>,
    stop: Option<oneshot::Sender<()>>,
}

pub struct Identity {
    pub raw_token: String,
    pub token: String,
    pub user_id: String,
}

pub struct Enrollment {
    /// The resource name `users/{user}/memberships/{membership}`.
    pub name: String,
    pub membership_id: String,
    pub member_number: String,
}

impl Harness {
    pub async fn setup() -> Self {
        let database_url = env::var("TEST_DATABASE_URL")
            .expect("admin contract tests require an isolated TEST_DATABASE_URL");
        let control = Database::connect(&database_url)
            .await
            .expect("connect to the explicitly selected test database");
        let schema = format!("admin_contract_{}", Uuid::new_v4().simple());
        control
            .execute_unprepared(&format!("CREATE SCHEMA \"{schema}\""))
            .await
            .expect("create a unique private test schema");

        let mut options = ConnectOptions::new(database_url);
        options
            .set_schema_search_path(schema.clone())
            .max_connections(8)
            .sqlx_logging(false);
        let database = Database::connect(options)
            .await
            .expect("connect to the private test schema");
        migrations::migrate(&database)
            .await
            .expect("migrate the private test schema");

        let mail = TempDir::new().expect("create private authentication mail directory");
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind private HTTP listener");
        let origin = format!(
            "http://{}",
            listener.local_addr().expect("listener address")
        );
        let authentication = auth::build(
            database.clone(),
            auth::AuthOptions {
                secret: "admin-contract-signing-key-not-for-production".into(),
                base_url: origin.clone(),
                trusted_origins: vec![origin.clone()],
                mail_output_directory: mail.path().to_owned(),
                apple: None,
                account_linking: auth::AccountLinking::Disabled,
            },
        )
        .await
        .expect("build real authentication service");
        let router: Router = app::router(
            database.clone(),
            authentication,
            std::slice::from_ref(&origin),
            boji_bizserver::rpc::Capabilities::default(),
        )
        .expect("compose real HTTP router");
        let (stop, stopped) = oneshot::channel();
        let server = tokio::spawn(async move {
            axum::serve(listener, router)
                .with_graceful_shutdown(async {
                    let _ = stopped.await;
                })
                .await
                .expect("run private HTTP server");
        });
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("build HTTP client");

        Self {
            client,
            database,
            origin,
            control,
            mail,
            schema,
            server: Some(server),
            stop: Some(stop),
        }
    }

    pub async fn register_verified(&self, label: &str) -> Identity {
        let email = format!("{label}-{}@example.test", Uuid::new_v4());
        let password = "test-only-not-a-real-account-Password!123";
        let signed_up = self
            .client
            .post(format!("{}/api/auth/sign-up/email", self.origin))
            .header("origin", &self.origin)
            .json(&json!({"name":label,"email":email,"password":password}))
            .send()
            .await
            .expect("register fixture user");
        assert!(
            signed_up.status().is_success(),
            "registration failed with {}",
            signed_up.status()
        );
        let sent = self
            .client
            .post(format!("{}/api/auth/send-verification-email", self.origin))
            .header("origin", &self.origin)
            .json(&json!({"email":email}))
            .send()
            .await
            .expect("send verification message");
        assert_eq!(sent.status(), StatusCode::OK);
        let verification = self.read_mail_url(&email, "/verify-email").await;
        let verified = self
            .client
            .get(verification)
            .send()
            .await
            .expect("open verification link");
        assert!(
            verified.status().is_success() || verified.status().is_redirection(),
            "verification failed with {}",
            verified.status()
        );
        let signed_in = self
            .client
            .post(format!("{}/api/auth/sign-in/email", self.origin))
            .header("origin", &self.origin)
            .json(&json!({"email":email,"password":password}))
            .send()
            .await
            .expect("sign in verified fixture user");
        assert_eq!(signed_in.status(), StatusCode::OK);
        let token = signed_in
            .headers()
            .get("set-auth-token")
            .expect("signed token response header")
            .to_str()
            .expect("UTF-8 signed token")
            .to_owned();
        let body: Value = signed_in.json().await.expect("sign-in JSON response");
        let raw_token = body
            .get("token")
            .and_then(Value::as_str)
            .expect("framework exposes the raw token in its native response")
            .to_owned();
        let fixture_user = user::Entity::find()
            .filter(user::Column::Email.eq(email.as_str()))
            .one(&self.database)
            .await
            .expect("find fixture user")
            .expect("registered fixture user");
        Identity {
            raw_token,
            token,
            user_id: fixture_user.id,
        }
    }

    pub async fn enroll(&self, identity: &Identity, nickname: &str) -> Enrollment {
        let response = self
            .rpc_json(
                "boji.v1.MembershipService/CreateMembership",
                Some(&identity.token),
                json!({"parent":"users/me","membership":{"nickname":nickname,"termsVersion":"community-v1"}}),
            )
            .await;
        assert_eq!(response.status(), StatusCode::OK);
        let body: Value = response.json().await.expect("created membership JSON");
        let name = body["name"].as_str().expect("membership name").to_owned();
        let membership_id = name
            .rsplit('/')
            .next()
            .expect("membership ID segment")
            .to_owned();
        assert_eq!(
            name,
            format!("users/{}/memberships/{membership_id}", identity.user_id)
        );
        Enrollment {
            name,
            membership_id,
            member_number: body["memberNumber"]
                .as_str()
                .expect("opaque member number")
                .to_owned(),
        }
    }

    pub async fn rpc_json(&self, method: &str, token: Option<&str>, body: Value) -> Response {
        let mut request = self
            .client
            .post(self.rpc_url(method))
            .header("connect-protocol-version", "1")
            .json(&body);
        if let Some(token) = token {
            request = request.bearer_auth(token);
        }
        request.send().await.expect("send Connect JSON request")
    }

    pub async fn rpc_proto(&self, method: &str, token: &str, body: Vec<u8>) -> Response {
        self.client
            .post(self.rpc_url(method))
            .bearer_auth(token)
            .header("content-type", "application/proto")
            .header("connect-protocol-version", "1")
            .body(body)
            .send()
            .await
            .expect("send Connect protobuf request")
    }

    /// `method` is the full procedure, for example
    /// `boji.admin.v1.MembershipService/GetMembership`.
    pub fn rpc_url(&self, method: &str) -> String {
        format!("{}/{method}", self.origin)
    }

    pub async fn set_role(&self, user_id: &str, role: &str) {
        user::Entity::update_many()
            .col_expr(user::Column::Role, Expr::value(role.to_owned()))
            .filter(user::Column::Id.eq(user_id))
            .exec(&self.database)
            .await
            .expect("change fixture role");
    }

    pub async fn set_email_verified(&self, user_id: &str, verified: bool) {
        user::Entity::update_many()
            .col_expr(user::Column::EmailVerified, Expr::value(verified))
            .filter(user::Column::Id.eq(user_id))
            .exec(&self.database)
            .await
            .expect("change fixture verification state");
    }

    pub async fn set_session_created_at(&self, user_id: &str, created_at: DateTime<Utc>) {
        session::Entity::update_many()
            .col_expr(session::Column::CreatedAt, Expr::value(created_at))
            .filter(session::Column::UserId.eq(user_id))
            .exec(&self.database)
            .await
            .expect("change fixture session creation time");
    }

    pub async fn revoke_sessions(&self, user_id: &str) {
        session::Entity::update_many()
            .col_expr(session::Column::Active, Expr::value(false))
            .filter(session::Column::UserId.eq(user_id))
            .exec(&self.database)
            .await
            .expect("revoke fixture sessions");
    }

    pub async fn session_is_active(&self, user_id: &str) -> bool {
        session::Entity::find()
            .filter(session::Column::UserId.eq(user_id))
            .one(&self.database)
            .await
            .expect("read fixture session")
            .is_some_and(|record| record.active)
    }

    pub async fn set_entitlement_active(&self, entitlement_id: Uuid, active: bool) {
        entitlement::Entity::update_many()
            .col_expr(entitlement::Column::IsActive, Expr::value(active))
            .filter(entitlement::Column::Id.eq(entitlement_id))
            .exec(&self.database)
            .await
            .expect("change fixture entitlement activity");
    }

    pub async fn add_catalog_entry(&self, code: &str) -> Uuid {
        let id = Uuid::new_v4();
        let now = Utc::now();
        entitlement::ActiveModel {
            id: Set(id),
            code: Set(code.to_owned()),
            name: Set("Admin contract fixture".into()),
            description: Set("Private pagination fixture.".into()),
            is_active: Set(true),
            created_at: Set(now),
            updated_at: Set(now),
        }
        .insert(&self.database)
        .await
        .expect("insert private catalog fixture");
        id
    }

    pub async fn expire_grant(&self, membership_id: Uuid, entitlement_id: Uuid) {
        membership_entitlement::Entity::update_many()
            .col_expr(
                membership_entitlement::Column::ExpiresAt,
                Expr::value(Utc::now() - chrono::Duration::minutes(1)),
            )
            .filter(membership_entitlement::Column::MembershipId.eq(membership_id))
            .filter(membership_entitlement::Column::EntitlementId.eq(entitlement_id))
            .exec(&self.database)
            .await
            .expect("expire private grant fixture");
    }

    pub async fn audit_count(&self) -> i64 {
        let row = self
            .database
            .query_one_raw(Statement::from_string(
                DbBackend::Postgres,
                "SELECT COUNT(*) AS count FROM admin_audit_event",
            ))
            .await
            .expect("count audit events")
            .expect("audit event count row");
        row.try_get("", "count").expect("audit event count value")
    }

    /// Return the action and the reason of the newest audit event.
    pub async fn latest_audit(&self) -> (String, String) {
        let row = self
            .database
            .query_one_raw(Statement::from_string(
                DbBackend::Postgres,
                "SELECT action, reason FROM admin_audit_event ORDER BY created_at DESC LIMIT 1",
            ))
            .await
            .expect("read newest audit event")
            .expect("stored audit event");
        (
            row.try_get("", "action").expect("stored audit action"),
            row.try_get("", "reason").expect("stored audit reason"),
        )
    }

    pub async fn make_audit_insert_fail(&self) {
        self.database
            .execute_unprepared(
                "CREATE FUNCTION admin_contract_audit_fail() RETURNS trigger LANGUAGE plpgsql AS $$\
                 BEGIN RAISE EXCEPTION 'admin contract audit failure'; END; $$;\
                 CREATE TRIGGER admin_contract_audit_fail BEFORE INSERT ON admin_audit_event \
                 FOR EACH ROW EXECUTE FUNCTION admin_contract_audit_fail();",
            )
            .await
            .expect("install private audit failure trigger");
    }

    pub async fn shutdown(&mut self) {
        if let Some(stop) = self.stop.take() {
            let _ = stop.send(());
        }
        if let Some(server) = self.server.take() {
            server.await.expect("join private HTTP server");
        }
        self.database
            .clone()
            .close()
            .await
            .expect("close private schema pool");
        self.control
            .execute_unprepared(&format!("DROP SCHEMA \"{}\" CASCADE", self.schema))
            .await
            .expect("drop private test schema");
        self.control
            .clone()
            .close()
            .await
            .expect("close control pool");
    }

    async fn read_mail_url(&self, email: &str, path: &str) -> String {
        for _ in 0..50 {
            for entry in std::fs::read_dir(self.mail.path()).expect("read private mail directory") {
                let text = std::fs::read_to_string(entry.expect("mail entry").path())
                    .expect("read private mail message");
                if !text.starts_with(&format!("To: {email}\n")) {
                    continue;
                }
                for word in text.split_whitespace() {
                    if word.starts_with("http://") && word.contains(path) {
                        return word.to_owned();
                    }
                }
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        panic!("expected verification email for {email}");
    }
}
