//! Affiliation email verification codes.
//!
//! Input: a parsed organization address, a code that the user typed and the key of
//! the address and code digests.
//! Output: a stored verification with the code to send, or a confirmed organization
//! verification.
//! Pos: domain. The transport sends the mail after [`issue_verification`] and
//! calls [`discard_verification`] when the mail fails, so a failed mail does
//! not count against the sending limits.

use super::{
    Affiliation, AffiliationEmail, AffiliationEmailKey, OrganizationError, OrganizationType,
    VerificationCode,
    affiliation::{Verified, apply_verification},
    after,
    catalog::{DomainMatch, match_domain},
    lock_user, policy, require_active_membership,
    secret::digests_equal,
};
use crate::entities::affiliation_email_verification;
use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, DatabaseConnection,
    DatabaseTransaction, DbBackend, EntityTrait, IntoActiveModel, QueryFilter, QueryOrder,
    QuerySelect, Statement, TransactionTrait,
};
use uuid::Uuid;

/// A stored organization email verification.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Verification {
    /// The verification ID.
    pub id: Uuid,
    /// The user ID.
    pub user_id: String,
    /// The organization type of the parent affiliation.
    pub organization_type: OrganizationType,
    /// The masked address.
    pub masked_email: String,
    /// The organizations that the domain matches, in ID order.
    pub candidate_organizations: Vec<Uuid>,
    /// When the code was sent.
    pub created_at: DateTime<Utc>,
    /// When the code expires.
    pub expires_at: DateTime<Utc>,
    /// The earliest time when the user can request another code.
    pub resend_at: DateTime<Utc>,
}

/// A new verification and the code to send.
#[derive(Debug)]
pub struct IssuedVerification {
    /// The stored verification.
    pub verification: Verification,
    /// The address to send the code to.
    pub recipient: String,
    /// The code. The server stores only its digest.
    pub code: VerificationCode,
}

/// Store a new verification for an organization address.
///
/// Checks, in order: the membership card, the organization list and the sending
/// limits.
pub async fn issue_verification(
    db: &DatabaseConnection,
    key: &AffiliationEmailKey,
    user_id: &str,
    kind: OrganizationType,
    email: &AffiliationEmail,
    now: DateTime<Utc>,
) -> Result<IssuedVerification, OrganizationError> {
    let transaction = db.begin().await?;
    let result = issue_in_transaction(&transaction, key, user_id, kind, email, now).await;
    finish(transaction, result).await
}

async fn issue_in_transaction(
    transaction: &DatabaseTransaction,
    key: &AffiliationEmailKey,
    user_id: &str,
    kind: OrganizationType,
    email: &AffiliationEmail,
    now: DateTime<Utc>,
) -> Result<IssuedVerification, OrganizationError> {
    lock_user(transaction, user_id).await?;
    require_active_membership(transaction, user_id, now).await?;
    let candidates = match match_domain(transaction, kind, email.domain()).await? {
        DomainMatch::Organizations(organizations) => organizations,
        DomainMatch::Unknown | DomainMatch::Excluded => {
            return Err(OrganizationError::DomainUnknown);
        }
    };

    affiliation_email_verification::Entity::delete_many()
        .filter(affiliation_email_verification::Column::CreatedAt.lte(retention_start(now)))
        .exec(transaction)
        .await?;
    let email_hmac = key.email_digest(&email.canonical())?;
    let mut history = SendHistory::load(transaction, user_id, &email_hmac, now).await?;
    let retry_at = history.next_send_time();
    if retry_at > now {
        return Err(OrganizationError::RateLimited { retry_at });
    }

    let id = Uuid::new_v4();
    let code = VerificationCode::generate()?;
    let record = affiliation_email_verification::ActiveModel {
        id: Set(id),
        user_id: Set(user_id.to_owned()),
        organization_type: Set(kind.as_str().to_owned()),
        email_hmac: Set(email_hmac),
        email_domain: Set(email.domain().to_owned()),
        masked_email: Set(email.masked()),
        candidate_organization_ids: Set(serde_json::json!(candidates)),
        code_hmac: Set(key.code_digest(id, &code)?),
        failed_attempts: Set(0),
        created_at: Set(now),
        expires_at: Set(after(now, policy::CODE_LIFETIME)),
        consumed_at: Set(None),
    }
    .insert(transaction)
    .await?;
    history.account.push(now);
    history.address.push(now);
    Ok(IssuedVerification {
        verification: to_verification(&record, history.next_send_time())?,
        recipient: email.delivery_address(),
        code,
    })
}

/// Delete a verification whose mail could not be sent.
pub async fn discard_verification(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<(), OrganizationError> {
    affiliation_email_verification::Entity::delete_by_id(id)
        .exec(db)
        .await?;
    Ok(())
}

/// Return a verification of the user, or `None` when it does not exist or is
/// older than the retention period.
pub async fn get_verification<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    kind: OrganizationType,
    id: Uuid,
    now: DateTime<Utc>,
) -> Result<Option<Verification>, OrganizationError> {
    let Some(record) = find(db, user_id, kind, id, now).await? else {
        return Ok(None);
    };
    let history = SendHistory::load(db, user_id, &record.email_hmac, now).await?;
    Ok(Some(to_verification(&record, history.next_send_time())?))
}

/// Check a code and write the affiliation.
///
/// A wrong code is stored, so the attempt limit holds across requests.
pub async fn confirm_verification(
    db: &DatabaseConnection,
    key: &AffiliationEmailKey,
    request: ConfirmRequest<'_>,
    now: DateTime<Utc>,
) -> Result<Affiliation, OrganizationError> {
    let transaction = db.begin().await?;
    let result = confirm_in_transaction(&transaction, key, request, now).await;
    match finish(transaction, result).await? {
        Confirmation::Confirmed(affiliation) => Ok(affiliation),
        Confirmation::WrongCode => Err(OrganizationError::CodeInvalid),
    }
}

/// The result of a code check that commits.
enum Confirmation {
    /// The code was correct.
    Confirmed(Affiliation),
    /// The code was wrong, and the failed attempt was stored.
    WrongCode,
}

/// The values of one confirmation request.
#[derive(Clone, Copy, Debug)]
pub struct ConfirmRequest<'a> {
    /// The user who confirms the code.
    pub user_id: &'a str,
    /// The type of the affiliation.
    pub kind: OrganizationType,
    /// The verification ID.
    pub id: Uuid,
    /// The code from the mail.
    pub code: &'a str,
    /// The chosen organization, or `None` when the verification has one
    /// candidate.
    pub organization: Option<Uuid>,
}

async fn confirm_in_transaction(
    transaction: &DatabaseTransaction,
    key: &AffiliationEmailKey,
    request: ConfirmRequest<'_>,
    now: DateTime<Utc>,
) -> Result<Confirmation, OrganizationError> {
    let ConfirmRequest {
        user_id,
        kind,
        id,
        code,
        organization,
    } = request;
    lock_user(transaction, user_id).await?;
    let record = find(transaction, user_id, kind, id, now)
        .await?
        .ok_or(OrganizationError::VerificationNotFound)?;
    if record.consumed_at.is_some()
        || record.expires_at <= now
        || record.failed_attempts >= policy::MAX_FAILED_ATTEMPTS
    {
        return Err(OrganizationError::VerificationExpired);
    }
    // These checks come before the code check, so that they cost no attempt.
    require_active_membership(transaction, user_id, now).await?;
    let candidates = candidates(&record)?;
    let organization_id = choose_organization(&candidates, organization)?;

    let expected = VerificationCode::parse(code)
        .map(|code| key.code_digest(id, &code))
        .transpose()?;
    if !expected.is_some_and(|digest| digests_equal(&digest, &record.code_hmac)) {
        let failed_attempts = record.failed_attempts + 1;
        let mut model = record.into_active_model();
        model.failed_attempts = Set(failed_attempts);
        model.update(transaction).await?;
        return Ok(Confirmation::WrongCode);
    }

    lock_address(transaction, &record.email_hmac).await?;
    let affiliation = apply_verification(
        transaction,
        Verified {
            user_id,
            kind,
            organization_id,
            email_hmac: record.email_hmac.clone(),
            email_domain: record.email_domain.clone(),
        },
        now,
    )
    .await?;
    let mut model = record.into_active_model();
    model.consumed_at = Set(Some(now));
    model.update(transaction).await?;
    Ok(Confirmation::Confirmed(affiliation))
}

/// Pick the organization of a confirmation.
fn choose_organization(
    candidates: &[Uuid],
    organization: Option<Uuid>,
) -> Result<Uuid, OrganizationError> {
    match (organization, candidates) {
        (Some(organization), _) if candidates.contains(&organization) => Ok(organization),
        (Some(_), _) => Err(OrganizationError::OrganizationNotCandidate),
        (None, [only]) => Ok(*only),
        (None, _) => Err(OrganizationError::OrganizationChoiceRequired),
    }
}

/// Serialize confirmations of one address across accounts, so that two
/// accounts cannot hold the same address hash at once.
async fn lock_address(
    transaction: &DatabaseTransaction,
    email_hmac: &[u8],
) -> Result<(), OrganizationError> {
    let prefix: [u8; 8] = email_hmac
        .get(..8)
        .and_then(|bytes| bytes.try_into().ok())
        .ok_or(OrganizationError::Corrupt(
            "address digest is shorter than 8 bytes",
        ))?;
    transaction
        .execute_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT pg_advisory_xact_lock($1)",
            [i64::from_be_bytes(prefix).into()],
        ))
        .await?;
    Ok(())
}

async fn find<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    kind: OrganizationType,
    id: Uuid,
    now: DateTime<Utc>,
) -> Result<Option<affiliation_email_verification::Model>, OrganizationError> {
    Ok(affiliation_email_verification::Entity::find_by_id(id)
        .filter(affiliation_email_verification::Column::UserId.eq(user_id))
        .filter(affiliation_email_verification::Column::OrganizationType.eq(kind.as_str()))
        .filter(affiliation_email_verification::Column::CreatedAt.gt(retention_start(now)))
        .one(db)
        .await?)
}

fn candidates(
    record: &affiliation_email_verification::Model,
) -> Result<Vec<Uuid>, OrganizationError> {
    serde_json::from_value(record.candidate_organization_ids.clone())
        .map_err(|_| OrganizationError::Corrupt("candidate organizations are not a UUID array"))
}

fn to_verification(
    record: &affiliation_email_verification::Model,
    resend_at: DateTime<Utc>,
) -> Result<Verification, OrganizationError> {
    Ok(Verification {
        id: record.id,
        user_id: record.user_id.clone(),
        organization_type: OrganizationType::parse(&record.organization_type)
            .ok_or(OrganizationError::Corrupt("unknown organization type"))?,
        masked_email: record.masked_email.clone(),
        candidate_organizations: candidates(record)?,
        created_at: record.created_at,
        expires_at: record.expires_at,
        resend_at,
    })
}

fn retention_start(now: DateTime<Utc>) -> DateTime<Utc> {
    now.checked_sub_signed(policy::VERIFICATION_RETENTION)
        .unwrap_or(DateTime::<Utc>::MIN_UTC)
}

/// The recent send times that the sending limits look at.
#[derive(Debug, Default, PartialEq, Eq)]
struct SendHistory {
    /// The codes of the account in the account window, oldest first.
    account: Vec<DateTime<Utc>>,
    /// The codes to the address in the address window, oldest first.
    address: Vec<DateTime<Utc>>,
}

impl SendHistory {
    async fn load<C: ConnectionTrait>(
        db: &C,
        user_id: &str,
        email_hmac: &[u8],
        now: DateTime<Utc>,
    ) -> Result<Self, OrganizationError> {
        let account = send_times(
            db,
            affiliation_email_verification::Column::UserId.eq(user_id),
            now.checked_sub_signed(policy::ACCOUNT_WINDOW)
                .unwrap_or(DateTime::<Utc>::MIN_UTC),
        )
        .await?;
        let address = send_times(
            db,
            affiliation_email_verification::Column::EmailHmac.eq(email_hmac.to_vec()),
            now.checked_sub_signed(policy::ADDRESS_WINDOW)
                .unwrap_or(DateTime::<Utc>::MIN_UTC),
        )
        .await?;
        Ok(Self { account, address })
    }

    /// The earliest time when the next code can be sent. A time at or before
    /// now means that a code can be sent now.
    fn next_send_time(&self) -> DateTime<Utc> {
        let mut next = DateTime::<Utc>::MIN_UTC;
        if let Some(last) = self.account.last() {
            next = next.max(after(*last, policy::RESEND_INTERVAL));
        }
        // With `n` codes in a window of limit `l`, the code at index `n - l`
        // must leave the window before the count drops below the limit.
        for (times, limit, window) in [
            (&self.account, policy::ACCOUNT_LIMIT, policy::ACCOUNT_WINDOW),
            (&self.address, policy::ADDRESS_LIMIT, policy::ADDRESS_WINDOW),
        ] {
            if let Some(index) = times.len().checked_sub(limit) {
                next = next.max(after(times[index], window));
            }
        }
        next
    }
}

/// The send times of the rows that match `condition` and are newer than
/// `since`, oldest first.
async fn send_times<C: ConnectionTrait>(
    db: &C,
    condition: impl sea_orm::sea_query::IntoCondition,
    since: DateTime<Utc>,
) -> Result<Vec<DateTime<Utc>>, OrganizationError> {
    Ok(affiliation_email_verification::Entity::find()
        .select_only()
        .column(affiliation_email_verification::Column::CreatedAt)
        .filter(condition)
        .filter(affiliation_email_verification::Column::CreatedAt.gt(since))
        .order_by_asc(affiliation_email_verification::Column::CreatedAt)
        .into_tuple::<DateTime<Utc>>()
        .all(db)
        .await?)
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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeDelta;

    fn time(minute: i64) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339("2026-10-21T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc)
            + TimeDelta::minutes(minute)
    }

    #[test]
    fn an_empty_history_allows_a_code_now() {
        assert!(SendHistory::default().next_send_time() <= time(0));
    }

    #[test]
    fn the_resend_interval_follows_the_last_code() {
        let history = SendHistory {
            account: vec![time(0)],
            address: vec![time(0)],
        };
        assert_eq!(history.next_send_time(), time(1));
    }

    #[test]
    fn the_account_limit_waits_for_the_oldest_code() {
        let history = SendHistory {
            account: vec![time(0), time(10), time(20), time(30), time(40)],
            address: Vec::new(),
        };
        assert_eq!(history.next_send_time(), time(24 * 60));
        let history = SendHistory {
            account: vec![time(0), time(10), time(20), time(30)],
            address: Vec::new(),
        };
        assert_eq!(history.next_send_time(), time(31));
    }

    #[test]
    fn the_address_limit_counts_codes_from_every_account() {
        let history = SendHistory {
            account: vec![time(30)],
            address: vec![time(0), time(15), time(30)],
        };
        assert_eq!(history.next_send_time(), time(60));
    }

    #[test]
    fn a_confirmation_must_name_one_candidate() {
        let one = [Uuid::from_u128(1)];
        let two = [Uuid::from_u128(1), Uuid::from_u128(2)];
        assert_eq!(
            choose_organization(&one, None).ok(),
            Some(Uuid::from_u128(1))
        );
        assert!(matches!(
            choose_organization(&two, None),
            Err(OrganizationError::OrganizationChoiceRequired)
        ));
        assert_eq!(
            choose_organization(&two, Some(Uuid::from_u128(2))).ok(),
            Some(Uuid::from_u128(2))
        );
        assert!(matches!(
            choose_organization(&one, Some(Uuid::from_u128(3))),
            Err(OrganizationError::OrganizationNotCandidate)
        ));
    }
}
