# 活动同步域迁移接口

本模块位于 `src/domain/activity.rs`。它不提供 HTTP 或 RPC 路由。
调用方必须先完成认证，并将认证得到的 `user_id` 传入函数。

## 公开类型

| 类型 | 作用 |
| --- | --- |
| `BatchInput` | 请求体。`operations` 必须有 1 到 50 条。 |
| `Operation` | `upsert` 或 `delete` 变更。它保留旧版的 `op`、`kind`、`source` 和 `payload` JSON 形状。 |
| `MutationResult` | 单条操作的回执。它保留旧字段 `mutationId`、`id`、`status`、`revision`、`sequence`、`code` 和 `currentRevision`。 |
| `SyncState` | 同步开关、同意版本和同意时间。 |
| `Changes` | 游标拉取结果。包含 `records`、`nextCursor` 和 `hasMore`。 |
| `Days` | 日期范围内的每日汇总。 |
| `ActivityError` | 类型化领域错误。调用方应按错误类型映射传输层状态。 |

`source` 只接受 `manual`、`app` 和 `import`。模块拒绝 `healthkit`。
`kind` 只接受 `hydration`、`sleep` 和 `workout`。

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

## 接线状态

活动实体已从 `src/entities.rs` 导出。版本化迁移在认证表之后创建活动表。业务 RPC 已调用本模块的公开函数。

读取使用只读 Repeatable Read 事务。同一响应中的游标、记录和载荷取自同一快照。关闭同步后，读取与写入都会拒绝继续执行。
