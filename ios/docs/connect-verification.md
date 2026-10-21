# Connect 接口迁移验证记录

iOS 已从旧 REST 接口改用 bizserver 的接口。会员卡、服务能力和钱包凭证调用 ConnectRPC 方法，账号恢复调用 `/api/auth/get-session`。单元测试和界面测试全部通过。连接正式服务的构建能读到 Apple 登录开关，并显示可用的登录按钮。完整的 Apple 系统登录没有验证。

验证时间：2026 年 10 月 21 日 20:11–20:43，UTC+08:00。环境为 Xcode 27.1（27A9275）和 iPhone 17 模拟器（iOS 26.5）。构建为 `eb1a369` 加本次改动的 Debug 构建 0.7.0 (7)。

## 改动

| 调用 | 旧 → 新 |
| --- | --- |
| 恢复账号 | `GET /api/me` → `GET /api/auth/get-session` |
| 服务能力 | `GET /api/capabilities` → `SystemService.GetServerConfig` |
| 读取会员卡 | `GET /api/membership` → `MembershipService.ListMemberships` |
| 领卡 | `POST /api/membership/enroll` → `MembershipService.CreateMembership` |
| 钱包凭证 | `GET /api/membership/wallet/pass` → `WalletService.GetMembershipPass` |

Apple 登录仍调用 `/api/auth/sign-in/social`。后端拒绝身份令牌时，客户端按错误码显示提示，详见 [Apple 生态接入说明](apple-integration.md)。接口契约见 [会员卡开发说明](../../docs/membership.md)。

## 已验证

| 范围 | 结果 |
| --- | --- |
| 单元测试 `BojiTests` | 129 项通过，0 项失败 |
| 界面测试 `BojiUITests` | 19 项通过，0 项失败 |
| 发布工程生成 | 按 `ci/signing.py` 的方式导出并生成工程，`BojiAPI` 的相对路径解析正确 |
| CI 离线测试 | 55 项中 54 项通过。`test_artifacts` 的 `setUpClass` 报错，原因是受限终端无法连接 `gpg-agent`，与本次改动无关 |
| 正式服务开关 | 以 `BOJI_API_BASE_URL=https://api.leanmuscle.club` 构建。登录页显示可用的「Continue with Apple」按钮，说明 `GetServerConfig` 返回 `apple_login_enabled = true` |
| 签名模拟器构建 | 模拟 entitlements 包含 `com.apple.developer.applesignin` 和 `application-identifier = 8U3ZJ258K9.club.leanmuscle.boji` |

单元测试和界面测试使用未签名构建和隔离的测试传输层，没有连接真实后端。只有「正式服务开关」和「签名模拟器构建」两项连接或面向正式服务。正式服务地址只通过构建参数传入，没有写入 `project.yml`。

日志位于仓库根目录的 `.work/ios-siwa/`：`unit1.log`、`ui1.log`、`build-prod.log` 和 `build-prod-signed.log`。

## 未验证

- 完整的 Apple 系统登录。测试模拟器没有登录 Apple 账户，本轮跳过这一步。
- 登录后 `get-session`、`ListMemberships`、`CreateMembership` 和 `GetMembershipPass` 与正式服务的往返。这需要真实账号。
- 真机构建、TestFlight 构建和 GitHub 托管运行。

## 发布配置

GitHub 的 `ios-testflight` 环境已设置 `BOJI_API_BASE_URL`。其余发布配置的状态见 [iOS CI/CD](ci-cd.md#当前配置状态)。
