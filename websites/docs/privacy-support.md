# 隐私政策、用户协议与支持页维护记录

本文是内部文档，不在网站发布。它记录 `/privacy/`、`/terms/`、`/support/` 及英文版页面的状态、决定事项、每条陈述的依据、待办事项和上线条件。

## 状态

隐私政策和用户协议自 2026 年 10 月 21 日起生效，有中文版和英文版，两版不一致时以英文版为准。页面已在本地实现，尚未部署，公网不可访问。正式生效前尚未经律师审阅，见[待办事项](#待办事项)。

| 页面 | 内容源 | 路由 | 正式地址 |
| --- | --- | --- | --- |
| 支持 | `docs/sites/support.mdx` | `/support/` | `https://leanmuscle.club/support/` |
| 隐私政策 | `docs/sites/privacy.mdx` | `/privacy/` | `https://leanmuscle.club/privacy/` |
| 隐私政策（英文） | `docs/sites/privacy.en.mdx` | `/en/privacy/` | `https://leanmuscle.club/en/privacy/` |
| 用户协议 | `docs/sites/terms.mdx` | `/terms/` | `https://leanmuscle.club/terms/` |
| 用户协议（英文） | `docs/sites/terms.en.mdx` | `/en/terms/` | `https://leanmuscle.club/en/terms/` |
| 第三方信息共享清单 | `docs/sites/third-parties.mdx` | `/third-parties/` | `https://leanmuscle.club/third-parties/` |
| 第三方信息共享清单（英文） | `docs/sites/third-parties.en.mdx` | `/en/third-parties/` | `https://leanmuscle.club/en/third-parties/` |

## 写作原则

两份文件按信息类别和用途描述，不列具体字段、界面名称、平台功能或服务商名称。产品变化时，只要类别、用途、接收方类别和保存期限不变，就不需要修改文件。

- 每条陈述必须对所有已发布版本成立。不承诺产品没有做到的做法，例如尚未实现的删除方式。
- 服务商只写类别。用户可以发邮件索取名称、所在国家和联系方式。法律或应用商店要求在正文中写明名称时，才写名称。
- 类别、用途、接收方类别或保存期限变化时，在代码改动的同一变更中修改两种语言的版本，并更新生效日期。

### 文体

两份文件是法律文本，使用正式的法律文体，不使用技术文档的写作规范。

- 中文版称用户为「您」，称运营者为「我们」，使用「应当」「不得」「有权」「可以」等规范用语。条款按「一、（一）1.」或「1.1、（1）」编号。结构参照 GB/T 35273-2020 附录 D 的隐私政策模板，以及国内主流 App 的隐私政策。
- 英文版使用美国法律文本的惯用表述，例如「you represent and warrant」「to the maximum extent permitted by applicable law」。用户协议第 14 条照录 Apple 最低条款的原文措辞。
- 涉及敏感个人信息、跨境传输、免责和限责、争议解决的条款使用粗体。《民法典》第 496 条要求格式条款提供方以合理方式提示此类条款，《个人信息保护法》第 17 条要求以显著方式告知。
- 两种语言版本的章节结构和锚点必须一致。标题使用 `[#id]` 自定义锚点，跨页链接和应用内链接只引用这些锚点。

### 参考文本

2026-10-21 改写时参考了以下文本，只借鉴结构和表述，不照抄内容：

- 法律原文：《个人信息保护法》（中国网信网全文）、《网络数据安全管理条例》第 21～26 条、《互联网应用程序个人信息收集使用规定（征求意见稿）》（2026-01-10）、加州 B&P Code §22575（CalOPPA）、Apple「Instructions for Minimum Terms of Developer's End-User License Agreement」。
- 同类产品：千问产品隐私政策（2026-09-30）、Strava Privacy Policy 和 Terms of Service（2026）、Sukka 的隐私政策（skk.moe）。
- `privacy-policy-stephane-boghossian` skill 的模板和自检清单。

## 决定事项

2026-10-21，用户确认了以下事项：

| 事项 | 决定 |
| --- | --- |
| 运营主体 | AprilNEA LLC，依据美国怀俄明州法律设立 |
| 联系方式 | 邮箱见下文「邮箱」；地址 28 Geary St STE 650 Suite #344, San Francisco, California 94108, United States。用户协议用作自定义 EULA，Apple 最低条款第 8 条要求写明地址和联系方式 |
| 服务器所在地 | 美国 |
| 发行地区 | 全部地区，含中国大陆。两份文件都写了中国大陆和欧洲经济区的补充说明 |
| 准据语言 | 英文版为准 |
| 生效日期 | 2026 年 10 月 21 日 |
| 云同步 | 会提供。默认关闭，开启前单独征求同意。当前 iOS App 还没有云同步入口 |
| 最低年龄 | 18 周岁 |
| 适用法律与管辖 | 怀俄明州法律和法院，保留消费者经常居住地法律的强制性保护 |

## 邮箱

2026-10-21，用户确认 `leanmuscle.club` 的以下邮箱已设置：

| 地址 | 类型 | 用途 | 出现位置 |
| --- | --- | --- | --- |
| `support@` | 独立邮箱，业务主收件箱 | App 使用问题、不便公开的反馈 | 支持页、官网页脚 |
| `privacy@` | 别名，转入 `support@` | 个人信息权利请求、隐私投诉 | 隐私政策、第三方信息共享清单、支持页、App 内注销提示 |
| `legal@` | 别名，转入 `support@` | 对用户协议的疑问、投诉和索赔，侵权通知，机关来函 | 用户协议第 16 条（App Store 自定义 EULA 的联系方式） |
| `security@` | 别名，转入 `support@` | 安全漏洞报告 | `websites/public/.well-known/security.txt`、`.github/SECURITY.md` |
| `conduct@` | 别名，转入 `support@` | 违反行为准则的举报 | `.github/CODE_OF_CONDUCT.md` |
| `postmaster@`、`abuse@` | 别名，转入 `support@` | 邮件系统的必备地址 | 不写入公开文件 |
| `dmarc@` | 独立邮箱 | 接收 DMARC 汇总报告 | 只写在 DNS 的 DMARC 记录中 |

回复 `privacy@`、`legal@` 收到的邮件时，必须以收件的别名发信，不得暴露个人邮箱。

服务端的认证邮件尚未确定发件地址。建议使用 `no-reply@leanmuscle.club` 作为 `MAIL_FROM`，并把回复地址设为 `support@`。`bizserver/src/mail/smtp.rs` 目前只设置发件人，不设置 Reply-To。

`security.txt` 的 `Expires` 为 2027-10-21，过期前必须更新。

## 陈述依据

| 陈述 | 依据 |
| --- | --- |
| 记录默认保存在本机，领卡不上传 | `ios/Boji/Models/BojiStore.swift` 的 `persistIfNeeded()`；`ios/Boji/` 中没有调用活动同步接口 |
| 云同步默认关闭，开启前单独同意，并记录同意版本和时间 | `bizserver/docs/connectrpc-api.md` 的「活动同步」；`activity_sync_state` 的 `consent_version`、`consented_at` |
| 关闭同步后服务器记录保留；删除记录后保留不含内容的删除标记 | `bizserver/src/domain/activity/service/state.rs`；`batch.rs` 的 `delete_payloads()` |
| 健康平台数据只在本机使用 | `ios/Boji/Models/HealthDataStore.swift`：`typesToShare` 为空，样本只在内存中；`connectrpc-api.md` 写明 HealthKit 数据不在同步范围内 |
| 账号信息包括第三方登录的标识和身份令牌 | `bizserver/src/migrations/auth.rs` 的 `account` 表；better-auth 把 Apple `sub` 写入 `account_id`，把 `id_token` 写入 `id_token` |
| 密码只以哈希形式保存 | better-auth 默认 scrypt：`better-auth-core/src/utils/password.rs` |
| 会员信息包括守则同意记录 | `bizserver/src/entities/membership.rs` 的 `terms_version`、`accepted_at` |
| 设备与使用信息包括 IP、User-Agent、登录时间 | better-auth 写入 `session.ip_address`、`session.user_agent`：`better-auth-core/src/store/session_create.rs` |
| 诊断信息的内容和排除项 | `docs/developers/sentry.mdx`；`ios/Boji/CrashReporting.swift`；`bizserver/src/telemetry.rs` 的 `send_default_pii(false)` |
| 诊断信息最长保存 90 天 | Sentry 文档「Data Retention Periods」：Team 和 Business 套餐的错误事件保存 90 天，Developer 套餐 30 天 |
| 不收集精确位置、通讯录、照片和广告标识 | `ios/` 中没有 CoreLocation、Contacts、Photos、`identifierForVendor` 和 ATT；`PrivacyInfo.xcprivacy` 中 `NSPrivacyTracking` 为 `false` |
| 网站不使用 Cookie，只在本地存储保存提示时间 | `websites/src/components/layout/Chrome.tsx` 的 `boji-cookie-last-shown` |
| 删除账号时关联数据一并删除，审计记录去掉用户 ID | `user` 表的外键为级联删除；`bizserver/src/migrations/admin.rs` 的审计记录外键为 `SET NULL` |
| 不进行自动化决策 | 服务端只有会员状态和权益的人工管理操作 |

## 待办事项

以下事项影响文件中的承诺能否兑现。上线前必须完成第 1～6 项。

1. **律师审阅**：两份文件涉及健康风险、跨境传输、责任限制和管辖法院，尚未经熟悉美国和中国法律的律师审阅。英文版是准据文本，审阅以英文版为主。
2. **联系邮箱**：已完成。2026-10-21 用户确认各邮箱已设置，见下文「邮箱」。隐私政策承诺在 15 个工作日内答复请求、在核验身份后 15 个工作日内完成账号注销，这是《App 违法违规收集使用个人信息行为认定方法》采用的上限。需要指定处理人，按时处理 `support@` 收件箱中的请求。
3. **App 内删除账号**：App Store 审核指南 5.1.1(v) 要求支持创建账号的 App 在 App 内提供删除账号的入口。隐私政策和支持页已按功能上线后的状态编写：支持页写明入口为「设置」>「账号与安全」>「删除账号」，并保留邮件方式供无法登录的用户使用。iOS 0.7.0 上架前必须实现这个入口，否则必须先改回文案。`MembershipView.swift` 中「当前版本的 App 还不能在 App 内注销账号」的提示也要在实现时一并删除。删除 Apple 登录的账号时，还必须调用 Apple 的接口撤销令牌，这需要服务端取得 authorization code。
4. **App 内隐私政策链接**：已完成。「设置」的「关于」一节链接隐私政策和用户协议，地址由 `ios/Boji/Models/LegalDocument.swift` 按界面语言选择。网站部署前，链接打开的页面返回 404。
5. **云同步的同意页面**：开启云同步前，App 必须显示单独的同意页面，说明上传哪些内容和存放地点。中国大陆用户的同意还要满足《个人信息保护法》对敏感个人信息和出境的单独同意要求。
6. **服务商与数据处理协议**：2026-10-21 用户确认服务商为 OVH US LLC（OVHcloud）、Cloudflare, Inc. 和 Sentry，邮件由自建系统发送，不属于受托处理，所以清单不列。三家已列入《第三方信息共享清单》。还需与各服务商签署数据处理协议，并确认自建邮件系统上线。
7. **中国大陆合规**：律师评估是否需要按《个人信息保护法》第 53 条在境内设立专门机构或指定代表，以及数据出境的合规路径。在中国大陆区上架需要 ICP 备案号。
8. **华盛顿州 My Health My Data Act**：律师评估云同步上传的活动与身体记录是否属于「消费者健康数据」。如果属于，需要单独的同意，并另行发布消费者健康数据隐私政策。
9. **保存期限**：服务端没有清理过期会话、验证令牌和本地邮件文件的定时任务。文件承诺设备与使用信息「保存到实现安全和诊断目的所需的期限」，需要确定具体期限并实现清理。
10. **Apple 身份令牌明文保存**：better-auth 的 `encrypt_oauth_tokens` 默认关闭。已建议在单独任务中处理。
11. **支持页**：支持页的常见问题仍描述当前 iOS 版本的具体行为，产品变化时要同步更新。支持页目前只有中文版。

## 上线条件

1. 完成待办事项 1～6。
2. 在正常终端中运行 `pnpm build`（Turbopack），确认构建通过。
3. 把 `out/` 部署到 `leanmuscle.club`，确认 `/privacy/`、`/terms/`、`/support/`、`/en/privacy/` 和 `/en/terms/` 返回 200，页面内容与仓库一致。
4. 在 App Store Connect 中填写隐私政策网址和支持网址。英文商店可以使用 `/en/privacy/`。
5. 在 App Store Connect 中把用户协议设为自定义 EULA，并把年龄分级调高到 18+。自定义 EULA 只接受纯文本，粘贴前去掉 Markdown 标记。
6. 按文件内容复核 App 隐私标签：账号信息、设备与使用信息、诊断信息，以及云同步上线后的健康与健身数据。

## 验证记录

2026-10-21，在开发者的 Mac 上，用 Node.js 24.19.0 执行：

- `pnpm typecheck` 通过。
- `next build --webpack` 通过，生成 `/privacy/`、`/terms/`、`/en/privacy/` 和 `/en/terms/` 等 20 个静态页面。
- 英文页面的标题为「Privacy Policy · Lean Muscle Club」和「Terms of Use · Lean Muscle Club」，正文带有 `lang="en"`。
- 中英文页面互相链接。两种语言版本的隐私政策各有 16 个自定义锚点，用户协议各有 16 个，两版一致。用脚本检查五个页面中全部 137 个页内和跨页锚点链接，全部能解析到构建后的 `id`，页面中没有残留的 `[#` 文本。
- zhlint 对中文页面的报错有两类，均不修改：
  - 英文地址行中的半角标点。
  - 粗体结束标记 `**` 后的空格。这个空格让 Markdown 正确识别粗体结束。
- 自检：按 skill 的 12 项清单检查。没有「军用级」「100% 安全」等过度承诺；成文法条引用只有英文版 GDPR 第五章，属于法律名称和章节的一般性引用；各条陈述都有[陈述依据](#陈述依据)；联系方式、生效日期、变更通知方式、未成年人条款和律师审阅提示齐全。律师审阅仍是待办事项。

未验证：Turbopack 构建、浏览器中的显示效果和公网访问。
