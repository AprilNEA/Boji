# App Store 元数据

本目录使用 asc 5.16.0 管理中英文商店文案。工具安装在仓库的 `.work/` 中，不修改全局 PATH。1.0 文案已保存到商店草稿，尚未提交审核。

## 当前商店草稿

2026-10-20（UTC+8），已回读核对以下结果：

- 英文名称：`Lean Muscle Club`。
- 中文名称：`薄肌俱乐部 - 训练与习惯记录`。原短名称被其他账号占用，扩展名称已获用户确认并保存。
- 两种语言的副标题、描述、关键词和推广文本已保存，均与 `metadata/` 中对应的 1.0 文件一致。
- 主分类为 Health & Fitness，次分类留空。
- 年龄问卷已填写。一般健康主题为是，医疗治疗信息为无；当前总体评级为 4+。地区评级以 Apple 后台为准。

2026-10-21（UTC+08:00），已保存版权 `2026 AprilNEA LLC`。发布方式已改为手动发布，API 回读为 `MANUAL`。本轮未提交审核。

首发已确定启用在线账号和会员卡。隐私草稿已保存姓名、邮箱和用户 ID 三项数据。用途均为应用功能，关联用户身份，不用于追踪。草稿尚未发布；正式服务、邮件和诊断配置仍须核对。

iPhone 辅助功能草稿已保存，状态为 `DRAFT`。草稿包含深色界面、较大字体和足够对比度。草稿未发布，其他未验证能力未勾选。

审核联系人和 1302 字符的英文审核说明已保存。两项结果已通过 API 回读，联系方式不写入本目录。说明明确标注正式服务与账号注销仍待验收，不代表已经申请审核。

隐私政策网址为 `https://leanmuscle.club/privacy/`，支持网址为 `https://leanmuscle.club/support/`。用户要求先填入草稿，并在提交审核前确保内容可用。2026-10-21 02:47（UTC+08:00），两种语言的四个字段均已保存并回读匹配。网站页面已在本地实现，尚未部署；正式条款、支持渠道和公网访问仍须验收。

同日已按用户确认设置免费价格和全部 175 个国家或地区。未来新增地区也自动加入。定价与地区通过已登录后台保存，未扩大 Marketing API Key 权限。内容权利声明为不包含第三方内容，API 回读匹配。选择全部地区不代表已满足各地区的发行条件。

正式审核账号仍待提供。未上传构建，也未发布隐私声明。中英文 iPhone 和 iPad 截图已上传，见下文。

本地构建版本仍是 `0.7.0`，商店目标为现有 `1.0`。本轮没有改变构建版本；发布前仍须对齐并完成[检查清单](release-checklist.md)。

## 商店截图

[本地截图编辑器](screenshots/README.md)负责文案、布局和 PNG 导出。它使用真实 App 截图，与 asc 的凭据和上传流程分开。2026-10-21 03:28（UTC+08:00），中英文 iPhone 和 iPad 共 72 个尺寸版本已上传到 1.0 草稿。Apple 均返回 `COMPLETE`。提交审核前仍须修正英文问题并按最终构建复核，详见[上传记录](screenshots/shots.md)。

## 开始使用

需要 Python 3.10 或更高版本。以下命令在仓库根目录运行：

```sh
# 首次安装需要联网；先核对 SHA-256，再启用可执行文件。
python3 ios/app-store/manage.py install

# 每次执行都会核对二进制摘要。
python3 ios/app-store/manage.py version

# 离线检查公开字段，再调用 asc 的原生校验器。
python3 ios/app-store/manage.py validate

# 离线检查发布必填项；当前草案会被拦截。
python3 ios/app-store/manage.py validate --release

# 回归测试不访问 Apple，也不读取真实凭据。
python3 -m unittest discover -s ios/app-store/tests -v
```

安装器只在首次下载时联网。离线校验不读取现有 asc 凭据，不检查网址是否可访问。校验成功不代表文案已批准，也不代表 App 已满足审核要求。

`asc-lock.json` 固定版本和各平台的官方文件摘要。升级时一起修改版本与摘要，然后重新测试。当前已执行验证的平台为 macOS arm64；其他平台尚未实测。

## 文件结构

```text
app-store/
├── asc-lock.json
├── project.json
├── install_asc.py
├── manage.py
├── metadata/
│   ├── app-info/
│   │   ├── en-US.json
│   │   └── zh-Hans.json
│   └── version/
│       ├── 0.7.0/
│       │   ├── en-US.json
│       │   └── zh-Hans.json
│       └── 1.0/
│           ├── en-US.json
│           └── zh-Hans.json
├── release-checklist.md
└── tests/
```

**版本目录必须使用 `version/`，不能写成 `versions/`。** asc 5.16.0 的部分文档使用复数，但安装版 `metadata init` 生成单数。本目录已按实际工具验证。

`project.json` 中的版本必须与 `ios/project.yml` 一致。更新版本时，准备对应目录的文案。旧版本文件可以保留；预览始终使用显式版本和 `IOS` 平台。

## 连接 App Store Connect

已配置 App ID `6824964768`，对应 `club.leanmuscle.boji`。Apple API 已核实目标身份，商店现有名称为 `Lean Muscle Club`。

鉴权使用通用的 `ASC Metadata` Team API Key，角色为 Marketing。该角色不是管理员，但团队 Key 的权限并非只限 Boji。密钥保存在 AprilNEA LLC 的 1Password 保险库。

本机通过 `op run` 临时注入凭据，不另外复制到 Keychain。引用配置位于 `.work/boji-asc/asc.env`，其中没有私钥明文。该文件不进入 Git，新机器需要重新配置引用。

```sh
op run --env-file .work/boji-asc/asc.env -- \
  python3 ios/app-store/manage.py check-connection
```

运行时注入下列变量：

- `ASC_KEY_ID`：API Key ID。
- `ASC_ISSUER_ID`：团队 Key 的 Issuer ID。
- `ASC_PRIVATE_KEY`：由 1Password 注入的 PEM 私钥。

引用配置还固定 `ASC_KEY_TYPE=team`，并禁用 Keychain 回退。不要运行 `env`、`printenv` 或输出这组变量。最初下载的 `.p8` 已在保险库核验后删除。

个人 Key 还需按 asc 文档设置 `ASC_KEY_TYPE=individual`，不使用 Issuer ID。不要使用 Sign in with Apple 或 Wallet 的密钥替代。不要把私钥、审核账号或联系人写入本目录。

环境变量、Keychain 和已选 profile 可能存在优先级关系。配置时使用一种明确来源，避免混用不同团队的凭据。不要复制完整环境或认证响应到日志。

**版本尚未对齐：本地为 `0.7.0`，商店草稿为 `1.0`。** 连接检查不处理版本文案，当前可以运行。下列版本命令须等发布版本对齐后再运行：

```sh
# 从 Apple 读取应用身份；Bundle ID 不匹配时停止。
# 随后使用 metadata push --dry-run 生成差异，不修改商店。
op run --env-file .work/boji-asc/asc.env -- \
  python3 ios/app-store/manage.py preview

# 拉取至 .work/boji-asc/pull-*，不覆盖公开元数据。
op run --env-file .work/boji-asc/asc.env -- \
  python3 ios/app-store/manage.py pull
```

预览文件保存在 `.work/boji-asc/preview-*.json`。拉取内容先人工筛选，再合入 `metadata/`。不要把 `.work/` 中的原始下载或日志强制加入 Git。

本入口故意不提供真实 `push`、审核提交或发布命令。本轮获得用户授权后，直接用 asc 将文案保存到指定的 1.0 草稿。远端身份读取、下载、差异预览和文案保存均已验证。

应用某个范围时，应保留该范围内全部现有语言。只放一个语言文件可能触发删除保护；不要为绕过保护而启用 `--allow-deletes`。部分失败后先回读实际结果，再补写失败项。

## 公开仓库约束

`metadata/` 只允许规定的本地化 JSON 字段。校验会拦截未知字段、重复键、符号链接和疑似私钥。工具禁止 `null` 清空指令及 `default.json` 批量回退，避免扩大修改范围。

关键词同时按 100 字符和 100 个 UTF-8 字节限制。只有用户确认的正式网址可以先填入草稿，不能用示例网址冒充。提交审核前必须验证网页内容和公网访问。名称与功能声明确认后，才更新 `nameApproved` 和 `claimsVerified`。

发布检查还要求每个语言文件有隐私政策和支持网址。但它只验证结构，不判断网页内容是否真实合规。截图、隐私标签、年龄问卷、分类和版权不属于本轮自动管理范围。

根 `.gitignore` 已排除 `.asc/`、`ios/app-store/private/` 和私钥文件。忽略规则不保护已跟踪文件；提交前仍需检查差异。基础文案可以公开，发布凭据不能公开。

## 验证记录

2026-10-20（UTC+8），macOS arm64：asc 5.16.0 下载摘要匹配，重复安装不重新下载。实际初始化确认版本目录为 `version/`。

6 份中英文文件通过 asc 原生校验，错误和警告均为 0。23 项 Python 回归测试通过，覆盖字段白名单、凭据拦截、目标身份、独立连接检查和安装完整性。

当前草案仍未满足发布条件，网址、审核资料和发布版本仍待完善。真实 Apple 鉴权和 App ID、Bundle ID 校验已通过。1.0 的四份中英文文件已经保存，并逐项回读匹配；尚未执行审核提交或发布。

2026-10-21 02:47（UTC+08:00），asc 提交前检查有 4 项阻塞：审核账号名、审核密码、构建和主语言 en-US 截图。隐私草稿尚未发布，CLI 无法确认这项网页状态。iPad、Watch、地区合规和实际服务可用性仍需另外检查，不能把 CLI 结果当作完整审核保证。

03:28（UTC+08:00），已新增 60 张并保留已有 12 张。中英文 iPhone 各四种尺寸，iPad 各两种尺寸，每组六张。72 张图片的数量、顺序、尺寸和 MD5 回读一致，状态均为 `COMPLETE`。主语言已有截图，但本轮没有重新运行完整提审检查。Watch 没有可用的正式截图，本次未上传。

## 工具来源

- [asc 5.16.0 发布页](https://github.com/rorkai/App-Store-Connect-CLI/releases/tag/5.16.0 "asc 固定版本")
- [元数据文档](https://github.com/rorkai/App-Store-Connect-CLI/blob/5.16.0/commands/metadata.mdx "asc 元数据文件与命令")
- [鉴权文档](https://github.com/rorkai/App-Store-Connect-CLI/blob/5.16.0/authentication.mdx "asc API Key 配置")

asc 是第三方开源工具，不是 Apple 官方 CLI。安装器核对文件摘要，但摘要不能替代上游信任评估。不要运行未经审查的工具升级。
