> [!WARNING]
> Boji 仍在开发中，iOS 和 Android 两端都尚未上架。

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="assets/public/boji-icon-dark.png">
        <img src="assets/public/boji-icon.png" width="138" alt="Boji 应用图标"/>
    </picture>
</p>

<h1 align="center">Boji · 薄肌俱乐部</h1>

<p align="center"><strong>穿衣显瘦，脱衣有肉<br/>把薄肌理论落到每天的训练、饮水和睡眠里</strong></p>

<div align="center">
    <img alt="iOS 26+" src="https://img.shields.io/badge/iOS-26%2B-000000?style=flat&logo=apple&logoColor=white">
    <img alt="watchOS 26+" src="https://img.shields.io/badge/watchOS-26%2B-000000?style=flat&logo=apple&logoColor=white">
    <img alt="Android 8.0+" src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=flat&logo=android&logoColor=white">
    <a href="https://twitter.com/AprilNEA" target="_blank">
    <img alt="twitter" src="https://img.shields.io/badge/follow-AprilNEA-green?style=social&logo=Twitter"></a>
    <img alt="Hits" src="https://hits.aprilnea.com/hits?url=https://github.com/aprilnea/boji">
</div>

<p align="center">支持 iPhone、Apple Watch 和 Android 手机。</p>

---

## 薄肌理论

- **薄肌**：穿衣显瘦，脱衣有肉。体脂长期保持在 13% 以下，不吃欺骗餐。
- **黄毛**：不被外界评价左右，坚持自己判断过的方向。
- **大水**：成年男性每天喝 1700 mL 水，成年女性每天 1500 mL 起。
- **大睡**：每晚睡 7 小时～9 小时，不靠周末补觉。

## 功能

Boji 把薄肌理论变成每天可以打卡的记录：

- **练出薄肌**：4 套课程（居家基础、居家进阶、器械基础和舒缓拉伸），带动作说明、逐组计时和休息倒计时。
- **大水、大睡**：记录每天的饮水量和睡眠时长。今日看板显示当天的训练、饮水和睡眠是否完成。
- **看见变化**：足迹页汇总最近 7 天的活动，并用趋势图展示体重和腰围。iOS 版还可以连接 Apple 健康，读取体重、腰围和睡眠数据。
- **加入俱乐部**：参加每周挑战，阅读入门文章。登录并确认俱乐部守则后，可以领取免费会员卡。
- **Apple Watch 与小组件**：开启共享后，在手表和主屏幕上查看当天的打卡状态。

免费会员卡、Apple 健康、Apple Watch 和小组件目前只在 iOS 版提供，Android 版尚未支持，详见 [Android 说明](android/README.md#尚未移植的功能)。

课程是通用参考，不提供医疗诊断。

## 参与开发

本仓库包含 iOS 与 Android 两个原生客户端、Rust 后端、两端共用的动作动画与文案，以及薄肌俱乐部宣传网站，各目录独立构建。目录结构、工具链与本地运行方式详见[开发指南](docs/DEVELOPMENT.md)。

外部贡献者必须先签署[贡献者许可协议](.github/CLA.md)（CLA），其 Pull Request 方可合并。签署方式为在 Pull Request 中原样评论以下文字：

```text
I have read the CLA Document and I hereby sign the CLA
```

依据该协议，贡献者保留其贡献的著作权，并授权 AprilNEA LLC 以包括商业条款在内的任意条款分发其贡献。

## 许可证

本仓库的代码与文档由 AprilNEA LLC 依据 [PolyForm Noncommercial License 1.0.0](LICENSE.md) 授权，仅限非商业使用。

下列内容不适用该许可证，其权利归各自的权利人所有：

| 内容 | 目录 |
| --- | --- |
| App 图标 | `ios/Boji/Resources/AppIcon.icon`、`assets/public/boji-icon.png`、`assets/public/boji-icon-dark.png`、`bizserver/assets/wallet/icon*.png` |
| 网站媒体 | `websites/public/media/` |
| 人像照片 | `websites/public/images/portraits/` |
| 动作库 | `animations/src/exercises/library/` |
| Apple Root CA 证书 | `bizserver/assets/wallet/apple-root-ca.crt` |
| 第三方依赖与字体 | — |

如需使用动作库，须另行取得 AprilNEA LLC 的商业授权。
