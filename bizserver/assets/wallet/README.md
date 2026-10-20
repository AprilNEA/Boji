# Wallet 素材

`src/wallet.rs` 在编译时把本目录的文件编入二进制。修改这里的文件后需要重新编译。

| 文件 | 内容 | 来源 |
| --- | --- | --- |
| `icon.png`、`icon@2x.png`、`icon@3x.png` | 通行证图标，29、58 和 87 像素 | 从 `assets/public/boji-icon.png` 缩放 |
| `apple-root-ca.crt` | Apple Root CA，PEM 格式，有效期到 2035-02-09 | <https://www.apple.com/appleca/AppleIncRootCertificate.cer> |

## 图标

App 图标变更后，先按根目录 `AGENTS.md` 重新导出 `assets/public/boji-icon.png`，再在仓库根目录运行：

```sh
S=assets/public/boji-icon.png
D=bizserver/assets/wallet
sips -s format png -z 29 29 "$S" --out "$D/icon.png"
sips -s format png -z 58 58 "$S" --out "$D/icon@2x.png"
sips -s format png -z 87 87 "$S" --out "$D/icon@3x.png"
```

图标属于 App 图标，不在 `LICENSE.md` 的许可范围内。

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
