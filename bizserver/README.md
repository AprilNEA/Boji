# Boji Rust 后端

新后端位于本目录。认证使用 Axum 与 `better-auth-rs`。业务接口使用 ConnectRPC。数据访问使用 SeaORM 与 PostgreSQL。

旧 TypeScript 服务没有上线过。新服务不需要兼容旧服务的接口、密码、会话或数据。新服务必须使用独立数据库。`APP_ENV=production` 暂时拒绝启动。

## 已迁入的模块

- 邮箱注册、验证、登录、会话和密码重置。
- Apple 登录：原生身份令牌和网页 `form_post` 流程。设置全部 `APPLE_*` 变量后启用。账号关联由 `ACCOUNT_LINKING` 控制，默认关闭。详见[认证迁移说明](docs/migration-auth.md)。
- 免费会员卡与结构化权益。每个用户最多持有一张会员卡。
- 主动授权的活动同步、冲突检测和每日汇总。
- 会员运营：列表、查询、暂停、恢复和权益管理。变更与审计原子提交。
- Axum 健康检查、CORS 和脱敏请求日志。
- 版本化 SeaORM 迁移与 Docker 开发配置。

Wallet 和 SMTP 发件箱尚未迁入。Wallet 目前只有协议定义，服务端尚未注册。账号删除和邮箱变更也未完成。能力查询不会声称未迁入的功能可用。

## 本地启动

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 按 `rust-toolchain.toml` 提供 Rust 1.99.0，并提供 `protoc`、`buf`、OpenSSL 和 `pkg-config`。PostgreSQL 由 `compose.yml` 提供。编译期间会用 `protoc` 生成 RPC 代码。首次编译需要访问依赖仓库。

`better-auth` 精确固定到 crates.io 版本 `=1.0.0-alpha.4`。这个版本包含 Apple 签名器和原生运营权限 API。编译不需要克隆框架仓库或准备本机副本。首次构建需要访问 crates.io。

```bash
cd bizserver
cp .env.example .env
chmod 600 .env
```

先替换密码和密钥占位值。数据库密码同时用于 `POSTGRES_PASSWORD` 和 `DATABASE_URL`。`BETTER_AUTH_SECRET` 至少需要 32 字节。

本地数据库只用 `compose.yml` 启动，运行在 ArcBox 中。不要用 devenv 或本机安装的 PostgreSQL 搭建本地数据库。先启动 ArcBox，再确认 `docker context show` 输出 `arcbox`。如果输出其他 context，先运行 `docker context use arcbox`。

启动数据库后再运行 Rust 服务：

```bash
docker compose up -d postgres
cargo run --locked -- migrate
cargo run --locked -- serve
```

数据库只监听 `127.0.0.1:55439`，与 `.env.example` 中的 `DATABASE_URL` 一致。本机服务地址为 `http://localhost:3000`。`/healthz` 检查进程。`/readyz` 检查数据库。开发邮件写入 `.data/mail/`，不会实际外发。

完整 Docker 开发环境使用另一端口：

```bash
docker compose up --build
```

Docker 服务地址为 `http://localhost:3002`。Compose 等待数据库就绪后执行迁移。迁移成功后才启动 API。镜像和 Compose 不代表已部署。

## 接口入口

认证保留 `/api/auth/*`。业务改用版本化 RPC 路径。协议按 Google AIP 设计，协议文件是接口的唯一来源：

- [会员本人协议](proto/boji/v1/)：系统配置、会员卡、活动同步、Wallet 和错误原因
- [运营协议](proto/boji/admin/v1/)：权益目录与会员运营
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
buf format -d --exit-code proto
(cd proto && api-linter --set-exit-status -I . -I ../third_party/googleapis $(find boji -name '*.proto'))
```

`api-linter` 不由 devenv 提供，安装方法见 `AGENTS.md`。

数据库测试默认忽略。测试库也放在 Compose 启动的 PostgreSQL 中。先建一个单独的 `boji_test` 库，再运行测试：

```bash
set -a && . ./.env && set +a
docker compose exec -T postgres createdb -U boji boji_test
export TEST_DATABASE_URL="${DATABASE_URL%/*}/boji_test"
cargo test --locked -- --include-ignored --test-threads=1
```

`createdb` 只需要运行一次。禁止把 `TEST_DATABASE_URL` 指向 `boji_rust`、生产库或共享联调库。测试会写入账号与活动记录。部分测试创建并删除自己生成的临时 schema。
