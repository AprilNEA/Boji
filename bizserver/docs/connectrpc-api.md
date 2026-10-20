# ConnectRPC 业务接口

业务协议位于 `proto/boji/v1/business.proto`。`build.rs` 使用官方 `connectrpc-build` 生成服务绑定。服务运行在 Axum 上，不自行实现 Connect 协议。

## 请求与认证

客户端使用 `POST /boji.v1.<Service>/<Method>`。JSON 请求需要以下请求头：

```http
Content-Type: application/json
Connect-Protocol-Version: 1
Authorization: Bearer <signed-session-token>
```

服务也接受 `application/proto`。客户端应该通过 proto 生成类型。JSON 中的字段使用 lowerCamelCase。

业务接口只接受已验证邮箱的有效会话。客户端必须使用登录响应的 `set-auth-token`。服务不接受原始会话 token 或仅 Cookie 的业务请求。

`SystemService/GetCapabilities` 不要求登录。当前 `appleSignIn` 和 `walletPass` 均为 `false`。Proto JSON 可能省略默认值。生成客户端会把缺少的布尔字段解释为 `false`。

## 方法列表

| 服务 | 方法 | 用途 |
| --- | --- | --- |
| `SystemService` | `GetCapabilities` | 查询本次迁移可用能力 |
| `MembershipService` | `GetMembership` | 读取当前用户的会员卡 |
| `MembershipService` | `EnrollMembership` | 幂等领取免费会员卡 |
| `ActivityService` | `GetSyncState` | 查询同步授权状态 |
| `ActivityService` | `SetSyncState` | 开启或关闭同步 |
| `ActivityService` | `ApplyBatch` | 提交活动记录的变更 |
| `ActivityService` | `ListChanges` | 分页拉取记录与删除标记 |
| `ActivityService` | `GetDays` | 读取日期范围内的汇总 |

原 REST 业务路径没有自动映射。iOS 和 Android 必须单独迁移协议。客户端迁移完成前应继续使用旧服务。

## 会员卡

领卡请求如下。`GetMembership` 使用空对象请求。

```json
{"displayName":"Boji Runner","termsVersion":"community-v1"}
```

未领卡时，响应不包含 `membership` 字段。有卡时，字段包含会员与有效权益。`memberNumber` 是不透明字符串。`id` 才是会员卡标识。

时间字段为 UTC ISO 8601 字符串。缺少可选 `expiresAt` 表示未设置到期时间。免费本地功能不依赖会员卡保持可用。

## 活动同步

同步默认关闭。客户端必须取得明确同意，再发送：

```json
{"enabled":true,"consentVersion":"activity-sync-v1"}
```

关闭同步使用 `{"enabled":false}`。关闭操作不会删除已有服务端记录。HealthKit 数据不在本次同步授权范围内。

提交饮水记录的示例：

```json
{
  "operations": [{
    "mutationId": "50000000-0000-4000-8000-000000000001",
    "id": "60000000-0000-4000-8000-000000000001",
    "expectedRevision": 0,
    "upsert": {
      "occurredAt": "2026-10-20T09:00:00Z",
      "timeZone": "Asia/Shanghai",
      "source": "manual",
      "hydration": {"amountMl": 250}
    }
  }]
}
```

每批包含 1 至 50 个操作。`upsert` 与 `delete` 只能选择一个。饮水、睡眠和训练载荷也只能选择一个。删除请求携带 `delete: {}` 和当前 `expectedRevision`。

服务识别 `manual`、`app` 和 `import` 来源。客户端不能把 HealthKit 数据标成这些来源上传。服务拒绝显式 `healthkit` 来源，但不能验证客户端伪造的来源。

客户端首次拉取使用空 `cursor` 或 `"0"`。后续必须保存 `ListChanges` 的 `nextCursor`。提交响应中的 `serverCursor` 只是服务端水位，不能替代拉取游标。

冲突由每个操作的 `status` 和 `code` 表达。重新提交相同 `mutationId` 和相同内容会得到原回执。改变内容必须使用新的 `mutationId`。

## 错误与限制

业务错误采用 Connect 标准错误码。错误不再沿用旧 REST 的大写 `code` 格式。认证接口仍使用 `better-auth-rs` 的原生错误。

| Connect 错误码 | 含义 |
| --- | --- |
| `unauthenticated` | 会话缺失、无效或已撤销 |
| `permission_denied` | 邮箱未验证或同步未开启 |
| `invalid_argument` | 输入、日期或游标无效 |
| `failed_precondition` | 尚未接受条款或同步授权 |
| `internal` | 服务端失败；不返回数据库细节 |

请求体和解码后的消息上限均为 64 KiB。部署前仍需完成多实例限流与压力测试。
