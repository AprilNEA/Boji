# Boji App Store 截图编辑器

此目录提供一个**纯本地**的 App Store 截图编辑器。它保留上游画布编辑和 PNG 导出功能。编辑器不部署到 Manus，也不连接云服务。

## 当前截图

编辑器包含中英文 iPhone 和 iPad 版式，每组六张。共 72 个尺寸版本，已全部上传商店 1.0 草稿。文案、来源和重采清单见 [shots.md](shots.md)。

源图来自 2026-10-20 至 21 日的真实模拟器测试。`capture-manifest.json` 保存采集时间和文件摘要。图中仅有隔离测试数据，没有重绘 App 界面。英文存在局部中文和换行问题，Watch 尚未采得有效进度画面。

## 环境和运行

需要 Node.js `20.9` 或更高版本，以及现有的 pnpm `12.9.1`。只使用 pnpm；不要生成 Bun、npm 或 Yarn 锁文件。

`package.json` 已固定 `pnpm@12.9.1`。锁文件由 pnpm 实际安装生成，不再使用手工转换版本。自动化运行时设置 `CI=1`，避免停在交互确认提示。

```sh
cd ios/app-store/screenshots
pnpm install
pnpm typecheck
pnpm build
pnpm dev
```

`pnpm dev` 只监听 `http://127.0.0.1:4317`。生产模式使用 `pnpm start`，并使用同一地址和端口。`dev`、`build` 和 `start` 都设置了 `NEXT_TELEMETRY_DISABLED=1`。

服务器只供本机编辑使用，不包含商店凭据。构建日志写入仓库根目录的 `.work/boji-asc/screenshots/`。完成编辑后，可在启动终端按 `Control+C` 停止服务。

## 项目文件

| 路径 | 用途 | 维护规则 |
| --- | --- | --- |
| `app-store-screenshots.json` | 截图卡组、文案和布局的源数据 | 更新模板时保留，不用示例覆盖。 |
| `public/screenshots/` | 原始截图和本地上传文件 | 更新模板时保留，入库前检查隐私。 |
| `public/app-icon.png` | 商店创意资源的应用图标 | 与 App 图标保持一致。 |
| `public/frames/` | Apple 产品设备框架 | 适用单独的 Apple 许可。见下文。 |
| `src/components/editor/` | 上游编辑器、画布和导出实现 | 保留上游行为。 |

编辑器在本机把项目状态写入 `app-store-screenshots.json`。它把上传的截图写入 `public/screenshots/uploaded/`。如果要让卡组可复现，请一起保存这两处内容。

## 编辑和导出

在编辑器中选择平台和设备，然后设置卡片文案、截图、主题和布局。使用工具栏的 **Export bundle** 导出 PNG ZIP 包。连接画布模式会按屏幕裁切跨页元素。独立模式会限制每张卡片的元素范围。

默认编辑器和截图字体使用本机系统字体栈。该栈包含 macOS 的 `PingFang SC` 回退。项目不下载 `next/font/google` 字体，也不把中文文本的尺寸或布局固定为某一种字体。

## 验证记录

2026-10-21 01:28（UTC+8），在 macOS arm64 上完成验证。依赖安装、TypeScript 检查和 Webpack 生产构建均通过。Turbopack 的编译端口在当前环境受限，因此 `dev` 和 `build` 使用 `--webpack`。

浏览器已载入六张图片，并通过 **Export bundle** 导出 24 张 PNG。四种尺寸分别为 1320 × 2868、1284 × 2778、1206 × 2622 和 1125 × 2436，每种六张。导出图为 RGB，没有透明通道；已查看六张大尺寸图的排版总览。

项目经上游编辑器自动升级为第三版格式，源截图没有改动。未执行上游的破坏性回归测试；该测试要求另建可丢弃的编辑器实例。未重采最终发布构建。

2026-10-21 02:36（UTC+08:00），已按用户要求上传商店草稿。简体中文 1.0 包含 1206 × 2622 和 1320 × 2868 两组图片，每组六张。12 个文件均为 `COMPLETE`，数量、顺序和 MD5 回读一致。未提交审核，完整记录见 [shots.md](shots.md)。

2026-10-21 03:23（UTC+08:00），已导出双语 iPhone 48 张和双语 iPad 24 张。每个语言与尺寸组合均有六张。全部 PNG 可解码、尺寸匹配且没有透明通道。24 张原图的 SHA-256 与来源记录一致。英文与 Watch 的问题见截图清单。

03:28（UTC+08:00），按用户要求补传 60 张。共 72 张已返回 `COMPLETE`。数量、顺序、尺寸和 MD5 回读均一致。没有删除原图或提交审核，已上传不代表最终验收通过。

## 许可证与资源

上游编辑器来自 [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots)，版本为 `5386f227360bddb06c8beaff920a1a34c9f01932`。其 MIT 许可证原文保存在本目录的 [`LICENSE`](LICENSE)。

`public/frames/` 中的 PNG 是 Apple Design Resources 的 Product Bezels。Apple 将其许可范围限定为制作 Apple 平台应用的模型图。它们不是 MIT 资源，且该许可不覆盖 Android 或其他非 Apple 平台。详情见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## Git 规则

`.gitignore` 排除 `node_modules/`、`.next/` 和本地导出缓存。它不忽略 `app-store-screenshots.json` 或 `public/screenshots/`。提交前请确认项目数据和截图是否适合进入版本控制。
