# Boji Rust 后端

新后端位于本目录。认证使用 Axum 与 `better-auth-rs`。业务接口使用 ConnectRPC。数据访问使用 SeaORM 与 PostgreSQL。

本轮是迁移首批，不是生产切换。旧 TypeScript 服务保持原状。新服务只接受独立数据库。`APP_ENV=production` 暂时拒绝启动。

## 已迁入的模块

- 邮箱注册、验证、登录、会话和密码重置。
- 免费会员卡、幂等领卡和结构化权益。
- 主动授权的活动同步、冲突检测和每日汇总。
- Axum 健康检查、CORS 和脱敏请求日志。
- 版本化 SeaORM 迁移与 Docker 开发配置。

Apple 登录、Wallet、SMTP 发件箱和运营接口尚未迁入。账号删除、邮箱变更和旧数据转换也未完成。能力查询不会声称未迁入的功能可用。

## 本地启动

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 按 `rust-toolchain.toml` 提供 Rust 1.99.0，并提供 `protoc`、`buf`、OpenSSL 和 `pkg-config`。PostgreSQL 由 `compose.yml` 提供。编译期间会用 `protoc` 生成 RPC 代码。首次编译需要访问依赖仓库。

```bash
cd bizserver
cp .env.example .env
chmod 600 .env
```

先替换密码和密钥占位值。数据库密码同时用于 `POSTGRES_PASSWORD` 和 `DATABASE_URL`。`BETTER_AUTH_SECRET` 至少需要 32 字节。

只启动独立开发数据库，再运行 Rust 服务：

```bash
docker compose up -d postgres
cargo run --locked -- migrate
cargo run --locked -- serve
```

本机服务地址为 `http://localhost:3000`。`/healthz` 检查进程。`/readyz` 检查数据库。开发邮件写入 `.data/mail/`，不会实际外发。

完整 Docker 开发环境使用另一端口：

```bash
docker compose up --build
```

Docker 服务地址为 `http://localhost:3002`。Compose 等待数据库就绪后执行迁移。迁移成功后才启动 API。镜像和 Compose 不代表已部署。

## 接口入口

认证保留 `/api/auth/*`。业务改用版本化 RPC 路径。协议文件是接口的唯一来源：

- [业务协议](proto/boji/v1/business.proto)
- [RPC 使用说明](docs/connectrpc-api.md)
- [认证迁移说明](docs/migration-auth.md)
- [迁移状态与旧数据边界](docs/migration-status.md)

会员号始终是不透明字符串。客户端必须原样保存和显示。客户端不得推断服务端规则。

## 验证命令

```bash
cargo fmt --all --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
buf lint
```

数据库测试默认忽略。显式设置独立测试库后再运行：

```bash
export TEST_DATABASE_URL='postgresql://user:password@localhost:5432/boji_test'
cargo test --locked -- --include-ignored --test-threads=1
```

禁止把 `TEST_DATABASE_URL` 指向生产或共享联调库。测试会写入账号与活动记录。部分测试创建并删除自己生成的临时 schema。
