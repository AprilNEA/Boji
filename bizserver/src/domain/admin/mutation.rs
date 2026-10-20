use chrono::{DateTime, Utc};
use sea_orm::sea_query::LockType;
use sea_orm::{
    ActiveModelTrait, DatabaseConnection, DatabaseTransaction, EntityTrait, QuerySelect, Set,
    TransactionTrait,
};
use serde_json::{Value, json};
use uuid::Uuid;

use crate::entities::{admin_audit_event, entitlement, membership, membership_entitlement};

use super::read::is_effective;
use super::types::{EXPIRES_AT, future_expiry, normalized_reason, parse_uuid, validate_text};
use super::{
    AdminError, GrantMutation, GrantRecord, GrantResult, RevokeMutation, StatusMutation,
    StatusResult,
};

struct EntitlementTarget {
    membership_id: Uuid,
    entitlement_id: Uuid,
}

struct GrantChange {
    target: EntitlementTarget,
    expires_at: Option<DateTime<Utc>>,
}

struct AuditEntry<'a> {
    actor_user_id: &'a str,
    target_user_id: &'a str,
    action: &'a str,
    reason: &'a str,
    metadata: Value,
    created_at: DateTime<Utc>,
}

/// Change one membership card status and audit the change when it is not already set.
pub async fn change_status(
    db: &DatabaseConnection,
    input: &StatusMutation,
) -> Result<StatusResult, AdminError> {
    validate_text(&input.actor_user_id, "actor_user_id")?;
    let membership_id = parse_uuid(&input.membership_id, "membership_id")?;
    let reason = normalized_reason(&input.reason)?;
    let transaction = db.begin().await?;
    let result = change_status_in_transaction(&transaction, input, membership_id, &reason).await;
    finish(transaction, result).await
}

/// Create, restore, or update one entitlement grant and audit every state change.
pub async fn grant_entitlement(
    db: &DatabaseConnection,
    input: &GrantMutation,
) -> Result<GrantResult, AdminError> {
    validate_text(&input.actor_user_id, "actor_user_id")?;
    let membership_id = parse_uuid(&input.membership_id, "membership_id")?;
    let entitlement_id = parse_uuid(&input.entitlement_id, "entitlement_id")?;
    let reason = normalized_reason(&input.reason)?;
    let expires_at = future_expiry(&input.expires_at)?;
    let transaction = db.begin().await?;
    let result = grant_in_transaction(
        &transaction,
        input,
        GrantChange {
            target: EntitlementTarget {
                membership_id,
                entitlement_id,
            },
            expires_at,
        },
        &reason,
    )
    .await;
    finish(transaction, result).await
}

/// Revoke one existing grant and audit the change when it remains unrevoked.
pub async fn revoke_entitlement(
    db: &DatabaseConnection,
    input: &RevokeMutation,
) -> Result<GrantResult, AdminError> {
    validate_text(&input.actor_user_id, "actor_user_id")?;
    let membership_id = parse_uuid(&input.membership_id, "membership_id")?;
    let entitlement_id = parse_uuid(&input.entitlement_id, "entitlement_id")?;
    let reason = normalized_reason(&input.reason)?;
    let transaction = db.begin().await?;
    let result = revoke_in_transaction(
        &transaction,
        input,
        EntitlementTarget {
            membership_id,
            entitlement_id,
        },
        &reason,
    )
    .await;
    finish(transaction, result).await
}

async fn change_status_in_transaction(
    transaction: &DatabaseTransaction,
    input: &StatusMutation,
    membership_id: Uuid,
    reason: &str,
) -> Result<StatusResult, AdminError> {
    let card = lock_membership(transaction, membership_id).await?;
    if card.status == input.status.as_str() {
        return Ok(StatusResult {
            membership: card,
            changed: false,
            audit_event_id: None,
        });
    }

    let target_user_id = card.user_id.clone();
    let mut active: membership::ActiveModel = card.into();
    active.status = Set(input.status.as_str().to_owned());
    let membership = active.update(transaction).await?;
    let audit_event_id = append_audit(
        transaction,
        AuditEntry {
            actor_user_id: &input.actor_user_id,
            target_user_id: &target_user_id,
            action: "membership.status.updated",
            reason,
            metadata: json!({
                "membershipId": membership_id.to_string(),
                "status": input.status.as_str(),
            }),
            created_at: Utc::now(),
        },
    )
    .await?;
    Ok(StatusResult {
        membership,
        changed: true,
        audit_event_id: Some(audit_event_id.to_string()),
    })
}

async fn grant_in_transaction(
    transaction: &DatabaseTransaction,
    input: &GrantMutation,
    change: GrantChange,
    reason: &str,
) -> Result<GrantResult, AdminError> {
    let GrantChange {
        target: EntitlementTarget {
            membership_id,
            entitlement_id,
        },
        expires_at,
    } = change;
    // Every membership mutation locks the card first. Entitlement operations lock
    // the catalog definition second, so catalog deactivation cannot race a grant.
    let card = lock_membership(transaction, membership_id).await?;
    let definition = lock_entitlement(transaction, entitlement_id).await?;
    if !definition.is_active {
        return Err(AdminError::EntitlementInactive);
    }

    let now = Utc::now();
    if expires_at.as_ref().is_some_and(|value| value <= &now) {
        return Err(AdminError::InvalidInput { field: EXPIRES_AT });
    }
    let current = lock_grant(transaction, membership_id, entitlement_id).await?;
    let (grant, changed) = match current {
        Some(current) if current.revoked_at.is_none() && current.expires_at == expires_at => {
            (current, false)
        }
        Some(current) => {
            let restore = current.revoked_at.is_some();
            let mut active: membership_entitlement::ActiveModel = current.into();
            if restore {
                active.granted_at = Set(now);
            }
            active.expires_at = Set(expires_at);
            active.revoked_at = Set(None);
            (active.update(transaction).await?, true)
        }
        None => (
            membership_entitlement::ActiveModel {
                membership_id: Set(membership_id),
                entitlement_id: Set(entitlement_id),
                granted_at: Set(now),
                expires_at: Set(expires_at),
                revoked_at: Set(None),
            }
            .insert(transaction)
            .await?,
            true,
        ),
    };
    let audit_event_id = if changed {
        Some(
            append_audit(
                transaction,
                AuditEntry {
                    actor_user_id: &input.actor_user_id,
                    target_user_id: &card.user_id,
                    action: "membership.entitlement.granted",
                    reason,
                    metadata: json!({
                        "membershipId": membership_id.to_string(),
                        "entitlementId": entitlement_id.to_string(),
                    }),
                    created_at: now,
                },
            )
            .await?
            .to_string(),
        )
    } else {
        None
    };
    Ok(GrantResult {
        grant: GrantRecord {
            effective: is_effective(&card, &grant, &definition, now),
            grant,
            entitlement: definition,
        },
        changed,
        audit_event_id,
    })
}

async fn revoke_in_transaction(
    transaction: &DatabaseTransaction,
    input: &RevokeMutation,
    target: EntitlementTarget,
    reason: &str,
) -> Result<GrantResult, AdminError> {
    let EntitlementTarget {
        membership_id,
        entitlement_id,
    } = target;
    // Revoke also locks the catalog row. This retains one order for every
    // entitlement mutation, including revocation of an inactive definition.
    let card = lock_membership(transaction, membership_id).await?;
    let definition = lock_entitlement(transaction, entitlement_id).await?;
    let current = lock_grant(transaction, membership_id, entitlement_id)
        .await?
        .ok_or(AdminError::GrantNotFound)?;
    let now = Utc::now();
    let (grant, changed) = match current.revoked_at {
        Some(_) => (current, false),
        None => {
            let mut active: membership_entitlement::ActiveModel = current.into();
            active.revoked_at = Set(Some(now));
            (active.update(transaction).await?, true)
        }
    };
    let audit_event_id = if changed {
        Some(
            append_audit(
                transaction,
                AuditEntry {
                    actor_user_id: &input.actor_user_id,
                    target_user_id: &card.user_id,
                    action: "membership.entitlement.revoked",
                    reason,
                    metadata: json!({
                        "membershipId": membership_id.to_string(),
                        "entitlementId": entitlement_id.to_string(),
                    }),
                    created_at: now,
                },
            )
            .await?
            .to_string(),
        )
    } else {
        None
    };
    Ok(GrantResult {
        grant: GrantRecord {
            effective: is_effective(&card, &grant, &definition, now),
            grant,
            entitlement: definition,
        },
        changed,
        audit_event_id,
    })
}

async fn lock_membership(
    transaction: &DatabaseTransaction,
    membership_id: Uuid,
) -> Result<membership::Model, AdminError> {
    membership::Entity::find_by_id(membership_id)
        .lock(LockType::Update)
        .one(transaction)
        .await?
        .ok_or(AdminError::MembershipNotFound)
}

async fn lock_entitlement(
    transaction: &DatabaseTransaction,
    entitlement_id: Uuid,
) -> Result<entitlement::Model, AdminError> {
    entitlement::Entity::find_by_id(entitlement_id)
        .lock(LockType::Update)
        .one(transaction)
        .await?
        .ok_or(AdminError::EntitlementNotFound)
}

async fn lock_grant(
    transaction: &DatabaseTransaction,
    membership_id: Uuid,
    entitlement_id: Uuid,
) -> Result<Option<membership_entitlement::Model>, AdminError> {
    membership_entitlement::Entity::find_by_id((membership_id, entitlement_id))
        .lock(LockType::Update)
        .one(transaction)
        .await
        .map_err(AdminError::from)
}

async fn append_audit(
    transaction: &DatabaseTransaction,
    event: AuditEntry<'_>,
) -> Result<Uuid, AdminError> {
    let AuditEntry {
        actor_user_id,
        target_user_id,
        action,
        reason,
        metadata,
        created_at,
    } = event;
    let id = Uuid::new_v4();
    admin_audit_event::ActiveModel {
        id: Set(id),
        actor_user_id: Set(Some(actor_user_id.to_owned())),
        target_user_id: Set(Some(target_user_id.to_owned())),
        action: Set(action.to_owned()),
        reason: Set(reason.to_owned()),
        metadata: Set(metadata),
        created_at: Set(created_at),
    }
    .insert(transaction)
    .await?;
    Ok(id)
}

async fn finish<T>(
    transaction: DatabaseTransaction,
    result: Result<T, AdminError>,
) -> Result<T, AdminError> {
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
