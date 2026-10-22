# syntax=docker/dockerfile:1
# The boji-bizserver image. compose.yml builds it for local development, and
# .github/workflows/image.yml publishes it to GHCR for each bizserver/v* tag.
#
# build.rs runs `buf build` on the workspace in buf.yaml. Keep the buf image
# tag equal to the buf version in devenv.nix.
FROM bufbuild/buf:1.73.0 AS buf

# better-auth-core links ICU4C 78 through rust_icu with pre-generated bindings.
# Debian bookworm ships ICU 72, so this stage builds ICU from the release source.
# Keep the major version equal to the icu78 package in devenv.nix.
FROM debian:bookworm-slim AS icu
ARG ICU_VERSION=78.3
ARG ICU_SHA256=3a2e7a47604ba702f345878308e6fefeca612ee895cf4a5f222e7955fabfe0c0
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl g++ make \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /tmp/icu
RUN curl --fail --silent --show-error --location --output icu.tgz \
        "https://github.com/unicode-org/icu/releases/download/release-${ICU_VERSION}/icu4c-${ICU_VERSION}-sources.tgz" \
    && echo "${ICU_SHA256}  icu.tgz" | sha256sum --check --strict \
    && tar -xzf icu.tgz \
    && cd icu/source \
    && ./configure --prefix=/opt/icu --disable-samples --disable-tests --disable-extras \
        --disable-icuio --disable-layoutex \
    && make -j"$(nproc)" \
    && make install \
    && major="${ICU_VERSION%%.*}" \
    && mkdir -p /opt/icu-runtime/lib /opt/icu-runtime/doc \
    && for name in icudata icuuc icui18n; do cp -L "/opt/icu/lib/lib${name}.so.${major}" /opt/icu-runtime/lib/; done \
    && cp ../LICENSE /opt/icu-runtime/doc/LICENSE

# Keep the Rust version equal to rust-toolchain.toml and rust-version in Cargo.toml.
FROM rust:1.99.0-slim-bookworm AS build
ARG TARGETPLATFORM
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
COPY --from=buf /usr/local/bin/buf /usr/local/bin/buf
COPY --from=icu /opt/icu /opt/icu
# rust_icu_sys reads these variables at compile time, as in devenv.nix.
ENV RUST_ICU_MAJOR_VERSION_NUMBER=78 RUST_ICU_LINK_SEARCH_DIR=/opt/icu/lib
WORKDIR /src
COPY Cargo.toml Cargo.lock build.rs buf.yaml buf.lock ./
COPY src ./src
COPY proto ./proto
# src/wallet.rs embeds the Apple Root CA and the pass icons from assets/wallet.
COPY assets ./assets
# src/domain/organization/import.rs embeds the organization list from data/schools.
COPY data ./data
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
# With 1.0.0-alpha.5 the linker drops ICU, because bizserver calls no ICU
# function. The image still ships libicuuc, libicui18n and libicudata, so a
# framework update that calls ICU does not fail at startup. The ICU license
# ships with the libraries.
COPY --from=icu /opt/icu-runtime/lib/ /usr/local/lib/
COPY --from=icu /opt/icu-runtime/doc/LICENSE /usr/share/doc/icu/LICENSE
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/* \
    && ldconfig \
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
