# ConnectRPC 业务接口

业务协议位于 `proto/boji/`，按 [Google AIP](https://google.aip.dev/) 设计。服务运行在 Axum 上，不自行实现 Connect 协议。

| 部分 | 来源 |
| --- | --- |
| 服务绑定 | `build.rs` 用官方 `connectrpc-build` 生成 |
| `google.api`、`google.rpc`、`google.type` 定义 | BSR 的 `buf.build/googleapis/googleapis`，由 `buf.lock` 固定在一个提交上 |
| 服务端的 `google.rpc` Rust 类型 | [`aip-193`](https://crates.io/crates/aip-193) 的 `proto` 特性 |
| 过滤条件解析 | [`aip-160`](https://crates.io/crates/aip-160) |

修改协议后，必须运行 `buf lint`、`buf format -d --exit-code` 和 Google `api-linter`。三项检查的命令见 `AGENTS.md`。修改 `proto/boji/v1/` 后，还要在 `ios/BojiAPI/` 和 `android/rpc/` 中运行 `buf generate`，并在同一次改动中提交重新生成的 Swift 和 Kotlin 代码。

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
| `boji/v1/organization.proto` | 资源 `Organization`、`OrganizationStanding` 与枚举 `OrganizationType`，两个包共用 | 已使用 |
| `boji/v1/organization_service.proto` | 公开的 `OrganizationService` | 已注册 |
| `boji/v1/affiliation.proto` | 资源 `Affiliation` 与 `AffiliationEmailVerification`，两个包共用 | 已使用 |
| `boji/v1/affiliation_service.proto` | 会员本人的 `AffiliationService` | 已注册 |
| `boji/admin/v1/entitlement_service.proto` | 运营的 `EntitlementService` 与资源 `Entitlement` | 已注册 |
| `boji/admin/v1/membership_service.proto` | 运营的 `MembershipService` 与资源 `EntitlementGrant` | 已注册 |
| `boji/admin/v1/organization_service.proto` | 运营的 `OrganizationService` | 已注册 |


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

`SystemService/GetServerConfig` 和 `boji.v1.OrganizationService` 的方法不要求登录。`GetServerConfig` 的请求为 `{"name":"serverConfig"}`。服务设置全部 `APPLE_*` 变量后，`appleLoginEnabled` 为 `true`。服务设置 `GOOGLE_CLIENT_ID` 后，`googleLoginEnabled` 为 `true`。服务配置了 Wallet 签名材料，并且签名证书和 WWDR 证书都在有效期内时，`walletPassEnabled` 为 `true`。`activitySyncEnabled` 为 `true`。服务设置了 `AFFILIATION_EMAIL_HMAC_KEY` 时，`organizationRankingEnabled` 为 `true`。

## 资源名

每个资源都有 AIP-122 资源名。请求用资源名指定目标，响应中的 `name` 始终使用规范形式。

| 资源 | 资源名 |
| --- | --- |
| `ServerConfig` | `serverConfig` |
| `Membership` | `users/{user}/memberships/{membership}` |
| `MembershipPass` | `users/{user}/memberships/{membership}/pass` |
| `SyncState` | `users/{user}/syncState` |
| `Activity` | `users/{user}/activities/{activity}` |
| `Organization` | `organizations/{organization}` |
| `OrganizationStanding` | `organizations/{organization}/standing` |
| `Affiliation` | `users/{user}/affiliations/{affiliation}` |
| `AffiliationEmailVerification` | `users/{user}/affiliations/{affiliation}/emailVerifications/{email_verification}` |
| `Entitlement` | `entitlements/{entitlement}` |
| `EntitlementGrant` | `users/{user}/memberships/{membership}/entitlementGrants/{entitlement}` |

`{user}` 是 Better Auth 的用户 ID。`{membership}`、`{activity}`、`{organization}`、`{email_verification}` 和 `{entitlement}` 是 UUID。`{affiliation}` 是小写的组织类型，目前只有 `school`。会员本人调用 `boji.v1` 时，`{user}` 可以写成 `me`，也可以写成自己的用户 ID。资源名指向其他用户时，服务端在检查资源是否存在之前返回 `permission_denied` `RESOURCE_ACCESS_DENIED`。

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
| `boji.v1.OrganizationService` | `ListOrganizations` | 按类型、名称、域名或地区查找组织 |
| `boji.v1.OrganizationService` | `GetOrganization` | 读取一个组织 |
| `boji.v1.OrganizationService` | `ListOrganizationStandings` | 按名次分页列出一种类型的公开排名，或读取一个组织的排名 |
| `boji.v1.OrganizationService` | `GetOrganizationStanding` | 读取一个组织的排名 |
| `boji.v1.AffiliationService` | `GetAffiliation` | 读取本人一种类型的归属 |
| `boji.v1.AffiliationService` | `ListAffiliations` | 列出本人每种类型的归属 |
| `boji.v1.AffiliationService` | `CreateAffiliationEmailVerification` | 提交组织邮箱，发送验证码 |
| `boji.v1.AffiliationService` | `GetAffiliationEmailVerification` | 读取一次邮箱验证 |
| `boji.v1.AffiliationService` | `ConfirmAffiliationEmailVerification` | 提交验证码，建立、续期或更换归属 |
| `boji.v1.AffiliationService` | `LeaveOrganization` | 结束本人一种类型的归属 |

组织与归属的方法见[组织排名接口](#组织排名接口)，运营方法见[运营接口](#运营接口)。

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
| `ListOrganizations`、`ListOrganizationStandings` | 50 | 100 |
| 运营的 `ListMemberships`、`ListEntitlements`、`ListEntitlementGrants`、`ListAffiliations` | 50 | 100 |

本人的 `ListAffiliations` 每种类型返回一项，始终只有一页。它不接受 `pageToken`，`pageSize` 只检查是否为负数。

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

请求体和解码后的消息上限均为 64 KiB。服务端不做请求限流，由 CDN 和网关负责。唯一的例外是学校验证码的发送上限，见[邮箱验证码](#邮箱验证码)。

## 运营接口

`boji.admin.v1.EntitlementService` 和 `boji.admin.v1.MembershipService` 已接入会员卡与权益运营。`boji.admin.v1.OrganizationService` 已接入归属与排名运营，见[运营方法](#运营方法)。`m20261020_000004_admin` 迁移建立审计表。权限配置和运维边界见[运营说明](admin-operations.md)。

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
| `OrganizationService` | `GetAffiliation`、`ListAffiliations` | `organization.read` |
| `OrganizationService` | `RevokeAffiliation`、`FreezeOrganizationStanding`、`UnfreezeOrganizationStanding` | `organization.update` |

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

暂停不撤销授权、会话、已同步的活动记录或客户端本地数据。暂停后，会员本人仍能读取会员卡，但有效权益为空，Wallet 也拒绝签发新卡。已添加到钱包的会员卡会收到更新推送，变为已失效。恢复后，未撤销、已开始且未到期的授权重新生效，钱包中的会员卡也重新生效。恢复不会还原已撤销或已到期的授权。

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

卡面显示会员卡号、卡面昵称和入会日期。会员卡有到期时间时，卡面还显示有效期。卡片背面注明会员状态以 App 为准，并说明本卡不是付款或核销凭证。卡片不包含邮箱、用户 ID、会话令牌、条码或健康数据。卡面文案有中文和英文，钱包按设备语言显示。

卡片带有 `webServiceURL` 和 `authenticationToken`。钱包通过 `/wallet/v1/*` 的更新服务登记设备和取回新卡。这组接口是 Apple 规定的 HTTP 接口，不属于 ConnectRPC，详见 [README](../README.md) 的「通行证更新服务」。会员卡暂停后，更新服务返回已失效的卡片；恢复后返回有效的卡片。

### Wallet 错误

Wallet 错误使用与其他方法相同的 `ErrorInfo`。服务端完成会话和邮箱检查后，按下表顺序检查：

| Connect 错误码 | `reason` | 客户端处理 |
| --- | --- | --- |
| `not_found` | `MEMBERSHIP_NOT_FOUND` | 引导用户领卡 |
| `failed_precondition` | `MEMBERSHIP_SUSPENDED` | 刷新会员卡，不重试 |
| `failed_precondition` | `WALLET_NOT_CONFIGURED` | 隐藏入口，稍后重新读取 `ServerConfig`，不自动重试 |
| `unavailable` | `WALLET_SIGNING_FAILED` | 稍后可以重试 |

客户端收到其他 `reason` 时，按错误码处理。

## 组织排名接口

组织排名由两个服务组成。`boji.v1.OrganizationService` 公开组织名单和排名，不要求登录。`boji.v1.AffiliationService` 管理会员本人的归属，要求与其他本人方法相同的会话。计数规则、排序规则和隐私处理见[大学排名设计](../../docs/developers/school-ranking.mdx)。

本节用到 3 个术语：

- 组织（`Organization`）：会员可以用邮箱证明自己属于的单位，例如一所大学。
- 组织类型（`OrganizationType`）：组织的类别。目前只有 `SCHOOL`。每种类型有自己的名单、验证规则和排名，不同类型不混排。
- 归属（`Affiliation`）：一个用户与一种类型下一个组织的关系。每个用户每种类型最多有一个组织。

### 组织名单

`SCHOOL` 类型的名单来自 `data/schools/` 中的 Hipo 快照和本地修正，由 `import-schools` 命令写入数据库，见 `data/schools/README.md`。`Organization` 的主要字段如下：

- `type`：组织类型，例如 `SCHOOL`。
- `displayNames`：`google.type.LocalizedText` 列表。第一项是英文名，语言代码为 `en`。有中文名时，第二项的语言代码为 `zh-Hans`。客户端显示与用户语言匹配的一项，没有匹配项时显示英文名。
- `regionCode`：ISO 3166-1 alpha-2 代码，例如 `CN`。
- `emailDomains`：可用于验证的邮箱域名，例如 `xjtlu.edu.cn`。子域名的地址也匹配，例如 `student.xjtlu.edu.cn`。

`ListOrganizations` 只列出有效的组织，按英文名排序。`filter` 支持 AIP-160 的一个子集，下面每种条件最多一项，用 `AND` 连接：

- `type = SCHOOL`：按组织类型匹配。
- `region_code = "CN"`：按地区精确匹配。
- 一段文本：例如 `交通` 或 `"Jiao Tong"`，长度为 1～64 个字符。服务端在英文名、中文名和邮箱域名中做不区分大小写的子串匹配。含空格的文本必须加引号。

其他表达式返回 `INVALID_FILTER`。页令牌绑定 `filter`。

### 排名

`OrganizationStanding` 是每个组织的单例资源。`placement` 的取值如下：

| `placement` | 含义 | 计数字段 |
| --- | --- | --- |
| `RANKED` | 计入人数达到这种类型的公开门槛。`SCHOOL` 的门槛是 3 人 | `rank`、`memberCount`、`weeklyNewMemberCount` |
| `BELOW_THRESHOLD` | 有计入的会员，但不足门槛 | 不返回 |
| `NO_MEMBERS` | 没有计入的会员 | 不返回 |

计数字段只在 `RANKED` 时返回，所以响应不会泄露不足门槛的人数。名次只在同一类型内计算。每个响应还带有 `weekStartTime`（北京时间本周一 0:00）、`computeTime`、`organizationDisplayNames`、`organizationRegionCode` 和 `organizationType`，所以排名页不需要再逐个调用 `GetOrganization`。

运营人员冻结一个组织后，`frozen` 为 `true`，排名使用冻结时保存的人数和名次依据，直到解冻。排名页应把这个组织标为「审核中」。冻结时不足门槛的组织仍不返回计数字段。

服务端在读取时按类型计算排名，并在进程内缓存 60 秒。新的一周开始时，或运营人员撤销归属、冻结或解冻组织后，缓存立即失效。`ListOrganizationStandings` 的 `parent` 有两种形式：

- `organizations/-`：按名次列出一种类型中 `RANKED` 的组织。`filter` 必须是 `type = SCHOOL`，缺少类型时返回 `INVALID_FILTER`。页令牌绑定类型和 `computeTime`。缓存更新后，旧页令牌返回 `INVALID_PAGE_TOKEN`，客户端从第一页重新读取。
- `organizations/{organization}`：返回这个组织的一条排名，`placement` 可以是任意值。这种形式不分页，`filter` 必须为空。携带 `pageToken` 时返回 `INVALID_PAGE_TOKEN`。

`GetOrganizationStanding` 读取任意一个组织的排名，例如 `{"name":"organizations/<id>/standing"}`。

### 邮箱验证码

验证分两步。第一步提交组织邮箱。`parent` 是本人这种类型的归属：

```json
{
  "parent": "users/me/affiliations/school",
  "affiliationEmailVerification": {"email": "alice@student.xjtlu.edu.cn"}
}
```

服务端在这种类型的组织中按最长域名后缀找到候选组织，向这个地址发送 6 位验证码，然后返回 `AffiliationEmailVerification`。响应不包含 `email`，只包含 `maskedEmail`（例如 `a***@student.xjtlu.edu.cn`）、`candidateOrganizations`、`expireTime` 和 `resendTime`。服务端只保存地址的 HMAC，不保存原文。邮件发送失败时，服务端删除这次记录并返回 `unavailable` `BACKEND_UNAVAILABLE`，这次失败不计入发送上限。

第二步提交验证码：

```json
{"name": "users/me/affiliations/school/emailVerifications/<id>", "code": "123456"}
```

`candidateOrganizations` 多于一个时，请求还必须用 `organization` 选择其中一个。缺少 `organization`，或者 `organization` 不在候选组织中，服务端返回 `INVALID_INPUT`，`fieldViolations` 指向 `organization`。成功后，响应的 `affiliation` 是验证后的状态。同一个地址在同一类型下的有效归属属于另一个账号时，那个归属立即结束。

`SCHOOL` 类型的验证码参数如下：

| 参数 | 值 |
| --- | --- |
| 有效期 | 10 分钟 |
| 错误次数上限 | 5 次，超过后验证码作废 |
| 同一账号的重发间隔 | 60 秒 |
| 同一账号的发送上限 | 每 24 小时 5 次 |
| 同一地址的发送上限 | 每小时 3 次，所有账号合计 |

超过上限时，服务端返回 `resource_exhausted` `RATE_LIMITED`，并附带 `google.rpc.RetryInfo`。`retryDelay` 向上取整到秒，至少为 1 秒。验证码记录保存 24 小时，之后在下一次发送时删除。

### 归属

每个用户每种类型都有一个 `Affiliation`，资源 ID 是小写的类型，例如 `users/me/affiliations/school`。`{affiliation}` 不是已知类型时，服务端返回 `INVALID_INPUT`。`ListAffiliations` 按 `OrganizationType` 的顺序返回每种类型的一项。

`state` 为 `UNAFFILIATED`、`ACTIVE` 或 `EXPIRED`。`organizationType` 是这个归属的类型。`counted` 表示本人当前是否计入组织人数：归属有效、会员卡为 `ACTIVE` 且账号未被封禁时才为 `true`。会员卡暂停后，`state` 仍为 `ACTIVE`，`counted` 为 `false`。

`SCHOOL` 归属的有效期为 365 天。用本校的任一邮箱重新验证会续期，`countStartTime` 不变。更换学校必须距离上次更换至少 30 天，`organizationChangeAvailableTime` 给出最早时间。`LeaveOrganization` 立即结束归属。

### 运营方法

`boji.admin.v1.OrganizationService` 使用[访问控制](#访问控制)中的规则。它与本人接口共用 `Affiliation` 和 `OrganizationStanding` 资源。组织名单没有运营方法，只能通过 `data/schools/` 中的文件和 `import-schools` 命令修改。

| 方法 | 作用 |
| --- | --- |
| `GetAffiliation` | 读取任意用户一种类型的归属，例如 `users/<用户 ID>/affiliations/school`。`{user}` 不能写成 `-` |
| `ListAffiliations` | 列出 `ACTIVE` 和 `EXPIRED` 的归属，按最近一次验证时间降序排列。`parent` 为 `users/-` 时列出全部用户 |
| `RevokeAffiliation` | 立即结束一个有效归属。这个地址之后可以验证其他账号，本人也可以再次验证 |
| `FreezeOrganizationStanding` | 保存组织当前的人数、本周新增人数和名次依据。解冻前，排名使用保存的值 |
| `UnfreezeOrganizationStanding` | 删除冻结，排名重新使用当前人数 |

`ListAffiliations` 的 `filter` 只支持一个等值比较，例如 `organization = "organizations/<id>"`。其他表达式返回 `INVALID_FILTER`。页令牌绑定 `parent` 和 `filter`。冻结期间保存的本周新增人数不会在新的一周清零。

3 个变更方法都要求 `reason`，规则与会员卡运营的 `reason` 相同。每次变更在同一个事务中写入一条审计事件，动作如下。审计事件不保存邮箱地址或它的 HMAC。

| 方法 | 审计动作 |
| --- | --- |
| `RevokeAffiliation` | `organization.affiliation.revoked` |
| `FreezeOrganizationStanding` | `organization.standing.frozen` |
| `UnfreezeOrganizationStanding` | `organization.standing.unfrozen` |

重复撤销、重复冻结或解冻未冻结的组织时，服务端返回 `failed_precondition`，不改变数据，也不写审计事件。

### 组织排名错误

| Connect 错误码 | `reason` | 客户端处理 |
| --- | --- | --- |
| `failed_precondition` | `AFFILIATION_VERIFICATION_NOT_CONFIGURED` | 隐藏验证入口，不重试 |
| `failed_precondition` | `MEMBERSHIP_REQUIRED` | 引导用户领卡 |
| `failed_precondition` | `MEMBERSHIP_SUSPENDED` | 刷新会员卡，不重试 |
| `invalid_argument` | `AFFILIATION_EMAIL_DOMAIN_UNKNOWN` | 显示「你的学校暂未收录」 |
| `invalid_argument` | `AFFILIATION_VERIFICATION_CODE_INVALID` | 让用户重新输入验证码 |
| `failed_precondition` | `AFFILIATION_VERIFICATION_EXPIRED` | 让用户重新获取验证码 |
| `failed_precondition` | `ORGANIZATION_CHANGE_TOO_SOON` | 显示 `organizationChangeAvailableTime` |
| `failed_precondition` | `AFFILIATION_INACTIVE` | 刷新归属 |
| `not_found` | `ORGANIZATION_NOT_FOUND`、`AFFILIATION_EMAIL_VERIFICATION_NOT_FOUND` | 刷新页面 |
| `resource_exhausted` | `RATE_LIMITED` | 等待 `RetryInfo.retryDelay` 后再发送 |
| `failed_precondition` | `ORGANIZATION_STANDING_ALREADY_FROZEN`、`ORGANIZATION_STANDING_NOT_FROZEN` | 仅运营方法返回。刷新排名状态 |
