# Boji business server

This directory is the Rust migration target. Use Axum, better-auth-rs, ConnectRPC, SeaORM, and PostgreSQL. Authentication stays at `/api/auth/*`. Business APIs use generated ConnectRPC services.

Do not reimplement Connect framing or password and session algorithms. Use `app::router` for HTTP composition. Its authentication response policy closes a verified-email gap in the pinned alpha dependency. Keep that policy until upstream behavior and regression tests justify removal.

## Directory map

| Path | Purpose |
| --- | --- |
| `src/auth*`, `src/mail.rs` | Native authentication, application-owned entities, and delivery adapters |
| `src/domain/` | Transport-independent membership and activity rules |
| `src/entities/` | SeaORM business entities |
| `src/migrations*` | Versioned PostgreSQL migrations |
| `src/rpc*`, `proto/` | ConnectRPC adapters and canonical protobuf contracts |
| `tests/` | Contract and database integration tests |
| `docs/` | Chinese interface and migration documents |
| `Dockerfile`, `compose.yml` | Development image and isolated local services |

## Migration safety

The previous service at `/Users/Xuan/Developer/AprilNEA/bojifit/bizserver` is a read-only reference. Never copy its environment, database files, credentials, `.data`, `.work`, or dependencies here. Do not migrate a real or shared database automatically. Preserve that service until parity and data conversion are approved.

Production startup currently fails closed. Do not remove that guard while authentication parity, delivery, throttling, and data conversion remain incomplete. Never present an unimplemented capability as available.

## Commands

Run these commands in this directory inside the devenv shell of the repository root. devenv provides Rust from `rust-toolchain.toml`, `protoc` for `build.rs`, `buf`, OpenSSL and `pkg-config`. `better-auth` links `openssl-sys` through `josekit` and `webauthn-rs-core`, so the build needs OpenSSL.

- `cargo fmt --all --check`
- `cargo clippy --locked --all-targets -- -D warnings`
- `cargo test --locked`
- `buf lint`
- `cargo run --locked -- migrate`
- `cargo run --locked -- serve`

To change the Rust version, update `rust-toolchain.toml`, `rust-version` in `Cargo.toml` and the base image in `Dockerfile` in the same change. devenv reads `rust-toolchain.toml`, so `devenv.nix` needs no change.

Database tests are ignored by default. Set `TEST_DATABASE_URL` to an isolated PostgreSQL database before running `cargo test --locked -- --include-ignored --test-threads=1`. Never run those tests against production or the shared client fixture.

## Code and collaboration

Read the Rust coding skill. Use domain types, documented public items, and typed errors. Keep source files below 500 lines where practical. Write agent guides in English and human documentation in Chinese.

Clients treat membership numbers as opaque strings. Keep allocation details inside the server. Do not modify client directories or their working changes as part of a backend-only task.

Keep `Cargo.lock` tracked. Do not commit without permission. Follow the root Git and attribution rules.
