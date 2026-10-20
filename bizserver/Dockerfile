# syntax=docker/dockerfile:1
# build.rs runs `buf build` on the workspace in buf.yaml. Keep the buf image
# tag equal to the buf version in devenv.nix.
FROM bufbuild/buf:1.73.0 AS buf

FROM rust:1.99.0-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
COPY --from=buf /usr/local/bin/buf /usr/local/bin/buf
WORKDIR /src
COPY Cargo.toml Cargo.lock build.rs buf.yaml buf.lock ./
COPY src ./src
COPY proto ./proto
RUN cargo build --release --locked --bin boji-bizserver

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 boji && useradd --uid 10001 --gid 10001 --no-create-home boji \
    && mkdir -p /app/.data/mail && chown -R boji:boji /app
COPY --from=build /src/target/release/boji-bizserver /usr/local/bin/boji-bizserver
WORKDIR /app
USER 10001:10001
ENV HOST=0.0.0.0 PORT=3000 MAIL_OUTPUT_DIR=/app/.data/mail
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail --silent "http://127.0.0.1:${PORT}/readyz" || exit 1
ENTRYPOINT ["boji-bizserver"]
CMD ["serve"]
