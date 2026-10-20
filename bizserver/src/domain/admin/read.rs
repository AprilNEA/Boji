use chrono::{DateTime, Utc};
use sea_orm::{
    AccessMode, ColumnTrait, Condition, DatabaseConnection, DbErr, EntityTrait, IsolationLevel,
    QueryFilter, QueryOrder, QuerySelect, TransactionTrait,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use uuid::Uuid;

use crate::entities::{entitlement, membership, membership_entitlement};

use super::types::{page_limit, parse_uuid, status_filter, validate_text};
use super::{
    AdminError, CatalogPage, GrantRecord, ListEntitlements, ListMemberships, LookupKey,
    MembershipDetail, MembershipPage,
};

const CURSOR_VERSION: u8 = 1;
const MEMBERSHIP_CURSOR_METHOD: &str = "memberships";
const ENTITLEMENT_CURSOR_METHOD: &str = "entitlements";
/// The domain field name of a page cursor.
const CURSOR: &str = "cursor";

#[derive(Debug, Deserialize, Serialize)]
struct MembershipCursor {
    version: u8,
    method: String,
    status: Option<String>,
    joined_at: DateTime<Utc>,
    id: Uuid,
}

#[derive(Debug, Deserialize, Serialize)]
struct EntitlementCursor {
    version: u8,
    method: String,
    code: String,
    id: Uuid,
}

/// List membership cards by `joined_at DESC, id DESC` with a filter-bound cursor.
pub async fn list_memberships(
    db: &DatabaseConnection,
    input: &ListMemberships,
) -> Result<MembershipPage, AdminError> {
    let limit = page_limit(input.limit)?;
    let status = status_filter(input.status.as_deref())?;
    let cursor = membership_cursor(&input.cursor, status)?;
    let transaction = db
        .begin_with_config(
            Some(IsolationLevel::RepeatableRead),
            Some(AccessMode::ReadOnly),
        )
        .await?;
    let query = membership::Entity::find();
    let query = match status {
        Some(status) => query.filter(membership::Column::Status.eq(status)),
        None => query,
    };
    let query = match cursor.as_ref() {
        Some(cursor) => query.filter(
            Condition::any()
                .add(membership::Column::JoinedAt.lt(cursor.joined_at))
                .add(
                    Condition::all()
                        .add(membership::Column::JoinedAt.eq(cursor.joined_at))
                        .add(membership::Column::Id.lt(cursor.id)),
                ),
        ),
        None => query,
    };
    let mut records = query
        .order_by_desc(membership::Column::JoinedAt)
        .order_by_desc(membership::Column::Id)
        .limit(limit + 1)
        .all(&transaction)
        .await?;
    let has_more = records.len() > limit as usize;
    if has_more {
        records.pop();
    }
    let next_cursor = match (has_more, records.last()) {
        (true, Some(record)) => encode_cursor(&MembershipCursor {
            version: CURSOR_VERSION,
            method: MEMBERSHIP_CURSOR_METHOD.to_owned(),
            status: status.map(str::to_owned),
            joined_at: record.joined_at,
            id: record.id,
        })?,
        (false, _) => String::new(),
        (true, None) => return Err(storage_error("membership page had no final record")),
    };
    transaction.commit().await?;
    Ok(MembershipPage {
        records,
        next_cursor,
        has_more,
    })
}

/// List catalog definitions by `code ASC, id ASC` with a method-bound cursor.
pub async fn list_entitlements(
    db: &DatabaseConnection,
    input: &ListEntitlements,
) -> Result<CatalogPage, AdminError> {
    let limit = page_limit(input.limit)?;
    let cursor = entitlement_cursor(&input.cursor)?;
    let transaction = db
        .begin_with_config(
            Some(IsolationLevel::RepeatableRead),
            Some(AccessMode::ReadOnly),
        )
        .await?;
    let query = entitlement::Entity::find();
    let query = match cursor.as_ref() {
        Some(cursor) => query.filter(
            Condition::any()
                .add(entitlement::Column::Code.gt(cursor.code.clone()))
                .add(
                    Condition::all()
                        .add(entitlement::Column::Code.eq(cursor.code.clone()))
                        .add(entitlement::Column::Id.gt(cursor.id)),
                ),
        ),
        None => query,
    };
    let mut records = query
        .order_by_asc(entitlement::Column::Code)
        .order_by_asc(entitlement::Column::Id)
        .limit(limit + 1)
        .all(&transaction)
        .await?;
    let has_more = records.len() > limit as usize;
    if has_more {
        records.pop();
    }
    let next_cursor = match (has_more, records.last()) {
        (true, Some(record)) => encode_cursor(&EntitlementCursor {
            version: CURSOR_VERSION,
            method: ENTITLEMENT_CURSOR_METHOD.to_owned(),
            code: record.code.clone(),
            id: record.id,
        })?,
        (false, _) => String::new(),
        (true, None) => return Err(storage_error("catalog page had no final record")),
    };
    transaction.commit().await?;
    Ok(CatalogPage {
        records,
        next_cursor,
        has_more,
    })
}

/// Find one entitlement-catalog definition by its UUID.
pub async fn get_entitlement(
    db: &DatabaseConnection,
    id: &str,
) -> Result<entitlement::Model, AdminError> {
    entitlement::Entity::find_by_id(parse_uuid(id, "entitlement_id")?)
        .one(db)
        .await?
        .ok_or(AdminError::EntitlementNotFound)
}

/// Find one membership and every stored grant in one repeatable-read snapshot.
pub async fn lookup_membership(
    db: &DatabaseConnection,
    key: &LookupKey,
) -> Result<MembershipDetail, AdminError> {
    validate_lookup_key(key)?;
    let transaction = db
        .begin_with_config(
            Some(IsolationLevel::RepeatableRead),
            Some(AccessMode::ReadOnly),
        )
        .await?;
    let membership = find_membership(&transaction, key)
        .await?
        .ok_or(AdminError::MembershipNotFound)?;
    let now = Utc::now();
    let grants = membership_entitlement::Entity::find()
        .filter(membership_entitlement::Column::MembershipId.eq(membership.id))
        .find_also_related(entitlement::Entity)
        .order_by_asc(entitlement::Column::Code)
        .order_by_asc(entitlement::Column::Id)
        .all(&transaction)
        .await?
        .into_iter()
        .map(|(grant, definition)| {
            let entitlement =
                definition.ok_or_else(|| storage_error("grant catalog is missing"))?;
            Ok(GrantRecord {
                effective: is_effective(&membership, &grant, &entitlement, now),
                grant,
                entitlement,
            })
        })
        .collect::<Result<Vec<_>, AdminError>>()?;
    transaction.commit().await?;
    Ok(MembershipDetail { membership, grants })
}

pub(super) fn is_effective(
    card: &membership::Model,
    grant: &membership_entitlement::Model,
    definition: &entitlement::Model,
    now: DateTime<Utc>,
) -> bool {
    card.status == "active"
        && card
            .expires_at
            .as_ref()
            .is_none_or(|expires_at| expires_at > &now)
        && definition.is_active
        && grant.granted_at <= now
        && grant
            .expires_at
            .as_ref()
            .is_none_or(|expires_at| expires_at > &now)
        && grant.revoked_at.is_none()
}

async fn find_membership<C>(
    db: &C,
    key: &LookupKey,
) -> Result<Option<membership::Model>, AdminError>
where
    C: sea_orm::ConnectionTrait,
{
    match key {
        LookupKey::MembershipId(value) => {
            membership::Entity::find_by_id(parse_uuid(value, "membership_id")?)
                .one(db)
                .await
                .map_err(AdminError::from)
        }
        LookupKey::UserId(value) => membership::Entity::find()
            .filter(membership::Column::UserId.eq(value.as_str()))
            .one(db)
            .await
            .map_err(AdminError::from),
        LookupKey::MemberNumber(value) => membership::Entity::find()
            .filter(membership::Column::MemberNumber.eq(value.as_str()))
            .one(db)
            .await
            .map_err(AdminError::from),
    }
}

fn validate_lookup_key(key: &LookupKey) -> Result<(), AdminError> {
    match key {
        LookupKey::MembershipId(value) => {
            parse_uuid(value, "membership_id")?;
        }
        LookupKey::UserId(value) => validate_text(value, "user_id")?,
        LookupKey::MemberNumber(value) => validate_text(value, "member_number")?,
    }
    Ok(())
}

fn membership_cursor(
    value: &str,
    status: Option<&str>,
) -> Result<Option<MembershipCursor>, AdminError> {
    if value.is_empty() {
        return Ok(None);
    }
    let cursor: MembershipCursor = decode_cursor(value)?;
    if cursor.version != CURSOR_VERSION
        || cursor.method != MEMBERSHIP_CURSOR_METHOD
        || cursor.status.as_deref() != status
    {
        return Err(AdminError::InvalidInput { field: CURSOR });
    }
    Ok(Some(cursor))
}

fn entitlement_cursor(value: &str) -> Result<Option<EntitlementCursor>, AdminError> {
    if value.is_empty() {
        return Ok(None);
    }
    let cursor: EntitlementCursor = decode_cursor(value)?;
    if cursor.version != CURSOR_VERSION || cursor.method != ENTITLEMENT_CURSOR_METHOD {
        return Err(AdminError::InvalidInput { field: CURSOR });
    }
    Ok(Some(cursor))
}

fn encode_cursor<T: Serialize>(cursor: &T) -> Result<String, AdminError> {
    serde_json::to_vec(cursor)
        .map(hex::encode)
        .map_err(|_| storage_error("cursor serialization failed"))
}

fn decode_cursor<T: DeserializeOwned>(value: &str) -> Result<T, AdminError> {
    let value = hex::decode(value).map_err(|_| AdminError::InvalidInput { field: CURSOR })?;
    serde_json::from_slice(&value).map_err(|_| AdminError::InvalidInput { field: CURSOR })
}

fn storage_error(message: &str) -> AdminError {
    AdminError::Storage(DbErr::Custom(message.to_owned()))
}
