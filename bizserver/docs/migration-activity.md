# 活动同步域迁移接口

本模块位于 `src/domain/activity.rs`。它不提供 HTTP 或 RPC 路由。
调用方必须先完成认证，并将认证得到的 `user_id` 传入函数。

## 公开类型

| 类型 | 作用 |
| --- | --- |
| `BatchInput` | 请求体。`operations` 必须有 1 到 50 条。 |
| `Operation` | `upsert` 或 `delete` 变更。 |
| `MutationResult` | 单条操作的回执，包含修订号、序列号和冲突原因。 |
| `SyncState` | 同步开关、同意版本和同意时间。 |
| `Changes` | 游标拉取结果。包含 `records`、`nextCursor` 和 `hasMore`。 |
| `Days` | 日期范围内的每日汇总。 |
| `ActivityError` | 类型化领域错误。调用方应按错误类型映射传输层状态。 |

`source` 只接受 `manual`、`app` 和 `import`。模块拒绝 `healthkit`。
`kind` 只接受 `hydration`、`sleep` 和 `workout`。

这些类型的 serde 形状是内部格式，不是对外协议。对外协议见 [activity_service.proto](../proto/boji/v1/activity_service.proto)，字段对应关系见[传输层映射](#传输层映射)。`Operation` 的 JSON 序列化结果用于计算幂等哈希。`MutationResult` 以 JSON 形式存入回执表。上线后修改这两个类型的 serde 属性，会导致已存回执无法匹配重试请求或无法读取。

## 公开函数

```rust
pub async fn get_sync(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<SyncState, ActivityError>;

pub async fn set_sync(
    db: &DatabaseConnection,
    user_id: &str,
    enabled: bool,
    consent_version: Option<&str>,
) -> Result<SyncState, ActivityError>;

pub async fn apply_batch(
    db: &DatabaseConnection,
    user_id: &str,
    operations: Vec<Operation>,
) -> Result<BatchResult, ActivityError>;

pub async fn get_changes(
    db: &DatabaseConnection,
    user_id: &str,
    cursor: &str,
    limit: u64,
) -> Result<Changes, ActivityError>;

pub async fn get_activity(
    db: &DatabaseConnection,
    user_id: &str,
    id: Uuid,
) -> Result<Option<ActivityRecord>, ActivityError>;

pub async fn get_days(
    db: &DatabaseConnection,
    user_id: &str,
    from: &str,
    to: &str,
) -> Result<Days, ActivityError>;
```

## 同意与写入

调用 `set_sync(..., true, Some("activity-sync-v1"))` 才能开启同步。
其他同意版本会返回 `ActivityError::ConsentRequired`。
读取和写入都要求同步已开启。保存的授权版本必须仍为 `activity-sync-v1`。

每条操作使用 `mutationId` 作为幂等键。
相同键和相同内容会返回原回执。
相同键和不同内容会返回 `MUTATION_REUSED`。

删除会保留事件 tombstone，并删除健康载荷。
所有批量写入、序列分配和每日汇总都在一个事务内完成。
每个用户的同步状态行在写入时使用行锁。

## 游标规则

游标是每个用户独立的十进制序列号。
`get_changes` 的 `nextCursor` 是唯一可用于下一次拉取的游标。
`apply_batch` 的 `serverCursor` 是提交后的服务器位置。
客户端**不得**把 `serverCursor` 当作拉取的 `nextCursor`。

## 日期汇总

`get_days` 接受 `YYYY-MM-DD` 的闭区间。
范围最多包含 93 个日历日。
响应会填充范围内没有记录的日期。

每日汇总包含饮水总量、睡眠分钟数、完成训练数量和完成训练秒数。
睡眠按用户本地日期唯一。训练与饮水按用户本地日期聚合。

## 传输层映射

`src/rpc/activity.rs` 和 `src/rpc/conversion.rs` 把领域类型转换为 `boji.v1.ActivityService` 的消息。领域层不知道资源名、etag 和页令牌。

| 领域层 | RPC |
| --- | --- |
| 记录 `id` | `Activity.name` 的最后一段 |
| `mutationId` | `ActivityWrite.requestId` |
| `expectedRevision` | `etag`。etag 是带引号的修订号，例如 `"3"`。缺少 etag 表示修订号 0，只能创建新记录 |
| `deletedAt` | `Activity.deleteTime` |
| `get_changes` 的 `nextCursor` | `ListActivities` 和 `SyncActivities` 的令牌 |
| 冲突原因 | `ActivityWriteResult.status` 中 `ErrorInfo` 的 `reason`，例如 `MUTATION_REUSED` 对应 `REQUEST_ID_REUSED` |

RPC 层不直接暴露游标。令牌是编码后的结构，记录令牌用途、用户 ID 和游标。用途和用户不匹配的令牌返回 `INVALID_PAGE_TOKEN` 或 `INVALID_SYNC_TOKEN`。RPC 响应不包含 `serverCursor`。

## 接线状态

活动实体已从 `src/entities.rs` 导出。版本化迁移在认证表之后创建活动表。业务 RPC 已调用本模块的公开函数。

读取使用只读 Repeatable Read 事务。同一响应中的游标、记录和载荷取自同一快照。关闭同步后，读取与写入都会拒绝继续执行。
