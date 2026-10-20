# Boji business server

This directory is the Rust migration target. Use Axum, better-auth-rs, ConnectRPC, SeaORM, and PostgreSQL. Authentication stays at `/api/auth/*`. Business APIs use generated ConnectRPC services.

Do not reimplement Connect framing or password and session algorithms. Use `app::router` for HTTP composition. Its authentication response policy closes a verified-email gap in the pinned alpha dependency. Keep that policy until upstream behavior and regression tests justify removal.

## Directory map

| Path | Purpose |
| --- | --- |
| `src/config.rs`, `src/config/` | Service configuration through `figment`: the only reader of service environment variables |
| `src/auth*`, `src/mail*` | Native authentication, application-owned entities, and mail delivery: SMTP relay or local files |
| `src/apple.rs` | Sign in with Apple provider assembly and the stored-email fallback |
| `src/wallet.rs`, `src/wallet/` | Apple Wallet signing material checks, pass packaging, and PKCS #7 signatures |
| `assets/wallet/` | Pass icons and the Apple Root CA that `src/wallet.rs` embeds at build time |
| `src/domain/` | Transport-independent membership, administration, and activity rules |
| `src/admin_auth.rs`, `src/admin_permissions.rs` | Native permission checks and application-owned business role grants |
| `src/entities/` | SeaORM business entities |
| `src/migrations*` | Versioned PostgreSQL migrations |
| `src/rpc*` | ConnectRPC adapters: errors, resource names, page tokens, filters and conversions |
| `proto/boji/v1/` | Canonical owner API: system, membership, activity and Wallet contracts, and `ErrorReason` |
| `proto/boji/admin/v1/` | Canonical operations API: entitlement catalog and membership administration |
| `tests/` | Contract and database integration tests |
| `docs/` | Chinese interface and migration documents |
| `buf.yaml`, `buf.lock` | buf workspace of `proto/` and the pinned googleapis dependency from the BSR |
| `Dockerfile`, `compose.yml` | Development image and isolated local services |

## Migration safety

The previous service at `/Users/Xuan/Developer/AprilNEA/bojifit/bizserver` never went live. It is a read-only feature reference, not a compatibility target. Do not keep its REST paths, error format, password hashes, sessions, or data for compatibility, and do not add data conversion. Never copy its environment, database files, credentials, `.data`, `.work`, or dependencies here. Do not migrate a real or shared database automatically.

`APP_ENV=production` requires the production checks in `src/config.rs`: an HTTPS `BETTER_AUTH_URL`, HTTPS origins, `SMTP_HOST` with `MAIL_FROM`, and SMTP over TLS or STARTTLS. Add a check there when a new setting is unsafe in production. Never present an unimplemented capability as available.

`boji.admin.v1.EntitlementService` and `boji.admin.v1.MembershipService` are registered. Their handlers require a signed Bearer, verified email, fresh authoritative session, and native Admin permissions before target lookup. Deny banned accounts and impersonation. Keep business writes and audit inserts in one transaction. When an implementation changes a contract rule, update the proto comments and `docs/connectrpc-api.md` in the same change.

## Configuration

Read every service setting in `src/config.rs` through `figment`. `src/config/source.rs` holds the only table of environment variable names. Other modules receive typed values from `Config` and never call `std::env::var`. Tests may read `TEST_DATABASE_URL`, and `build.rs` may read Cargo variables, because they are not service settings.

To add a setting, add the variable to `VARIABLES` in `src/config/source.rs`, add a field to the raw settings, validate it in `src/config.rs`, and add a unit test for the invalid values. Update `.env.example` and the configuration table in `README.md` in the same change. An empty value means unset. Error messages name the variable and never contain its value.

## Mail, account lifecycle, and gateway

`src/mail.rs` selects the transport. Without `SMTP_HOST`, development and tests write private local files. Never log SMTP credentials or message bodies. There is no outbox: a failed send is not retried.

`auth::build` installs the Better Auth user management plugin. Account deletion needs a code from an email to the account address. Email change needs a confirmation from the old address, and then verification of the new address. Every business table that references `user` must use `ON DELETE CASCADE`, except audit actor and target columns, which use `SET NULL`. A new table that references `user` needs the same choice and a case in `tests/account_contract.rs`.

Keep the `auth::UserDeletion` before-delete hook. It deletes the `user` row in one statement, so the cascades are atomic. Without it, Better Auth deletes sessions and accounts in separate statements, and then fails on the `api_keys` table that this service does not create. That failure leaves a user who cannot sign in. When you upgrade better-auth-rs, run `tests/account_contract.rs` before you remove or change the hook.

The service has no request rate limiter and does not trust forwarding headers by default. The CDN and the gateway in front of it limit requests and terminate connections. `CLIENT_IP_HEADER` must name a header that the gateway overwrites. Do not add an in-process limiter without a documented need.

## Apple Wallet

`WalletService` is always registered. `PassSigner::new` rejects a key that does not match the signer certificate, a signer subject whose UID or OU differs from the configuration, and a chain that does not end at the embedded Apple Root CA. A failed check stops startup. Expired or not-yet-valid certificates do not stop startup: `ServerConfig.wallet_pass_enabled` is false and the service returns `WALLET_NOT_CONFIGURED`. Keep both checks on the same `PassSigner::is_current`.

Never commit a real Pass Type ID certificate, private key, or `.pkpass` file. `tests/wallet_contract.rs` creates a private test chain at run time. When the app icon changes, regenerate the pass icons with the commands in `assets/wallet/README.md`.

## API design

The protobuf API follows Google AIPs. No released client uses it yet, so a contract change needs no compatibility layer. Apply these rules:

- Address every resource by its AIP-122 name. Parse and format names only in `src/rpc/names.rs`. Owner methods accept `me` or the caller ID as `{user}`. Operations methods also accept `-`.
- Build every error in `src/rpc/error.rs` with `aip_193::proto`. Each error carries exactly one `google.rpc.ErrorInfo` with the domain `boji.leanmuscle.club`. `INVALID_ARGUMENT` errors also carry `BadRequest`, and `NOT_FOUND` errors also carry `ResourceInfo`.
- Add a new error reason to `ErrorReason` in `proto/boji/v1/error_reason.proto`. Do not define reasons in Rust.
- Parse AIP-160 filters with `aip_160::parse_filter` in `src/rpc/filter.rs`, then accept only the supported subset there. Do not write another filter parser.
- Use `page_size`, `page_token` and `next_page_token` for lists. Bind each page token to its method and request parameters. Use `src/rpc/pagination.rs`.
- Return the resource from Get, Create and state-change methods. A state change whose target state already exists returns `FAILED_PRECONDITION` and writes no audit event, except `GrantEntitlement`, which returns the existing grant.
- Run `buf lint`, the `buf format` check and `api-linter`. `api-linter` must report zero problems. Disable a rule only for one element, with a `(-- api-linter: ... aip.dev/not-precedent: ... --)` comment that states the reason. Explain every `buf.yaml` lint exception in a comment.

`buf.yaml` defines the buf workspace, and `proto/` is its only module. `buf.lock` pins googleapis from the BSR. To update googleapis, run `buf dep update` here, then set the googleapis commit in `../ios/BojiAPI/buf.gen.yaml` to the new commit. `build.rs` runs `buf build` on the workspace and maps `google.rpc` to `aip_193::proto` with an `extern_path`. Generate only Boji files and `google/type/date.proto`; do not generate `google.rpc` here.

Clients generate their code from this workspace. After a change to `proto/boji/v1/`, run `buf generate` in `../ios/BojiAPI/` and in `../android/rpc/`, and include the regenerated Swift and Kotlin files in the same change. This is the one exception to the rule against changes in client directories: a contract change must not leave the generated client code stale.

Sign in with Apple is enabled only when every `APPLE_*` variable is set. `rpc::Capabilities::apple_sign_in` must match the providers installed by `auth::build`. better-auth-rs signs and renews the Apple client secret. Do not add a static client secret or a renewal job here.

`ACCOUNT_LINKING` selects `auth::AccountLinking`, which defaults to `Disabled`. `AccountLinking::config` sets every Better Auth linking field explicitly. When linking is enabled, keep these settings: no trusted providers, a verified local email, equal emails, and no profile overwrite. Changing any of them requires a security review and an update to `docs/migration-auth.md`.

The `better-auth` dependency is pinned to crates.io version `=1.0.0-alpha.4`. It includes the Apple signer and the Admin permission API. Keep the exact version requirement and `Cargo.lock`. Do not replace it with a local path or a moving Git branch. Run authentication, permission, and database contract tests when upgrading it. Historical copies under `.work/` are not build inputs.

## Commands

Run these commands in this directory inside the devenv shell of the repository root. devenv provides Rust from `rust-toolchain.toml`, `buf` for `build.rs`, OpenSSL and `pkg-config`. Set `BUF` to use another `buf` binary. The first build needs network access to fetch googleapis from the BSR into the buf cache. `better-auth` links `openssl-sys` through `josekit` and `webauthn-rs-core`, so the build needs OpenSSL.

- `cargo fmt --check`
- `cargo clippy --locked --all-targets -- -D warnings`
- `cargo test --locked`
- `buf lint`
- `buf format -d --exit-code`
- `api-linter` on an export of the workspace and its googleapis dependency: `buf export . -o ../.work/buf-export && (cd ../.work/buf-export && api-linter --set-exit-status -I . $(find boji -name '*.proto'))`
- `cargo run --locked -- migrate`
- `cargo run --locked -- serve`

devenv does not provide `api-linter`. Install version 1.72.0 into the ignored root `.work/tools/bin/` with `GOBIN="$PWD/../.work/tools/bin" go install github.com/googleapis/api-linter/cmd/api-linter@v1.72.0`. This requires Go.

To change the Rust version, update `rust-toolchain.toml`, `rust-version` in `Cargo.toml` and the base image in `Dockerfile` in the same change. devenv reads `rust-toolchain.toml`, so `devenv.nix` needs no change.

The image build copies `buf` from the `bufbuild/buf` image. Keep that image tag in `Dockerfile` equal to the buf version that devenv provides.

Run the local database only with `docker compose up -d postgres` on ArcBox. Confirm that `docker context show` prints `arcbox` first, or set `DOCKER_CONTEXT=arcbox` for the command. If `~/.arcbox/bin/abctl daemon status` reports `stopped`, start ArcBox with `~/.arcbox/bin/abctl daemon start`. Do not set up local PostgreSQL with devenv, Nix binaries, Homebrew, or `initdb`. The Compose database listens on `127.0.0.1:55439`.

Database tests are ignored by default. Create a `boji_test` database in the Compose PostgreSQL with `docker compose exec -T postgres createdb -U boji boji_test`. Point `TEST_DATABASE_URL` at it before running `cargo test --locked -- --include-ignored --test-threads=1`. Never run those tests against `boji_rust`, production, or the shared client fixture.

## Code and collaboration

Read the Rust coding skill. Use domain types, documented public items, and typed errors. Keep source files below 500 lines where practical. Write agent guides in English and human documentation in Chinese.

Clients treat membership numbers as opaque strings. Keep allocation details inside the server. Do not modify client directories or their working changes as part of a backend-only task.

Keep `Cargo.lock` tracked. Do not commit without permission. Follow the root Git and attribution rules.
