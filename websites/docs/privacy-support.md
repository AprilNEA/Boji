# 隐私政策与支持页维护记录

本文是内部文档，不在网站发布。它记录 `/privacy/` 和 `/support/` 两个页面的状态、每条陈述的依据、待确认项和上线条件。

## 状态

两个页面已在本地实现，尚未部署，公网不可访问。隐私政策是发布前草案，页面顶部有草案提示。AprilNEA LLC 确认最终条款前，禁止把它当作正式隐私政策提交审核。

| 页面 | 内容源 | 路由 | 正式地址 |
| --- | --- | --- | --- |
| 支持 | `docs/sites/support.mdx` | `/support/` | `https://leanmuscle.club/support/` |
| 隐私政策 | `docs/sites/privacy.mdx` | `/privacy/` | `https://leanmuscle.club/privacy/` |

2026-10-21 02:28（UTC+08:00），用户确认了 `leanmuscle.club` 域名和上面两个正式地址。主任务同一时间用 curl 跟随跳转访问两个地址，都返回 HTTP 404，说明页面尚未部署。这个确认只针对网址，不代表政策条款或公开支持邮箱已经确认。

页面曾在本地放在 `/docs/support/` 和 `/docs/privacy/`。这两个路径没有部署过，也没有填入 App Store Connect，所以没有保留跳转。

## 陈述依据

页面只写源码能证实的行为。下表列出主要陈述和对应的源码。修改陈述前，先重新核对源码。

| 陈述 | 依据 |
| --- | --- |
| 本机记录保存在 App 容器中，不上传 | `ios/Boji/Models/BojiStore.swift` 的 `persistIfNeeded()`；`ios/Boji/` 中没有调用活动同步接口 |
| 导出文件的内容 | `BojiStore.exportJSON()` 只编码 `StoredState`；`ios/Boji/Views/SettingsView.swift` 的说明文字 |
| Apple 健康只读三类数据、最近 30 天 | `ios/Boji/Models/HealthDataStore.swift`：`typesToShare` 为空，查询起点为 30 天前 |
| 健康样本只在内存中，不进入导出 | `HealthDataStore.swift`；`ios/Boji/Views/HealthConnectionView.swift` 的说明文字 |
| 注册发送昵称、邮箱和密码 | `ios/Boji/Models/BetterAuthClient.swift` 的 `register()` |
| Apple 登录发送凭证和可选姓名 | `ios/Boji/Views/AppleSignInSection.swift` 请求 `.fullName` 和 `.email` |
| 令牌只在本机有效 | `ios/Boji/Models/MembershipAPI.swift` 使用 `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` |
| 本机保存账号和会员卡缓存 | `MembershipAPI.swift` 的 `FileMembershipCacheStore` |
| 领卡提交卡面昵称和守则版本 | `ios/Boji/Views/MembershipEnrollmentView.swift` 的说明文字 |
| 分享图片默认隐藏卡号 | `ios/Boji/Models/MembershipPresentation.swift` 中 `showsMemberNumber = false` |
| 共享当天打卡状态默认关闭，只含是否记录和训练场景 | `ios/Boji/Models/CompanionSharingStore.swift`、`ios/Shared/CompanionSnapshot.swift`、`ios/Boji/BojiApp.swift` |
| 会话可能记录 IP 地址和 User-Agent | `bizserver/src/auth_schema/session.rs` 与 `bizserver/src/migrations/auth.rs` 的 `ip_address`、`user_agent` 列 |
| 崩溃报告默认关闭，以及报告内容 | `docs/sentry.md`、`ios/project.yml` 的 `BOJI_SENTRY_DSN`、`ios/Boji/CrashReporting.swift` |
| 除 Sentry 外不包含收集数据的第三方 SDK | `ios/project.yml` 的 `packages` 只有 Lottie 和 Sentry；`ios/Boji/Resources/PrivacyInfo.xcprivacy` 中 `NSPrivacyTracking` 为 `false` |
| 发布版本只用 HTTPS 连接服务 | `ios/Boji/Models/BojiHTTPClient.swift` 的 Release 地址校验 |
| 删除本机数据和退出登录的范围 | `SettingsView.swift` 的确认操作；`ios/Boji/Models/MembershipStore.swift` 的 `clearLocalSession()`，以及先调用服务端退出、再清除本机状态的 `signOut()` |
| App 内不能删除账号 | `ios/Boji/Views/AccountSecurityView.swift`；`bizserver/README.md` 写明账号删除未完成 |

## 待确认项

以下事项需要 AprilNEA LLC 或发布负责人确认。确认前，页面不写相关条款。

1. **最终条款和生效日期**：确认后删除 `privacy.mdx` 顶部的草案提示，并写明生效日期。
2. **账号删除**：App 支持创建账号，App Store 要求 App 内提供删除账号的入口。功能上线后，更新隐私政策的「删除账号」一节和支持页的对应问题，写明删除范围。
3. **私密联系渠道**：支持页目前只有公开的 Discord 社区。需要确认一个公开的支持邮箱或表单，供用户处理账号问题。官网页脚已公开 `thinmuscle-club@proton.me`，用于网站内容的问题和投诉，尚未确认能否用于 App 支持。禁止使用 App Store 审核联系人。
4. **公开 Issue 渠道**：2026-10-20 17:53（UTC）匿名访问 `https://github.com/AprilNEA/Boji` 返回 404，仓库不能作为公开反馈渠道。仓库公开后，可以把 Issue 加入支持页，并保留不要公开敏感信息的提醒。
5. **正式域名**：已确认。2026-10-21 02:28（UTC+08:00），用户确认使用 `https://leanmuscle.club/support/` 和 `https://leanmuscle.club/privacy/`。
6. **服务端数据处理**：确认托管服务商、服务器所在地区、邮件服务商、服务器日志和各类数据的保存期限。`bizserver/README.md` 写明 SMTP 发件箱尚未迁入，验证邮件和重置密码邮件的发送方式也要确认。确认生产环境是否写入会话的 `ip_address` 和 `user_agent`，并据此复核 App 隐私标签。
7. **崩溃报告**：确认本次归档是否注入 `BOJI_SENTRY_DSN`。启用时，把「崩溃诊断」一节改为确定的表述，并在 App 隐私标签中申报诊断数据。不启用时，把该节改为「当前版本不发送崩溃报告」。
8. **法律条款**：决定是否写入以下内容：不出售个人信息的承诺、儿童隐私、政策变更的通知方式、适用法律，以及各地区法规规定的用户权利。
9. **网站隐私**：本政策只覆盖 iOS App。官网本身的访问日志、浏览器本地存储和可选的 Sentry 没有写入。
10. **其他版本**：Android 版上架前，补充 Android 的数据处理说明。英文商店是否需要英文版政策页面，待决定。

## 上线条件

1. 完成待确认项 1、2、3，并按结果更新两个页面。
2. 在正常终端中运行 `pnpm build`（Turbopack），确认构建通过。本次修改只用 `next build --webpack` 验证过，原因见下文。
3. 把 `out/` 部署到 `leanmuscle.club`，确认两个地址返回 200，页面内容与仓库一致，文档搜索能找到两个页面。不带结尾斜杠的 `/privacy` 和 `/support` 是否跳转到带斜杠的地址，由托管服务决定，部署后也要检查。
4. 在 App Store Connect 中填写隐私政策网址和支持网址。

## 验证记录

2026-10-21 02:42（UTC+08:00），在开发者的 Mac 上，用 devenv 的 Node.js 26.11.1 执行。这是页面移到根路径以后的结果。

已验证的结果：

- `pnpm typecheck` 通过。
- `next build --webpack` 通过。构建生成 `/privacy/` 和 `/support/` 两个静态页面，文档区仍是 `/docs/`、`/docs/guide/` 和 `/docs/developers/` 3 个页面。`out/docs/privacy/` 和 `out/docs/support/` 不存在。
- `docs/sites/docs/` 下 6 个文件与 Git 中 `websites/content/docs/` 的原文逐字相同，文档区内容只是移动了位置。
- 搜索索引 `out/api/search` 包含 5 个页面：3 个文档区页面、`/privacy` 和 `/support`。文档区页面的面包屑与迁移前相同，例如 `/docs/guide` 为「文档 › 用户指南」。索引中没有 `AGENTS`、`membership.md`、`sentry.md` 和 `DSN` 等字样，说明 `docs/sites/AGENTS.md` 和内部文档没有发布。
- 3 个文档区页面的侧边栏最下面都有「支持」和「隐私政策」，位于 Discord 和深浅色切换按钮下方。用户指南页的栏目切换器正常显示。
- `/privacy/` 和 `/support/` 没有侧边栏，只有顶栏。顶栏有「文档」「支持」「隐私政策」、搜索和 Discord。页面标题分别为「隐私政策 · 薄肌俱乐部」和「支持 · 薄肌俱乐部」。隐私政策仍显示草案提示。
- 用 `python3 -m http.server` 预览 `out/`，在浏览器中从隐私政策点击「文档」，再从侧边栏点击「支持」，都能正常跳转。两个页面之间的相对链接指向 `/privacy/` 和 `/support/`。

未验证的事项：

- Turbopack 构建，即 `pnpm build` 的默认方式。本机执行环境禁止 Turbopack 的加载器进程绑定本机端口。构建在编译 `src/lib/source.ts` 时失败，错误为 `binding to a port: Operation not permitted`。原配置同样要启动这个加载器进程，所以推断这个限制与内容源的位置无关，但没有用原配置复现。`next.config.ts` 已按 Next.js 文档把 `turbopack.root` 设为仓库根目录，否则 Turbopack 不解析 `websites/` 以外的文件。
- `pnpm dev` 的热更新。没有运行开发服务器，因为它也使用 Turbopack。
- 浏览器中的搜索对话框。只检查了构建出的索引文件，没有在对话框中输入关键词。
- 公网访问。两个页面尚未部署。
