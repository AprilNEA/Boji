# 认证迁移说明

认证继续使用 Better Auth 的原生端点。本轮没有自行实现密码校验、会话签名或验证令牌。HTTP 入口使用 `app::router`，不能绕过其中的安全保护。

## 已配置的端点

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/auth/sign-up/email` | 邮箱注册，不自动登录 |
| POST | `/api/auth/send-verification-email` | 显式发送验证邮件 |
| GET | `/api/auth/verify-email` | 验证邮件链接 |
| POST | `/api/auth/sign-in/email` | 邮箱密码登录 |
| GET | `/api/auth/get-session` | 查询当前会话 |
| GET | `/api/auth/list-sessions` | 查询用户会话 |
| POST | `/api/auth/revoke-session` | 撤销指定会话 |
| POST | `/api/auth/revoke-other-sessions` | 撤销其他会话 |
| POST | `/api/auth/sign-out` | 退出当前会话 |
| POST | `/api/auth/request-password-reset` | 请求重置邮件 |
| POST | `/api/auth/reset-password` | 使用令牌重置密码 |
| POST | `/api/auth/change-password` | 使用旧密码修改密码 |

这是配置范围，不代表每个端点均已完成联调。实际验证范围见[迁移状态](migration-status.md)。Apple 登录、账号删除和邮箱变更未迁入。

## 邮箱与会话流程

注册后，客户端显式调用发送验证邮件端点。请求体为 `{"email":"user@example.com"}`。当前 alpha 版本不会仅凭注册开关自动发信。

登录响应通过 `set-auth-token` 返回签名令牌。客户端应保存这个值。不要把 JSON 中的原始 `token` 用作业务 Bearer。业务层拒绝 Cookie-only 请求。

旧 iOS 客户端也读取 `set-auth-token`。这并不证明旧会话可直接迁移。签名密钥、会话表和数据库格式仍需单独验证。

## alpha 版本的边界保护

固定版本的邮箱登录未执行验证开关。用户名登录与邮箱登录的行为不同。当前服务在 Axum 响应边界补齐限制。

保护层先让框架校验密码。框架产生会话后，保护层检查真实用户状态。如果邮箱未验证，保护层调用框架撤销新会话。响应返回 `403 EMAIL_NOT_VERIFIED`，不返回令牌或 Cookie。

如果检查或撤销失败，服务返回 `503 AUTH_UNAVAILABLE`。服务不会放行原成功响应。业务 RPC 还会独立验证邮箱状态。

框架生成邮件链接时不追加 `base_path`。适配层因此把完整认证路径传给框架。环境变量 `BETTER_AUTH_URL` 仍只填写服务的 origin。

## 邮件与密码

当前邮件只写入私有本地文件。目录权限为 `0700`，文件权限为 `0600`。生产 SMTP 与可靠发件箱尚未迁入。

新密码使用框架默认的 Argon2。旧 TypeScript 服务默认使用 scrypt。没有配置跨格式密码兼容器。禁止把旧密码列直接复制后宣称兼容。

密码重置使用原生令牌和原生密码处理。配置启用了重置后的会话撤销。正常改密、会话列表等管理流程仍需独立联调。

## 数据库与生产限制

认证实体由应用持有，存储适配使用 SeaORM。表为 `user`、`session`、`account` 和 `verification`。主键是字符串，不依赖数字 ID。

本轮只初始化新的 PostgreSQL 数据库。旧 Drizzle 表不会被自动转换。生产切换前必须完成旧数据转换和认证回归。

`APP_ENV=production` 当前会拒绝启动。这个限制同时覆盖缺失的邮件、限流和迁移验收。Docker 开发环境不能替代生产验收。
