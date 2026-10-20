# ConnectRPC 业务接口

业务协议位于 `proto/boji/`，按 [Google AIP](https://google.aip.dev/) 设计。`build.rs` 使用官方 `connectrpc-build` 生成服务绑定。服务运行在 Axum 上，不自行实现 Connect 协议。协议引用的 `google.api`、`google.rpc` 和 `google.type` 定义从 BSR 的 `buf.build/googleapis/googleapis` 获取，由 `buf.lock` 固定在一个提交上。服务端的 `google.rpc` Rust 类型来自 [`aip-193`](https://crates.io/crates/aip-193) 的 `proto` 特性，过滤条件由 [`aip-160`](https://crates.io/crates/aip-160) 解析。

修改协议后，必须运行 `buf lint`、`buf format -d --exit-code` 和 Google `api-linter`。三项检查的命令见 `AGENTS.md`。修改 `proto/boji/v1/` 后，还要在 `ios/BojiAPI/` 中运行 `buf generate`，并在同一次改动中提交重新生成的 Swift 代码。

## 包与文件

协议分为两个包。`boji.v1` 面向会员本人，`boji.admin.v1` 面向运营人员。

| 文件 | 内容 | 状态 |
| --- | --- | --- |
| `boji/v1/error_reason.proto` | 全部错误原因 `ErrorReason` | 已使用 |
| `boji/v1/system_service.proto` | `SystemService` 与单例资源 `ServerConfig` | 已注册 |
| `boji/v1/membership.proto` | 资源 `Membership`，两个包共用 | 已使用 |
| `boji/v1/membership_service.proto` | 会员本人的 `MembershipService` | 已注册 |
| `boji/v1/activity_service.proto` | `ActivityService`、资源 `Activity` 与 `SyncState` | 已注册 |
| `boji/v1/wallet_service.proto` | `WalletService` 与资源 `MembershipPass` | 已注册 |
| `boji/admin/v1/entitlement_service.proto` | 运营的 `EntitlementService` 与资源 `Entitlement` | 已注册 |
| `boji/admin/v1/membership_service.proto` | 运营的 `MembershipService` 与资源 `EntitlementGrant` | 已注册 |


新服务不提供旧 REST 业务路径。iOS 和 Android 必须改用 ConnectRPC 生成的客户端。

## 请求与认证

客户端使用 `POST /<package>.<Service>/<Method>`，例如 `POST /boji.v1.MembershipService/GetMembership`。JSON 请求需要以下请求头：

```http
Content-Type: application/json
Connect-Protocol-Version: 1
Authorization: Bearer <signed-session-token>
```

服务也接受 `application/proto`。客户端应该通过 proto 生成类型。JSON 编码遵循 proto3 JSON 映射：

- 字段名使用 lowerCamelCase，例如 `memberNumber`。
- 枚举使用值的名称，例如 `"ACTIVE"`。
- `Timestamp` 是 RFC 3339 字符串，例如 `"2026-10-20T09:00:00Z"`。
- `Duration` 是以 `s` 结尾的秒数，例如 `"1800s"`。
- `google.type.Date` 是对象，例如 `{"year":2026,"month":10,"day":20}`。
- `FieldMask` 是逗号分隔的字符串，例如 `"enabled,consentVersion"`。
- 默认值可能被省略。生成客户端会把缺少的字段解释为默认值，例如布尔字段为 `false`、列表为空。

业务接口只接受已验证邮箱的有效会话。客户端必须使用登录响应的 `set-auth-token`。服务不接受原始会话 token 或仅 Cookie 的业务请求。

`SystemService/GetServerConfig` 不要求登录，请求为 `{"name":"serverConfig"}`。服务设置全部 `APPLE_*` 变量后，`appleLoginEnabled` 为 `true`。服务配置了 Wallet 签名材料，并且签名证书和 WWDR 证书都在有效期内时，`walletPassEnabled` 为 `true`。`activitySyncEnabled` 为 `true`。

## 资源名

每个资源都有 AIP-122 资源名。请求用资源名指定目标，响应中的 `name` 始终使用规范形式。

| 资源 | 资源名 |
| --- | --- |
| `ServerConfig` | `serverConfig` |
| `Membership` | `users/{user}/memberships/{membership}` |
| `MembershipPass` | `users/{user}/memberships/{membership}/pass` |
| `SyncState` | `users/{user}/syncState` |
| `Activity` | `users/{user}/activities/{activity}` |
| `Entitlement` | `entitlements/{entitlement}` |
| `EntitlementGrant` | `users/{user}/memberships/{membership}/entitlementGrants/{entitlement}` |

`{user}` 是 Better Auth 的用户 ID。`{membership}`、`{activity}` 和 `{entitlement}` 是 UUID。会员本人调用 `boji.v1` 时，`{user}` 可以写成 `me`，也可以写成自己的用户 ID。资源名指向其他用户时，服务端在检查资源是否存在之前返回 `permission_denied` `RESOURCE_ACCESS_DENIED`。

运营方法的 `{user}` 可以写成 `-`，表示按 `{membership}` 查找任意用户的会员卡（AIP-159）。资源名中的用户与会员卡不匹配时，服务端返回 `not_found`。

## 方法列表

| 服务 | 方法 | 用途 |
| --- | --- | --- |
| `boji.v1.SystemService` | `GetServerConfig` | 查询服务端可用能力 |
| `boji.v1.MembershipService` | `GetMembership` | 读取本人的一张会员卡 |
| `boji.v1.MembershipService` | `ListMemberships` | 列出本人的会员卡，最多一张 |
| `boji.v1.MembershipService` | `CreateMembership` | 领取免费会员卡 |
| `boji.v1.ActivityService` | `GetSyncState` | 查询同步授权状态 |
| `boji.v1.ActivityService` | `UpdateSyncState` | 开启或关闭同步 |
| `boji.v1.ActivityService` | `GetActivity` | 读取一条活动记录 |
| `boji.v1.ActivityService` | `ListActivities` | 分页列出未删除的活动记录 |
| `boji.v1.ActivityService` | `BatchWriteActivities` | 批量创建、替换或删除活动记录 |
| `boji.v1.ActivityService` | `SyncActivities` | 增量拉取变更，包括删除 |
| `boji.v1.ActivityService` | `SummarizeActivities` | 读取日期范围内的每日汇总 |
| `boji.v1.WalletService` | `GetMembershipPass` | 下载 Apple Wallet 会员卡 |

运营方法见[运营接口](#运营接口)。

## 分页

列表方法遵循 AIP-158。请求携带 `pageSize` 和 `pageToken`，响应携带 `nextPageToken`。

- `pageSize` 为 0 时使用默认值。超过上限时按上限处理。负数返回 `INVALID_INPUT`。
- 首页使用空 `pageToken`。后续页面使用上一页的 `nextPageToken`。
- `nextPageToken` 为空表示没有更多页面。一页的记录数可能少于 `pageSize`，客户端不能据此判断是否结束。
- 页令牌是不透明字符串，只能用于同一方法和同样的其他请求参数。否则服务端返回 `INVALID_PAGE_TOKEN`。

| 方法 | 默认值 | 上限 |
| --- | --- | --- |
| `boji.v1.MembershipService/ListMemberships` | 50 | 100 |
| `ListActivities`、`SyncActivities` | 100 | 200 |
| `SummarizeActivities` | 93 | 93 |
| 运营的 `ListMemberships`、`ListEntitlements`、`ListEntitlementGrants` | 50 | 100 |

## 会员卡

领卡请求如下：

```json
{
  "parent": "users/me",
  "membership": {"nickname": "Boji Runner", "termsVersion": "community-v1"}
}
```

`termsVersion` 必须等于当前条款版本 `community-v1`，否则服务端返回 `TERMS_NOT_ACCEPTED`。每个用户最多持有一张会员卡。用户已有会员卡时，服务端返回 `already_exists` `MEMBERSHIP_ALREADY_EXISTS`，客户端应该调用 `ListMemberships` 读取已有的卡。

`ListMemberships` 使用 `{"parent":"users/me"}`。未领卡时，响应不包含 `memberships` 字段。`GetMembership` 使用完整资源名，例如 `{"name":"users/me/memberships/<id>"}`。

`Membership` 的主要字段如下：

- `name`：会员卡的资源名，最后一段是会员卡 ID。
- `memberNumber`：不透明字符串。客户端必须原样显示，禁止做数值转换或按格式推断含义。
- `state`：`ACTIVE` 或 `SUSPENDED`。客户端收到未知状态时，必须按 `SUSPENDED` 处理。
- `entitlements`：当前生效的权益。会员卡暂停时为空。
- `createTime`：入会时间。`expireTime` 缺少表示会员卡没有到期时间。

免费本地功能不依赖会员卡保持可用。

## 活动同步

同步默认关闭。客户端必须取得明确同意，再调用 `UpdateSyncState`：

```json
{
  "syncState": {
    "name": "users/me/syncState",
    "enabled": true,
    "consentVersion": "activity-sync-v1"
  }
}
```

请求省略 `updateMask` 时，服务端更新 `syncState` 中已填写的字段。开启同步时缺少当前同意版本，服务端返回 `CONSENT_REQUIRED`。关闭同步使用 `"enabled": false` 和 `"updateMask": "enabled"`。关闭操作不删除已有服务端记录。同步关闭时，活动记录的读写方法返回 `SYNC_DISABLED`。HealthKit 数据不在本次同步授权范围内。

### 写入

提交饮水记录的示例：

```json
{
  "parent": "users/me",
  "writes": [{
    "requestId": "50000000-0000-4000-8000-000000000001",
    "upsert": {
      "name": "users/me/activities/60000000-0000-4000-8000-000000000001",
      "occurTime": "2026-10-20T09:00:00Z",
      "timeZone": "Asia/Shanghai",
      "source": "MANUAL",
      "hydration": {"amountMl": 250}
    }
  }]
}
```

`BatchWriteActivities` 的规则如下：

- 每批包含 1～50 个写入。每个写入只能选择 `upsert` 或 `deletion` 之一。饮水、睡眠和训练载荷也只能选择一个。
- 活动记录 ID 由客户端生成，必须是 UUID。
- `upsert` 不带 `etag` 时只能创建新记录。记录已存在时，该写入返回 `ALREADY_EXISTS`。
- 替换和删除必须携带当前 `etag`。`etag` 不匹配时，该写入返回 `ABORTED` `ACTIVITY_ETAG_MISMATCH`。
- `deletion` 是活动记录的资源名。删除是永久操作，删除后的记录不再接受写入。
- `requestId` 是 UUID，用于安全重试。重新提交相同 `requestId` 和相同内容会得到原结果。改变内容必须使用新的 `requestId`，否则返回 `REQUEST_ID_REUSED`。

格式错误使整个请求失败，返回 `invalid_argument`。冲突只影响对应的写入：响应的 `writeResults` 与 `writes` 一一对应，每项包含活动记录的资源名、`google.rpc.Status` 和当前 `etag`。`status` 为空对象表示写入成功。失败的 `status` 带有 `code`、`message` 和一条 `ErrorInfo`，客户端应该按其中的 `reason` 处理。

服务识别 `MANUAL`、`APP` 和 `IMPORT` 来源。客户端禁止把 HealthKit 数据标成这些来源上传。服务端拒绝未知来源，但不能验证客户端伪造的来源。

### 读取

`SyncActivities` 用于增量同步：

1. 首次同步不带 `syncToken`。服务端从头返回全部变更，包括带 `deleteTime` 的已删除记录。
2. 响应带有 `nextPageToken` 时，客户端用它请求下一页。
3. 最后一页带有 `nextSyncToken`。客户端必须保存它，下次同步时作为 `syncToken` 发送。
4. 服务端返回 `INVALID_SYNC_TOKEN` 时，客户端必须丢弃保存的令牌，重新执行首次同步。

`ListActivities` 只返回未删除的记录，适合一次性浏览。`SummarizeActivities` 的 `startDate` 和 `endDate` 都包含在范围内，范围最多 93 天。

## 错误

业务错误遵循 AIP-193。每个错误使用 Connect 标准错误码，并且恰好携带一条 `google.rpc.ErrorInfo` 详情：

- `ErrorInfo.domain` 固定为 `boji.leanmuscle.club`。
- `ErrorInfo.reason` 是 `ErrorReason` 中一个值的名称，例如 `MEMBERSHIP_NOT_FOUND`。客户端必须按 `reason` 分支，禁止解析错误消息。错误消息是面向开发者的英文，可能变化。
- `invalid_argument` 错误还携带 `google.rpc.BadRequest`，其中的 `fieldViolations` 指出出错的请求字段。
- `not_found` 错误还携带 `google.rpc.ResourceInfo`，其中包含资源类型和资源名。

例外是无法解码的请求，例如 JSON 中的枚举名未知。Connect 框架在调用业务代码之前返回 `invalid_argument`，这种错误不带详情。

Connect JSON 中的详情是 base64 编码的 protobuf。会员卡不存在时的错误如下，`value` 分别是 `ErrorInfo` 和 `ResourceInfo` 的编码：

```json
{
  "code": "not_found",
  "message": "The requested resource does not exist.",
  "details": [
    {"type": "google.rpc.ErrorInfo", "value": "<base64>"},
    {"type": "google.rpc.ResourceInfo", "value": "<base64>"}
  ]
}
```

`ErrorReason` 是可扩展枚举。客户端收到未知 `reason` 时，必须只按错误码处理。各原因的含义见 `error_reason.proto`，常用原因如下：

| Connect 错误码 | `reason` | 含义 |
| --- | --- | --- |
| `unauthenticated` | `SESSION_REQUIRED` | 会话缺失、无效、过期或已撤销 |
| `permission_denied` | `EMAIL_NOT_VERIFIED` | 邮箱未验证 |
| `permission_denied` | `RESOURCE_ACCESS_DENIED` | 资源名指向其他用户 |
| `invalid_argument` | `INVALID_INPUT` | 请求字段缺失或无效 |
| `invalid_argument` | `INVALID_PAGE_TOKEN`、`INVALID_SYNC_TOKEN` | 令牌无效 |
| `failed_precondition` | `TERMS_NOT_ACCEPTED`、`CONSENT_REQUIRED`、`SYNC_DISABLED` | 条款或同步授权不满足 |
| `unavailable` | `BACKEND_UNAVAILABLE` | 存储暂不可用，应该按指数退避重试 |
| `internal` | `INTERNAL_ERROR` | 服务端失败，不返回数据库细节 |

认证接口 `/api/auth/*` 使用 `better-auth-rs` 的原生错误，不使用上述格式。

请求体和解码后的消息上限均为 64 KiB。服务端不做请求限流，由 CDN 和网关负责。

## 运营接口

`boji.admin.v1.EntitlementService` 和 `boji.admin.v1.MembershipService` 已接入会员卡与权益运营。`m20261020_000004_admin` 迁移建立审计表。权限配置和运维边界见[运营说明](admin-operations.md)。

### 访问控制

每个方法都要求已验证邮箱的签名 Bearer 会话。会话必须创建于 15 分钟内。调用者的 Better Auth 角色必须拥有方法对应的权限。服务端先检查会话和权限，再检查邮箱与会话时效。所有检查通过后，服务端才读取业务输入。因此，无权限的调用者无法探测目标是否存在。

运营接口拒绝封禁账号和冒充其他用户的会话，统一返回 `ADMIN_FORBIDDEN`。角色检查使用 Better Auth 的权威会话读取，不能通过客户端声明角色绕过。会话超过 15 分钟时，服务端返回 `FRESH_SESSION_REQUIRED`。

| 服务 | 方法 | 权限 |
| --- | --- | --- |
| `EntitlementService` | `GetEntitlement`、`ListEntitlements` | `entitlement.read` |
| `MembershipService` | `GetMembership`、`ListMemberships` | `membership.read`；完整视图另需 `entitlement.read` |
| `MembershipService` | `GetEntitlementGrant`、`ListEntitlementGrants` | `membership.read`、`entitlement.read` |
| `MembershipService` | `SuspendMembership`、`ResumeMembership` | `membership.update` |
| `MembershipService` | `GrantEntitlement` | `entitlement.grant` |
| `MembershipService` | `RevokeEntitlementGrant` | `entitlement.revoke` |

### 查询

运营方法返回的 `Membership` 与会员本人看到的资源相同，不包含邮箱。`view` 控制返回的字段：

- `MEMBERSHIP_VIEW_BASIC`：`entitlements` 为空。`ListMemberships` 默认使用该视图。
- `MEMBERSHIP_VIEW_FULL`：包含当前生效的权益。`GetMembership` 默认使用该视图。

`ListMemberships` 的 `parent` 为 `users/-` 时列出全部会员卡，为 `users/<用户 ID>` 时只列出该用户的会员卡。结果按 `createTime` 降序排列，再按会员卡 ID 降序排列。分页期间新增的会员卡不会让后续页面错位。分页期间状态发生变化的会员卡，可能进入或离开按状态筛选的结果。

`filter` 支持 AIP-160 的一个子集：一个或两个用 `AND` 连接的等值比较。可用字段如下，其他表达式返回 `INVALID_FILTER`。

- `state`：`ACTIVE` 或 `SUSPENDED`，例如 `state = SUSPENDED`。
- `member_number`：带引号的字符串，例如 `member_number = "<会员号>"`。服务端按原字符串精确匹配，不做规范化。

`ListEntitlements` 按目录 `code` 升序排列，包含停用的目录项。`ListEntitlementGrants` 返回一张会员卡的全部授权，包括已撤销和已到期的授权，并按目录 `code` 升序排列。

`EntitlementGrant` 的资源名以目录项 ID 结尾。`effective` 表示会员本人的 `MembershipService` 当前是否返回该授权。会员卡和目录项都处于有效状态，且授权已开始、未撤销、未到期时，`effective` 才为 `true`。

### 变更

四个变更方法都要求 `reason`。服务端去除首尾空白后，原因必须包含 1～500 个 Unicode 标量值，且不含控制字符。原因写入审计事件。禁止在原因中填写邮箱、健康数据、令牌或凭据。

暂停会员卡的请求如下：

```json
{
  "name": "users/-/memberships/20000000-0000-4000-8000-000000000001",
  "reason": "处理工单 1234 的滥用举报"
}
```

变更方法返回调用后的资源。状态发生变化时，服务端在同一事务中写入一条审计事件。目标状态已经存在时，服务端不修改数据，不写审计事件，并按下表处理：

| 方法 | 调用后的状态 | 目标状态已存在时 |
| --- | --- | --- |
| `SuspendMembership` | `state` 为 `SUSPENDED` | 返回 `failed_precondition` `MEMBERSHIP_ALREADY_SUSPENDED` |
| `ResumeMembership` | `state` 为 `ACTIVE` | 返回 `failed_precondition` `MEMBERSHIP_ALREADY_ACTIVE` |
| `GrantEntitlement` | 授权未撤销，到期时间等于请求值 | 返回已有授权 |
| `RevokeEntitlementGrant` | 授权已撤销 | 返回 `failed_precondition` `ENTITLEMENT_GRANT_ALREADY_REVOKED` |

两个相同的请求同时到达时，只有一个请求生效并写入审计事件。另一个请求按上表处理。

暂停不撤销授权、会话、已同步的活动记录或客户端本地数据。暂停后，会员本人仍能读取会员卡，但有效权益为空，Wallet 也拒绝签发新卡。恢复后，未撤销、已开始且未到期的授权重新生效。恢复不会还原已撤销或已到期的授权。

`GrantEntitlement` 的请求包含 `parent`（会员卡资源名）、`entitlement`（目录项资源名）、可选的 `expireTime` 和 `reason`。服务端按以下规则处理已有授权：

- 授权不存在或已撤销：服务端把 `grantTime` 设为服务端时间，并清除 `revokeTime`。
- 授权未撤销：服务端保留 `grantTime`，只替换 `expireTime`。

请求省略 `expireTime` 表示不设到期时间，因此会清除已有的到期时间。`expireTime` 必须晚于服务端时间。服务端按 PostgreSQL 微秒精度截断，以 UTC 存储和返回。停用的目录项不能授予，服务端返回 `ENTITLEMENT_INACTIVE`。暂停的会员卡可以接收授权，恢复后授权才生效。

撤销权益时，服务端把 `revokeTime` 设为服务端时间，并保留 `grantTime` 和 `expireTime`。停用的目录项也可以撤销。

## Wallet 接口

`boji.v1.WalletService/GetMembershipPass` 为会员本人的会员卡签发 Apple Wallet 会员卡。客户端必须先检查 `walletPassEnabled`，再显示 Wallet 入口。签名材料可能在两次请求之间失效，因此客户端仍必须处理下载错误。

### 请求与二进制响应

请求只有资源名，例如 `{"name":"users/me/memberships/<id>/pass"}`。响应是资源 `MembershipPass`：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `name` | `string` | 卡片的资源名 |
| `content` | `bytes` | 签名后的 `.pkpass` ZIP 数据，最大 1 MiB |
| `mimeType` | `string` | `content` 的媒体类型，当前为 `application/vnd.apple.pkpass` |

二进制 protobuf 直接携带原始字节。JSON 使用标准 base64 编码，体积增加约 33%。客户端应该对该方法使用 `application/proto`。64 KiB 上限只约束服务端解码请求，不约束响应。客户端如果设置了响应大小上限，该上限必须不小于 1 MiB。

响应设置 `Cache-Control: no-store`。卡片使用 `generic` 样式，`serialNumber` 等于会员卡 ID，并且禁止通过 Wallet 分享。重复下载使用同一序列号，签名时间可以不同。

卡面显示卡面昵称、会员号和入会日期。卡片背面注明会员状态以 App 为准，并说明本卡不是付款或核销凭证。卡片不包含邮箱、用户 ID、会话令牌、条码或健康数据。会员卡暂停后，已保存到 Wallet 的旧卡不会自动更新或移除。

### Wallet 错误

Wallet 错误使用与其他方法相同的 `ErrorInfo`。服务端完成会话和邮箱检查后，按下表顺序检查：

| Connect 错误码 | `reason` | 客户端处理 |
| --- | --- | --- |
| `not_found` | `MEMBERSHIP_NOT_FOUND` | 引导用户领卡 |
| `failed_precondition` | `MEMBERSHIP_SUSPENDED` | 刷新会员卡，不重试 |
| `failed_precondition` | `WALLET_NOT_CONFIGURED` | 隐藏入口，稍后重新读取 `ServerConfig`，不自动重试 |
| `unavailable` | `WALLET_SIGNING_FAILED` | 稍后可以重试 |

客户端收到其他 `reason` 时，按错误码处理。
