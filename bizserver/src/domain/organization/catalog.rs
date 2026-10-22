//! Reads of the organization lists.
//!
//! Input: organization IDs, a search query, or an organization type and an
//! email domain.
//! Output: organizations with their accepted domains, and the organizations that accept a
//! domain.
//! Pos: domain reads. Only `import` writes the organization list.

use super::{OrganizationError, OrganizationType, email::domain_suffixes};
use crate::entities::{organization, organization_domain};
use sea_orm::{
    ColumnTrait, ConnectionTrait, DbBackend, DbErr, EntityTrait, FromQueryResult, QueryFilter,
    QueryOrder, Statement,
};
use std::collections::BTreeMap;
use uuid::Uuid;

/// An organization of an organization list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Organization {
    /// Stable organization ID.
    pub id: Uuid,
    /// The type, which selects the list, the rules and the ranking.
    pub organization_type: OrganizationType,
    /// English name.
    pub english_name: String,
    /// Chinese name, when the organization list has one.
    pub chinese_name: Option<String>,
    /// ISO 3166-1 alpha-2 code.
    pub region_code: String,
    /// The accepted email domains in lexical order.
    pub email_domains: Vec<String>,
}

/// A page request of [`list_organizations`].
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct OrganizationQuery {
    /// The type, or `None` for every type.
    pub organization_type: Option<OrganizationType>,
    /// The exact region code, or `None` for every region.
    pub region_code: Option<String>,
    /// A case-insensitive substring of a name or an accepted domain.
    pub text: Option<String>,
    /// The number of organizations to skip.
    pub offset: u64,
    /// The maximum number of organizations to return.
    pub limit: u64,
}

/// One page of [`list_organizations`].
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct OrganizationPage {
    /// The organizations of the page, ordered by English name and ID.
    pub organizations: Vec<Organization>,
    /// True when more organizations follow.
    pub more: bool,
}

#[derive(Debug, FromQueryResult)]
struct OrganizationRow {
    id: Uuid,
    organization_type: String,
    english_name: String,
    chinese_name: Option<String>,
    region_code: String,
}

/// List active organizations.
pub async fn list_organizations<C: ConnectionTrait>(
    db: &C,
    query: &OrganizationQuery,
) -> Result<OrganizationPage, OrganizationError> {
    let pattern = query.text.as_deref().map(like_pattern);
    // Read one extra row to learn whether another page follows.
    let limit = query.limit.saturating_add(1);
    let statement = Statement::from_sql_and_values(
        DbBackend::Postgres,
        r"SELECT s.id, s.organization_type, s.english_name, s.chinese_name, s.region_code
          FROM organization AS s
          WHERE s.state = 'active'
            AND ($5::text IS NULL OR s.organization_type = $5)
            AND ($1::text IS NULL OR s.region_code = $1)
            AND ($2::text IS NULL
                 OR s.english_name ILIKE $2 ESCAPE '\'
                 OR s.chinese_name ILIKE $2 ESCAPE '\'
                 OR EXISTS (SELECT 1 FROM organization_domain AS d
                            WHERE d.organization_id = s.id AND d.kind = 'allow'
                              AND d.domain ILIKE $2 ESCAPE '\'))
          ORDER BY s.english_name, s.id
          LIMIT $3 OFFSET $4",
        [
            query.region_code.clone().into(),
            pattern.into(),
            to_i64(limit).into(),
            to_i64(query.offset).into(),
            query.organization_type.map(OrganizationType::as_str).into(),
        ],
    );
    let mut rows = OrganizationRow::find_by_statement(statement)
        .all(db)
        .await?;
    let more = rows.len() as u64 > query.limit;
    rows.truncate(usize::try_from(query.limit).unwrap_or(usize::MAX));
    let organizations = with_domains(db, rows).await?;
    Ok(OrganizationPage {
        organizations,
        more,
    })
}

/// Return an organization in any state, or `None` when no organization has the ID.
pub async fn get_organization<C: ConnectionTrait>(
    db: &C,
    id: Uuid,
) -> Result<Option<Organization>, OrganizationError> {
    let Some(record) = organization::Entity::find_by_id(id).one(db).await? else {
        return Ok(None);
    };
    let row = OrganizationRow {
        id: record.id,
        organization_type: record.organization_type,
        english_name: record.english_name,
        chinese_name: record.chinese_name,
        region_code: record.region_code,
    };
    Ok(with_domains(db, vec![row]).await?.pop())
}

/// Attach the accepted domains to organization rows, keeping the row order.
async fn with_domains<C: ConnectionTrait>(
    db: &C,
    rows: Vec<OrganizationRow>,
) -> Result<Vec<Organization>, OrganizationError> {
    if rows.is_empty() {
        return Ok(Vec::new());
    }
    let ids: Vec<Uuid> = rows.iter().map(|row| row.id).collect();
    let mut domains: BTreeMap<Uuid, Vec<String>> = BTreeMap::new();
    for record in organization_domain::Entity::find()
        .filter(organization_domain::Column::OrganizationId.is_in(ids))
        .filter(organization_domain::Column::Kind.eq("allow"))
        .order_by_asc(organization_domain::Column::Domain)
        .all(db)
        .await?
    {
        domains
            .entry(record.organization_id)
            .or_default()
            .push(record.domain);
    }
    rows.into_iter()
        .map(|row| {
            Ok(Organization {
                organization_type: OrganizationType::parse(&row.organization_type)
                    .ok_or(OrganizationError::Corrupt("unknown organization type"))?,
                email_domains: domains.remove(&row.id).unwrap_or_default(),
                id: row.id,
                english_name: row.english_name,
                chinese_name: row.chinese_name,
                region_code: row.region_code,
            })
        })
        .collect()
}

/// The organizations that accept an email domain.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(super) enum DomainMatch {
    /// No active organization lists the domain or a parent domain.
    Unknown,
    /// The longest listed suffix is an excluded domain.
    Excluded,
    /// The active organizations of the longest listed suffix, in ID order.
    Organizations(Vec<Uuid>),
}

/// Match an email domain against the organization list of one type.
///
/// The longest listed suffix decides. `qatar.cmu.edu` therefore matches the
/// Qatar campus, not `cmu.edu`. An excluded suffix rejects the domain, even
/// when another organization allows the same suffix.
pub(super) async fn match_domain<C: ConnectionTrait>(
    db: &C,
    kind: OrganizationType,
    domain: &str,
) -> Result<DomainMatch, DbErr> {
    let suffixes: Vec<String> = domain_suffixes(domain)
        .into_iter()
        .map(str::to_owned)
        .collect();
    let statement = Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT d.domain, d.organization_id, d.kind
         FROM organization_domain AS d
         JOIN organization AS s ON s.id = d.organization_id
         WHERE s.state = 'active' AND s.organization_type = $2 AND d.domain = ANY($1)",
        [suffixes.into(), kind.as_str().into()],
    );
    let rows = DomainRow::find_by_statement(statement).all(db).await?;
    Ok(decide(domain, &rows))
}

#[derive(Debug, FromQueryResult)]
struct DomainRow {
    domain: String,
    organization_id: Uuid,
    kind: String,
}

/// Pick the rows of the longest suffix of `domain` and decide the match.
fn decide(domain: &str, rows: &[DomainRow]) -> DomainMatch {
    for suffix in domain_suffixes(domain) {
        let matching: Vec<&DomainRow> = rows.iter().filter(|row| row.domain == suffix).collect();
        if matching.is_empty() {
            continue;
        }
        if matching.iter().any(|row| row.kind != "allow") {
            return DomainMatch::Excluded;
        }
        let mut organizations: Vec<Uuid> = matching.iter().map(|row| row.organization_id).collect();
        organizations.sort_unstable();
        organizations.dedup();
        return DomainMatch::Organizations(organizations);
    }
    DomainMatch::Unknown
}

/// Escape `%`, `_` and `\` and wrap the text for a substring `ILIKE`.
fn like_pattern(text: &str) -> String {
    let mut pattern = String::with_capacity(text.len() + 2);
    pattern.push('%');
    for character in text.chars() {
        if matches!(character, '%' | '_' | '\\') {
            pattern.push('\\');
        }
        pattern.push(character);
    }
    pattern.push('%');
    pattern
}

fn to_i64(value: u64) -> i64 {
    i64::try_from(value).unwrap_or(i64::MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(domain: &str, organization: u128, kind: &str) -> DomainRow {
        DomainRow {
            domain: domain.to_owned(),
            organization_id: Uuid::from_u128(organization),
            kind: kind.to_owned(),
        }
    }

    #[test]
    fn the_longest_suffix_decides() {
        let rows = [row("cmu.edu", 1, "allow"), row("qatar.cmu.edu", 2, "allow")];
        assert_eq!(
            decide("qatar.cmu.edu", &rows),
            DomainMatch::Organizations(vec![Uuid::from_u128(2)])
        );
        assert_eq!(
            decide("andrew.cmu.edu", &rows),
            DomainMatch::Organizations(vec![Uuid::from_u128(1)])
        );
        assert_eq!(decide("pitt.edu", &rows), DomainMatch::Unknown);
    }

    #[test]
    fn exclusions_and_shared_domains() {
        let rows = [
            row("xjtlu.edu.cn", 1, "allow"),
            row("alumni.xjtlu.edu.cn", 1, "exclude"),
            row("qu.edu.az", 3, "allow"),
            row("qu.edu.az", 2, "allow"),
        ];
        assert_eq!(decide("alumni.xjtlu.edu.cn", &rows), DomainMatch::Excluded);
        assert_eq!(
            decide("x.alumni.xjtlu.edu.cn", &rows),
            DomainMatch::Excluded
        );
        assert_eq!(
            decide("student.xjtlu.edu.cn", &rows),
            DomainMatch::Organizations(vec![Uuid::from_u128(1)])
        );
        assert_eq!(
            decide("qu.edu.az", &rows),
            DomainMatch::Organizations(vec![Uuid::from_u128(2), Uuid::from_u128(3)])
        );
    }

    #[test]
    fn escapes_like_wildcards() {
        assert_eq!(like_pattern("交通"), "%交通%");
        assert_eq!(like_pattern(r"a_b%c\d"), r"%a\_b\%c\\d%");
    }
}
