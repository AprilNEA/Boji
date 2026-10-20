# 薄肌俱乐部网站

本目录是薄肌俱乐部的粉丝向宣传网站，原项目为 `bojiclub`（版本 `827ca94`）。网站使用 Next.js 16 静态导出，样式用 Tailwind CSS 4，动画用 Motion 和 Lenis。`/docs` 下是 Boji 的文档站，使用 Fumadocs，和官网一起构建和部署。

## 本地运行

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 提供 Node.js 26 和 pnpm 12，并在本目录执行 `pnpm install`。devenv 还提供 Python 3 以及 Pillow 和 rembg，用于运行 `scripts/` 中的脚本。`portraits.py` 第一次运行时会把 rembg 模型下载到 `~/.u2net`。

然后在本目录运行：

```sh
pnpm dev        # 开发服务器，http://localhost:3000
pnpm typecheck  # 类型检查
pnpm build      # 静态构建，产物在 out/
```

## 独立托管

网站不依赖 Manus 或其他后端服务。`pnpm build` 生成的 `out/` 是纯静态文件，可以放到任意静态服务器或 CDN 上。站点专用的图片、视频和字体都在 `out/` 内，页面运行时只请求本站资源。Discord 邀请链接是唯一的外部链接，在官网页脚和文档侧边栏中出现，只在用户点击时打开。

部署时注意三点：

- 构建开启了 `trailingSlash`，每个路由导出为 `<路由>/index.html`。服务器需要把 `/theory/` 映射到 `theory/index.html`，大多数静态服务器默认如此。
- 未知路径要返回 `404.html`。例如 Nginx 配置 `error_page 404 /404.html;`。
- 文档的搜索索引是 `out/api/search`，这是一个没有扩展名的 JSON 文件。服务器要能按原路径返回它。

本地预览构建产物：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory out
```

Python 自带的服务器不会返回 `404.html`，所以用它预览时看不到自定义 404 页面。

## 页面

| 路由 | 页面 |
| --- | --- |
| `/` | 发布会首页 |
| `/theory/` | 薄肌理论 |
| `/pro/` | 薄肌产品页 |
| `/compare/` | 型号对比 |
| `/store/` | 选购：配置交付日期、配件、宣誓并领取会员卡 |
| `/founders/` | 创始人 |
| `/join/` | 入会：宣誓并领取会员卡 |
| `/calculator/` | 旧链接，在客户端跳转到 `/store/` |
| `/support/` | 支持：Boji iOS App 的求助方式和常见问题 |
| `/privacy/` | 隐私政策：Boji iOS App 的数据处理说明（发布前草案） |
| `/docs/` | 文档首页 |
| `/docs/guide/` | 用户指南（占位） |
| `/docs/developers/` | 开发者文档（占位） |

## 文档站

文档站和支持、隐私政策两个页面的内容源在仓库根目录的 `docs/sites/`，不在本目录中。`docs/sites/` 是公开边界：其中的 `.mdx` 页面和 `meta.json` 都会发布，`docs/` 下的其他文档不会发布。`src/lib/source.ts` 读取 `../docs/sites`，只收录 `**/*.mdx` 和 `**/meta.json`。

`docs/sites/` 下的文件路径就是网址路径。`docs/sites/docs/` 是文档区，页面在 `/docs/` 下，显示文档侧边栏。顶层的 `.mdx` 是独立页面，没有侧边栏：

| 文件 | 地址 | 用途 |
| --- | --- | --- |
| `docs/sites/support.mdx` | `https://leanmuscle.club/support/` | App Store 的支持网址 |
| `docs/sites/privacy.mdx` | `https://leanmuscle.club/privacy/` | App Store 的隐私政策网址 |

这两个地址用于 App Store Connect，不要改名或移动。两个页面只有顶栏，顶栏链接到文档、支持和隐私政策。文档侧边栏的最下面也有这两个页面的链接。每个独立页面在 `src/app/(docs)/(pages)/` 下有自己的路由文件；只在 `docs/sites/` 顶层新建 `.mdx`，不会生成页面。

隐私政策目前是发布前草案。页面状态、每条陈述的源码依据、待确认项和上线条件见 [隐私政策与支持页维护记录](docs/privacy-support.md)。

文档区分为两个栏目：

| 目录 | 栏目 | 读者 |
| --- | --- | --- |
| `docs/sites/docs/guide/` | 用户指南 | Boji App 的用户 |
| `docs/sites/docs/developers/` | 开发者文档 | 开发者 |

新增页面的步骤：

1. 在栏目目录中新建 `.mdx` 文件，例如 `docs/sites/docs/guide/install.mdx`。页面地址是 `/docs/guide/install/`。
2. 在文件开头的 front matter 中写 `title` 和 `description`。
3. 把文件名（不含扩展名）加到同一目录 `meta.json` 的 `pages` 中，用来确定侧边栏的顺序。

MDX 中可以直接使用 Fumadocs 的 `Callout`、`Card` 和 `Cards` 组件。站内链接可以写相对文件路径，例如 `[安装](./install.mdx)`。

文档站的界面文字是中文，搜索在浏览器中完成，不需要服务器。构建时会生成搜索索引 `out/api/search`，其中包含文档区页面、支持页和隐私政策。文档的配色在 `src/app/docs.css` 中定义，和官网一样取自 Boji App，并支持深色模式。

不要把内部文档放到 `docs/sites/`，例如 `docs/membership.md`、`docs/sentry.md` 和 `ios/docs/`。

内容源在本目录以外，所以 `next.config.ts` 把 Turbopack 的根目录 `turbopack.root` 设为仓库根目录。Turbopack 不解析根目录以外的文件。Next.js 命令要在本目录运行，因为 fumadocs-mdx 按当前工作目录解析 `../docs/sites`。

`pnpm build` 默认使用 Turbopack。Turbopack 要绑定本机端口来启动 MDX 加载器进程。如果执行环境禁止绑定端口，构建会报错 `binding to a port: Operation not permitted`。这时可以用 `pnpm exec next build --webpack` 验证页面，但发布前仍要在正常环境中运行 `pnpm build`。

## 视觉风格

网站沿用苹果发布会的版式，颜色取自 Boji App。色值以 iOS 的 `ios/Boji/Views/DesignSystem.swift` 和 Android 的 `BojiColors.kt` 为准，网站的颜色令牌在 `src/app/globals.css` 中定义。

| 用途 | 令牌 | 色值 |
| --- | --- | --- |
| 浅色页面背景 | `paper` | `#F7F5F0` |
| 交替的浅色区块和页脚 | `mist` | `#EFEBE4` |
| 正文 | `ink` | `#1E1D1B` |
| 次要文字 | `ash`、`ash-dark` | `#898681`、`#706E69` |
| 产品名和关键数字的渐变 | `green`、`mint` | 浅色背景上从 `#4A9A7D` 到 `#1C5242`，深色背景上从 `#D3F2E6` 到 `#4FAE8E` |
| 按钮、链接和全新角标 | `accent` | `#C7401F`，深色背景上为 `#FF7A4D` |
| 喝水卡和睡眠卡 | `water`、`sleep` | `#1F5FA8`、`#7A4FA3` |

深色区块保持纯黑，因为人像、芯片图和舞台图都是黑底。浅色区块上的卡片用白色。Logo、favicon 和通知中的小图标使用 App 图标中的站立人形，路径来自 `ios/Boji/Resources/AppIcon.icon/Assets/mark.svg`。

## 素材

生成图片和发布会短片原先存放在 Manus 项目存储中，迁移时已从线上站点下载到 `public/media/`。代码通过 `src/lib/content.ts` 中的 `IMG` 和 `LAUNCH_FILM` 引用这些文件。

`public/media/chip.webp` 中的西兰花标志已换成 Boji 人形，电路走线从荧光绿调为薄荷绿。

## 迁移说明

- `package.json` 不再锁定 pnpm 11，改用 devenv 提供的 pnpm 12。
- `plan.md`、`TODO.md` 和 `notes.md` 移到了 `docs/`。文档中的 `/home/ubuntu/...` 路径指向原 Manus 沙盒，在本仓库中不存在。
- 源码目录 `app/`、`components/` 和 `lib/` 移到了 `src/`，`@/` 别名指向 `src/`。`docs/` 中的旧路径没有同步修改。
- 删除了 `scripts/fetch_preview.py`，因为它依赖 Manus 存储接口。
- `app.config.ts` 和 `public/manus-routes.json` 是 Manus 托管用的元数据，暂时保留。`app.config.ts` 的 `logoUrl` 原先指向 `files.manuscdn.com` 上的西兰花图标，现在改为仓库根目录 `assets/public/` 中的 Boji 应用图标，地址是 `https://assets.leanmuscle.club/boji-icon.png`。
- 删除了 `next.config.ts` 中 Manus 预览域名的 `allowedDevOrigins`，只保留 `localhost` 和 `127.0.0.1`。
