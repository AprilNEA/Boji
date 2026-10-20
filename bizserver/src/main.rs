use anyhow::{Context, Result, bail};
use boji_bizserver::{app, auth, config::Config, migrations};
use sea_orm::{ConnectOptions, Database};
use std::{process::ExitCode, time::Duration};

#[tokio::main]
async fn main() -> ExitCode {
    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            // Boundary errors are sanitized; never print their database source chains.
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}

async fn run() -> Result<()> {
    if let Err(error) = dotenvy::dotenv()
        && !error.not_found()
    {
        bail!("Cannot load .env file");
    }
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("off,boji_bizserver=info"));
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(filter)
        .init();
    let command = std::env::args().nth(1).unwrap_or_else(|| "serve".into());
    if !matches!(command.as_str(), "serve" | "migrate") {
        bail!("Usage: boji-bizserver [serve|migrate]");
    }
    let config = Config::from_env()?;
    if command == "serve" && config.production {
        bail!(
            "Production rollout is blocked until authentication and mail migration parity is verified"
        );
    }
    let mut options = ConnectOptions::new(config.database_url);
    options
        .max_connections(10)
        .connect_timeout(Duration::from_secs(5))
        .acquire_timeout(Duration::from_secs(5))
        .sqlx_logging(false);
    let database = Database::connect(options)
        .await
        .context("Database connection failed")?;
    if command == "migrate" {
        migrations::migrate(&database)
            .await
            .context("Schema migration failed; only a fresh Rust database is supported")?;
        database.close().await.context("Database close failed")?;
        tracing::info!(event = "schema_migrated");
        return Ok(());
    }
    migrations::ensure_current(&database)
        .await
        .context("Run explicit migrations against an isolated Rust database before serving")?;
    let auth = auth::build(
        database.clone(),
        auth::AuthOptions {
            secret: config.auth_secret,
            base_url: config.auth_url,
            trusted_origins: config.trusted_origins,
            mail_output_directory: config.mail_dir,
        },
    )
    .await
    .context("Authentication initialization failed")?;
    let router = app::router(database.clone(), auth, &config.cors_origins)
        .context("HTTP configuration failed")?;
    let listener = tokio::net::TcpListener::bind(config.bind)
        .await
        .context("Cannot bind HTTP listener")?;
    tracing::info!(event = "server_started", address = %config.bind);
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("HTTP server failed")?;
    database.close().await.context("Database close failed")?;
    Ok(())
}

async fn shutdown_signal() {
    #[cfg(unix)]
    {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut terminate) => {
                tokio::select! { result = tokio::signal::ctrl_c() => { if result.is_err() { tracing::error!(event="signal_handler_failed"); } }, _ = terminate.recv() => {} }
            }
            Err(_) => tracing::error!(event = "signal_handler_failed"),
        }
    }
    #[cfg(not(unix))]
    if tokio::signal::ctrl_c().await.is_err() {
        tracing::error!(event = "signal_handler_failed");
    }
    tracing::info!(event = "server_stopping");
}
