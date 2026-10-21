# Boji Rust 后端

新后端位于本目录。认证使用 Axum 与 `better-auth-rs`。业务接口使用 ConnectRPC。数据访问使用 SeaORM 与 PostgreSQL。

旧 TypeScript 服务没有上线过。新服务不需要兼容旧服务的接口、密码、会话或数据。新服务必须使用独立数据库。`APP_ENV=production` 启动时检查生产配置，缺少必需项时拒绝启动。

## 已迁入的模块

- 邮箱注册、验证、登录、会话和密码重置。
- 账号注销和更换邮箱。注销需要邮件中的确认码，更换邮箱需要旧邮箱确认和新邮箱验证。
- 认证邮件经 SMTP 中继发送。开发环境未设置 `SMTP_HOST` 时写入本地文件。
- Apple 登录：原生身份令牌和网页 `form_post` 流程。设置全部 `APPLE_*` 变量后启用。账号关联由 `ACCOUNT_LINKING` 控制，默认关闭。详见[认证迁移说明](docs/migration-auth.md)。
- Google 登录：原生 ID 令牌。设置 `GOOGLE_CLIENT_ID` 后启用，账号关联规则与 Apple 相同。
- 免费会员卡与结构化权益。每个用户最多持有一张会员卡。
- Apple Wallet 会员卡。设置 `WALLET_*` 变量后，服务端为有效会员卡签发通行证。
- 主动授权的活动同步、冲突检测和每日汇总。
- 会员运营：列表、查询、暂停、恢复和权益管理。变更与审计原子提交。
- Axum 健康检查、CORS 和脱敏请求日志。
- 可选的 Sentry 错误上报：设置 `SENTRY_DSN` 后，上报 `ERROR` 日志、panic 和启动错误。事件不含请求头、请求体、查询串和用户身份。详见 [Sentry 错误上报](../docs/developers/sentry.mdx)。
- 版本化 SeaORM 迁移与 Docker 开发配置。

以下内容不在本服务中：

- 可靠发件箱。服务端不保存待发邮件，也不自动重发。
- 通行证更新和 Google Wallet。已保存的通行证不会随会员卡状态更新。
- 注销账号时撤销 Apple 令牌。这一步需要 iOS 客户端提供授权码，详见[迁移状态](docs/migration-status.md)。
- 请求限流、代理信任和压力测试。这些由 CDN 和网关负责。

## 配置

全部服务配置由 `src/config.rs` 读取。它用 `figment` 从环境变量取值，再校验并组装。其他模块不直接读取环境变量。空值等同于未设置。`.env.example` 列出全部变量和取值规则。

| 变量组 | 作用 | 生产环境要求 |
| --- | --- | --- |
| `APP_ENV`、`HOST`、`PORT`、`RUST_LOG` | 运行环境、监听地址和日志过滤 | `APP_ENV=production` |
| `DATABASE_URL` | PostgreSQL 连接 | 必填 |
| `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`CORS_ORIGINS`、`TRUSTED_ORIGINS` | 认证密钥和来源 | 地址必须使用 HTTPS |
| `MAIL_FROM`、`SMTP_*`、`MAIL_OUTPUT_DIR` | 认证邮件 | 必须设置 `SMTP_HOST` 和 `MAIL_FROM`，`SMTP_TLS` 不能为 `none` |
| `CLIENT_IP_HEADER`、`TRUSTED_PROXIES` | 会话记录的客户端 IP | 可选。留空时不记录 IP |
| `APPLE_*`、`ACCOUNT_LINKING` | Apple 登录 | 可选。全部填写或全部留空 |
| `GOOGLE_*` | Google 登录 | 可选。填写 `GOOGLE_CLIENT_ID` 即启用，另外两项依赖它 |
| `WALLET_*` | Apple Wallet 签名材料 | 可选。全部填写或全部留空 |

`CLIENT_IP_HEADER` 必须是网关覆盖写入的请求头，例如 `cf-connecting-ip`。客户端能自行设置的请求头会让会话记录伪造的 IP。

服务启动时校验 Wallet 签名材料，任一项不符合时拒绝启动：

- 私钥与 `WALLET_SIGNER_CERT` 匹配。
- 签名证书主题的 UID 等于 `WALLET_PASS_TYPE_IDENTIFIER`，OU 等于 `WALLET_TEAM_IDENTIFIER`。
- 签名证书由 `WALLET_WWDR_CERT` 签发，WWDR 证书由内置的 Apple Root CA 签发。

证书过期或尚未生效不会阻止启动。此时 `walletPassEnabled` 为 `false`，签发请求返回 `WALLET_NOT_CONFIGURED`。

## 本地启动

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 按 `rust-toolchain.toml` 提供 Rust 1.99.0，并提供 `buf`、OpenSSL 和 `pkg-config`。PostgreSQL 由 `compose.yml` 提供。编译期间，`build.rs` 对本目录的 buf workspace（`buf.yaml`）运行 `buf build`，再生成 RPC 代码。googleapis 依赖从 BSR 获取，由 `buf.lock` 固定版本。首次编译需要访问 BSR 和 crates.io。

`better-auth` 精确固定到 crates.io 版本 `=1.0.0-alpha.4`。这个版本包含 Apple 签名器和原生运营权限 API。编译不需要克隆框架仓库或准备本机副本。首次构建需要访问 crates.io。

```bash
cd bizserver
cp .env.example .env
chmod 600 .env
```

先替换密码和密钥占位值。数据库密码同时用于 `POSTGRES_PASSWORD` 和 `DATABASE_URL`。`BETTER_AUTH_SECRET` 至少需要 32 字节。

本地数据库只用 `compose.yml` 启动，运行在 ArcBox 中。不要用 devenv 或本机安装的 PostgreSQL 搭建本地数据库。先启动 ArcBox，再确认 `docker context show` 输出 `arcbox`。如果输出其他 context，先运行 `docker context use arcbox`，或者在命令前加 `DOCKER_CONTEXT=arcbox`。如果 `~/.arcbox/bin/abctl daemon status` 显示 `stopped`，用 `~/.arcbox/bin/abctl daemon start` 启动 ArcBox。

启动数据库后再运行 Rust 服务：

```bash
docker compose up -d postgres
cargo run --locked -- migrate
cargo run --locked -- serve
```

数据库只监听 `127.0.0.1:55439`，与 `.env.example` 中的 `DATABASE_URL` 一致。本机服务地址为 `http://localhost:3000`。`/healthz` 检查进程。`/readyz` 检查数据库。未设置 `SMTP_HOST` 时，开发邮件写入 `.data/mail/`，不会实际外发。

完整 Docker 开发环境使用另一端口：

```bash
docker compose up --build
```

Docker 服务地址为 `http://localhost:3002`。Compose 等待数据库就绪后执行迁移。迁移成功后才启动 API。镜像和 Compose 不代表已部署。

镜像构建阶段从 `bufbuild/buf` 镜像复制 `buf`，镜像标签与 devenv 提供的 buf 版本一致。

## 发布镜像

推送 `bizserver/v<版本号>` 标签后，GitHub Actions 构建镜像，并推送到 `ghcr.io/aprilnea/boji-bizserver`。流程定义在 [`image.yml`](../.github/workflows/image.yml) 中，构建和发布由 Docker 官方的可复用工作流 [`docker/github-builder`](https://github.com/docker/github-builder) 完成。镜像发布不代表服务已部署。

发布流程从标签中读取版本号。它不比较标签和 `Cargo.toml`，不检查分支，也不运行测试。发布前在本目录运行「验证命令」一节的命令，然后按顺序操作：

1. 修改 `Cargo.toml` 中的 `version`，再运行 `cargo update --workspace` 更新 `Cargo.lock`。
2. 把这两个文件的改动合入 `master`。
3. 在合入后的 `master` 提交上创建标签并推送，例如 `git tag bizserver/v0.1.0`，再运行 `git push origin bizserver/v0.1.0`。标签中的版本号必须等于 `Cargo.toml` 中的 `version`。

每个版本生成以下镜像标签：

| 版本号 | 镜像标签 |
| --- | --- |
| `0.2.1` | `0.2.1`、`0.2`、`latest` |
| `0.3.0-rc.1` | `0.3.0-rc.1` |

镜像包含 `linux/amd64` 和 `linux/arm64` 两个平台，两个平台分别在 GitHub 托管的原生 runner 上构建。每个平台附带 SBOM 和 SLSA 来源证明 (provenance)。仓库为私有仓库时，流程不签名来源证明，因为公共 Sigstore 服务会把仓库名和提交记录到公开日志中。

镜像默认设置 `APP_ENV=production`，缺少生产配置时服务拒绝启动。`compose.yml` 为本地服务设置 `APP_ENV=development`。部署时先运行 `migrate`，再运行 `serve`：

```bash
docker run --rm --env-file .env.production ghcr.io/aprilnea/boji-bizserver:0.1.0 migrate
docker run -d --env-file .env.production -p 3000:3000 ghcr.io/aprilnea/boji-bizserver:0.1.0
```

首次发布的 GHCR 镜像默认是私有的。拉取镜像前，用带 `read:packages` 权限的令牌登录 `ghcr.io`。

## 接口入口

认证保留 `/api/auth/*`。业务改用版本化 RPC 路径。协议按 Google AIP 设计，协议文件是接口的唯一来源：

- [会员本人协议](proto/boji/v1/)：系统配置、会员卡、活动同步、Wallet 和错误原因
- [运营协议](proto/boji/admin/v1/)：权益目录与会员运营
- [iOS 客户端代码](../ios/BojiAPI/)：在该目录运行 `buf generate`，从 `proto/boji/v1/` 生成 Swift 消息和 Connect 客户端
- [RPC 使用说明](docs/connectrpc-api.md)
- [运营权限与审计说明](docs/admin-operations.md)
- [认证迁移说明](docs/migration-auth.md)
- [迁移状态与上线前提](docs/migration-status.md)

会员号始终是不透明字符串。客户端必须原样保存和显示。客户端不得推断服务端规则。

## 验证命令

```bash
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
buf lint
buf format -d --exit-code
buf export . -o ../.work/buf-export
(cd ../.work/buf-export && api-linter --set-exit-status -I . $(find boji -name '*.proto'))
```

`api-linter` 不由 devenv 提供，安装方法见 `AGENTS.md`。`buf export` 把协议和 googleapis 依赖导出到 `.work/buf-export/`，供 `api-linter` 读取。

数据库测试默认忽略。测试库也放在 Compose 启动的 PostgreSQL 中。先建一个单独的 `boji_test` 库，再运行测试：

```bash
set -a && . ./.env && set +a
docker compose exec -T postgres createdb -U boji boji_test
export TEST_DATABASE_URL="${DATABASE_URL%/*}/boji_test"
cargo test --locked -- --include-ignored --test-threads=1
```

`createdb` 只需要运行一次。禁止把 `TEST_DATABASE_URL` 指向 `boji_rust`、生产库或共享联调库。测试会写入账号与活动记录。部分测试创建并删除自己生成的临时 schema。
