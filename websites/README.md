# 薄肌俱乐部网站

本目录是薄肌俱乐部的粉丝向宣传网站，原项目为 `bojiclub`（版本 `827ca94`）。网站使用 Next.js 16 静态导出，样式用 Tailwind CSS 4，动画用 Motion 和 Lenis。

## 本地运行

在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 提供 Node.js 24 和 pnpm 12，并在本目录执行 `pnpm install`。

然后在本目录运行：

```sh
pnpm dev        # 开发服务器，http://localhost:3000
pnpm typecheck  # 类型检查
pnpm build      # 静态构建，产物在 out/
```

## 独立托管

网站不依赖 Manus 或其他后端服务。`pnpm build` 生成的 `out/` 是纯静态文件，可以放到任意静态服务器或 CDN 上。站点专用的图片、视频和字体都在 `out/` 内，页面运行时只请求本站资源。页脚的 Discord 邀请链接是唯一的外部链接，只在用户点击时打开。

部署时注意两点：

- 构建开启了 `trailingSlash`，每个路由导出为 `<路由>/index.html`。服务器需要把 `/theory/` 映射到 `theory/index.html`，大多数静态服务器默认如此。
- 未知路径要返回 `404.html`。例如 Nginx 配置 `error_page 404 /404.html;`。

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

## 素材

生成图片和发布会短片原先存放在 Manus 项目存储中，迁移时已从线上站点下载到 `public/media/`。代码通过 `src/lib/content.ts` 中的 `IMG` 和 `LAUNCH_FILM` 引用这些文件。

## 迁移说明

- `package.json` 不再锁定 pnpm 11，改用 devenv 提供的 pnpm 12。
- `plan.md`、`TODO.md` 和 `notes.md` 移到了 `docs/`。文档中的 `/home/ubuntu/...` 路径指向原 Manus 沙盒，在本仓库中不存在。
- 源码目录 `app/`、`components/` 和 `lib/` 移到了 `src/`，`@/` 别名指向 `src/`。`docs/` 中的旧路径没有同步修改。
- 删除了 `scripts/fetch_preview.py`，因为它依赖 Manus 存储接口。
- `app.config.ts` 和 `public/manus-routes.json` 是 Manus 托管用的元数据，暂时保留。`app.config.ts` 的 `logoUrl` 原先指向 `files.manuscdn.com` 上的西兰花图标，现在改为仓库根目录 `assets/public/` 中的 Boji 应用图标，地址是 `https://assets.leanmuscle.club/boji-icon.png`。
- 删除了 `next.config.ts` 中 Manus 预览域名的 `allowedDevOrigins`，只保留 `localhost` 和 `127.0.0.1`。
