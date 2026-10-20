# Better Auth 原生接入

iOS 使用原生 Swift 调用 Better Auth HTTP 接口。后端负责密码校验、会话签发和撤销，客户端不另建认证系统。

现有网络实现已使用 Better Auth 的 Bearer 协议。[1] 官方客户端说明主要面向 JavaScript 框架。[2] 已查到的 Swift SDK 为独立社区项目，不由 Better Auth 团队维护。[3] 本轮保留原生网络栈，不额外引入该依赖。

## 客户端分层

- `BetterAuthClient`：注册、登录、验证邮件、找回密码和会话管理。
- `BojiHTTPClient`：统一 HTTP 请求、Bearer 头和服务端错误。
- `MembershipAPI`：会员接口，以及兼容现有调用的认证转发。
- `MembershipStore`：界面状态、Keychain 令牌和独立会员缓存。

注册、邮箱登录和 Apple 登录仍使用后端已有接口。注册成功不自动登录，需要先验证邮箱。邮箱验证和找回密码继续通过后端网页完成，不把普通导航链接当作认证回调。

## 账号与安全

登录后，入口为「设置 → 账号与安全」。新增功能使用 Better Auth 自带的端点。[4] [5]

- 当前会话：`GET /api/auth/get-session`。
- 修改密码：`POST /api/auth/change-password`。
- 退出其他会话：`POST /api/auth/revoke-other-sessions`。

会话页显示登录时间与到期时间。客户端不保存服务端响应中的原始会话 token、IP 或设备代理字段。空会话响应表示认证失效，不能作为有效登录。

修改密码前，界面要求输入当前密码并确认新密码。最终确认会提示其他会话将退出。客户端明确发送 `revokeOtherSessions: true`，不自动重试写请求。

改密后的认证令牌只从 `set-auth-token` 响应头读取。客户端不会回退使用正文中的原始 token。如果服务端已确认改密，但没有提供签名令牌，客户端要求重新登录。

错误提示区分密码错误、会话失效和请求过于频繁。网络中断时，修改结果可能不确定，界面不会声称密码一定没有变化。

## 安全边界

令牌只保存在 Keychain。网络层关闭 Cookie 自动保存，并阻止 HTTP 重定向。密码只在输入和请求期间使用，不写入日志、偏好设置、共享容器或会员缓存。

普通启动使用真实网络。仅 Debug 的 `--uitesting` 启用隔离测试服务。

账号注销和邮箱变更由后端继续开发。客户端暂不连接未验收的流程，也不新增替代接口。活动记录同步与本轮认证接入无关，仍默认不上传数据。

## 服务配置

`BOJI_API_BASE_URL` 必须配置为后端服务基础地址，而不是登录页面。Debug 未配置时仍连接 `http://localhost:3000`。Release 必须显式提供 HTTPS 地址。

在真机上，localhost 指向手机自身。仅打开 Better Auth 客户端代码，不能代替部署服务或配置地址。Apple 登录还需要服务端启用对应能力。

本轮没有修改生产地址、读取 Apple 私钥或部署后端。也没有迁移共享测试数据库。

## 验证

验证版本：0.5.0 (5)。验证时间：2026-10-20 18:00，UTC+08:00。

已验证：

- macOS 宿主模型测试：74 项通过，无失败。测试直接引用实际 iOS 模型源码。
- 其中新增协议测试 11 项，新增账号安全状态机测试 9 项。
- iOS Debug 的 `build-for-testing` 通过，包括应用和测试目标。
- iOS Release 构建通过，目标为通用 iOS Simulator。

测试覆盖令牌原样保存、改密后令牌轮换和空会话清理。也覆盖请求限流、错误密码与不重试写请求。登录后发放的令牌若被后端拒绝，客户端会清除令牌，不误报为密码错误。

未验证：本轮新增端点的真实 HTTP 联调、模拟器点击、真机 Keychain 和真实 Apple 登录。后端正在并行修改认证管理流程，本轮没有启动共享实例，也没有迁移其数据库。

新增页面已编译，但尚未进行视觉验收。原有界面测试仍有主线程隔离警告，构建另有未使用 AppIntents 的元数据提示。

本地证据位于项目根目录 `.work/boji-betterauth/`：`tests-final.log`、`build-debug-final.log` 和 `build-release-final.log`。本轮没有创建提交或推送代码。

## 参考

[1]: https://better-auth.com/docs/plugins/bearer "Better Auth Bearer Token Authentication"
[2]: https://better-auth.com/docs/concepts/client "Better Auth Client"
[3]: https://github.com/jsj/better-auth-swift "独立社区 Swift SDK"
[4]: https://better-auth.com/docs/concepts/session-management "Better Auth Session Management"
[5]: https://better-auth.com/docs/authentication/email-password "Better Auth Email and Password"
