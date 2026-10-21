# Boji iOS

Boji 的原生 iOS 客户端，本地优先。界面采用 SwiftUI 和系统 Liquid Glass。最低支持 iOS 26。

## 已实现

- 首次引导：选择居家或健身房训练。
- 今日看板：训练、饮水、睡眠的记录状态。
- 日常记录：饮水增减、睡眠时长和输入校验。
- 训练：4 套课程（3 套入门、1 套进阶）、动作说明和逐组训练。
- 训练计时：暂停、继续、休息倒计时和完成记录。
- 动作演示：Lottie 本地加载、循环、暂停、慢速与代表姿势。接入和验证见[动作动画说明](docs/lottie-integration.md)。
- 足迹：最近 7 天活动、身体数据和趋势图。
- 俱乐部：本地每周挑战、免费会员身份卡和入门文章。
- 会员：邮箱登录、验证提示、服务端领卡、状态同步和图片分享。
- Apple 生态：HealthKit 只读查询、Apple 登录和 Wallet 接入代码。
- 小组件与 Watch：用户主动开启后，共享当天打卡状态。
- 设置：昵称、外观、JSON 导出和本地数据删除。

同一天重复完成同一课程不会重复计数。训练页面的分钟数是计划时长。完成页另行显示本次计时。

## 本地运行

本文的命令都在 `ios/` 目录中运行。构建产物写入仓库根目录的 `.work/`，该目录不纳入版本控制。

项目通过 Swift Package Manager 使用 Lottie 4.6.1。首次解析依赖需要联网，动画播放不需要联网。打开 `Boji.xcodeproj`，选择 `Boji` scheme 和 iOS 模拟器，再运行。

本次开发使用 Xcode 27.1。若修改 `project.yml`，先用 XcodeGen 重新生成工程：

```sh
xcodegen generate
```

命令行构建：

```sh
xcodebuild -project Boji.xcodeproj -scheme Boji \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ../.work/boji-ios/DerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

工程使用已注册的 `club.leanmuscle.boji` 和团队 `8U3ZJ258K9`。真机运行仍需有效签名证书及配置文件。切换自旧 Bundle ID 时，系统不会自动迁移旧 App 数据。

## 测试

数据测试位于 `BojiTests`。界面测试位于 `BojiUITests`。使用目标模拟器的 UDID 替换下方变量：

```sh
SIMULATOR_UDID='<目标模拟器 UDID>'
xcodebuild -project Boji.xcodeproj -scheme Boji \
  -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
  -derivedDataPath ../.work/boji-ios/DerivedData \
  -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO test
```

Debug 构建的 `--uitesting` 参数启用内存存储和会员测试服务。测试卡标明非真实会员，不连接后端。健康查询使用空数据测试提供器，不访问真实 HealthKit。界面测试不改写正常使用的身体记录。测试截图保存在 Xcode 测试结果中。

受限终端可能拦截 Swift 宏插件。出现 `sandbox_apply: Operation not permitted` 时，需要允许 Xcode 执行宏插件。不要删除 `@Observable` 来掩盖权限问题。

## 免费会员卡

基础记录无需登录。免费身份卡需要登录已验证的邮箱账号，再主动同意守则并领卡。卡号、入会日期和状态由后端生成，客户端不自行签发。

领卡包含昵称预览、守则确认和信息核对。分享预览支持三种配色，卡号默认隐藏。流程和验证结果见[会员卡体验完善](docs/membership-experience.md)。

Debug 默认连接 `http://localhost:3000`。正式配置通过构建设置 `BOJI_API_BASE_URL` 写入 `BojiAPIBaseURL`。Release 必须使用 HTTPS；未配置时禁用联网领卡。后端由独立任务维护，不包含在此 iOS 目录。

接入与验证边界见[会员卡开发说明](../docs/membership.md)。这版不包含付费订阅或场馆核销。

## 账号与安全

认证使用原生 Swift 的 `BetterAuthClient` 对接后端标准接口。登录后可在「设置 → 账号与安全」检查当前会话、修改密码或退出其他会话。令牌只从 `set-auth-token` 读取，保存在 Keychain。

接入方式与本轮验证结果见 [Better Auth 原生接入](docs/better-auth.md)。服务器地址仍需独立配置；客户端实现不等于生产服务已上线。

## Apple 生态配置

设置页提供可选的 Apple 健康只读连接。健康样本仅在内存展示，不会覆盖手动记录或上传后端。Apple 登录与 Wallet 的客户端标识已配置，实际可用性仍由后端能力接口控制。

小组件和 Watch 首版显示当天手动打卡状态，不共享健康样本或账号信息。共享默认关闭。实现范围和前置条件见[已注册能力实现说明](docs/capability-implementation.md)。代码接入不等于真实 Apple 服务验收。

## 数据与隐私

应用将记录写入自身容器的 `Application Support/Boji/state.json`。写入采用原子替换。文件损坏时停止写入，并显示错误，不覆盖原文件。
用户明确确认删除后，应用会清除损坏文件并重建空记录。

会员登录会向后端提交邮箱和认证信息。会员卡使用服务端数据，令牌保存在 Keychain。训练和身体记录不会因领卡上传。退出账号只清理本机会员会话，不注销服务器账号。

用户开启共享后，当天打卡状态可显示在小组件与配对手表上。此功能不上传服务器，也不共享具体数值。原始记录仍留在 iPhone。

主动导出的 JSON 包含身体数据，但不包含认证令牌。设备系统备份仍可能包含应用数据。卸载前需要自行导出重要记录。

构建设置 `BOJI_SENTRY_DSN` 非空时，应用会把崩溃、卡顿和看门狗终止上报到 Sentry。`project.yml` 中的默认值为空，默认构建不上报任何内容。上报内容不含训练、身体和 HealthKit 记录，也不含账号信息、截图和网络请求。启用方式和上报字段见 [Sentry 错误上报](../docs/sentry.md)。

## 设计与发布边界

[设计说明](docs/design.md)记录了材质分层和辅助功能策略。[验证记录](docs/verification.md)列出实际测试结果，[界面改造验证](docs/ui-refresh-verification.md)记录本轮 HIG 改造的范围和结果。

Liquid Glass 只用于标签栏、导航栏、工具栏和底部操作栏。内容卡片使用实色，不使用玻璃。界面支持深色模式、高对比度和 Dynamic Type，iPad 上标签栏可以切换为侧边栏。

当前不包含照片分析、AI 识餐或 HealthKit 写入。多人社区、支付和训练视频也未接入。课程是通用参考，不提供医疗诊断。

App 图标使用 Icon Composer，支持默认、深色和系统着色外观。用 Icon Composer 打开 `Boji/Resources/AppIcon.icon` 编辑，Xcode 会在构建时编译图标。

「薄肌」为开发暂用名称。商标核查、发布签名和 App Store 审核尚未完成。本项目尚未上架。

商店文案通过 [asc 元数据工具](app-store/README.md)管理。中英文文件仍是未批准上传的草案。工具提供离线校验和只读差异预览，不会自动上传或提交审核。

CI/CD 分为自动校验、手动 TestFlight 上传和独立提审。发布前需完成托管 Runner 验证。发布凭据与审批配置见 [CI/CD 说明](docs/ci-cd.md)。
