# Apple 生态接入说明

**0.3.0 已加入三项能力的客户端代码。** 顺序为 HealthKit 只读查询、Apple 登录和 Wallet。真实 Apple 登录与钱包签发仍需开发者配置，不能把编译通过当作真机验收。

## 1. HealthKit 只读查询

入口为「设置 → 健康数据与授权」。用户点击「连接 Apple 健康」后，系统请求读取睡眠、体重和腰围。App 不请求写入权限，也不读取其他健康类型。

查询范围为近 30 天。体重与腰围使用独立样本，保留来源和日期，不伪造缺失字段。相同 UUID 去重，每次刷新替换快照，不追加重复数据。

睡眠日为前日 18:00 至当日 18:00。算法用日历计算日期，适配夏令时。算法只累计睡眠区间，并合并重叠来源；卧床和清醒时间不计入睡眠。

健康摘要显示在「今天」和「足迹」。手动记录保持独立，不会被健康数据覆盖。样本只保存在内存，不上传后端，不进入 JSON 导出或会员分享卡。

断开连接会清除当前样本和查询开关。在途结果不能重新填回数据。断开不会撤销系统权限，也不会删除健康 App 的数据。

授权请求完成不代表每项读取权限都已授予。读取为空时，界面显示「暂无可读取数据」。App 不推断用户拒绝了权限，也不把缺失值当成零。[1] [2]

### 真机准备

1. 在 `DEVELOPMENT_TEAM` 配置自己的团队。
2. 为 `com.aprilnea.boji` 启用 HealthKit。
3. 使用包含相应能力的签名配置构建。
4. 在真机主动授权，检查已有样本和空数据场景。

工程已包含 HealthKit entitlement 和 `NSHealthShareUsageDescription`。HealthKit 是可选功能，没有将它设为安装设备的必需能力。[1]

## 2. Apple 登录

账号页已接入系统 `SignInWithAppleButton`。客户端生成 32 字节随机值，并将 SHA-256 值交给 Apple。客户端把原始随机值交给后端，以匹配已确认的校验契约。

客户端调用 `/api/auth/sign-in/social`。后端验证身份令牌后，客户端继续使用原有 Bearer 会话。登录令牌存入绑定服务地址的 Keychain 条目。

取消系统登录不会建立本地会话。首次返回的姓名可以缺失；客户端不会伪造姓名或邮箱。Apple 与已有邮箱账号不自动合并。[3]

客户端和服务端必须同时启用，才显示可用登录按钮：

| 配置 | 默认值 | 用途 |
| --- | --- | --- |
| `BOJI_APPLE_SIGN_IN_ENABLED` | `NO` | 完成签名配置后改为 `YES` |
| `BOJI_API_BASE_URL` | 空 | 正式环境必须使用 HTTPS |
| `/api/capabilities.appleSignIn` | 后端决定 | 确认服务端 Apple 配置就绪 |

工程已加入 Sign in with Apple entitlement。后端需要自己的 Team ID、Key ID、Service ID 和 `.p8` 私钥。私钥只能放在后端，不能写入 App 或提交到 Git。

## 3. Apple Wallet 身份卡

有效会员卡页已加入系统钱包按钮。客户端请求 `/api/membership/wallet/pass`，使用现有 Bearer 会话。请求不包含健康数据。

客户端要求响应类型为 `application/vnd.apple.pkpass`。空响应、错误类型和超过 2 MiB 的响应都会被拒绝。PassKit 解析凭证后，还要核对凭证类型和会员 ID。

凭证类型必须匹配 `BOJI_WALLET_PASS_TYPE_IDENTIFIER`。`serialNumber` 必须等于当前会员卡 ID。校验通过后，App 打开系统添加窗口，由用户确认；关闭窗口不被当成「添加成功」。

正式签发需要 Pass Type ID 和对应签名证书。签名私钥留在后端，客户端不制作假凭证，也不把 PNG 分享卡冒充钱包卡。[4]

| 配置 | 默认值 | 用途 |
| --- | --- | --- |
| `BOJI_WALLET_PASS_TYPE_IDENTIFIER` | 空 | 与服务端 Pass Type ID 一致 |
| `/api/capabilities.walletPass` | 后端决定 | 确认服务端签发能力 |

服务未配置证书时，钱包接口返回 `503 WALLET_NOT_CONFIGURED`。无卡、未验证邮箱和暂停会员会被后端拒绝。钱包卡仅展示身份，不提供支付或场馆核销。

当前不包含钱包凭证自动更新与推送。已经添加的钱包卡不会自动反映后续暂停状态，因此不能作为实时授权凭证。

## 本地配置示例

完成开发者配置后，可以通过构建参数启用。在 `ios/` 目录中运行以下命令。命令中的值为占位符，不是可直接使用的账号：

```sh
xcodebuild -project Boji.xcodeproj -scheme Boji \
  -destination 'generic/platform=iOS' \
  DEVELOPMENT_TEAM='<你的团队 ID>' \
  BOJI_API_BASE_URL='https://<你的服务域名>' \
  BOJI_APPLE_SIGN_IN_ENABLED=YES \
  BOJI_WALLET_PASS_TYPE_IDENTIFIER='pass.<你的凭证标识>' \
  build
```

后端的 Apple 配置和钱包证书由后端任务维护。本轮没有申请证书，没有替你登录 Apple 账号，也没有部署生产服务。

## 验证与发布边界

验证结果见[Apple 生态验证记录](apple-integration-verification.md)。自动测试使用隔离提供器，不读取真实健康数据。界面测试使用空健康数据，不打开真实 Apple 登录。

当前还未实现 HealthKit 写入、独立 Watch App 或快捷指令。账号删除与 Apple 授权撤销仍需在上架前完善。还需发布隐私政策，并完成真机签名和 App Store 审核。

健康数据不能用于广告画像或出售。后续若增加云端健康功能，必须先设计独立同意和删除机制，不能沿用会员授权。[5]

## 官方参考

[1]: https://developer.apple.com/documentation/healthkit/setting-up-healthkit "Apple：Setting up HealthKit"
[2]: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data "Apple：Authorizing access to health data"
[3]: https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple "Apple：Authenticating users with Sign in with Apple"
[4]: https://developer.apple.com/documentation/walletpasses/building-a-pass "Apple：Building a Pass"
[5]: https://developer.apple.com/documentation/healthkit/protecting-user-privacy "Apple：Protecting user privacy"
