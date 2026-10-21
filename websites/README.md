# 薄肌俱乐部网站

本目录是薄肌俱乐部的网站。首页介绍 Boji App，粉丝向恶搞发布会在 `/keynote/` 和其他子页面，原项目为 `bojiclub`（版本 `827ca94`）。网站使用 Next.js 16 静态导出，样式用 Tailwind CSS 4，动画用 Motion 和 Lenis。`/docs` 下是 Boji 的文档站，使用 Fumadocs，和官网一起构建和部署。

## 本地运行

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 提供 Node.js 26 和 pnpm 12，并在本目录执行 `pnpm install`。devenv 还提供 Python 3 以及 Pillow 和 rembg，用于运行 `scripts/` 中的脚本。`portraits.py` 第一次运行时会把 rembg 模型下载到 `~/.u2net`。

然后在本目录运行：

```sh
pnpm dev        # 开发服务器，http://localhost:3000
pnpm typecheck  # 类型检查
pnpm build      # 静态构建，产物在 out/
```

## 独立托管

网站不依赖 Manus 或其他后端服务。`pnpm build` 生成的 `out/` 是纯静态文件，可以放到任意静态服务器或 CDN 上。站点专用的图片、视频和字体都在 `out/` 内。首页的 App 图标、截图和动作图来自仓库根目录的 `assets/public/`，运行时从 `https://assets.leanmuscle.club` 加载。除此之外，页面只请求本站资源。外部链接只有两个：App Store 下载链接，以及官网页脚和文档侧边栏中的 GitHub Discussions 链接，都只在用户点击时打开。

构建时设置了 `NEXT_PUBLIC_SENTRY_DSN`，网站才会把未捕获的错误上报到 Sentry，这是唯一的例外。默认构建不加载 Sentry，也不向 Sentry 发出请求。启用方式和上报字段见 [Sentry 错误上报](../docs/developers/sentry.mdx)。

```sh
NEXT_PUBLIC_SENTRY_DSN='https://<公钥>@<主机>/<项目编号>' pnpm build
```

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
| `/` | 首页：介绍 Boji App，提供 App Store 下载链接 |
| `/keynote/` | 2026 秋季发布会：原来的恶搞首页 |
| `/theory/` | 薄肌理论 |
| `/pro/` | 薄肌产品页 |
| `/compare/` | 型号对比 |
| `/store/` | 选购：配置交付日期、配件、宣誓并领取会员卡 |
| `/founders/` | 创始人 |
| `/join/` | 入会：宣誓并领取会员卡 |
| `/calculator/` | 旧链接，在客户端跳转到 `/store/` |
| `/support/` | 支持：Boji iOS App 的求助方式和常见问题 |
| `/privacy/`、`/en/privacy/` | 隐私政策，中文版和英文版 |
| `/terms/`、`/en/terms/` | 用户协议，中文版和英文版 |
| `/third-parties/`、`/en/third-parties/` | 第三方信息共享清单，中文版和英文版 |
| `/docs/` | 文档首页 |
| `/docs/guide/` | 用户指南，含大学排名规则 `/docs/guide/school-ranking/` |
| `/docs/developers/` | 开发者文档：会员卡开发说明、大学排名设计和 Sentry 错误上报 |

## 文档站

网站的内容源在仓库根目录，不在本目录中：

- `docs/` 是文档区，页面在 `/docs/` 下，显示文档侧边栏。`docs/` 中只有 `.mdx` 页面和 `meta.json` 会发布，同一目录下的内部 `.md` 文档不会发布。
- `docs/sites/` 是独立页面，没有侧边栏。文件名就是网址，英文版是同名的 `.en.mdx` 文件，网址在 `/en/` 下。

| 文件 | 地址 | 用途 |
| --- | --- | --- |
| `docs/sites/support.mdx` | `https://leanmuscle.club/support/` | App Store 的支持网址 |
| `docs/sites/privacy.mdx` | `https://leanmuscle.club/privacy/` | App Store 的隐私政策网址 |
| `docs/sites/terms.mdx` | `https://leanmuscle.club/terms/` | 用户协议，也是 App Store 的自定义 EULA |
| `docs/sites/third-parties.mdx` | `https://leanmuscle.club/third-parties/` | 第三方信息共享清单，隐私政策的组成部分 |
| `docs/sites/*.en.mdx` | `https://leanmuscle.club/en/…/` | 上面三份法律文件的英文版，以英文版为准 |

支持页和隐私政策的地址用于 App Store Connect，不要改名或移动。这些页面只有顶栏，顶栏链接到文档和各个独立页面。文档侧边栏的最下面也有这些页面的链接。每个独立页面在 `src/app/(docs)/(pages)/` 下有自己的路由文件，英文版的路由在 `(pages)/en/` 下；只新建 `.mdx`，不会生成页面。

隐私政策和用户协议自 2026 年 10 月 21 日起生效，有中文版和英文版，两版内容必须一致。决定事项、每条陈述的依据、待办事项和上线条件见 [隐私政策、用户协议与支持页维护记录](docs/privacy-support.md)。

文档区分为两个栏目：

| 目录 | 栏目 | 读者 |
| --- | --- | --- |
| `docs/guide/` | 用户指南 | Boji App 的用户 |
| `docs/developers/` | 开发者文档 | 开发者 |

新增页面的步骤：

1. 在栏目目录中新建 `.mdx` 文件，例如 `docs/guide/install.mdx`。页面地址是 `/docs/guide/install/`。
2. 在文件开头的 front matter 中写 `title` 和 `description`。
3. 把文件名（不含扩展名）加到同一目录 `meta.json` 的 `pages` 中，用来确定侧边栏的顺序。

MDX 中可以直接使用 Fumadocs 的 `Callout`、`Card` 和 `Cards` 组件。站内链接可以写相对文件路径，例如 `[安装](./install.mdx)`。

文档站的界面文字是中文，搜索在浏览器中完成，不需要服务器。构建时会生成搜索索引 `out/api/search`，其中包含文档区页面和各个独立页面，按语言分开。文档的配色在 `src/app/docs.css` 中定义，和官网一样取自 Boji App，并支持深色模式。

内部文档使用 `.md` 扩展名，例如 `docs/DEVELOPMENT.md` 和 `docs/ACCESSIBILITY.md`。不要把内部文档改成 `.mdx`，也不要把 `ios/docs/` 等其他目录的文档放进 `docs/`。

内容源在本目录以外，所以 `next.config.ts` 把 Turbopack 的根目录 `turbopack.root` 设为仓库根目录。Turbopack 不解析根目录以外的文件。Next.js 命令要在本目录运行，因为 fumadocs-mdx 按当前工作目录解析 `../docs`。

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
