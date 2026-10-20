# 已注册能力的客户端实现

本轮使用已注册的 Apple 标识构建 0.4.0。实现范围为主 App 配置、共享容器、小组件和 Watch 配套。服务端配置就绪不等于真实 Apple 服务已经验收。

## 工程标识

| 目标 | Bundle ID | 本轮使用的能力 |
| --- | --- | --- |
| iPhone / iPad | `club.leanmuscle.boji` | HealthKit 只读、Apple 登录、App Groups |
| Widget Extension | `club.leanmuscle.boji.widgets` | App Groups、WidgetKit |
| Watch App | `club.leanmuscle.boji.watchkitapp` | App Groups、WatchConnectivity |

签名团队为 `8U3ZJ258K9`。共享容器为 `group.club.leanmuscle.boji`。这些标识不是密钥，可以保存在客户端工程中。

主 App 的 Bundle ID 已从临时标识切换。这会被系统视为另一个 App，不会自动继承旧预览版的本地记录或登录状态。切换前可以在旧版导出记录。本轮没有删除旧版数据，也没有实现跨 Bundle 数据导入。

## 小组件与手表

入口为「设置 → 小组件与 Apple Watch」。共享默认关闭，用户必须主动开启。

共享内容只有日期、更新时间、训练场景，以及当天训练、饮水、睡眠是否记录。共享内容不包含饮水量、睡眠时长、身体测量、HealthKit 样本、昵称、会员信息或登录令牌。

小组件提供桌面小号、中号和锁屏样式。点击可打开 App 的对应页面。新的一天不沿用昨天的完成状态，刷新时间由系统决定。

Watch App 显示当天状态，并提供刷新按钮。它通过 WatchConnectivity 接收数据。App Group 不会自动把 iPhone 文件同步到手表，因此两端各自保存接收到的快照。

关闭共享或删除本地数据后，App 写入停用快照。离线手表会在下次连接后清除显示。小组件的显示更新也受系统调度影响。

Watch 首版是只读配套，不记录运动，不读取手表 HealthKit，不修改 iPhone 的打卡记录。暂未添加手表复杂功能、Live Activities 或独立登录。

## Apple 登录与 Wallet

Apple 登录的客户端开关已开启。只有服务端能力接口同时返回可用，App 才显示可操作的系统登录按钮。服务地址仍需通过 `BOJI_API_BASE_URL` 配置，Release 必须使用 HTTPS。

Wallet 凭证类型已配置为 `pass.club.leanmuscle.boji.membership`。它仍受服务端 `walletPass` 能力开关控制。正式签名证书尚未提供，不会制作假凭证。

Apple 私钥只应由后端从受限凭据存储读取。客户端代码、共享容器和 Watch 包都不保存私钥。尚未部署验证的域名，不作为默认生产地址。

## 权益对象兼容

会员权益改为读取服务端对象。界面使用服务端名称、说明、授权时间和到期时间。

旧字符串缓存仍可读取，但不能冒充已核验授权。未知代码、过期授权或尚未生效的授权，不会开启客户端能力。基础记录与训练继续免登录可用。

卡号仍是不透明字符串。客户端不实现或公开服务端分配策略。

## 暂不启用的能力

| 能力 | 当前边界 |
| --- | --- |
| 远程推送 | 未提供 APNs 密钥，也未实现设备令牌接口 |
| Associated Domains | 仍需确认生产域名、AASA 和实际链接场景 |
| Apple Pay | 仅预备了 Merchant ID，没有商品或支付流程 |
| 付费内购 | 没有产品 ID、订阅商品或购买验收 |
| Watch HealthKit | 已注册但首版未使用，不添加对应 entitlement |

本轮没有自动添加这些未使用的 entitlement。也没有申请证书、购买产品或修改 Apple Developer 后台。

## 验证入口

完整构建和测试结果见[本轮验证记录](capability-verification.md)。本地模型测试不会连接真实账号或读取健康数据。

真实设备验收仍需要有效签名和配对设备。模拟器暂停期间，不通过命令行绕过控制限制。
