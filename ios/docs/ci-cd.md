# iOS CI/CD

仓库用一个 `ios.yml` 管理三层流程。各层使用独立任务（job），PR 不接触发布凭据。上传和提审都需要手动触发。

推送到 `master` 后只运行 CI。上传和提审需要另行配置发布环境。提交这些文件不会创建 GitHub Secrets，也不会上传或提审。

## 三层职责

| 层级 | 手动 `action` | 触发方式 | 结果 |
| --- | --- | --- | --- |
| 代码校验 | `ci`（默认） | PR、`master` 推送或手动运行 | 检查生成产物，运行测试，编译 Release |
| TestFlight | `testflight` | `master` 手动运行并审批 | 先跑 CI，再签名、上传并等待处理 |
| App Store 审核 | `review` | `master` 手动运行并审批 | 检查或提交已有构建，不重新编译 |

唯一工作流是 [`.github/workflows/ios.yml`](../../.github/workflows/ios.yml)。后两层共享并发组，不能同时写入商店。新的 CI 运行不会取消正在执行的发布。

PR 和推送只执行 `validate`、`build`。手动上传还需通过 `release-gate`，才执行 `testflight`。手动提审只执行 `release-gate` 和 `review`。上传成功不会自动触发提审。

TestFlight 上传不等于外部测试发布。工作流不邀请测试员，不自动分发测试组。提审工作流也不会执行正式发布。

## 第一层：校验代码

PR 和 `master` 推送会运行两组检查：

1. 检查公开元数据和 CI 脚本。运行字符串与动画生成器的校验。重新生成 Xcode 工程，并与 Git 版本比较。
2. 在 Runner 上发现可用的 iPhone 模拟器。运行单元测试和 UI 测试，再编译 Release。检查动画资源及嵌入的 Widget、Watch App。

测试使用项目已有的隔离数据。后端地址和 Sentry DSN 均为空。工作流不访问真实账号或 HealthKit 记录。

CI 只上传测试日志和 `.xcresult`，保留 7 天。公开仓库的读取者可能下载这些文件。测试不得写入真实账号、个人数据或凭据。

CI 不使用 `pull_request_target`。PR 不进入带凭据的 Environment。不要将这个工作流改到个人自托管 Mac。

## 固定工具链

[`ci/toolchain.json`](../ci/toolchain.json)记录工具版本。工作流中的重复值必须与它一起更新。

| 工具 | 固定值 |
| --- | --- |
| Runner | `xcode-27`，GitHub 托管 |
| Xcode | `27.1`，构建号 `27A9275` |
| XcodeGen | `2.46.0`，校验官方 ZIP 的 SHA-256 |
| Node.js | `26.11.1` |
| pnpm | `12.9.1` |
| Rust | `crates/rust-toolchain.toml` |
| asc | `app-store/asc-lock.json`，当前为 `5.16.0` |

Action 使用完整提交 SHA。SwiftPM 使用仓库中的 `Package.resolved`。pnpm 和 Cargo 使用现有锁文件。

本机和 CI 都使用 Xcode 27.1，构建号均为 `27A9275`。`xcode-27` 是 GitHub 的 preview 镜像，可能不稳定或排队。它的底层系统是 macOS 27，默认 Xcode 是 27.0。工作流用 `DEVELOPER_DIR` 选择 `/Applications/Xcode_27.1.app`。这个路径是符号链接，指向镜像中的 Xcode 27.1 Release Candidate。镜像只带 iOS 27.0 和 watchOS 27.0 模拟器。以上信息来自 2026-10-12 的镜像清单。

CI 原先使用 `macos-26` 和 Xcode 26.6。在这套工具链上，`actool` 编译 `AppIcon.icon` 时抛出异常。因此，`master` 上 2026-10-21 前的最近 3 次运行都失败了。改用 `xcode-27` 后，这个问题是否解决未验证。

工作流检查 Xcode 版本和构建号。不匹配就停止，不会自动换版本。GitHub 更新镜像后，`Xcode_27.1.app` 可能指向另一个构建。这时 `check.py toolchain` 会停止。先查镜像清单，再一起更新 `ci/toolchain.json` 和工作流。`ci/tests/test_pipeline.py` 检查工作流中的重复值与 `ci/toolchain.json` 一致。不要为赶上线而改用不受控的 Runner。

## 配置发布权限

先在 GitHub 仓库设置中创建两个 Environment：

- `ios-testflight`
- `ios-appstore-review`

两个环境都只允许 `master` 部署。设置 required reviewers，并启用禁止自行批准。限制管理员绕过审批。保护 `master`，要求代码评审和第一层检查通过。

Environment 的审批规则不在工作流 YAML 中。仅写入 `environment:` 不会自动配置保护。检查规则后，再把仓库变量 `IOS_RELEASE_ENABLED` 设为 `true`。缺少该变量时，上传和提审 job 都会停止。

工作流、`ios/ci/` 和发布配置需要重点评审。代码拥有者可以执行带凭据的脚本，不能仅依赖密钥的日志遮罩。

### TestFlight 环境

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `BOJI_API_BASE_URL` | 已验收的正式 HTTPS 服务源地址 |
| Variable | `IOS_BACKEND_VERIFIED` | 联调通过后设为 `true` |
| Variable | `IOS_ARTIFACT_PUBLIC_KEY` | 单个 OpenPGP 加密公钥，保留 ASCII armor 和换行 |
| Secret | `IOS_DISTRIBUTION_P12_BASE64` | 分发证书及私钥的 P12，整体 Base64 编码 |
| Secret | `IOS_DISTRIBUTION_P12_PASSWORD` | P12 导出密码 |
| Secret | `IOS_APP_PROFILE_BASE64` | 主应用 App Store 描述文件的 Base64 |
| Secret | `IOS_WIDGET_PROFILE_BASE64` | Widget App Store 描述文件的 Base64 |
| Secret | `IOS_WATCH_PROFILE_BASE64` | Watch App Store 描述文件的 Base64 |
| Secret | `ASC_KEY_ID` | 具有上传权限的 API Key ID |
| Secret | `ASC_ISSUER_ID` | 对应的 Issuer ID |
| Secret | `ASC_PRIVATE_KEY_P8` | 对应 P8 私钥正文，保留换行 |

现有 Marketing Key 不具备构建上传权限。不要直接扩权。使用另一个经过授权的凭据，按需授予 Developer 等允许上传的角色。API Key 不能替代签名证书和三个描述文件。

描述文件必须分别匹配：

- `club.leanmuscle.boji`
- `club.leanmuscle.boji.widgets`
- `club.leanmuscle.boji.watchkitapp`

脚本检查团队、有效期、分发类型和证书归属。它还检查各目标声明的 App Groups 等能力。Development、Ad Hoc 和企业分发文件会被拒绝。

签名只在一次性 GitHub 托管 Runner 执行。脚本创建临时 Keychain，结束时由独立步骤清理。IPA 只上传到 Apple，不保存为 GitHub 产物。归档、描述文件、P8 和 P12 也不保存为 GitHub 产物。

Sentry 在这套流程中保持关闭。启用应用崩溃上报需要另行审查隐私声明。构建日志和 dSYM 只以加密产物保存，见下文。

### App Store 审核环境

配置同名的 `ASC_KEY_ID`、`ASC_ISSUER_ID` 和 `ASC_PRIVATE_KEY_P8`。使用允许提交审核的角色，例如 App Manager。不要把审核联系人或测试密码写进 Git。

本机的 `op run` 交互会话不能供 Runner 使用。本轮没有将 1Password 数据复制到 GitHub。配置 Secrets 或无人值守保险库访问，需要另行授权。

## 第二层：上传构建

先将目标提交合并到 `master`。`testflight` 模式会在同次运行中重新执行 CI。两个 CI job 都通过后，才允许进入签名和上传。输入版本必须与 `ios/project.yml` 和 `app-store/project.json` 一致。

输入一个尚未使用的构建号，例如 `8`。脚本不会自动改变营销版本。允许的构建号使用 Apple 数字版本格式。

操作顺序：

1. 打开 Actions 中的 `iOS`。
2. 选择 `master`，将 `action` 设为 `testflight`。
3. 填写 `version` 和 `build_number`，等待 CI 通过并审批环境。
4. 等待 Apple 完成构建处理。
5. 保存运行 ID，进入 TestFlight 验收。

`testflight` 任务将关键操作显示为独立步骤：

1. `Prepare signing certificates and profiles` 校验并安装签名材料。
2. `Archive signed iOS app` 直接执行 `xcodebuild archive`。
3. `Export IPA` 直接执行 `xcodebuild -exportArchive`。
4. `Upload IPA to App Store Connect and wait for processing` 上传并等待处理。
5. 加密保存诊断产物，再清理签名材料和明文文件。

`signing.py` 不再执行构建或上传。它只负责参数校验、签名准备和清理。`Export IPA` 生成 `$RUNNER_TEMP/boji-export/Boji.ipa`。上传仍使用 `store.py` 的精确构建校验和防重传规则。

上传前会查询相同版本和构建号。已有构建时停止，不重复上传。若上传超时，先去 Apple 后台确认结果。不要直接点击重新运行，也不要用新构建号掩盖不明状态。

成功后生成 `ios-testflight-receipt` artifact，保留 90 天。其中只有 App ID、版本、构建号、构建 ID、提交 SHA 和 IPA 摘要。该文件不包含凭据。

本地版本目前为 `0.7.0`，商店草稿为 `1.0`。本轮不自动对齐两者。正式发布前需明确版本，再同步代码、元数据与验收记录。

## 查看构建诊断

正式构建的完整日志不进入公开控制台。控制台只显示编译错误位置等有限信息。日志记录失败或构建失败都会使对应步骤失败。工作流不会因日志管道而忽略构建退出码。

工作流将原始日志和 dSYM 打包并加密。密文产物名为 `ios-release-evidence-<run-id>-<attempt>`，保留 90 天。内容不包含 IPA、签名文件或整个归档。构建失败时，工作流仍会尝试保存已有日志。

`IOS_ARTIFACT_PUBLIC_KEY` 必须是有效的加密公钥。缺失或无效时，工作流在签名前停止。对应私钥只由负责人员在 CI 外保管。不要用 Apple P8 或签名证书替代 OpenPGP 密钥。

只有密文会上传到 GitHub。加密失败时，工作流不会改为上传明文。产物过期前，由负责人员下载并按私密备份规则保存。

先解压 GitHub 下载的产物 ZIP，取得 `.tar.gpg` 文件。然后在持有对应私钥的可信电脑上解密：

```sh
gpg --output release-evidence.tar --decrypt release-evidence.tar.gpg
```

解密后的日志和符号文件不得进入 Git 或公开工单。本轮没有创建正式加密密钥，也没有配置环境变量。加密留存仍需在托管 Runner 验收。

## 第三层：提交同一构建

先验收 TestFlight 构建。完成后更新 [`release-approval.json`](../ci/release-approval.json)。先从回执复制以下三个值：

| 验收字段 | 回执字段 |
| --- | --- |
| `version` | `version` |
| `testedCommit` | `commit` |
| `testedBuildId` | `buildId` |

`testedCommit` 和 `testedBuildId` 初始为空。两者必须与本次回执完全一致。更换构建后必须重新验收，不能沿用旧构建的批准。

只将有证据的 `checks` 项设为 `true`：

| 字段 | 验收要求 |
| --- | --- |
| `backend` | 正式服务、登录、会员卡及客户端协议联调通过 |
| `reviewAccess` | 审核员可以访问全部需要审核的功能 |
| `privacy` | 政策、隐私标签、诊断配置与实际行为一致 |
| `legal` | 内容权利、地区条件、账号注销等发布要求已确认 |
| `screenshots` | 已上传截图与最终构建一致 |
| `exportCompliance` | 出口合规资料已按实际情况处理 |

这些字段默认全部为 `false`。它们是人工验收记录，不能由构建成功自动修改。`app-store/project.json` 中的名称和功能声明也必须获批准。对应字段是 `nameApproved` 和 `claimsVerified`。

将验收记录提交到 `master`，再触发提审。验收记录提交可以晚于构建提交。工作流仍使用回执中的原构建，不会重新编译。

在 Apple 后台准备对应的商店版本。发布方式必须是 `MANUAL`，并已选中回执中的同一构建。工作流不会替换尚未匹配的构建。

操作顺序：

1. 打开 Actions 中的 `iOS`，选择 `master`。
2. 将 `action` 设为 `review`，填写 `testflight_run_id`。
3. 保持 `submit=false`，审批环境后运行只读检查。
4. 检查通过后，使用同一运行 ID，设 `submit=true`。
5. 再次审批 `ios-appstore-review` 环境，提交审核。

运行 ID 必须来自成功的 `testflight` 模式。仅有 CI 或提审成功的运行不能提供构建回执。脚本检查该次运行的四个 job 是否全部成功：`validate`、`build`、`release-gate`、`testflight`。

脚本还检查回执所属的工作流、分支、仓库和提交。它从回执选择 Apple 构建，不接受任意 IPA。脚本再次核对版本、构建号与 `VALID` 处理状态。

`submit=false` 会联网检查，不是离线预览。它检查两种语言的网址及 Apple 版本状态。它会运行 `asc validate --strict`，但不修改商店。

本地默认只检查文件，不连接 Apple。`store.py submit` 必须提供 `--receipt` 路径。`--check-remote` 开启上述只读检查。只有 `--apply` 允许提交审核。

流程不会接受法律协议、回答出口问卷或发布隐私声明。它不自动同步文案、替换截图、创建版本或切换发布方式。缺项需要先在现有元数据流程或 Apple 后台完成。

审核通过后，仍需在 Apple 后台人工发布。

## 本地验证

在仓库根目录执行：

```sh
python3 -m unittest discover -s ios/ci/tests -v
python3 -m unittest discover -s ios/app-store/tests -v
python3 ios/ci/check.py source
python3 ios/app-store/manage.py validate
actionlint .github/workflows/ios.yml
```

`check.py simulator` 和签名脚本仅供 Runner 使用。本机继续用 AppSim 管理模拟器。不要伪造 Runner 环境变量绕过这个限制。

## 当前验证范围

2026-10-21（UTC+08:00），在本机 macOS 完成以下验证：

- 60 项 CI/CD 测试通过，含单工作流的来源与任务隔离检查。
- 23 项元数据回归测试通过。
- `actionlint`、Python 编译和公开元数据校验通过。
- 固定 XcodeGen 的签名工程生成检查通过。三个目标的独立描述文件设置正确。版本、构建号和原工程未修改保护也通过。
- 签名准备、部分失败清理和日志管道退出码检查通过。
- 在隔离钥匙环中完成真实 GPG 加密与解密往返。日志和符号打包范围检查通过。

XcodeGen 安装器已通过 ZIP 摘要校验。安装器同时保留其构建预设，不只复制二进制。上述工程检查使用测试值，没有读取证书或签名。

GPG 测试只生成一次性测试密钥。测试使用短临时路径，避免 macOS 的 socket 路径长度限制。测试结束后清理钥匙环，不读取已有私钥。

已人工复核文档结构、操作顺序和发布边界。`zhlint` 未运行成功：本地缓存缺包，联网安装未获执行权限。不能将人工复核当作自动格式校验。

未验证 GitHub 托管运行、真实分发签名、Apple 上传或正式提审。第一层的完整模拟器测试也未在本轮重跑。本轮不改变已有 App 功能。

## 参考

- [GitHub Xcode 27 镜像清单](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md "前往 GitHub")
- [GitHub Xcode 27 镜像公告](https://github.com/actions/runner-images/issues/14404 "前往 GitHub")
- [在 Runner 安装 Apple 证书](https://docs.github.com/actions/use-cases-and-examples/deploying/installing-an-apple-certificate-on-macos-runners-for-xcode-development "前往 GitHub 文档")
- [GitHub Environment 保护规则](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments "前往 GitHub 文档")
- [Apple 构建上传权限](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/ "前往 Apple 文档")
