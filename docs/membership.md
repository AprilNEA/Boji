# 免费会员卡开发说明

会员卡是绑定账号的免费俱乐部身份，不是付费订阅。卡号、入会日期、状态和权益由后端决定。客户端不能离线签发，也不提供本地升级会员操作。

## 用户流程

1. 在俱乐部页或设置页打开「会员卡与账号」。
2. 注册邮箱账号，并通过验证邮件确认邮箱。
3. 返回 App 登录，查看账号关联的会员卡。
4. 没有会员卡时，填写卡面昵称并预览。
5. 逐条确认守则，再核对信息并同意数据说明。
6. 领取成功后查看卡号、入会日期和免费权益。
7. 制作会员分享卡，选择是否展示卡号，再确认分享。

卡面昵称在本版中不可修改。客户端展示每次请求的服务端结果。退出不删除本机训练记录，也不会注销服务器账号。

## 接口契约

iOS 当前仍调用旧服务的 REST 业务接口，下表描述现有 iOS 代码的调用。旧服务没有上线过，Rust 后端不提供 `/api/me` 和 `/api/membership*` 路径。会员接口改为 `MembershipService` 的 ConnectRPC 方法，详见 [RPC 使用说明](../bizserver/docs/connectrpc-api.md)。认证仍使用 `/api/auth/*` 端点。iOS 切换后，必须同步更新本节。

| 接口 | 行为 |
| --- | --- |
| `POST /api/auth/sign-up/email` | 注册，提交 name、email、password；不自动登录 |
| `POST /api/auth/sign-in/email` | 登录；从 set-auth-token 响应头读取令牌 |
| `POST /api/auth/send-verification-email` | 重发验证邮件 |
| `POST /api/auth/request-password-reset` | 发送重置邮件 |
| `GET /api/me` | 恢复用户与会话状态 |
| `POST /api/auth/sign-out` | 请求注销当前会话 |
| `GET /api/membership` | 返回 membership，可为 null |
| `POST /api/membership/enroll` | 提交 displayName 和 termsVersion，返回会员卡 |

守则版本固定为 `community-v1`。后端校验登录和邮箱验证状态。`401` 表示需要重新登录，`403 EMAIL_NOT_VERIFIED` 表示需要验证邮箱。

会员字段为 `id`、`userId`、`memberNumber`、`displayName`、`joinedAt`、`tier`、`status`、`entitlements` 和 `expiresAt`。时间采用 UTC ISO 8601。免费卡的 `tier` 为 `community`，`expiresAt` 为 null。

`memberNumber` 是不透明字符串。客户端原样展示，并使用最新响应刷新缓存。客户端不从卡号推断权限、等级或其他身份信息。

`entitlements` 是对象数组，每项包含 `id`、`code`、`name`、`description`、`grantedAt` 和 `expiresAt`。客户端使用服务端的展示信息，不依赖数组顺序。

旧字符串缓存可以读取，但不会被当成已核验的授权。未知、过期或尚未生效的权益不会开启客户端能力。

免费权益为 `local_tracking`、`training_library` 和 `progress_history`。这些对应已有的日常记录、基础课程和历史趋势。它们本来就是免费本地功能，不因退出或暂停会员而被锁定。

## 配置与边界

Debug 默认访问 `http://localhost:3000`。通过 Xcode 构建设置 `BOJI_API_BASE_URL` 覆盖地址。该值写入应用的 `BojiAPIBaseURL` 配置。

Release 只接受 HTTPS。缺少有效地址时，会员服务显示未配置。客户端不能为了展示效果而自动改用测试卡。

本地开发邮件由后端写入文件。iOS 已提供邮箱和 Apple 登录的客户端流程。真实邮件服务、Apple 登录验证及账号删除，仍需后端和发布配置。

## 安全与隐私

认证令牌只存入 Keychain，不进入 UserDefaults、分享卡或身体数据导出。会员缓存独立于 `BojiStore` 的身体记录。服务地址和用户身份必须与缓存匹配。

网络失败时可展示既有缓存，并标明离线副本。登录失效时清除会员会话。会员来源未知、状态未知或失效时，不授予客户端新增权益。

iOS 分享图片包含昵称和入会日期，卡号默认隐藏，用户可以主动开启。图片不包含邮箱、令牌、内部用户 ID 或身体数据。它不是核销凭证，不能用截图证明当前有效身份。

「删除全部本地数据」清理本机记录和登录缓存。此操作不代表服务器账号删除。公开发布前需补齐账号删除流程、正式隐私政策与发布审查。

## 测试设计

`MembershipTests` 覆盖数据解析、认证状态、缓存、领卡与错误路径。`MembershipUITests` 覆盖游客状态、守则确认、分享预览和退出。

Debug 的 `--uitesting` 使用隔离的内存测试服务。测试卡显示「测试卡 · 非真实会员」。该路径不用于真实联调，Release 不启用测试服务。

测试覆盖卡号原样编解码、服务端响应更新，以及新旧权益格式。最新结果见 iOS 的[能力验证记录](../ios/docs/capability-verification.md)。

此前的编译与联调结果见 iOS 的[会员卡验证记录](../ios/docs/membership-verification.md)。编译成功不等于真机、邮件服务或生产发布已通过。
