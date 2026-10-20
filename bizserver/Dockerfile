# syntax=docker/dockerfile:1
# The boji-bizserver image. compose.yml builds it for local development, and
# .github/workflows/image.yml publishes it to GHCR for each bizserver/v* tag.
#
# build.rs runs `buf build` on the workspace in buf.yaml. Keep the buf image
# tag equal to the buf version in devenv.nix.
FROM bufbuild/buf:1.73.0 AS buf

# Keep the Rust version equal to rust-toolchain.toml and rust-version in Cargo.toml.
FROM rust:1.99.0-slim-bookworm AS build
ARG TARGETPLATFORM
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
COPY --from=buf /usr/local/bin/buf /usr/local/bin/buf
WORKDIR /src
COPY Cargo.toml Cargo.lock build.rs buf.yaml buf.lock ./
COPY src ./src
COPY proto ./proto
# src/wallet.rs embeds the Apple Root CA and the pass icons from assets/wallet.
COPY assets ./assets
# The cache mounts keep the crate registry, the buf module cache and the
# compiled dependencies between local builds. They are not part of the image.
# Each platform has its own target cache. The binary leaves the cache in the
# same step, because a later step cannot read a cache mount.
RUN --mount=type=cache,id=bizserver-cargo-registry,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,id=bizserver-buf,target=/root/.cache/buf,sharing=locked \
    --mount=type=cache,id=bizserver-target-${TARGETPLATFORM},target=/src/target,sharing=locked \
    cargo build --release --locked --bin boji-bizserver \
    && cp target/release/boji-bizserver /usr/local/bin/boji-bizserver

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 boji && useradd --uid 10001 --gid 10001 --no-create-home boji \
    && mkdir -p /app/.data/mail && chown -R boji:boji /app
COPY --from=build /usr/local/bin/boji-bizserver /usr/local/bin/boji-bizserver
WORKDIR /app
USER 10001:10001
# APP_ENV defaults to production, so a missing production setting stops startup.
# compose.yml sets APP_ENV=development for local services.
ENV APP_ENV=production HOST=0.0.0.0 PORT=3000 MAIL_OUTPUT_DIR=/app/.data/mail
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail --silent "http://127.0.0.1:${PORT}/readyz" || exit 1
ENTRYPOINT ["boji-bizserver"]
CMD ["serve"]
