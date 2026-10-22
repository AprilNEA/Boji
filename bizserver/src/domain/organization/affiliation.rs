//! The affiliations of a user: at most one for each organization type.
//!
//! Input: the `affiliation` rows of a user and the current time.
//! Output: the state that `Affiliation` shows, and the writes of a
//! confirmation and of leaving an organization.
//! Pos: domain. `verification` calls [`apply_verification`] after it checks a
//! code. Every write runs inside a transaction that holds the user lock.

use super::{COUNTED_CONDITION, OrganizationError, OrganizationType, after, lock_user};
use crate::entities::{affiliation, affiliation_event};
use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, DatabaseConnection,
    DbBackend, EntityTrait, IntoActiveModel, QueryFilter, Statement, TransactionTrait,
};
use uuid::Uuid;

/// The state of one affiliation of a user.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AffiliationState {
    /// The user never verified an organization, or left the organization.
    Unaffiliated,
    /// The verification is valid.
    Active,
    /// The verification expired.
    Expired,
}

/// One affiliation of a user, as `Affiliation` shows it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Affiliation {
    /// The user ID.
    pub user_id: String,
    /// The organization type. The resource ID of the affiliation.
    pub organization_type: OrganizationType,
    /// The state.
    pub state: AffiliationState,
    /// The organization, unless the state is `Unaffiliated`.
    pub organization_id: Option<Uuid>,
    /// The domain of the verified address, unless the state is `Unaffiliated`.
    pub email_domain: Option<String>,
    /// True when the user counts toward the organization now.
    pub counted: bool,
    /// The last successful code check.
    pub verified_at: Option<DateTime<Utc>>,
    /// The start of the current continuous counting.
    pub counted_since: Option<DateTime<Utc>>,
    /// When the verification expires.
    pub expires_at: Option<DateTime<Utc>>,
    /// The earliest time when a verification for another organization can succeed,
    /// or `None` when it can succeed now.
    pub organization_change_available_at: Option<DateTime<Utc>>,
}

impl Affiliation {
    pub(super) fn from_record(
        user_id: &str,
        kind: OrganizationType,
        record: Option<&affiliation::Model>,
        counted: bool,
        now: DateTime<Utc>,
    ) -> Result<Self, OrganizationError> {
        let mut affiliation = Self {
            user_id: user_id.to_owned(),
            organization_type: kind,
            state: AffiliationState::Unaffiliated,
            organization_id: None,
            email_domain: None,
            counted: false,
            verified_at: None,
            counted_since: None,
            expires_at: None,
            organization_change_available_at: None,
        };
        let Some(record) = record else {
            return Ok(affiliation);
        };
        let change_at = after(record.organization_since, kind.policy().change_cooldown);
        affiliation.organization_change_available_at = (change_at > now).then_some(change_at);
        match record.state.as_str() {
            "ended" => return Ok(affiliation),
            "active" => {}
            _ => {
                return Err(OrganizationError::Corrupt(
                    "unknown organization affiliation state",
                ));
            }
        }
        affiliation.state = if record.expires_at > now {
            AffiliationState::Active
        } else {
            AffiliationState::Expired
        };
        affiliation.organization_id = Some(record.organization_id);
        affiliation.email_domain = Some(record.email_domain.clone());
        affiliation.counted = counted && affiliation.state == AffiliationState::Active;
        affiliation.verified_at = Some(record.verified_at);
        affiliation.counted_since = Some(record.counted_since);
        affiliation.expires_at = Some(record.expires_at);
        Ok(affiliation)
    }
}

/// Return one affiliation of a user.
pub async fn get_affiliation<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    kind: OrganizationType,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    let record = find_record(db, user_id, kind).await?;
    let counted = match &record {
        Some(record) if record.state == "active" => is_counted(db, user_id, kind, now).await?,
        _ => false,
    };
    Affiliation::from_record(user_id, kind, record.as_ref(), counted, now)
}

/// Return every affiliation of a user: one for each type, in the order of
/// [`OrganizationType::ALL`].
pub async fn list_user_affiliations<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    now: DateTime<Utc>,
) -> Result<Vec<Affiliation>, OrganizationError> {
    let mut affiliations = Vec::with_capacity(OrganizationType::ALL.len());
    for kind in OrganizationType::ALL {
        affiliations.push(get_affiliation(db, user_id, kind, now).await?);
    }
    Ok(affiliations)
}

/// End one affiliation of a user.
///
/// An expired affiliation can end too. The address hash is removed, so the
/// address can verify another account.
pub async fn leave_organization(
    db: &DatabaseConnection,
    user_id: &str,
    kind: OrganizationType,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    let transaction = db.begin().await?;
    let result = async {
        lock_user(&transaction, user_id).await?;
        let record = find_record(&transaction, user_id, kind)
            .await?
            .filter(|record| record.state == "active")
            .ok_or(OrganizationError::AffiliationInactive)?;
        let organization_id = record.organization_id;
        let record = end(&transaction, record, now).await?;
        record_event(&transaction, user_id, organization_id, Action::Left, now).await?;
        Affiliation::from_record(user_id, kind, Some(&record), false, now)
    }
    .await;
    match result {
        Ok(affiliation) => {
            transaction.commit().await?;
            Ok(affiliation)
        }
        Err(error) => {
            transaction.rollback().await?;
            Err(error)
        }
    }
}

/// Read the `affiliation` row of one user and one type.
pub(super) async fn find_record<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    kind: OrganizationType,
) -> Result<Option<affiliation::Model>, OrganizationError> {
    Ok(
        affiliation::Entity::find_by_id((user_id.to_owned(), kind.as_str().to_owned()))
            .one(db)
            .await?,
    )
}

/// The verified facts of a confirmed code.
pub(super) struct Verified<'a> {
    /// The user ID.
    pub user_id: &'a str,
    /// The organization type of the verification.
    pub kind: OrganizationType,
    /// The chosen organization.
    pub organization_id: Uuid,
    /// The address hash.
    pub email_hmac: Vec<u8>,
    /// The domain of the address.
    pub email_domain: String,
}

/// Write the affiliation after a correct code.
///
/// The caller holds the user lock and an advisory lock on the address hash.
/// When another account holds the address, its verification ends first.
pub(super) async fn apply_verification<C: ConnectionTrait>(
    db: &C,
    verified: Verified<'_>,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    let kind = verified.kind;
    let previous = find_record(db, verified.user_id, kind).await?;
    let change = transition(previous.as_ref(), kind, verified.organization_id, now)?;

    let holders = affiliation::Entity::find()
        .filter(affiliation::Column::OrganizationType.eq(kind.as_str()))
        .filter(affiliation::Column::EmailHmac.eq(verified.email_hmac.clone()))
        .filter(affiliation::Column::UserId.ne(verified.user_id))
        .all(db)
        .await?;
    for holder in holders {
        let (holder_id, holder_organization) = (holder.user_id.clone(), holder.organization_id);
        end(db, holder, now).await?;
        record_event(db, &holder_id, holder_organization, Action::Displaced, now).await?;
    }

    let model = affiliation::ActiveModel {
        user_id: Set(verified.user_id.to_owned()),
        organization_type: Set(kind.as_str().to_owned()),
        organization_id: Set(verified.organization_id),
        state: Set("active".to_owned()),
        email_hmac: Set(Some(verified.email_hmac)),
        email_domain: Set(verified.email_domain),
        verified_at: Set(now),
        counted_since: Set(change.counted_since),
        organization_since: Set(change.organization_since),
        expires_at: Set(after(now, kind.policy().affiliation_lifetime)),
        ended_at: Set(None),
    };
    let record = if previous.is_some() {
        model.update(db).await?
    } else {
        model.insert(db).await?
    };
    record_event(
        db,
        verified.user_id,
        verified.organization_id,
        change.action,
        now,
    )
    .await?;
    let counted = is_counted(db, verified.user_id, kind, now).await?;
    Affiliation::from_record(verified.user_id, kind, Some(&record), counted, now)
}

/// The change that a correct code makes.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct Transition {
    action: Action,
    organization_since: DateTime<Utc>,
    counted_since: DateTime<Utc>,
}

/// The `action` of an `affiliation_event` row.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum Action {
    /// A first verification, or a new one after expiry or leaving.
    Verified,
    /// A verification for the same organization before expiry.
    Renewed,
    /// A verification for another organization.
    Changed,
    /// The user left the organization.
    Left,
    /// Another account verified the same address.
    Displaced,
    /// An operator revoked the verification.
    Revoked,
}

impl Action {
    fn as_str(self) -> &'static str {
        match self {
            Self::Verified => "verified",
            Self::Renewed => "renewed",
            Self::Changed => "changed",
            Self::Left => "left",
            Self::Displaced => "displaced",
            Self::Revoked => "revoked",
        }
    }
}

/// Decide the change for a correct code.
///
/// A renewal keeps `counted_since`. A new verification for the same
/// organization after expiry or leaving restarts counting and keeps
/// `organization_since`. A different organization restarts both, and needs the
/// cooldown of the type since `organization_since`.
fn transition(
    previous: Option<&affiliation::Model>,
    kind: OrganizationType,
    organization_id: Uuid,
    now: DateTime<Utc>,
) -> Result<Transition, OrganizationError> {
    let Some(previous) = previous else {
        return Ok(Transition {
            action: Action::Verified,
            organization_since: now,
            counted_since: now,
        });
    };
    let valid = previous.state == "active" && previous.expires_at > now;
    if previous.organization_id == organization_id {
        return Ok(if valid {
            Transition {
                action: Action::Renewed,
                organization_since: previous.organization_since,
                counted_since: previous.counted_since,
            }
        } else {
            Transition {
                action: Action::Verified,
                organization_since: previous.organization_since,
                counted_since: now,
            }
        });
    }
    let available_at = after(previous.organization_since, kind.policy().change_cooldown);
    if now < available_at {
        return Err(OrganizationError::ChangeTooSoon { available_at });
    }
    Ok(Transition {
        action: Action::Changed,
        organization_since: now,
        counted_since: now,
    })
}

/// Mark a verification as ended and remove its address hash.
pub(super) async fn end<C: ConnectionTrait>(
    db: &C,
    record: affiliation::Model,
    now: DateTime<Utc>,
) -> Result<affiliation::Model, OrganizationError> {
    let mut model = record.into_active_model();
    model.state = Set("ended".to_owned());
    model.email_hmac = Set(None);
    model.ended_at = Set(Some(now));
    Ok(model.update(db).await?)
}

/// Append one event.
pub(super) async fn record_event<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    organization_id: Uuid,
    action: Action,
    now: DateTime<Utc>,
) -> Result<(), OrganizationError> {
    affiliation_event::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_id.to_owned()),
        organization_id: Set(organization_id),
        action: Set(action.as_str().to_owned()),
        created_at: Set(now),
    }
    .insert(db)
    .await?;
    Ok(())
}

/// Evaluate [`COUNTED_CONDITION`] for one affiliation of one user.
async fn is_counted<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    kind: OrganizationType,
    now: DateTime<Utc>,
) -> Result<bool, OrganizationError> {
    let sql = format!(
        "SELECT EXISTS (
             SELECT 1 FROM affiliation AS a
             JOIN membership AS m ON m.user_id = a.user_id
             JOIN \"user\" AS u ON u.id = a.user_id
             WHERE a.user_id = $2 AND a.organization_type = $3 AND {COUNTED_CONDITION}
         ) AS counted"
    );
    let row = db
        .query_one_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            sql,
            [now.into(), user_id.into(), kind.as_str().into()],
        ))
        .await?
        .ok_or(OrganizationError::Corrupt("EXISTS returned no row"))?;
    Ok(row.try_get::<bool>("", "counted")?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeDelta;

    const SCHOOL: OrganizationType = OrganizationType::School;

    fn time(day: i64) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339("2026-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc)
            + TimeDelta::days(day)
    }

    fn record(
        organization: u128,
        state: &str,
        organization_since: i64,
        counted_since: i64,
    ) -> affiliation::Model {
        affiliation::Model {
            user_id: "user".to_owned(),
            organization_type: "school".to_owned(),
            organization_id: Uuid::from_u128(organization),
            state: state.to_owned(),
            email_hmac: (state == "active").then(|| vec![1; 32]),
            email_domain: "uq.edu.au".to_owned(),
            verified_at: time(counted_since),
            counted_since: time(counted_since),
            organization_since: time(organization_since),
            expires_at: time(counted_since + 365),
            ended_at: (state == "ended").then(|| time(counted_since + 1)),
        }
    }

    #[test]
    fn a_first_verification_starts_both_times() {
        let change = transition(None, SCHOOL, Uuid::from_u128(1), time(0)).unwrap();
        assert_eq!(change.action, Action::Verified);
        assert_eq!(
            (change.organization_since, change.counted_since),
            (time(0), time(0))
        );
    }

    #[test]
    fn a_renewal_keeps_the_counting_start() {
        let previous = record(1, "active", 0, 0);
        let change = transition(Some(&previous), SCHOOL, Uuid::from_u128(1), time(300)).unwrap();
        assert_eq!(change.action, Action::Renewed);
        assert_eq!(change.counted_since, time(0));
    }

    #[test]
    fn the_same_organization_after_expiry_or_leaving_restarts_counting() {
        for previous in [record(1, "active", 0, 0), record(1, "ended", 0, 0)] {
            let change =
                transition(Some(&previous), SCHOOL, Uuid::from_u128(1), time(400)).unwrap();
            assert_eq!(change.action, Action::Verified);
            assert_eq!(
                (change.organization_since, change.counted_since),
                (time(0), time(400))
            );
        }
    }

    #[test]
    fn an_organization_change_waits_for_the_cooldown() {
        let previous = record(1, "active", 10, 10);
        assert!(matches!(
            transition(Some(&previous), SCHOOL, Uuid::from_u128(2), time(39)),
            Err(OrganizationError::ChangeTooSoon { available_at }) if available_at == time(40)
        ));
        let change = transition(Some(&previous), SCHOOL, Uuid::from_u128(2), time(40)).unwrap();
        assert_eq!(change.action, Action::Changed);
        assert_eq!(
            (change.organization_since, change.counted_since),
            (time(40), time(40))
        );
        // Leaving does not skip the cooldown.
        let left = record(1, "ended", 10, 10);
        assert!(transition(Some(&left), SCHOOL, Uuid::from_u128(2), time(20)).is_err());
    }

    #[test]
    fn the_resource_shows_expiry_and_the_cooldown() {
        let active = record(1, "active", 0, 0);
        let shown =
            Affiliation::from_record("user", SCHOOL, Some(&active), true, time(10)).unwrap();
        assert_eq!(shown.state, AffiliationState::Active);
        assert!(shown.counted);
        assert_eq!(shown.organization_change_available_at, Some(time(30)));

        let shown =
            Affiliation::from_record("user", SCHOOL, Some(&active), true, time(365)).unwrap();
        assert_eq!(shown.state, AffiliationState::Expired);
        assert!(!shown.counted);
        assert_eq!(shown.organization_change_available_at, None);

        let ended = record(1, "ended", 0, 0);
        let shown = Affiliation::from_record("user", SCHOOL, Some(&ended), false, time(5)).unwrap();
        assert_eq!(shown.state, AffiliationState::Unaffiliated);
        assert_eq!(shown.organization_id, None);
        assert_eq!(shown.organization_change_available_at, Some(time(30)));
    }
}
