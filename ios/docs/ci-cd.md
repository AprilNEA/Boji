# iOS CI/CD

仓库用一个 `ios.yml` 管理三层流程。各层使用独立任务（job），PR 不接触发布凭据。TestFlight 和提审任务从 1Password service account 按步骤读取发布凭据。上传和提审都需要手动触发。

推送到 `master` 后只运行 CI。上传和提审需要另行配置发布环境。提交这些文件不会创建 GitHub Environment 的 Secret 或变量，也不会上传或提审。

## 三层职责

| 层级 | 手动 `action` | 触发方式 | 结果 |
| --- | --- | --- | --- |
| 代码校验 | `ci`（默认） | PR、`master` 推送或手动运行 | 校验源码与生成物，运行 Python 回归、模拟器构建和完整测试 |
| TestFlight | `testflight` | `master` 手动运行并审批 | 先跑 CI，再签名、上传并等待处理 |
| App Store 审核 | `review` | `master` 手动运行并审批 | 检查或提交已有构建，不重新编译 |

唯一工作流是 [`.github/workflows/ios.yml`](../../.github/workflows/ios.yml)。后两层共享并发组，不能同时写入商店。新的 CI 运行不会取消正在执行的发布。

`validate` 先检查源码、生成物并运行 Python 回归。`build` 和 `test` 都依赖 `validate`。两者在独立 Runner 并行执行。PR 和推送运行这三个 CI job。手动上传默认要求它们和 `release-gate` 全部成功。手动提审执行 `release-gate` 和 `review`。上传成功不会自动触发提审。

`skip_tests` 默认为 `false`。只有手动 TestFlight 运行可以显式设为 `true`。此时跳过 Python 回归和 `test` 任务。源码检查、编译、产物校验和本人审批仍须通过。标题和运行摘要会标明跳过测试。此类运行不能通过本流程直接提审。

TestFlight 上传不等于外部测试发布。工作流不邀请测试员，不自动分发测试组。提审工作流也不会执行正式发布。

## 第一层：校验代码

PR 和 `master` 推送会运行三个任务：

1. `validate` 检查公开元数据和 CI 脚本，运行字符串、动画生成器及 Python 回归校验。来源检查拒绝 `TEMP_`，固定 XcodeGen 重新生成工程后与 Git 版本比较。
2. `build` 在完成工具链和依赖准备后，分别编译模拟器 Debug 与 Release，并保存编译日志。它不发现或启动模拟器，不运行 `xcodebuild test`、任何 unittest，也不校验产物。超时为 30 分钟。
3. `test` 在独立 Runner 执行完整单元和 UI 测试，保留截图测试与隔离数据，不删除或跳过覆盖。日志和 `.xcresult` 保存 7 天，超时为 60 分钟。

测试使用项目已有的隔离数据。后端地址和 Sentry DSN 均为空。工作流不访问真实账号或 HealthKit 记录。

`validate`、`build`、`test` 和 `release-gate` 不读取 1Password service account。它们不进入发布 Environment。

`Boji/DebugSupport/Fixtures/` 保留为仓库中的 Debug 夹具。`project.yml` 排除整个 `DebugSupport/`，避免 XcodeGen 2.46.0 为排空的组写入随机 `TEMP_` 标识符。Debug 的预构建脚本单独复制夹具。Release 不会打包这些文件。TestFlight 在归档后、导出 IPA 前运行 `check.py bundle`，检查 `$ARCHIVE_PATH/Products/Applications/Boji.app`。该检查保持 fail closed；移动检查位置不表示移除测试或产物检查。

脚本的输出目录由 `BOJI_ANIMATION_FIXTURE_DIR` 控制。Debug 指向 App 包，Release 指向 `DERIVED_FILE_DIR`。Xcode 会预先创建输出文件的父目录，因此仅在脚本中判断 Debug 不够。两个配置必须使用不同的输出目录。

`build` 上传 `ios-build-evidence-{run_id}-{attempt}` 编译日志，保留 7 天。`test` 日志和 `.xcresult` 使用 `ios-ci-evidence-*`，保留 7 天。公开仓库的读取者可能下载这些文件。测试不得写入真实账号、个人数据或凭据。

本次结构调整只拆分构建与测试任务，不修复先前记录的 UI 查询超时。历史验收数字和既有运行结果不因任务拆分而改变。

CI 不使用 `pull_request_target`。PR 不进入带凭据的 Environment。不要将这个工作流改到个人自托管 Mac。

## 固定工具链

[`ci/toolchain.json`](../ci/toolchain.json)记录工具版本。工作流中的重复值必须与它一起更新。

| 工具 | 固定值 |
| --- | --- |
| Runner | `xcode-27`，GitHub 托管 |
| Xcode | `27.1`，构建号 `27A9275` |
| XcodeGen | `2.46.0`，校验官方 ZIP 的 SHA-256 |
| Node.js | `26.12.1` |
| pnpm | `12.9.1` |
| Rust | `crates/rust-toolchain.toml` |
| asc | `app-store/asc-lock.json`，当前为 `5.16.0` |

Action 使用完整提交 SHA。SwiftPM 使用仓库中的 `Package.resolved`。pnpm 和 Cargo 使用现有锁文件。

2026-10-23（UTC+08:00），已核对并采用以下最新正式版。四个 Action 均使用 Node.js 24 运行时。项目动画脚本另用 Node.js 26.12.1，两者独立配置。

| Action | 版本 |
| --- | --- |
| `actions/checkout` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| `actions/setup-node` | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) |
| `actions/upload-artifact` | [v7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) |
| `1password/load-secrets-action` | [v5.0.1](https://github.com/1Password/load-secrets-action/releases/tag/v5.0.1) |

这次升级处理 [Node.js 20 弃用警告](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)。`setup-node` 显式关闭自动缓存。三个产物步骤显式保留 ZIP 格式，保持回执校验兼容。旧运行使用启动时的提交，不会因更新工作流而改变。

本机和 CI 都使用 Xcode 27.1，构建号均为 `27A9275`。`xcode-27` 是 GitHub 的 preview 镜像，可能不稳定或排队。它的底层系统是 macOS 27，默认 Xcode 是 27.0。工作流用 `DEVELOPER_DIR` 选择 `/Applications/Xcode_27.1.app`。这个路径是符号链接，指向镜像中的 Xcode 27.1 Release Candidate。镜像只带 iOS 27.0 和 watchOS 27.0 模拟器。以上信息来自 2026-10-12 的镜像清单。

CI 原先使用 `macos-26` 和 Xcode 26.6。在这套工具链上，`actool` 编译 `AppIcon.icon` 时抛出异常。因此，`master` 上 2026-10-21 前的最近 3 次运行都失败了。

改用 `xcode-27` 后，图标问题已解决。2026-10-21 的运行 [39621455089](https://github.com/AprilNEA/Boji/actions/runs/39621455089) 验证了 `2e82483`：`check.py toolchain` 通过，`actool` 编译了 `AppIcon.icon`，单元测试 129 项全部通过。UI 测试 19 项中有 1 项失败：`testSettingsLinkToLegalPages`。原因是 iOS 27 把 SwiftUI `Link` 暴露为链接，不再是按钮，测试用 `app.buttons` 找不到它。测试已改为按标识查找任意类型的元素。在本机 iOS 26.5 模拟器上，修复后的测试通过。本机的 iOS 27.1 运行时只支持 iPhone Duo。它用侧边栏代替标签栏，所以正式测试在 `onboard()` 一步就会停止。在 iPhone Duo 上，一条跳过标签栏检查的临时测试验证了同样的查询：两个入口都是链接，并且可以点击。修复在 CI 上未验证。

工作流检查 Xcode 版本和构建号。不匹配就停止，不会自动换版本。GitHub 更新镜像后，`Xcode_27.1.app` 可能指向另一个构建。这时 `check.py toolchain` 会停止。先查镜像清单，再一起更新 `ci/toolchain.json` 和工作流。`ci/tests/test_pipeline.py` 检查工作流中的重复值与 `ci/toolchain.json` 一致。不要为赶上线而改用不受控的 Runner。

## 配置发布权限

先在 GitHub 仓库设置中创建两个 Environment：

- `ios-testflight`
- `ios-appstore-review`

两个环境都只允许 `master` 部署。配置 required reviewers，并禁止管理员绕过审批。用户已指定 TestFlight 只由 `AprilNEA` 审批，并允许审批自己发起的运行。正式审核环境需要单独核对保护设置。

Environment 的审批规则不在工作流 YAML 中。仅写入 `environment:` 不会自动配置保护。检查规则后，再把仓库变量 `IOS_RELEASE_ENABLED` 设为 `true`。缺少该变量时，上传和提审 job 都会停止。

工作流、`ios/ci/` 和发布配置需要重点评审。代码拥有者可以执行带凭据的脚本，不能仅依赖密钥的日志遮罩。

### TestFlight 环境

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `BOJI_API_BASE_URL` | 内测使用的正式 HTTPS 服务源地址 |
| Variable | `IOS_ARTIFACT_PUBLIC_KEY` | 单个 OpenPGP 加密公钥，保留 ASCII armor 和换行 |
| Variable | `OP_IOS_SIGNING_ITEM` | 1Password 签名条目的完整 `op://vault-id/item-id` 前缀，不含字段 |
| Variable | `OP_ASC_SECRET_ITEM` | 1Password App Store Connect 条目的完整 `op://vault-id/item-id` 前缀，不含字段 |
| Secret | `OP_SERVICE_ACCOUNT_TOKEN` | 只读 1Password service account token，只授权本流程所需条目 |

`OP_IOS_SIGNING_ITEM` 和 `OP_ASC_SECRET_ITEM` 不是凭据，但仍不得带字段名。工作流会在读取凭据前拒绝空值或非 `op://vault-id/item-id` 格式。

签名条目必须有以下同名字段：

| 1Password 字段 | 内容 |
| --- | --- |
| `IOS_DISTRIBUTION_P12_BASE64` | Apple Distribution 证书及私钥的 P12，整体 Base64 编码 |
| `IOS_DISTRIBUTION_P12_PASSWORD` | P12 导出密码 |
| `IOS_APP_PROFILE_BASE64` | 主应用 App Store 描述文件的 Base64 |
| `IOS_WIDGET_PROFILE_BASE64` | Widget App Store 描述文件的 Base64 |
| `IOS_WATCH_PROFILE_BASE64` | Watch App Store 描述文件的 Base64 |

App Store Connect 条目必须有以下同名字段：

| 1Password 字段 | 内容 |
| --- | --- |
| `ASC_KEY_ID` | 具有上传权限的 API Key ID |
| `ASC_ISSUER_ID` | 对应的 Issuer ID |
| `ASC_PRIVATE_KEY_P8` | 对应 P8 私钥正文，保留换行 |

现有 Marketing Key 不具备构建上传权限。不要直接扩权。使用另一个经过授权的凭据，按需授予 Developer 等允许上传的角色。API Key 不能替代 Apple Distribution 证书和三个描述文件。

描述文件必须分别匹配：

- `club.leanmuscle.boji`
- `club.leanmuscle.boji.widgets`
- `club.leanmuscle.boji.watchkitapp`

脚本检查团队、有效期、分发类型和证书归属。它还检查各目标声明的 App Groups 等能力。Development、Ad Hoc 和企业分发文件会被拒绝。

签名只在一次性 GitHub 托管 Runner 执行。脚本创建临时 Keychain，结束时由独立步骤清理。IPA 只上传到 Apple，不保存为 GitHub 产物。归档、描述文件、P8 和 P12 也不保存为 GitHub 产物。

工作流固定使用 [`1password/load-secrets-action`](https://github.com/1Password/load-secrets-action) 的 `70062d7a876d3eb6334754fa26efd2fbd90c32f2`（v5.0.1）。每个加载步骤设置 `export-env: false`。`OP_SERVICE_ACCOUNT_TOKEN` 仅在加载步骤的 step-level `env` 中。后续签名、上传和提审步骤只从该步骤的 outputs 接收所需字段。

该版本从 `env` 读取 `op://` 引用。不要使用不存在的 `with.secrets` 输入。固定版 `asc` 使用 `ASC_PRIVATE_KEY_PATH` 认证。`store.py` 将 P8 内容写入临时文件，再传入路径。目录权限为 `0700`，文件权限为 `0600`。调用结束后删除文件，失败时也会删除。

Sentry 在这套流程中保持关闭。启用应用崩溃上报需要另行审查隐私声明。构建日志和 dSYM 只以加密产物保存，见下文。

### App Store 审核环境

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `OP_ASC_SECRET_ITEM` | 1Password App Store Connect 条目的完整 `op://vault-id/item-id` 前缀，不含字段 |
| Secret | `OP_SERVICE_ACCOUNT_TOKEN` | 只读 1Password service account token，只授权 App Store Connect 条目 |

审核任务从 `OP_ASC_SECRET_ITEM` 读取 `ASC_KEY_ID`、`ASC_ISSUER_ID` 和 `ASC_PRIVATE_KEY_P8`。使用允许提交审核的角色，例如 App Manager。不要把审核联系人或测试密码写进 Git。

### 当前配置状态

截至 2026-10-22（UTC+08:00），配置仍在进行中。专用 Developer 上传密钥已创建。旧 Marketing Key 未改动。Apple Distribution 证书和三个描述文件已生成。

签名材料和上传密钥已存入专用保险库。只读服务账号已配置到 TestFlight 环境。两个条目引用和诊断加密公钥也已配置。实测服务账号只能看到该保险库，八个字段均读取正确。

服务账号有效期为 90 天，到期前需要轮换。诊断解密私钥保存在 CI 无权访问的保险库。核验入库后，已删除本机临时私钥和密码副本。

2026-10-23（UTC+08:00），已设置唯一审批人 `AprilNEA`。允许其审批自己发起的运行，禁止管理员绕过。`master` 分支限制保持不变。IPA 上传尚未执行。

用户已选择先发 TestFlight，验证登录与会员卡。签名阶段只检查 HTTPS 地址等构建条件，不再要求提前宣称后台验收完成。正式提审仍检查 `release-approval.json` 的 `backend` 等六项验收，并绑定同一构建。当前各项仍为 `false`。

## 第二层：上传构建

先将目标提交合并到 `master`。`testflight` 模式默认在同次运行中执行完整 CI。只有显式设置 `skip_tests=true` 才跳过测试。失败或取消的测试不能用这个选项放行。输入版本必须与 `ios/project.yml` 和 `app-store/project.json` 一致。

先查询 Apple 中的构建及上传记录。再输入未使用的构建号。脚本不会自动改变营销版本。允许的构建号使用 Apple 数字版本格式。

操作顺序：

1. 打开 Actions 中的 `iOS`。
2. 选择 `master`，将 `action` 设为 `testflight`。
3. 填写 `version` 和 `build_number`。默认保留测试；仅在明确选择内测例外时勾选 `skip_tests`。
4. 等待构建与检查通过，并由本人审批环境。
5. 等待 Apple 完成构建处理。
6. 保存运行 ID，进入 TestFlight 验收。

`testflight` 任务将关键操作显示为独立步骤：

1. `Prepare signing certificates and profiles` 校验并安装签名材料。
2. `Archive signed iOS app` 直接执行 `xcodebuild archive`。
3. `Verify archived resources` 对 `$ARCHIVE_PATH/Products/Applications/Boji.app` 运行 `check.py bundle`。检查失败即停止。
4. `Export IPA` 直接执行 `xcodebuild -exportArchive`。
5. `Validate exported IPA before loading upload credentials` 离线检查最终 IPA，不读取上传密钥。
6. `Upload IPA to App Store Connect and wait for processing` 上传并等待处理。
7. 加密保存诊断产物，再清理签名材料和明文文件。

`signing.py` 不再执行构建或上传。它只负责参数校验、签名准备和清理。`Export IPA` 生成 `$RUNNER_TEMP/boji-export/Boji.ipa`。上传仍使用 `store.py` 的精确构建校验和防重传规则。

预检读取 IPA 内三个产品的最终 `Info.plist`。它检查读取和更新两项健康用途说明，以及三个产品的显示名称。它也检查 iPad 四方向、Watch 图标名称和资源。Xcode 27 的 Watch 图标可只存在于 `Assets.car` 中。此时仍须有 `CFBundleIconName`，不能仅凭资源目录通过检查。这些检查不能替代 Apple 的服务端校验。

上传前会查询相同版本和构建号。已有构建时停止，不重复上传。若上传超时，先去 Apple 后台确认结果。不要直接点击重新运行，也不要用新构建号掩盖不明状态。

成功后生成 `ios-testflight-receipt` artifact，保留 90 天。其中只有 App ID、版本、构建号、构建 ID、提交 SHA 和 IPA 摘要。该文件不包含凭据。

本地版本与商店草稿均为 `1.0`。`CURRENT_PROJECT_VERSION` 保持为 `7`。版本对齐不能凭空增加构建号。正式上传前仍需确认 Apple 中未使用目标构建号。

## 查看构建诊断

正式构建的完整日志不进入公开控制台。控制台只显示编译错误位置等有限信息。日志记录失败或构建失败都会使对应步骤失败。工作流不会因日志管道而忽略构建退出码。

`asc` 失败时，脚本把标准输出和错误输出写入私有诊断目录。文件名为 `logs/asc-<随机标识>.stdout.log` 和对应的 `.stderr.log`，权限为 `0600`。只有 `artifacts.py prepare` 已准备的目录能接收日志。控制台不输出这些内容；后续步骤将其一并加密。没有有效私有目录时，脚本不在其他位置保存输出。

工作流将原始日志和 dSYM 打包并加密。密文产物名为 `ios-release-evidence-<run-id>-<attempt>`，保留 90 天。内容不包含 IPA、签名文件或整个归档。构建失败时，工作流仍会尝试保存已有日志。

`IOS_ARTIFACT_PUBLIC_KEY` 必须是有效的加密公钥。缺失或无效时，工作流在签名前停止。对应私钥只由负责人员在 CI 外保管。不要用 Apple P8 或签名证书替代 OpenPGP 密钥。

只有密文会上传到 GitHub。加密失败时，工作流不会改为上传明文。产物过期前，由负责人员下载并按私密备份规则保存。

先解压 GitHub 下载的产物 ZIP，取得 `.tar.gpg` 文件。然后在持有对应私钥的可信电脑上解密：

```sh
gpg --output release-evidence.tar --decrypt release-evidence.tar.gpg
```

解密后的日志和符号文件不得进入 Git 或公开工单。解密私钥保存在 1Password 管理保险库，不在 CI 可读保险库内。2026-10-23 的首次内测运行已成功上传加密诊断包，但 Apple 拒绝了应用包。

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

运行 ID 必须来自成功的 `testflight` 模式。仅有 CI 或提审成功的运行不能提供构建回执。脚本检查该次运行的五个 job 是否全部成功：`validate`、`build`、`test`、`release-gate`、`testflight`。

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

再用固定的 XcodeGen 验证工程生成：

```sh
XCODEGEN="$PWD/.work/tools/xcodegen/2.46.0/bin/xcodegen"
first=$(mktemp)
trap 'rm -f "$first"' EXIT
"$XCODEGEN" generate --no-env --spec ios/project.yml
cp ios/Boji.xcodeproj/project.pbxproj "$first"
"$XCODEGEN" generate --no-env --spec ios/project.yml
cmp --silent "$first" ios/Boji.xcodeproj/project.pbxproj
! rg -n 'TEMP_' ios/Boji.xcodeproj
git diff --exit-code -- ios/Boji.xcodeproj
```

`check.py simulator` 和签名脚本仅供 Runner 使用。本机继续用 AppSim 管理模拟器。不要伪造 Runner 环境变量绕过这个限制。

## 当前验证范围

### 2026-10-22：本机回归

2026-10-22（UTC+08:00），在本机 macOS 完成以下验证：

- 71 项 CI/CD 测试通过，含 1Password 作用域和 P8 清理检查。
- 23 项元数据回归测试通过。
- `actionlint`、Python 编译和公开元数据校验通过。
- 固定 XcodeGen 连续生成两次，工程逐字相同。生成结果不含 `TEMP_` 标识符。
- 本地工程与元数据目标均为 `1.0`。发布校验仍按预期拦截 `claimsVerified=false`。
- Debug 与 Release 模拟器构建通过。Debug 包的三个测试文件与源文件逐字相同。
- Release 产物检查通过。包内没有测试目录，课程动画和嵌入的 Widget、Watch App 完整。
- 签名准备、部分失败清理和日志管道退出码检查通过。
- 在隔离钥匙环中完成真实 GPG 加密与解密往返。日志和符号打包范围检查通过。

上传脚本已使用新密钥完成真实只读认证。Apple 返回的 App ID 和 Bundle ID 均与 Boji 匹配。证书与本机生成的私钥公钥匹配。三个描述文件均绑定该证书和对应 Bundle ID。

此前固定 XcodeGen 的签名工程生成检查已通过。三个目标使用独立描述文件，版本与构建号的覆盖检查也通过。该检查使用测试值，没有读取证书或签名。

XcodeGen 安装器已通过 ZIP 摘要校验。安装器同时保留其构建预设，不只复制二进制。

GPG 测试只生成一次性测试密钥。测试使用短临时路径，避免 macOS 的 socket 路径长度限制。测试结束后清理钥匙环，不读取已有私钥。

已人工复核文档结构、操作顺序和发布边界。`zhlint` 未运行成功：本地缓存缺包，联网安装未获执行权限。不能将人工复核当作自动格式校验。

客户端注销的验证记录见 [Better Auth 接入说明](better-auth.md)。

### 2026-10-23：首次上传后的包校验修复

运行 `39811383220` 的 CI、签名、归档和 IPA 导出成功。Apple 收到 `1.0 (8)` 后，将上传状态设为 `FAILED`。错误码为 `90683`、`90713`、`90360`、`90391`、`90474`。这些错误对应健康用途说明、Watch 图标、Widget 显示名称和 iPad 方向。该运行没有生成可用的 TestFlight 构建。

本机于 2026-10-23 01:35（UTC+08:00）完成以下验证。环境为 macOS、Xcode 27.1（27A9275）、XcodeGen 2.46.0：

- 87 项 CI/CD 回归和 23 项元数据回归通过。
- `actionlint`、公开元数据检查和 `git diff --check` 通过。
- iOS/watchOS 设备架构的未签名 Release 构建通过。
- 设备架构产物封装成测试 ZIP 后，IPA 预检通过。该文件没有签名，也没有上传。
- `assetutil` 确认 Watch 图标包含名为 `AppIcon` 的 1024 × 1024 图像。最终 plist 使用嵌套图标名称，没有独立 PNG 引用。
- 三个产品的中英文显示名均已编译。主 App 的两项健康用途说明也已编译。
- 动画和嵌入产物检查通过，Release 中没有 Debug 动画测试资源。
- 工程连续生成两次，输出逐字相同。GPG 隔离加密与解密回归通过。

修复后的签名 IPA、Apple 再次接收和 TestFlight 安装仍未验证。正式提审验收项保持关闭；HealthKit 写入授权仍为空。本次修复没有重传旧构建。

### 2026-10-23：分离编译与测试

本机于 2026-10-23 02:47（UTC+08:00）完成本轮校验。

- 94 项 CI/CD 回归通过，含 7 项任务隔离测试。
- 23 项元数据回归通过。
- `actionlint`、源码检查和 `git diff --check` 通过。
- 文档本地链接检查通过。

新结构尚未在 GitHub Runner 执行。本次没有修复注销测试的 UI 查询超时。

## 参考

- [GitHub Xcode 27 镜像清单](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md "前往 GitHub")
- [GitHub Xcode 27 镜像公告](https://github.com/actions/runner-images/issues/14404 "前往 GitHub")
- [在 Runner 安装 Apple 证书](https://docs.github.com/actions/use-cases-and-examples/deploying/installing-an-apple-certificate-on-macos-runners-for-xcode-development "前往 GitHub 文档")
- [GitHub Environment 保护规则](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments "前往 GitHub 文档")
- [1Password GitHub Action](https://github.com/1Password/load-secrets-action "前往 GitHub")
- [Apple 构建上传权限](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/ "前往 Apple 文档")
