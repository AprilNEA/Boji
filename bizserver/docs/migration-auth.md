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
| POST | `/api/auth/delete-user` | 注销账号：先发送确认码，再凭确认码删除账号 |
| POST | `/api/auth/change-email` | 申请更换登录邮箱 |
| POST | `/api/auth/sign-in/social` | Apple 或 Google 登录，仅在配置对应提供方后可用 |
| GET、POST | `/api/auth/callback/apple` | Apple 网页授权回调，仅在配置 Apple 后可用 |

这是配置范围，不代表每个端点均已完成联调。实际验证范围见[迁移状态](migration-status.md)。

## 邮箱与会话流程

注册后，客户端显式调用发送验证邮件端点。请求体为 `{"email":"user@example.com"}`。当前 alpha 版本不会仅凭注册开关自动发信。

登录响应通过 `set-auth-token` 返回签名令牌。客户端应保存这个值。不要把 JSON 中的原始 `token` 用作业务 Bearer。业务层拒绝 Cookie-only 请求。

旧服务没有上线过，新服务不迁移旧服务签发的会话。

## alpha 版本的边界保护

固定版本的邮箱登录未执行验证开关。用户名登录与邮箱登录的行为不同。当前服务在 Axum 响应边界补齐限制。

保护层先让框架校验密码。框架产生会话后，保护层检查真实用户状态。如果邮箱未验证，保护层调用框架撤销新会话。响应返回 `403 EMAIL_NOT_VERIFIED`，不返回令牌或 Cookie。

如果检查或撤销失败，服务返回 `503 AUTH_UNAVAILABLE`。服务不会放行原成功响应。业务 RPC 还会独立验证邮箱状态。

框架生成邮件链接时不追加 `base_path`。适配层因此把完整认证路径传给框架。环境变量 `BETTER_AUTH_URL` 仍只填写服务的 origin。

## 注销账号与更换邮箱

这两个流程都要求已登录的签名会话。未登录的请求返回 `401`。

注销账号分两步：

1. 客户端调用 `POST /api/auth/delete-user`，请求体为 `{}`。服务向账号邮箱发送确认码，确认码 15 分钟内有效。
2. 用户在 App 中输入确认码。客户端用同一账号的会话再次调用，请求体为 `{"token":"<确认码>"}`。

确认码只能由申请它的账号使用。其他账号提交这个确认码会失败，确认码也可能因此作废，此时用户需要重新申请。删除成功后，这个账号的会话全部失效。会员卡、权益授予和活动记录随用户一起删除。运营审计记录保留，其中指向这个用户的字段改为空。

框架在一个数据库事务中删除会话、账号和用户。PostgreSQL 在同一个事务中完成业务表的级联删除和置空，所以结果只有两种：全部删除，或全部保留。本服务没有注册 API Key 插件，所以框架不清理 `api_keys` 表。`tests/account_contract.rs` 验证这一行为。升级 better-auth-rs 时，必须先运行这个测试。

`1.0.0-alpha.4` 分三条独立语句删除，并且总会清理 `api_keys` 表。本服务没有这张表，所以删除会失败，并留下无法登录的用户。当时 `src/auth.rs` 用注销前钩子 `UserDeletion` 绕过这个问题。`1.0.0-alpha.5` 修复了这两个缺陷（上游 issue #129），本服务随之删除了这个钩子。

服务端不调用 Apple 的令牌撤销接口。

更换邮箱分三步：

1. 客户端调用 `POST /api/auth/change-email`，请求体为 `{"newEmail":"new@example.com"}`。服务向旧邮箱发送确认链接，新邮箱此时收不到邮件。
2. 用户在旧邮箱中打开确认链接。服务随后向新邮箱发送验证链接。
3. 用户在新邮箱中打开验证链接。之后用户用新邮箱登录，旧邮箱不能再登录。

## Apple 登录

服务只在 5 个 `APPLE_*` 变量全部设置时注册 `apple` 提供方。此时 `SystemService/GetServerConfig` 返回 `appleLoginEnabled: true`。全部省略时，Apple 登录保持关闭。只设置一部分时，服务拒绝启动并列出缺少的变量。

| 变量 | 含义 |
| --- | --- |
| `APPLE_CLIENT_ID` | Services ID，网页授权和令牌端点用它作为 client ID |
| `APPLE_APP_BUNDLE_IDENTIFIER` | iOS 应用的 bundle ID，原生身份令牌的 `aud` 是这个值 |
| `APPLE_TEAM_ID` | Apple Developer 的 Team ID |
| `APPLE_KEY_ID` | Sign in with Apple 私钥的 Key ID |
| `APPLE_PRIVATE_KEY` | `.p8` 私钥的 PEM 内容，单行写法用 `\n` 表示换行 |

服务启动时用私钥试签一次。私钥、Team ID 或 Key ID 不可用时，服务拒绝启动。Apple 的 client secret 是会过期的 ES256 JWT。better-auth-rs 在发起令牌请求时签发 client secret，有效期 1 小时。剩余有效期不足 5 分钟时，better-auth-rs 重新签发。部署时不需要定期更换 client secret。

iOS 客户端调用 `POST /api/auth/sign-in/social`。请求体为 `{"provider":"apple","idToken":{"token":"…","nonce":"…","user":{"name":{"firstName":"…","lastName":"…"}}}}`。`nonce` 填原始值，`user` 只在 Apple 返回姓名时提供。服务校验 Apple 签名、签发方、受众和签发时间。受众必须是 Services ID 或 bundle ID，签发时间必须在 1 小时内。令牌中的 `nonce` 可以是原始值，也可以是原始值的 SHA-256 十六进制摘要。成功响应与邮箱登录相同，签名令牌通过 `set-auth-token` 返回。

Apple 之后签发的身份令牌可能不含邮箱。如果令牌缺少邮箱，而这个 Apple 账号已绑定用户，服务沿用已保存的邮箱。新 Apple 账号缺少邮箱时，登录失败。

Apple 邮箱已属于现有用户时的行为由 `ACCOUNT_LINKING` 决定，见[账号关联](#账号关联)。如果 Apple 返回未验证的邮箱，边界保护撤销新会话并返回 `403 EMAIL_NOT_VERIFIED`。

网页流程使用 `response_mode=form_post`。配置 Apple 后，服务自动把 `https://appleid.apple.com` 加入可信来源，以接受 Apple 提交的回调表单。在 Apple Developer 中登记的回调地址必须是 `{BETTER_AUTH_URL}/api/auth/callback/apple`。

## Google 登录

服务在设置 `GOOGLE_CLIENT_ID` 时注册 `google` 提供方。此时 `SystemService/GetServerConfig` 返回 `googleLoginEnabled: true`。没有设置时，Google 登录保持关闭。只设置另外两个变量时，服务拒绝启动。

| 变量 | 含义 |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google Cloud 中 Web 应用类型的 OAuth 客户端 ID。Android 用它作为 `serverClientId` 请求 ID 令牌，所以令牌的 `aud` 是这个值 |
| `GOOGLE_CLIENT_SECRET` | 可选。Web 客户端的密钥，只用于网页授权流程。原生 ID 令牌登录不需要 |
| `GOOGLE_ADDITIONAL_CLIENT_IDS` | 可选。其他可接受的令牌受众，用逗号分隔，例如 iOS 客户端 ID。不能重复 `GOOGLE_CLIENT_ID` |

Android 客户端调用 `POST /api/auth/sign-in/social`。请求体为 `{"provider":"google","idToken":{"token":"…","nonce":"…"}}`，`nonce` 可选。服务用 Google 公布的公钥校验 RS256 签名，并检查签发方、受众、签发时间和过期时间。签发方必须是 `accounts.google.com`，受众必须是上表中的客户端 ID，签发时间必须在 1 小时内。请求带 `nonce` 时，令牌中的 `nonce` 必须相同。校验时，服务向 `https://www.googleapis.com/oauth2/v3/certs` 读取公钥，所以服务必须能访问 Google。成功响应与邮箱登录相同，签名令牌通过 `set-auth-token` 返回。

Google 邮箱已属于现有用户时的行为由 `ACCOUNT_LINKING` 决定，见[账号关联](#账号关联)。

客户端 ID 和密钥不写入仓库。本地调试时，开发者在自己的 Google Cloud 项目中创建客户端，把值写进本地 `.env`。正式值只放在部署环境中。

## 账号关联

账号关联指社交登录的邮箱已属于现有用户时，把社交账号加入这个用户。`ACCOUNT_LINKING` 控制这个行为，默认值为 `disabled`。其他取值会让服务拒绝启动。

| 取值 | 行为 |
| --- | --- |
| `disabled` 或留空 | 登录失败，服务不合并两个用户 |
| `enabled` | 满足下列全部条件时，把社交账号加入现有用户，并以现有用户登录 |

启用后，服务只在以下条件全部满足时关联：

- 提供方声明这个邮箱已验证。服务不把任何提供方视为可信，所以这项检查不会跳过。
- 现有用户已验证同一个邮箱。这样可以防止他人先用这个邮箱注册，再接管社交账号。
- 两个邮箱相同。服务从不关联邮箱不同的用户。

任何一项不满足时，登录失败，现有用户保持不变。关联不会用提供方资料覆盖现有用户的资料。已登录用户也可以调用 `POST /api/auth/link-social` 主动关联，同样受这些条件限制。这个配置同时影响 Apple 登录和 Google 登录。

## 邮件与密码

设置 `SMTP_HOST` 后，服务通过 SMTP 中继发信，配置见 [README](../README.md#配置)。没有设置时，邮件写入 `MAIL_OUTPUT_DIR` 下的私有本地文件，目录权限为 `0700`，文件权限为 `0600`。服务端不保存待发邮件，也不自动重发。验证邮箱和重置密码的链接都在 1 小时内有效。

密码使用框架默认的 Argon2。旧服务没有上线过，因此新服务不兼容旧密码格式。

密码重置使用原生令牌和原生密码处理。配置启用了重置后的会话撤销。正常改密、会话列表等管理流程仍需独立联调。

## 数据库与生产限制

认证实体由应用持有，存储适配使用 SeaORM。表为 `user`、`session`、`account` 和 `verification`。主键是字符串，不依赖数字 ID。

迁移命令在独立的 PostgreSQL 数据库中建表，不读取或转换旧服务的表。上线前必须完成认证回归测试。

`APP_ENV=production` 要求 HTTPS 地址和 SMTP 发信，具体检查见 [README](../README.md#配置)。服务端不做请求限流，`/api/auth/*` 的限流由 CDN 和网关负责。Docker 开发环境不能替代生产验收。
