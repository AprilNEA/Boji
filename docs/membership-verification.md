# 会员卡验证记录

版本：0.2.0 (2)。验证时间：2026 年 10 月 20 日，UTC+08:00。

**Debug 与 Release 编译通过。** 17 项会员模型测试和 1 项真实后端集成测试通过。模拟器仍处于暂停控制状态，本次没有安装新版本或运行界面测试。

## 已验证

- `xcodebuild build-for-testing`：iOS Debug 应用和测试目标编译通过，目标为通用 iOS Simulator。
- `xcodebuild build`：iOS Release 应用编译通过，目标为通用 iOS Simulator。
- macOS 宿主模型测试：17 项通过。使用实际会员模型与网络实现源码，注入隔离的网络和存储依赖。
- 真实后端集成测试：1 项通过。Swift URLSession 连接 `http://localhost:3131` 的隔离测试实例。
- 实际联调覆盖登录、Bearer 鉴权、领卡、重复领卡、重新创建客户端后的会话恢复和退出。
- 领卡返回 `BJ-` 开头的服务端卡号。重复领卡保留原卡号和昵称。
- 模型测试覆盖条款确认、未验证邮箱、401 清理、离线缓存、跨服务缓存隔离、错误用户数据、未知状态、日期和配置安全。
- 隐私清单与 Info.plist 语法通过检查。

集成测试使用后端任务提供的专用账号与数据库。凭据只从私有文件读取，没有打印到聊天或测试日志。

## 未验证

- iOS 模拟器的视觉效果、实际点击流程和系统图片分享界面。
- 真机 Keychain 的实际读写；模型测试使用注入的内存令牌存储。
- 跨 App 进程或设备重启后的真实恢复。已验证的是重新创建客户端后的会话恢复。
- 真实邮箱投递、Apple 登录、Apple Wallet 和 HealthKit。
- 真机签名、发布归档、App Store 提交与审核。

新增的 3 项会员界面测试已编译，但没有运行。此前 4 项界面测试也没有在本轮重跑。

## 运行方式与证据

宿主测试使用 `.work/boji-membership/model-tests/Package.swift`。源文件通过符号链接引用实际工程，未复制另一套模型实现。

- 编译日志：`.work/boji-membership/build-debug-final.log`
- Release 日志：`.work/boji-membership/build-release.log`
- 宿主与集成测试日志：`.work/boji-membership/model-tests-final.log`
- 集成测试：`.work/boji-membership/model-tests/Tests/BojiTests/MembershipIntegrationTests.swift`

首轮模型测试发现测试用 UTC 时间戳写错，已修正后重跑。首轮编译中新增模型的变量和锁警告也已修正。

旧界面测试的同步初始化仍有主线程隔离警告，尚未改动该测试。编译还提示未使用 AppIntents，跳过元数据提取；当前没有快捷指令功能。

本次没有修改后端源码，也没有创建 Git 提交。
