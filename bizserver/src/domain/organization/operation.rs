//! Operations methods for affiliations and the ranking.
//!
//! Input: an authorized operator, a normalized reason and the database.
//! Output: affiliations, ranking freezes and audit events.
//! Pos: domain. The transport authorizes the operator and validates the
//! reason before it calls this module. Each change writes one
//! `admin_audit_event` row in its transaction.

use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ConnectionTrait, DatabaseConnection, DatabaseTransaction, DbBackend,
    EntityTrait, FromQueryResult, QueryFilter, Set, Statement, TransactionTrait,
};
use serde_json::{Value, json};
use uuid::Uuid;

use super::affiliation::{Action, Affiliation, end, find_record, record_event};
use super::standing::count_organization;
use super::{COUNTED_CONDITION, OrganizationError, OrganizationType, try_lock_user};
use crate::entities::{admin_audit_event, affiliation, organization_standing_freeze};
use sea_orm::ColumnTrait;

/// A page request for affiliations in the `ACTIVE` or `EXPIRED` state.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AffiliationQuery {
    /// Only this user, or every user when `None`.
    pub user_id: Option<String>,
    /// Only this organization, or every organization when `None`.
    pub organization_id: Option<Uuid>,
    /// The last row of the previous page. `None` for the first page.
    pub after: Option<ListingPosition>,
    /// The maximum number of rows on the page.
    pub limit: u64,
}

/// The position of one row in the order of [`list_affiliations`].
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListingPosition {
    /// The last successful code check of the row.
    pub verified_at: DateTime<Utc>,
    /// The user of the row.
    pub user_id: String,
    /// The organization type of the row.
    pub organization_type: OrganizationType,
}

/// One page of affiliations, newest verification first.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AffiliationListing {
    /// The affiliations on the page.
    pub affiliations: Vec<Affiliation>,
    /// The position of the last row, when another page exists.
    pub next: Option<ListingPosition>,
}

/// The columns of one listed verification and its counted flag.
#[derive(Debug, FromQueryResult)]
struct ListedRow {
    user_id: String,
    organization_type: String,
    organization_id: Uuid,
    state: String,
    email_domain: String,
    verified_at: DateTime<Utc>,
    counted_since: DateTime<Utc>,
    organization_since: DateTime<Utc>,
    expires_at: DateTime<Utc>,
    counted: bool,
}

/// List affiliations that are not ended, newest verification first.
///
/// The order is `verified_at`, `user_id` and `organization_type`, all
/// descending. The three values identify one row, so a page can start after
/// any row.
pub async fn list_affiliations<C: ConnectionTrait>(
    db: &C,
    query: &AffiliationQuery,
    now: DateTime<Utc>,
) -> Result<AffiliationListing, OrganizationError> {
    // A missing card leaves the `m` columns null, so the condition is null and
    // the member does not count.
    let sql = format!(
        "SELECT a.user_id, a.organization_type, a.organization_id, a.state, a.email_domain,
                a.verified_at,
                a.counted_since, a.organization_since, a.expires_at,
                COALESCE(({COUNTED_CONDITION}), false) AS counted
         FROM affiliation AS a
         LEFT JOIN membership AS m ON m.user_id = a.user_id
         JOIN \"user\" AS u ON u.id = a.user_id
         WHERE a.state = 'active'
           AND ($2::text IS NULL OR a.user_id = $2)
           AND ($3::uuid IS NULL OR a.organization_id = $3)
           AND ($4::timestamptz IS NULL
                OR (a.verified_at, a.user_id, a.organization_type)
                   < ($4::timestamptz, $5::text, $7::text))
         ORDER BY a.verified_at DESC, a.user_id DESC, a.organization_type DESC
         LIMIT $6"
    );
    let after = query.after.as_ref();
    let after_time = after.map(|position| position.verified_at);
    let after_user = after.map(|position| position.user_id.clone());
    let after_type = after.map(|position| position.organization_type.as_str());
    let fetch = i64::try_from(query.limit.saturating_add(1)).unwrap_or(i64::MAX);
    let mut rows = ListedRow::find_by_statement(Statement::from_sql_and_values(
        DbBackend::Postgres,
        sql,
        [
            now.into(),
            query.user_id.clone().into(),
            query.organization_id.into(),
            after_time.into(),
            after_user.into(),
            fetch.into(),
            after_type.into(),
        ],
    ))
    .all(db)
    .await?;

    let limit = usize::try_from(query.limit).unwrap_or(usize::MAX);
    let more = rows.len() > limit;
    rows.truncate(limit);
    let affiliations = rows
        .into_iter()
        .map(|row| listed_affiliation(row, now))
        .collect::<Result<Vec<_>, _>>()?;
    let next = affiliations
        .last()
        .filter(|_| more)
        .map(|last| -> Result<ListingPosition, OrganizationError> {
            Ok(ListingPosition {
                verified_at: last
                    .verified_at
                    .ok_or(OrganizationError::Corrupt("listed affiliation has no time"))?,
                user_id: last.user_id.clone(),
                organization_type: last.organization_type,
            })
        })
        .transpose()?;
    Ok(AffiliationListing { affiliations, next })
}

fn listed_affiliation(
    row: ListedRow,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    // The resource never contains the address hash or the end time, so the
    // query does not read them.
    let kind = OrganizationType::parse(&row.organization_type)
        .ok_or(OrganizationError::Corrupt("unknown organization type"))?;
    let record = affiliation::Model {
        user_id: row.user_id,
        organization_type: row.organization_type,
        organization_id: row.organization_id,
        state: row.state,
        email_hmac: None,
        email_domain: row.email_domain,
        verified_at: row.verified_at,
        counted_since: row.counted_since,
        organization_since: row.organization_since,
        expires_at: row.expires_at,
        ended_at: None,
    };
    Affiliation::from_record(&record.user_id, kind, Some(&record), row.counted, now)
}

/// End one active affiliation of a user for an operator.
///
/// An expired affiliation can end too. The address hash is removed, so the
/// address can verify another account. A user who does not exist has no
/// affiliation.
pub async fn revoke_affiliation(
    db: &DatabaseConnection,
    actor_user_id: &str,
    user_id: &str,
    kind: OrganizationType,
    reason: &str,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    let transaction = db.begin().await?;
    let result = async {
        if !try_lock_user(&transaction, user_id).await? {
            return Err(OrganizationError::AffiliationInactive);
        }
        let record = find_record(&transaction, user_id, kind)
            .await?
            .filter(|record| record.state == "active")
            .ok_or(OrganizationError::AffiliationInactive)?;
        let organization_id = record.organization_id;
        let record = end(&transaction, record, now).await?;
        record_event(&transaction, user_id, organization_id, Action::Revoked, now).await?;
        audit(
            &transaction,
            AuditEntry {
                actor_user_id,
                target_user_id: Some(user_id),
                action: "organization.affiliation.revoked",
                reason,
                metadata: json!({
                    "organizationId": organization_id.to_string(),
                    "organizationType": kind.as_str(),
                }),
                created_at: now,
            },
        )
        .await?;
        Affiliation::from_record(user_id, kind, Some(&record), false, now)
    }
    .await;
    finish(transaction, result).await
}

/// Store the current counts of an organization and use them in the ranking.
pub async fn freeze_standing(
    db: &DatabaseConnection,
    actor_user_id: &str,
    organization_id: Uuid,
    reason: &str,
    now: DateTime<Utc>,
) -> Result<(), OrganizationError> {
    let transaction = db.begin().await?;
    let result = async {
        lock_organization(&transaction, organization_id).await?;
        let existing = organization_standing_freeze::Entity::find_by_id(organization_id)
            .one(&transaction)
            .await?;
        if existing.is_some() {
            return Err(OrganizationError::StandingAlreadyFrozen);
        }
        let count = count_organization(&transaction, organization_id, now).await?;
        organization_standing_freeze::ActiveModel {
            organization_id: Set(organization_id),
            member_count: Set(count.member_count),
            weekly_new_count: Set(count.weekly_new_count),
            reach_time: Set(count.reach_time),
            actor_user_id: Set(Some(actor_user_id.to_owned())),
            created_at: Set(now),
        }
        .insert(&transaction)
        .await?;
        audit(
            &transaction,
            AuditEntry {
                actor_user_id,
                target_user_id: None,
                action: "organization.standing.frozen",
                reason,
                metadata: json!({
                    "organizationId": organization_id.to_string(),
                    "memberCount": count.member_count,
                    "weeklyNewMemberCount": count.weekly_new_count,
                }),
                created_at: now,
            },
        )
        .await
    }
    .await;
    finish(transaction, result).await
}

/// Remove the freeze of an organization.
pub async fn unfreeze_standing(
    db: &DatabaseConnection,
    actor_user_id: &str,
    organization_id: Uuid,
    reason: &str,
    now: DateTime<Utc>,
) -> Result<(), OrganizationError> {
    let transaction = db.begin().await?;
    let result = async {
        lock_organization(&transaction, organization_id).await?;
        let deleted = organization_standing_freeze::Entity::delete_many()
            .filter(organization_standing_freeze::Column::OrganizationId.eq(organization_id))
            .exec(&transaction)
            .await?;
        if deleted.rows_affected == 0 {
            return Err(OrganizationError::StandingNotFrozen);
        }
        audit(
            &transaction,
            AuditEntry {
                actor_user_id,
                target_user_id: None,
                action: "organization.standing.unfrozen",
                reason,
                metadata: json!({ "organizationId": organization_id.to_string() }),
                created_at: now,
            },
        )
        .await
    }
    .await;
    finish(transaction, result).await
}

/// Lock the row of an organization, so that freezes of one organization run one at a time.
async fn lock_organization(
    transaction: &DatabaseTransaction,
    organization_id: Uuid,
) -> Result<(), OrganizationError> {
    let statement = Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT id FROM organization WHERE id = $1 FOR UPDATE",
        [organization_id.into()],
    );
    if transaction.query_one_raw(statement).await?.is_none() {
        return Err(OrganizationError::OrganizationNotFound);
    }
    Ok(())
}

/// One `admin_audit_event` row.
struct AuditEntry<'a> {
    actor_user_id: &'a str,
    /// The affected user. `None` for a change of an organization.
    target_user_id: Option<&'a str>,
    action: &'static str,
    reason: &'a str,
    /// The affected IDs. Never an email address or its hash.
    metadata: Value,
    created_at: DateTime<Utc>,
}

async fn audit(
    transaction: &DatabaseTransaction,
    entry: AuditEntry<'_>,
) -> Result<(), OrganizationError> {
    admin_audit_event::ActiveModel {
        id: Set(Uuid::new_v4()),
        actor_user_id: Set(Some(entry.actor_user_id.to_owned())),
        target_user_id: Set(entry.target_user_id.map(str::to_owned)),
        action: Set(entry.action.to_owned()),
        reason: Set(entry.reason.to_owned()),
        metadata: Set(entry.metadata),
        created_at: Set(entry.created_at),
    }
    .insert(transaction)
    .await?;
    Ok(())
}

/// Commit on success and roll back on failure.
async fn finish<T>(
    transaction: DatabaseTransaction,
    result: Result<T, OrganizationError>,
) -> Result<T, OrganizationError> {
    match result {
        Ok(value) => {
            transaction.commit().await?;
            Ok(value)
        }
        Err(error) => {
            transaction.rollback().await?;
            Err(error)
        }
    }
}
