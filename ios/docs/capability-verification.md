# 已注册能力验证记录

版本：0.4.0 (4)。验证日期：2026 年 10 月 20 日，UTC+08:00。

**54 项宿主模型测试通过。Debug 与 Release 构建通过。** 主 App 包已包含小组件和 Watch App。未完成模拟器运行、配对设备或真实 Apple 服务验收。

## 已验证

| 范围 | 结果 |
| --- | --- |
| 会员和缓存模型 | 18 项测试通过 |
| 新权益对象 | 6 项测试通过 |
| Apple 协议与 Wallet 响应 | 7 项测试通过 |
| 健康数据模型与状态 | 16 项测试通过 |
| 共享快照与导航 | 7 项测试通过 |
| Debug | 应用及测试目标编译通过 |
| Release | 应用及配套目标编译通过 |

共享快照测试覆盖字段最小化、关闭共享、跨日过期、非法数据、毫秒排序和本地导航边界。测试没有读取真实健康数据库，也没有使用真实账号。

权益测试覆盖对象字段、旧字符串缓存、未知权益、过期授权和尚未生效的授权。客户端不根据卡号推导权益，也不锁定基础本地功能。

两种构建包均包含以下目标：

- 主 App：`club.leanmuscle.boji`
- `PlugIns/BojiWidgets.appex`：`club.leanmuscle.boji.widgets`
- `Watch/BojiWatch.app`：`club.leanmuscle.boji.watchkitapp`

已检查 Watch 的 companion 标识与主 App 一致。已检查主 App 的 Apple 登录开关和 Wallet Pass Type ID。三个目标的版本均为 0.4.0。

对客户端文本文件的模式检查未发现私钥或凭据引用。该检查不能替代完整安全审计。

## 未验证

- 小组件实际渲染、刷新调度及锁屏隐私遮挡。
- 真机 App Group 容器权限和签名配置文件。
- iPhone 与 Apple Watch 的配对、可达性及双向消息。
- 关闭共享后，离线 Watch 的实际清除时机。
- 真实 Apple 登录、正式 `.pkpass` 导入与服务器部署。
- 新权益接口的真实后端联调和数据库迁移。

本轮没有安装新版本，没有申请 HealthKit 权限。没有创建远程推送密钥、钱包证书或支付商品。没有修改生产服务，也没有提交或推送代码。

## 已知警告

原有 `BojiUITests` 初始化仍有主线程隔离警告。构建还提示部分目标未依赖 AppIntents，跳过相关元数据提取。本轮没有加入快捷指令。

首次编译发现权益解码初始化方式和测试可选日期类型不匹配。这两处已修复，并通过最终测试与构建。

## 本地证据

以下路径相对于仓库根目录：

- `.work/boji-capabilities/model-tests-final.log`
- `.work/boji-capabilities/build-debug-final.log`
- `.work/boji-capabilities/build-release.log`
- `.work/boji-capabilities/model-tests/Package.swift`
- `.work/boji-capabilities/DerivedData/Build/Products/`

测试包通过符号链接使用实际客户端源码，没有维护独立实现。
