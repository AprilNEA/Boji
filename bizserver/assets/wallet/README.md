# Wallet 素材

`src/wallet.rs` 和 `src/wallet/package.rs` 在编译时把本目录的文件编入二进制。修改这里的文件后需要重新编译。

| 文件 | 内容 | 来源 |
| --- | --- | --- |
| `icon.svg` | 通行证图标的源文件：浅色 App 图标，没有圆角，因为钱包会加自己的遮罩 | 图形取自 `ios/Boji/Resources/AppIcon.icon/Assets/mark.svg` |
| `icon.png`、`icon@2x.png`、`icon@3x.png` | 通行证图标，38、76 和 114 像素见方，不透明。锁屏通知和邮件附件显示它 | 从 `icon.svg` 渲染 |
| `logo.svg` | 通行证 logo 的源文件：App 图标的图形，用卡面前景色 `#F7F2E0`，背景透明 | 图形取自 `mark.svg` |
| `logo.png`、`logo@2x.png`、`logo@3x.png` | 卡面左上角的 logo，26 × 50、52 × 100 和 78 × 150 像素。logo 右边是 `logoText` | 从 `logo.svg` 渲染 |
| `apple-root-ca.crt` | Apple Root CA，PEM 格式，有效期到 2035-02-09 | <https://www.apple.com/appleca/AppleIncRootCertificate.cer> |

## 图标和 logo

卡面配色与 App 内的森林绿卡面一致：背景 `rgb(33, 66, 54)`，前景 `rgb(247, 242, 224)`，标签 `rgb(183, 189, 173)`。颜色写在 `src/wallet/package.rs` 中。logo 的高度用满钱包允许的 50 pt，宽度按图形比例确定。

App 图标的图形变更后，把新路径同步到 `icon.svg` 和 `logo.svg`，再在仓库根目录运行下面的命令。`rsvg-convert` 和 `magick` 不由 devenv 提供，可以用 Homebrew 安装 `librsvg` 和 `imagemagick`。

```sh
D=bizserver/assets/wallet
T=$(mktemp -d)
for pair in icon:38 icon@2x:76 icon@3x:114; do
  name=${pair%:*} size=${pair#*:}
  rsvg-convert -w "$size" -h "$size" "$D/icon.svg" -o "$T/$name.png"
  magick "$T/$name.png" -strip -alpha off "$D/$name.png"
done
for pair in logo:26x50 logo@2x:52x100 logo@3x:78x150; do
  name=${pair%:*} size=${pair#*:}
  rsvg-convert -w "${size%x*}" -h "${size#*x}" "$D/logo.svg" -o "$T/$name.png"
  magick "$T/$name.png" -strip "$D/$name.png"
done
rm -r "$T"
```

`-strip` 删除 PNG 元数据，所以重新渲染相同的源文件得到相同的文件。图标和 logo 属于 App 图标，不在 `LICENSE.md` 的许可范围内。

## Apple Root CA

服务端用这张证书校验 `WALLET_WWDR_CERT`。证书的 SHA-256 指纹是：

```text
B0:B1:73:0E:CB:C7:FF:45:05:14:2C:49:F1:29:5E:6E:DA:6B:CA:ED:7E:2C:68:C5:BE:91:B5:A1:10:01:F0:24
```

更换证书时，从上表的 Apple 地址下载 DER 文件，核对指纹，再转换为 PEM：

```sh
openssl x509 -inform der -in AppleIncRootCertificate.cer -out bizserver/assets/wallet/apple-root-ca.crt
openssl x509 -in bizserver/assets/wallet/apple-root-ca.crt -noout -fingerprint -sha256
```

`src/wallet.rs` 的单元测试 `bundled_apple_root_is_the_published_certificate` 核对证书的指纹和到期时间。更换证书时同步修改这个测试。这张证书由 Apple 发布，不在 `LICENSE.md` 的许可范围内。
