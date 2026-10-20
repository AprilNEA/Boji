# googleapis 副本

本目录保存 `proto/` 引用的 Google 公共协议文件。文件取自 [googleapis/googleapis](https://github.com/googleapis/googleapis) 的提交 `ba591f1d7fdedc610639425448756cd8a64adc0f`，未做修改。许可证见 `LICENSE`（Apache License 2.0）。

| 文件 | 用途 |
| --- | --- |
| `google/api/annotations.proto`、`google/api/http.proto` | 方法的 HTTP 映射 |
| `google/api/client.proto`、`google/api/launch_stage.proto` | 服务地址与方法签名 |
| `google/api/field_behavior.proto`、`google/api/field_info.proto` | 字段行为与字段格式 |
| `google/api/resource.proto` | 资源类型与资源引用 |
| `google/rpc/status.proto`、`google/rpc/error_details.proto` | AIP-193 错误与错误详情 |
| `google/type/date.proto` | 日历日期 |

`buf lint` 和 `buf breaking` 忽略本目录。`build.rs` 只为 `google/rpc/` 和 `google/type/` 生成 Rust 类型。`google/api/` 只提供注解，不生成代码。

## 更新步骤

1. 选定 googleapis 的新提交，记下完整的提交号。
2. 用新提交的同名文件替换本目录的文件。新导入的文件也从同一提交复制，不要复制未被引用的文件。
3. 更新本文件中的提交号。
4. 在 `bizserver/` 中运行 `buf lint`、`api-linter` 和 `cargo test --locked`。
