//! The bundled organization list and its import.
//!
//! Input: `data/schools/hipo.json`, a snapshot of the Hipo
//! university-domains-list, and the local corrections in
//! `data/schools/overrides.json`. Both are embedded at build time.
//! Output: the `organization` and `organization_domain` tables, and an import report.
//! Pos: domain write path of the organization list. `boji-bizserver import-schools`
//! is its only caller. `data/schools/README.md` describes the file formats.

use super::{OrganizationType, email::normalize_domain};
use crate::entities::{organization, organization_domain};
use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveValue::Set, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend, DbErr,
    EntityTrait, FromQueryResult, QueryFilter, Statement, TransactionTrait, sea_query::OnConflict,
};
use serde::Deserialize;
use std::collections::{BTreeMap, HashMap};
use thiserror::Error;
use uuid::Uuid;

/// The bundled Hipo snapshot.
const HIPO_JSON: &str = include_str!("../../../data/schools/hipo.json");
/// The bundled local corrections.
const OVERRIDES_JSON: &str = include_str!("../../../data/schools/overrides.json");
/// The upstream commit of the bundled snapshot.
const HIPO_COMMIT: &str = include_str!("../../../data/schools/hipo.commit");

/// The rows of one insert statement. PostgreSQL accepts at most 65,535
/// parameters per statement.
const INSERT_CHUNK: usize = 1000;

/// The type of every organization that this import writes. The Hipo list
/// contains universities and colleges only.
const KIND: OrganizationType = OrganizationType::School;

/// A failure to read or import the organization list.
#[derive(Debug, Error)]
pub enum ImportError {
    /// A data file is not valid JSON of the expected shape.
    #[error("{file} is invalid: {source}")]
    Json {
        /// The file name.
        file: &'static str,
        /// The parse failure.
        source: serde_json::Error,
    },
    /// The data violates a rule of the organization list.
    #[error("{0}")]
    Invalid(String),
    /// A database operation failed.
    #[error("organization import database operation failed: {0}")]
    Database(#[from] DbErr),
}

/// Whether a domain accepts or rejects addresses.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DomainKind {
    /// Addresses at the domain and its subdomains verify the organization.
    Allow,
    /// Addresses at the domain and its subdomains are rejected.
    Exclude,
}

/// Where a domain comes from.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DomainSource {
    /// The Hipo snapshot.
    Hipo,
    /// `overrides.json`.
    Override,
}

/// One domain of an organization in the parsed list.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DomainEntry {
    /// Accept or reject.
    pub kind: DomainKind,
    /// Snapshot or correction.
    pub source: DomainSource,
}

/// One organization of the parsed list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CatalogOrganization {
    /// `{alpha_two_code}:{name}` of the Hipo record.
    pub key: String,
    /// English name.
    pub english_name: String,
    /// Chinese name from the corrections.
    pub chinese_name: Option<String>,
    /// ISO 3166-1 alpha-2 code.
    pub region_code: String,
    /// The domains of the organization.
    pub domains: BTreeMap<String, DomainEntry>,
}

/// The parsed and corrected organization list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Catalog {
    /// The upstream commit of the snapshot.
    pub commit: String,
    /// The number of records in the snapshot.
    pub records: usize,
    /// The organizations in key order.
    pub organizations: Vec<CatalogOrganization>,
}

/// The result of an import.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ImportReport {
    /// The number of active organizations after the import.
    pub organizations: usize,
    /// The number of domain rows after the import.
    pub domains: usize,
    /// The organizations that the import created.
    pub created: usize,
    /// The organizations that this import retired, because the list no longer
    /// contains them.
    pub retired: Vec<RetiredOrganization>,
}

/// An organization that an import retired.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RetiredOrganization {
    /// The source key of the organization.
    pub key: String,
    /// The number of verifications that still name the organization. Each one keeps
    /// counting until it expires. Add a correction when the organization was
    /// renamed upstream.
    pub active_affiliations: i64,
}

#[derive(Deserialize)]
struct HipoRecord {
    name: String,
    alpha_two_code: String,
    domains: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Overrides {
    /// The file covers the `school` type only, so its key is `schools`.
    schools: BTreeMap<String, OrganizationOverride>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct OrganizationOverride {
    chinese_name: Option<String>,
    #[serde(default)]
    merge: Vec<String>,
    #[serde(default)]
    extra_domains: Vec<String>,
    #[serde(default)]
    excluded_domains: Vec<String>,
}

/// Parse the bundled organization list.
pub fn bundled() -> Result<Catalog, ImportError> {
    parse(HIPO_COMMIT.trim(), HIPO_JSON, OVERRIDES_JSON)
}

/// Parse a snapshot and its corrections.
///
/// Records with the same key merge. A correction can name a Chinese name,
/// merge other records, add domains and exclude domains. It cannot add a
/// organization: every key must exist in the snapshot.
pub fn parse(commit: &str, hipo_json: &str, overrides_json: &str) -> Result<Catalog, ImportError> {
    let records: Vec<HipoRecord> =
        serde_json::from_str(hipo_json).map_err(|source| ImportError::Json {
            file: "hipo.json",
            source,
        })?;
    let overrides: Overrides =
        serde_json::from_str(overrides_json).map_err(|source| ImportError::Json {
            file: "overrides.json",
            source,
        })?;

    let mut organizations: BTreeMap<String, CatalogOrganization> = BTreeMap::new();
    for record in &records {
        let name = record.name.trim();
        let region = record.alpha_two_code.trim();
        if name.is_empty() {
            return Err(invalid(format!("a {region} record has an empty name")));
        }
        if region.len() != 2 || !region.bytes().all(|byte| byte.is_ascii_uppercase()) {
            return Err(invalid(format!("{name:?} has the region code {region:?}")));
        }
        let key = format!("{region}:{name}");
        let organization =
            organizations
                .entry(key.clone())
                .or_insert_with(|| CatalogOrganization {
                    key: key.clone(),
                    english_name: name.to_owned(),
                    chinese_name: None,
                    region_code: region.to_owned(),
                    domains: BTreeMap::new(),
                });
        for domain in &record.domains {
            let domain = list_domain(domain)
                .ok_or_else(|| invalid(format!("{key} has the invalid domain {domain:?}")))?;
            organization.domains.insert(
                domain,
                DomainEntry {
                    kind: DomainKind::Allow,
                    source: DomainSource::Hipo,
                },
            );
        }
    }

    apply_merges(&mut organizations, &overrides)?;
    for (key, correction) in &overrides.schools {
        let organization = organizations
            .get_mut(key)
            .ok_or_else(|| invalid(format!("overrides.json names {key}, which was merged")))?;
        apply_correction(organization, correction)?;
    }

    Ok(Catalog {
        commit: commit.to_owned(),
        records: records.len(),
        organizations: organizations.into_values().collect(),
    })
}

/// Move the domains of merged records into their target, then drop them.
fn apply_merges(
    organizations: &mut BTreeMap<String, CatalogOrganization>,
    overrides: &Overrides,
) -> Result<(), ImportError> {
    for key in overrides.schools.keys() {
        if !organizations.contains_key(key) {
            return Err(invalid(format!(
                "overrides.json names {key}, which is not in hipo.json. \
                 Corrections cannot add an organization."
            )));
        }
    }
    let mut merged: HashMap<&str, &str> = HashMap::new();
    for (target, correction) in &overrides.schools {
        for source in &correction.merge {
            if source == target || overrides.schools.contains_key(source) {
                return Err(invalid(format!(
                    "{target} merges {source}, which has its own correction"
                )));
            }
            if let Some(previous) = merged.insert(source, target) {
                return Err(invalid(format!(
                    "{previous} and {target} both merge {source}"
                )));
            }
            let removed = organizations.remove(source).ok_or_else(|| {
                invalid(format!(
                    "{target} merges {source}, which is not in hipo.json"
                ))
            })?;
            if let Some(organization) = organizations.get_mut(target) {
                organization.domains.extend(removed.domains);
            }
        }
    }
    Ok(())
}

/// Apply the name and domain corrections of one organization.
fn apply_correction(
    organization: &mut CatalogOrganization,
    correction: &OrganizationOverride,
) -> Result<(), ImportError> {
    let key = organization.key.clone();
    if let Some(name) = &correction.chinese_name {
        let name = name.trim();
        if name.is_empty() {
            return Err(invalid(format!("{key} has an empty Chinese name")));
        }
        organization.chinese_name = Some(name.to_owned());
    }
    for (domains, kind) in [
        (&correction.extra_domains, DomainKind::Allow),
        (&correction.excluded_domains, DomainKind::Exclude),
    ] {
        for domain in domains {
            let domain = normalize_domain(domain)
                .ok_or_else(|| invalid(format!("{key} corrects the invalid domain {domain:?}")))?;
            organization.domains.insert(
                domain,
                DomainEntry {
                    kind,
                    source: DomainSource::Override,
                },
            );
        }
    }
    Ok(())
}

/// Normalize a snapshot domain. Some records list a web host such as
/// `www.ysu.ac.kr`. Mail uses the domain without `www.`.
fn list_domain(domain: &str) -> Option<String> {
    let domain = normalize_domain(domain)?;
    match domain.strip_prefix("www.") {
        Some(rest) if rest.contains('.') => Some(rest.to_owned()),
        _ => Some(domain),
    }
}

fn invalid(message: String) -> ImportError {
    ImportError::Invalid(message)
}

/// Write the `school` organization list in one transaction.
///
/// The import reads and writes only organizations of the type `school`. It
/// keeps the ID of every organization whose key exists, so resource names
/// stay stable. It replaces every domain row of the type. An organization that
/// the list no longer contains becomes `retired`: it accepts no new
/// verification, and its affiliations count until they expire.
pub async fn import(
    db: &DatabaseConnection,
    catalog: &Catalog,
) -> Result<ImportReport, ImportError> {
    let transaction = db.begin().await?;
    let result = import_in_transaction(&transaction, catalog, Utc::now()).await;
    match result {
        Ok(report) => {
            transaction.commit().await?;
            Ok(report)
        }
        Err(error) => {
            transaction.rollback().await?;
            Err(error)
        }
    }
}

async fn import_in_transaction<C: ConnectionTrait>(
    db: &C,
    catalog: &Catalog,
    now: DateTime<Utc>,
) -> Result<ImportReport, ImportError> {
    // Two imports at once would retire each other's organizations.
    db.execute_unprepared("LOCK TABLE organization, organization_domain IN EXCLUSIVE MODE")
        .await?;
    let existing: HashMap<String, Uuid> = organization::Entity::find()
        .filter(organization::Column::OrganizationType.eq(KIND.as_str()))
        .all(db)
        .await?
        .into_iter()
        .map(|record| (record.source_key, record.id))
        .collect();

    let mut created = 0;
    let mut organizations = Vec::with_capacity(catalog.organizations.len());
    let mut domains = Vec::new();
    for entry in &catalog.organizations {
        let id = match existing.get(&entry.key) {
            Some(id) => *id,
            None => {
                created += 1;
                Uuid::new_v4()
            }
        };
        organizations.push(organization::ActiveModel {
            id: Set(id),
            organization_type: Set(KIND.as_str().to_owned()),
            source_key: Set(entry.key.clone()),
            english_name: Set(entry.english_name.clone()),
            chinese_name: Set(entry.chinese_name.clone()),
            region_code: Set(entry.region_code.clone()),
            state: Set("active".to_owned()),
            imported_at: Set(now),
            created_at: Set(now),
        });
        for (domain, details) in &entry.domains {
            domains.push(organization_domain::ActiveModel {
                domain: Set(domain.clone()),
                organization_id: Set(id),
                kind: Set(match details.kind {
                    DomainKind::Allow => "allow",
                    DomainKind::Exclude => "exclude",
                }
                .to_owned()),
                source: Set(match details.source {
                    DomainSource::Hipo => "hipo",
                    DomainSource::Override => "override",
                }
                .to_owned()),
            });
        }
    }

    let upsert = OnConflict::columns([
        organization::Column::OrganizationType,
        organization::Column::SourceKey,
    ])
    .update_columns([
        organization::Column::EnglishName,
        organization::Column::ChineseName,
        organization::Column::RegionCode,
        organization::Column::State,
        organization::Column::ImportedAt,
    ])
    .to_owned();
    for chunk in organizations.chunks(INSERT_CHUNK) {
        organization::Entity::insert_many(chunk.to_vec())
            .on_conflict(upsert.clone())
            .exec_without_returning(db)
            .await?;
    }
    db.execute_raw(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "DELETE FROM organization_domain AS d USING organization AS s
         WHERE s.id = d.organization_id AND s.organization_type = $1",
        [KIND.as_str().into()],
    ))
    .await?;
    for chunk in domains.chunks(INSERT_CHUNK) {
        organization_domain::Entity::insert_many(chunk.to_vec())
            .exec_without_returning(db)
            .await?;
    }

    let retired = RetiredRow::find_by_statement(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "WITH retired AS (
             UPDATE organization SET state = 'retired'
             WHERE organization_type = $2 AND state = 'active' AND imported_at < $1
             RETURNING id, source_key
         )
         SELECT r.source_key,
                (SELECT count(*) FROM affiliation AS a
                 WHERE a.organization_id = r.id AND a.state = 'active') AS active_affiliations
         FROM retired AS r
         ORDER BY r.source_key",
        [now.into(), KIND.as_str().into()],
    ))
    .all(db)
    .await?
    .into_iter()
    .map(|row| RetiredOrganization {
        key: row.source_key,
        active_affiliations: row.active_affiliations,
    })
    .collect();

    Ok(ImportReport {
        organizations: catalog.organizations.len(),
        domains: domains.len(),
        created,
        retired,
    })
}

#[derive(Debug, FromQueryResult)]
struct RetiredRow {
    source_key: String,
    active_affiliations: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    const HIPO: &str = r#"[
        {"name": "Alpha University", "alpha_two_code": "CN", "country": "China",
         "domains": ["alpha.edu.cn", "WWW.Alpha-Mail.edu.cn"], "web_pages": [], "state-province": null},
        {"name": "Alpha University", "alpha_two_code": "CN", "country": "China",
         "domains": ["alpha2.edu.cn"], "web_pages": [], "state-province": null},
        {"name": "Alpha Univ", "alpha_two_code": "CN", "country": "China",
         "domains": ["old.alpha.edu.cn"], "web_pages": [], "state-province": null},
        {"name": "Beta College", "alpha_two_code": "GB", "country": "United Kingdom",
         "domains": ["beta.ac.uk"], "web_pages": [], "state-province": null}
    ]"#;

    fn organization<'a>(catalog: &'a Catalog, key: &str) -> &'a CatalogOrganization {
        catalog
            .organizations
            .iter()
            .find(|organization| organization.key == key)
            .unwrap_or_else(|| panic!("{key} is missing"))
    }

    #[test]
    fn merges_records_and_applies_corrections() {
        let overrides = r#"{"schools": {
            "CN:Alpha University": {
                "chinese_name": " 阿尔法大学 ",
                "merge": ["CN:Alpha Univ"],
                "extra_domains": ["Mail.Alpha.edu.cn"],
                "excluded_domains": ["alumni.alpha.edu.cn"]
            }
        }}"#;
        let catalog = parse("abc", HIPO, overrides).unwrap();
        assert_eq!(catalog.records, 4);
        assert_eq!(catalog.organizations.len(), 2);
        let alpha = organization(&catalog, "CN:Alpha University");
        assert_eq!(alpha.chinese_name.as_deref(), Some("阿尔法大学"));
        let domains: Vec<(&str, DomainKind, DomainSource)> = alpha
            .domains
            .iter()
            .map(|(domain, entry)| (domain.as_str(), entry.kind, entry.source))
            .collect();
        assert_eq!(
            domains,
            [
                ("alpha-mail.edu.cn", DomainKind::Allow, DomainSource::Hipo),
                ("alpha.edu.cn", DomainKind::Allow, DomainSource::Hipo),
                ("alpha2.edu.cn", DomainKind::Allow, DomainSource::Hipo),
                (
                    "alumni.alpha.edu.cn",
                    DomainKind::Exclude,
                    DomainSource::Override
                ),
                (
                    "mail.alpha.edu.cn",
                    DomainKind::Allow,
                    DomainSource::Override
                ),
                ("old.alpha.edu.cn", DomainKind::Allow, DomainSource::Hipo),
            ]
        );
        assert_eq!(organization(&catalog, "GB:Beta College").chinese_name, None);
    }

    #[test]
    fn rejects_invalid_corrections() {
        for overrides in [
            r#"{"schools": {"CN:Gamma University": {"chinese_name": "伽马大学"}}}"#,
            r#"{"schools": {"CN:Alpha University": {"chinese_name": "  "}}}"#,
            r#"{"schools": {"CN:Alpha University": {"merge": ["CN:Missing"]}}}"#,
            r#"{"schools": {"CN:Alpha University": {"merge": ["CN:Alpha University"]}}}"#,
            r#"{"schools": {"CN:Alpha University": {"merge": ["GB:Beta College"]},
                            "GB:Beta College": {"chinese_name": "贝塔学院"}}}"#,
            r#"{"schools": {"CN:Alpha University": {"extra_domains": ["not a domain"]}}}"#,
            r#"{"schools": {"CN:Alpha University": {"nickname": "Alpha"}}}"#,
        ] {
            assert!(
                parse("abc", HIPO, overrides).is_err(),
                "{overrides} must be rejected"
            );
        }
    }

    #[test]
    fn the_bundled_list_parses() {
        let catalog = bundled().unwrap();
        assert_eq!(catalog.commit, "603e10f51b67c6553b9bca9aecc0db4c2417ed10");
        assert!(catalog.organizations.len() > 10_000);
        let sjtu = organization(&catalog, "CN:Shanghai Jiao Tong University");
        assert_eq!(sjtu.chinese_name.as_deref(), Some("上海交通大学"));
        assert!(sjtu.domains.contains_key("sjtu.edu.cn"));
        assert!(
            !catalog
                .organizations
                .iter()
                .any(|organization| organization.key == "CN:Shanghai Jiaotong University")
        );
        let xjtlu = organization(&catalog, "CN:Xi'an Jiaotong-Liverpool University");
        assert!(xjtlu.domains.contains_key("xjtlu.edu.cn"));
        assert!(
            catalog
                .organizations
                .iter()
                .flat_map(|organization| organization.domains.keys())
                .all(|domain| !domain.starts_with("www."))
        );
    }
}
