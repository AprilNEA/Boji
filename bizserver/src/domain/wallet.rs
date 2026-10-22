//! Device registrations of the Apple Wallet web service.
//!
//! A `wallet_pass` row records when the content of a membership pass last
//! changed. The row appears when the first device registers the pass. Code that
//! changes a value on the pass calls [`touch`] in the same transaction, and then
//! sends a notification with `wallet::push::PassUpdates`.
//!
//! The upserts need PostgreSQL `ON CONFLICT ... RETURNING`, so this module uses
//! SQL statements instead of entities.

use chrono::{DateTime, Utc};
use sea_orm::{
    ConnectionTrait, DatabaseConnection, DbBackend, DbErr, EntityTrait, Statement,
    TransactionTrait, Value,
};
use uuid::Uuid;

use crate::entities::membership;

/// The most devices that receive updates for one pass. A new registration
/// beyond this number removes the registration that changed least recently.
pub const MAX_DEVICES_PER_PASS: i64 = 10;

/// A membership with the time its pass last changed.
pub struct PassContent {
    /// The membership that the pass shows.
    pub membership: membership::Model,
    /// When the pass last changed, if a device registered it.
    pub update_time: Option<DateTime<Utc>>,
}

/// The result of a registration request.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Registration {
    /// The device registered the pass for the first time.
    Created,
    /// The device had registered the pass. The push token may have changed.
    Updated,
}

/// The passes of a device that changed after a tag.
#[derive(Debug, PartialEq, Eq)]
pub struct UpdatedPasses {
    /// The membership IDs, which are the serial numbers of the passes.
    pub serial_numbers: Vec<Uuid>,
    /// The latest change time among them. It becomes the next update tag.
    pub last_updated: DateTime<Utc>,
}

fn statement(sql: &str, values: impl IntoIterator<Item = Value>) -> Statement {
    Statement::from_sql_and_values(DbBackend::Postgres, sql, values)
}

/// Record that the pass of `membership_id` changed. A pass that no device
/// registered has no row, and the call changes nothing.
///
/// The update time always increases, even when the clock does not.
pub async fn touch<C: ConnectionTrait>(db: &C, membership_id: Uuid) -> Result<(), DbErr> {
    db.execute_raw(statement(
        "UPDATE wallet_pass \
         SET update_time = GREATEST(clock_timestamp(), update_time + interval '1 microsecond') \
         WHERE membership_id = $1",
        [membership_id.into()],
    ))
    .await?;
    Ok(())
}

/// Read the membership of a pass and the time the pass last changed.
pub async fn find_pass<C: ConnectionTrait>(
    db: &C,
    membership_id: Uuid,
) -> Result<Option<PassContent>, DbErr> {
    let Some(membership) = membership::Entity::find_by_id(membership_id)
        .one(db)
        .await?
    else {
        return Ok(None);
    };
    let row = db
        .query_one_raw(statement(
            "SELECT update_time FROM wallet_pass WHERE membership_id = $1",
            [membership_id.into()],
        ))
        .await?;
    let update_time = row
        .map(|row| row.try_get::<DateTime<Utc>>("", "update_time"))
        .transpose()?;
    Ok(Some(PassContent {
        membership,
        update_time,
    }))
}

/// Register `device` for updates of the pass of `membership_id`, or replace
/// its push token.
pub async fn register(
    db: &DatabaseConnection,
    device: &str,
    membership_id: Uuid,
    push_token: &str,
) -> Result<Registration, DbErr> {
    let transaction = db.begin().await?;
    transaction
        .execute_raw(statement(
            "INSERT INTO wallet_pass (membership_id, update_time) \
             VALUES ($1, clock_timestamp()) \
             ON CONFLICT (membership_id) DO NOTHING",
            [membership_id.into()],
        ))
        .await?;
    let row = transaction
        .query_one_raw(statement(
            "INSERT INTO wallet_registration \
               (device_library_identifier, membership_id, push_token, create_time, update_time) \
             VALUES ($1, $2, $3, clock_timestamp(), clock_timestamp()) \
             ON CONFLICT (device_library_identifier, membership_id) DO UPDATE \
             SET push_token = EXCLUDED.push_token, update_time = EXCLUDED.update_time \
             RETURNING (xmax = 0) AS created",
            [device.into(), membership_id.into(), push_token.into()],
        ))
        .await?
        .ok_or_else(|| DbErr::Custom("registration upsert returned no row".to_owned()))?;
    let created = row.try_get::<bool>("", "created")?;
    transaction
        .execute_raw(statement(
            "DELETE FROM wallet_registration \
             WHERE membership_id = $1 AND device_library_identifier NOT IN ( \
               SELECT device_library_identifier FROM wallet_registration \
               WHERE membership_id = $1 \
               ORDER BY update_time DESC, device_library_identifier \
               LIMIT $2)",
            [membership_id.into(), MAX_DEVICES_PER_PASS.into()],
        ))
        .await?;
    transaction.commit().await?;
    Ok(if created {
        Registration::Created
    } else {
        Registration::Updated
    })
}

/// Remove the registration of `device` for the pass of `membership_id`.
/// Returns whether a registration existed.
pub async fn unregister<C: ConnectionTrait>(
    db: &C,
    device: &str,
    membership_id: Uuid,
) -> Result<bool, DbErr> {
    let result = db
        .execute_raw(statement(
            "DELETE FROM wallet_registration \
             WHERE device_library_identifier = $1 AND membership_id = $2",
            [device.into(), membership_id.into()],
        ))
        .await?;
    Ok(result.rows_affected() > 0)
}

/// The passes that `device` registered and that changed after `since`, or all
/// of them without `since`. `None` means that no pass changed.
pub async fn updated_passes<C: ConnectionTrait>(
    db: &C,
    device: &str,
    since: Option<DateTime<Utc>>,
) -> Result<Option<UpdatedPasses>, DbErr> {
    let select = "SELECT p.membership_id, p.update_time \
                  FROM wallet_registration r \
                  JOIN wallet_pass p ON p.membership_id = r.membership_id \
                  WHERE r.device_library_identifier = $1";
    let query = match since {
        Some(since) => statement(
            &format!("{select} AND p.update_time > $2 ORDER BY p.membership_id"),
            [device.into(), since.into()],
        ),
        None => statement(
            &format!("{select} ORDER BY p.membership_id"),
            [device.into()],
        ),
    };
    let rows = db.query_all_raw(query).await?;
    let mut serial_numbers = Vec::with_capacity(rows.len());
    let mut last_updated: Option<DateTime<Utc>> = None;
    for row in rows {
        serial_numbers.push(row.try_get::<Uuid>("", "membership_id")?);
        let update_time = row.try_get::<DateTime<Utc>>("", "update_time")?;
        last_updated = Some(last_updated.map_or(update_time, |last| last.max(update_time)));
    }
    Ok(last_updated.map(|last_updated| UpdatedPasses {
        serial_numbers,
        last_updated,
    }))
}

/// The distinct push tokens of the devices that registered the pass.
pub async fn push_tokens<C: ConnectionTrait>(
    db: &C,
    membership_id: Uuid,
) -> Result<Vec<String>, DbErr> {
    let rows = db
        .query_all_raw(statement(
            "SELECT DISTINCT push_token FROM wallet_registration \
             WHERE membership_id = $1 ORDER BY push_token",
            [membership_id.into()],
        ))
        .await?;
    rows.iter()
        .map(|row| row.try_get::<String>("", "push_token"))
        .collect()
}

/// Remove every registration with `push_token`, after APNs reported that the
/// token is no longer valid. Returns the number of removed registrations.
pub async fn forget_push_token<C: ConnectionTrait>(db: &C, push_token: &str) -> Result<u64, DbErr> {
    let result = db
        .execute_raw(statement(
            "DELETE FROM wallet_registration WHERE push_token = $1",
            [push_token.into()],
        ))
        .await?;
    Ok(result.rows_affected())
}
