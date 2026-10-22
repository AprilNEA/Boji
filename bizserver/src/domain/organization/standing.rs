//! The public organization rankings: one for each organization type.
//!
//! Input: the affiliations, membership cards, accounts and the frozen
//! counts.
//! Output: an immutable ranking snapshot of one type, cached for a short time.
//! Pos: domain reads. Each snapshot answers every ranking request until it
//! expires, so a page token can name the snapshot that produced it.

use super::{COUNTED_CONDITION, OrganizationType, policy};
use chrono::{DateTime, Datelike, NaiveTime, TimeDelta, TimeZone, Utc};
use chrono_tz::Asia::Shanghai;
use sea_orm::{ConnectionTrait, DbBackend, DbErr, FromQueryResult, Statement};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, RwLock},
};
use uuid::Uuid;

/// One organization in the public part of the ranking.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RankedOrganization {
    /// The 1-based position. Positions are consecutive.
    pub rank: u32,
    /// The organization ID.
    pub organization_id: Uuid,
    /// English name.
    pub english_name: String,
    /// Chinese name, when the organization list has one.
    pub chinese_name: Option<String>,
    /// ISO 3166-1 alpha-2 code.
    pub region_code: String,
    /// The number of counted members.
    pub member_count: i64,
    /// The counted members whose counting started this week.
    pub weekly_new_count: i64,
}

/// Whether the ranking shows an organization.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Placement<'a> {
    /// The organization is public.
    Ranked(&'a RankedOrganization),
    /// The organization has counted members below the public threshold.
    BelowThreshold,
    /// The organization has no counted member.
    NoMembers,
}

/// An immutable ranking snapshot of one organization type.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Ranking {
    /// The type. The snapshot contains only organizations of this type.
    pub organization_type: OrganizationType,
    /// When the snapshot was computed.
    pub computed_at: DateTime<Utc>,
    /// The start of the week of `computed_at`.
    pub week_start: DateTime<Utc>,
    ranked: Vec<RankedOrganization>,
    /// The position in `ranked` of each public organization.
    positions: HashMap<Uuid, usize>,
    /// The organizations with counted members below the threshold.
    below_threshold: Vec<Uuid>,
    /// The frozen organizations, in any placement.
    frozen: HashSet<Uuid>,
}

impl Ranking {
    /// The public organizations in rank order.
    pub fn ranked(&self) -> &[RankedOrganization] {
        &self.ranked
    }

    /// The placement of one organization.
    pub fn placement(&self, organization: Uuid) -> Placement<'_> {
        if let Some(position) = self.positions.get(&organization) {
            return Placement::Ranked(&self.ranked[*position]);
        }
        if self.below_threshold.contains(&organization) {
            Placement::BelowThreshold
        } else {
            Placement::NoMembers
        }
    }

    /// Whether operators froze the counts of the organization.
    pub fn is_frozen(&self, organization: Uuid) -> bool {
        self.frozen.contains(&organization)
    }
}

/// The counted members of one organization.
#[derive(Clone, Debug, PartialEq, Eq, FromQueryResult)]
struct CountRow {
    organization_id: Uuid,
    english_name: String,
    chinese_name: Option<String>,
    region_code: String,
    member_count: i64,
    weekly_new_count: i64,
    /// The latest `counted_since` among the counted members: when the organization
    /// reached its current count.
    reach_time: DateTime<Utc>,
}

/// The stored counts of one frozen organization.
#[derive(Clone, Debug, PartialEq, Eq, FromQueryResult)]
struct FrozenRow {
    organization_id: Uuid,
    english_name: String,
    chinese_name: Option<String>,
    region_code: String,
    member_count: i64,
    weekly_new_count: i64,
    /// `None` when the organization had no counted member at freeze time.
    reach_time: Option<DateTime<Utc>>,
}

const FROZEN_SQL: &str = "SELECT f.organization_id, s.english_name, s.chinese_name, s.region_code,
            f.member_count, f.weekly_new_count, f.reach_time
     FROM organization_standing_freeze AS f
     JOIN organization AS s ON s.id = f.organization_id
     WHERE s.organization_type = $1";

/// The counts of one organization at one time.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) struct OrganizationCount {
    /// The number of counted members.
    pub member_count: i64,
    /// The counted members whose counting started in the current week.
    pub weekly_new_count: i64,
    /// When the organization reached `member_count`. `None` when it is zero.
    pub reach_time: Option<DateTime<Utc>>,
}

/// The aggregate query of the counted members of each organization.
///
/// `$1` is the current time and `$2` the start of the week. `extra` adds
/// conditions with further parameters.
fn count_sql(extra: &str) -> String {
    format!(
        "SELECT a.organization_id, s.english_name, s.chinese_name, s.region_code,
                count(*) AS member_count,
                count(*) FILTER (WHERE a.counted_since >= $2) AS weekly_new_count,
                max(a.counted_since) AS reach_time
         FROM affiliation AS a
         JOIN organization AS s ON s.id = a.organization_id
         JOIN membership AS m ON m.user_id = a.user_id
         JOIN \"user\" AS u ON u.id = a.user_id
         WHERE {COUNTED_CONDITION}{extra}
         GROUP BY a.organization_id, s.english_name, s.chinese_name, s.region_code"
    )
}

/// Compute a new snapshot of one type.
pub async fn compute<C: ConnectionTrait>(
    db: &C,
    kind: OrganizationType,
    now: DateTime<Utc>,
) -> Result<Ranking, DbErr> {
    let week_start = week_start(now);
    let rows = CountRow::find_by_statement(Statement::from_sql_and_values(
        DbBackend::Postgres,
        count_sql(" AND a.organization_type = $3"),
        [now.into(), week_start.into(), kind.as_str().into()],
    ))
    .all(db)
    .await?;
    let frozen = FrozenRow::find_by_statement(Statement::from_sql_and_values(
        DbBackend::Postgres,
        FROZEN_SQL,
        [kind.as_str().into()],
    ))
    .all(db)
    .await?;
    let frozen_ids = frozen.iter().map(|row| row.organization_id).collect();
    Ok(rank(
        kind,
        apply_freezes(rows, frozen),
        frozen_ids,
        now,
        week_start,
    ))
}

/// Return the current counts of one organization.
pub(super) async fn count_organization<C: ConnectionTrait>(
    db: &C,
    organization_id: Uuid,
    now: DateTime<Utc>,
) -> Result<OrganizationCount, DbErr> {
    let row = CountRow::find_by_statement(Statement::from_sql_and_values(
        DbBackend::Postgres,
        count_sql(" AND a.organization_id = $3"),
        [now.into(), week_start(now).into(), organization_id.into()],
    ))
    .one(db)
    .await?;
    Ok(row.map_or(
        OrganizationCount {
            member_count: 0,
            weekly_new_count: 0,
            reach_time: None,
        },
        |row| OrganizationCount {
            member_count: row.member_count,
            weekly_new_count: row.weekly_new_count,
            reach_time: Some(row.reach_time),
        },
    ))
}

/// Replace the current counts of frozen organizations with their stored counts.
///
/// An organization frozen without members has no row, so its placement is
/// `NoMembers`.
fn apply_freezes(rows: Vec<CountRow>, frozen: Vec<FrozenRow>) -> Vec<CountRow> {
    let ids: HashSet<Uuid> = frozen.iter().map(|row| row.organization_id).collect();
    let mut rows: Vec<CountRow> = rows
        .into_iter()
        .filter(|row| !ids.contains(&row.organization_id))
        .collect();
    for row in frozen {
        let Some(reach_time) = row.reach_time else {
            continue;
        };
        rows.push(CountRow {
            organization_id: row.organization_id,
            english_name: row.english_name,
            chinese_name: row.chinese_name,
            region_code: row.region_code,
            member_count: row.member_count,
            weekly_new_count: row.weekly_new_count,
            reach_time,
        });
    }
    rows
}

/// Order the counts and split them at the public threshold of the type.
fn rank(
    kind: OrganizationType,
    mut rows: Vec<CountRow>,
    frozen: HashSet<Uuid>,
    computed_at: DateTime<Utc>,
    week_start: DateTime<Utc>,
) -> Ranking {
    // More members first. For equal counts, the organization that reached its count
    // earlier first. The organization ID makes the order total.
    rows.sort_by(|left, right| {
        right
            .member_count
            .cmp(&left.member_count)
            .then(left.reach_time.cmp(&right.reach_time))
            .then(left.organization_id.cmp(&right.organization_id))
    });
    let mut ranked = Vec::new();
    let mut below_threshold = Vec::new();
    for row in rows {
        if row.member_count < kind.policy().public_threshold {
            below_threshold.push(row.organization_id);
            continue;
        }
        ranked.push(RankedOrganization {
            rank: u32::try_from(ranked.len() + 1).unwrap_or(u32::MAX),
            organization_id: row.organization_id,
            english_name: row.english_name,
            chinese_name: row.chinese_name,
            region_code: row.region_code,
            member_count: row.member_count,
            weekly_new_count: row.weekly_new_count,
        });
    }
    let positions = ranked
        .iter()
        .enumerate()
        .map(|(position, organization)| (organization.organization_id, position))
        .collect();
    Ranking {
        organization_type: kind,
        computed_at,
        week_start,
        ranked,
        positions,
        below_threshold,
        frozen,
    }
}

/// Monday 00:00 in China Standard Time of the week that contains `now`.
pub fn week_start(now: DateTime<Utc>) -> DateTime<Utc> {
    let local = now.with_timezone(&Shanghai).date_naive();
    let monday = local - TimeDelta::days(i64::from(local.weekday().num_days_from_monday()));
    // China Standard Time has no daylight saving time, so midnight exists
    // exactly once.
    Shanghai
        .from_local_datetime(&monday.and_time(NaiveTime::MIN))
        .single()
        .map_or(now, |start| start.with_timezone(&Utc))
}

/// One ranking snapshot for each type, each reused for
/// [`policy::RANKING_CACHE_LIFETIME`].
///
/// Concurrent requests after expiry can compute a ranking more than once.
/// Each computation is a single aggregate query, so the cache takes no lock
/// across the query.
#[derive(Debug, Default)]
pub struct RankingCache {
    slots: RwLock<HashMap<OrganizationType, Arc<Ranking>>>,
}

impl RankingCache {
    /// Return the cached snapshot of a type, or compute a new one.
    pub async fn current<C: ConnectionTrait>(
        &self,
        db: &C,
        kind: OrganizationType,
        now: DateTime<Utc>,
    ) -> Result<Arc<Ranking>, DbErr> {
        if let Some(ranking) = self.fresh(kind, now) {
            return Ok(ranking);
        }
        let ranking = Arc::new(compute(db, kind, now).await?);
        if let Ok(mut slots) = self.slots.write() {
            slots.insert(kind, ranking.clone());
        }
        Ok(ranking)
    }

    /// Drop every cached snapshot, so that the next requests compute new ones.
    ///
    /// A computation that started before the call can still store an older
    /// snapshot. That snapshot expires after the normal cache lifetime.
    pub fn invalidate(&self) {
        if let Ok(mut slots) = self.slots.write() {
            slots.clear();
        }
    }

    fn fresh(&self, kind: OrganizationType, now: DateTime<Utc>) -> Option<Arc<Ranking>> {
        let slots = self.slots.read().ok()?;
        let ranking = slots.get(&kind)?;
        let age = now.signed_duration_since(ranking.computed_at);
        // A new week starts a new count of weekly new members.
        let same_week = week_start(now) == ranking.week_start;
        (age >= TimeDelta::zero() && age < policy::RANKING_CACHE_LIFETIME && same_week)
            .then(|| ranking.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SCHOOL: OrganizationType = OrganizationType::School;

    fn time(text: &str) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339(text)
            .unwrap()
            .with_timezone(&Utc)
    }

    fn row(organization: u128, members: i64, reach: &str) -> CountRow {
        CountRow {
            organization_id: Uuid::from_u128(organization),
            english_name: format!("Organization {organization}"),
            chinese_name: None,
            region_code: "CN".to_owned(),
            member_count: members,
            weekly_new_count: 1,
            reach_time: time(reach),
        }
    }

    #[test]
    fn weeks_start_on_monday_in_china_standard_time() {
        // 2026-10-21 is a Wednesday.
        assert_eq!(
            week_start(time("2026-10-21T12:00:00Z")),
            time("2026-10-18T16:00:00Z")
        );
        // Monday 00:30 in UTC+8 is still Sunday in UTC.
        assert_eq!(
            week_start(time("2026-10-18T16:30:00Z")),
            time("2026-10-18T16:00:00Z")
        );
        // Sunday 23:59 in UTC+8 belongs to the previous week.
        assert_eq!(
            week_start(time("2026-10-18T15:59:00Z")),
            time("2026-10-11T16:00:00Z")
        );
    }

    #[test]
    fn orders_by_count_then_reach_time_and_hides_small_organizations() {
        let now = time("2026-10-21T12:00:00Z");
        let ranking = rank(
            SCHOOL,
            vec![
                row(1, 3, "2026-10-20T00:00:00Z"),
                row(2, 5, "2026-10-21T00:00:00Z"),
                row(3, 3, "2026-10-19T00:00:00Z"),
                row(4, 2, "2026-10-01T00:00:00Z"),
                row(5, 3, "2026-10-19T00:00:00Z"),
            ],
            HashSet::new(),
            now,
            week_start(now),
        );
        let order: Vec<(u32, u128)> = ranking
            .ranked()
            .iter()
            .map(|organization| (organization.rank, organization.organization_id.as_u128()))
            .collect();
        assert_eq!(order, [(1, 2), (2, 3), (3, 5), (4, 1)]);
        assert!(matches!(
            ranking.placement(Uuid::from_u128(3)),
            Placement::Ranked(RankedOrganization { rank: 2, .. })
        ));
        assert_eq!(
            ranking.placement(Uuid::from_u128(4)),
            Placement::BelowThreshold
        );
        assert_eq!(ranking.placement(Uuid::from_u128(9)), Placement::NoMembers);
    }

    #[test]
    fn the_cache_expires_after_its_lifetime_and_at_a_new_week() {
        let cache = RankingCache::default();
        let now = time("2026-10-18T15:59:30Z");
        cache.slots.write().unwrap().insert(
            SCHOOL,
            Arc::new(rank(
                SCHOOL,
                Vec::new(),
                HashSet::new(),
                now,
                week_start(now),
            )),
        );
        assert!(cache.fresh(SCHOOL, now + TimeDelta::seconds(10)).is_some());
        // The week changes at 2026-10-18T16:00:00Z.
        assert!(cache.fresh(SCHOOL, now + TimeDelta::seconds(40)).is_none());
        let later = time("2026-10-21T12:00:00Z");
        cache.slots.write().unwrap().insert(
            SCHOOL,
            Arc::new(rank(
                SCHOOL,
                Vec::new(),
                HashSet::new(),
                later,
                week_start(later),
            )),
        );
        assert!(
            cache
                .fresh(SCHOOL, later + TimeDelta::seconds(59))
                .is_some()
        );
        assert!(
            cache
                .fresh(SCHOOL, later + TimeDelta::seconds(60))
                .is_none()
        );
        assert!(cache.fresh(SCHOOL, later - TimeDelta::seconds(1)).is_none());
    }

    fn frozen(organization: u128, members: i64, reach: Option<&str>) -> FrozenRow {
        FrozenRow {
            organization_id: Uuid::from_u128(organization),
            english_name: format!("Organization {organization}"),
            chinese_name: None,
            region_code: "CN".to_owned(),
            member_count: members,
            weekly_new_count: 0,
            reach_time: reach.map(time),
        }
    }

    #[test]
    fn frozen_organizations_keep_their_stored_counts() {
        let now = time("2026-10-21T12:00:00Z");
        let rows = vec![
            row(1, 9, "2026-10-21T00:00:00Z"),
            row(2, 4, "2026-10-20T00:00:00Z"),
            row(3, 5, "2026-10-19T00:00:00Z"),
        ];
        // Organization 1 grew from 3 to 9 members. Organization 3 was frozen without
        // members. Organization 4 has no current member but a stored count.
        let freezes = vec![
            frozen(1, 3, Some("2026-10-02T00:00:00Z")),
            frozen(3, 0, None),
            frozen(4, 6, Some("2026-10-01T00:00:00Z")),
        ];
        let ids: HashSet<Uuid> = freezes.iter().map(|row| row.organization_id).collect();
        let ranking = rank(
            SCHOOL,
            apply_freezes(rows, freezes),
            ids,
            now,
            week_start(now),
        );
        let order: Vec<(u128, i64)> = ranking
            .ranked()
            .iter()
            .map(|organization| {
                (
                    organization.organization_id.as_u128(),
                    organization.member_count,
                )
            })
            .collect();
        assert_eq!(order, [(4, 6), (2, 4), (1, 3)]);
        assert_eq!(ranking.placement(Uuid::from_u128(3)), Placement::NoMembers);
        assert!(ranking.is_frozen(Uuid::from_u128(1)));
        assert!(ranking.is_frozen(Uuid::from_u128(3)));
        assert!(!ranking.is_frozen(Uuid::from_u128(2)));
    }

    #[test]
    fn invalidate_drops_the_snapshot() {
        let cache = RankingCache::default();
        let now = time("2026-10-21T12:00:00Z");
        cache.slots.write().unwrap().insert(
            SCHOOL,
            Arc::new(rank(
                SCHOOL,
                Vec::new(),
                HashSet::new(),
                now,
                week_start(now),
            )),
        );
        cache.invalidate();
        assert!(cache.fresh(SCHOOL, now).is_none());
    }
}
