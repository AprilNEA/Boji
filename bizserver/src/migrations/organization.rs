//! Organization-ranking table migration helpers.
//!
//! Input: the authentication tables of `auth`.
//! Output: the organization lists, the affiliations of users, their events,
//! the short-lived email verification codes and the frozen ranking counts.
//! Pos: migration only. `crate::domain::organization` owns the rules. The database
//! enforces the stored states and the one-address-one-account rule.

use sea_orm_migration::prelude::*;

/// The stored values of `organization_type`. The domain maps each value to a
/// `boji.v1.OrganizationType`. Add a value here and in the domain together.
const ORGANIZATION_TYPES: [&str; 1] = ["school"];

/// Create the organization tables.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    create_organization(manager).await?;
    create_organization_domain(manager).await?;
    create_affiliation(manager).await?;
    create_affiliation_event(manager).await?;
    create_affiliation_email_verification(manager).await?;
    create_organization_standing_freeze(manager).await
}

async fn create_organization(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(Organization::Table)
                .col(
                    ColumnDef::new(Organization::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(ColumnDef::new(Organization::Type).text().not_null())
                .col(ColumnDef::new(Organization::SourceKey).text().not_null())
                .col(ColumnDef::new(Organization::EnglishName).text().not_null())
                .col(ColumnDef::new(Organization::ChineseName).text())
                .col(ColumnDef::new(Organization::RegionCode).text().not_null())
                .col(ColumnDef::new(Organization::State).text().not_null())
                .col(
                    ColumnDef::new(Organization::ImportedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(Organization::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .check(Check::named(
                    "organization_type_check",
                    Expr::col(Organization::Type).is_in(ORGANIZATION_TYPES),
                ))
                .check(Check::named(
                    "organization_state_check",
                    Expr::col(Organization::State).is_in(["active", "retired"]),
                ))
                .check(Check::named(
                    "organization_region_code_check",
                    Expr::cust("\"region_code\" ~ '^[A-Z]{2}$'"),
                ))
                .check(Check::named(
                    "organization_names_not_blank",
                    Expr::cust(
                        "btrim(\"english_name\") <> '' \
                         AND (\"chinese_name\" IS NULL OR btrim(\"chinese_name\") <> '')",
                    ),
                ))
                .to_owned(),
        )
        .await?;
    // Each organization list names its entries with its own source keys.
    manager
        .create_index(
            Index::create()
                .name("organization_type_source_key_key")
                .table(Organization::Table)
                .col(Organization::Type)
                .col(Organization::SourceKey)
                .unique()
                .to_owned(),
        )
        .await?;
    // The target of the composite foreign key of `affiliation`, so that an
    // affiliation names an organization of its own type.
    manager
        .create_index(
            Index::create()
                .name("organization_id_type_key")
                .table(Organization::Table)
                .col(Organization::Id)
                .col(Organization::Type)
                .unique()
                .to_owned(),
        )
        .await
}

async fn create_organization_domain(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(OrganizationDomain::Table)
                .col(ColumnDef::new(OrganizationDomain::Domain).text().not_null())
                .col(
                    ColumnDef::new(OrganizationDomain::OrganizationId)
                        .uuid()
                        .not_null(),
                )
                .col(ColumnDef::new(OrganizationDomain::Kind).text().not_null())
                .col(ColumnDef::new(OrganizationDomain::Source).text().not_null())
                .primary_key(
                    Index::create()
                        .col(OrganizationDomain::Domain)
                        .col(OrganizationDomain::OrganizationId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("organization_domain_organization_id_fkey")
                        .from(
                            OrganizationDomain::Table,
                            OrganizationDomain::OrganizationId,
                        )
                        .to(Organization::Table, Organization::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check(Check::named(
                    "organization_domain_kind_check",
                    Expr::col(OrganizationDomain::Kind).is_in(["allow", "exclude"]),
                ))
                .check(Check::named(
                    "organization_domain_source_check",
                    Expr::col(OrganizationDomain::Source).is_in(["hipo", "override"]),
                ))
                .check(Check::named(
                    "organization_domain_lowercase",
                    Expr::cust("\"domain\" = lower(\"domain\") AND \"domain\" LIKE '%_._%'"),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("organization_domain_organization_id_idx")
                .table(OrganizationDomain::Table)
                .col(OrganizationDomain::OrganizationId)
                .to_owned(),
        )
        .await
}

async fn create_affiliation(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(Affiliation::Table)
                .col(ColumnDef::new(Affiliation::UserId).text().not_null())
                .col(ColumnDef::new(Affiliation::OrganizationType).text().not_null())
                .col(ColumnDef::new(Affiliation::OrganizationId).uuid().not_null())
                .col(ColumnDef::new(Affiliation::State).text().not_null())
                .col(ColumnDef::new(Affiliation::EmailHmac).binary())
                .col(ColumnDef::new(Affiliation::EmailDomain).text().not_null())
                .col(
                    ColumnDef::new(Affiliation::VerifiedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(Affiliation::CountedSince)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(Affiliation::OrganizationSince)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(Affiliation::ExpiresAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(ColumnDef::new(Affiliation::EndedAt).timestamp_with_time_zone())
                // A user holds at most one organization of each type.
                .primary_key(
                    Index::create()
                        .col(Affiliation::UserId)
                        .col(Affiliation::OrganizationType),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("affiliation_user_id_fkey")
                        .from(Affiliation::Table, Affiliation::UserId)
                        .to(User::Table, User::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("affiliation_organization_fkey")
                        .from(
                            Affiliation::Table,
                            (Affiliation::OrganizationId, Affiliation::OrganizationType),
                        )
                        .to(
                            Organization::Table,
                            (Organization::Id, Organization::Type),
                        )
                        .on_delete(ForeignKeyAction::Restrict),
                )
                .check(Check::named(
                    "affiliation_state_check",
                    Expr::col(Affiliation::State).is_in(["active", "ended"]),
                ))
                // An ended verification keeps no address hash, so the address can
                // verify another account.
                .check(Check::named(
                    "affiliation_state_fields",
                    Expr::cust(
                        "(\"state\" = 'active' AND \"email_hmac\" IS NOT NULL AND \"ended_at\" IS NULL) \
                         OR (\"state\" = 'ended' AND \"email_hmac\" IS NULL AND \"ended_at\" IS NOT NULL)",
                    ),
                ))
                .check(Check::named(
                    "affiliation_times",
                    Expr::cust(
                        "\"organization_since\" <= \"counted_since\" \
                         AND \"counted_since\" <= \"verified_at\" \
                         AND \"verified_at\" < \"expires_at\"",
                    ),
                ))
                .to_owned(),
        )
        .await?;
    // One email address counts for one account per organization type. Ended
    // rows store NULL, and PostgreSQL treats NULL values as distinct.
    manager
        .create_index(
            Index::create()
                .name("affiliation_type_email_hmac_key")
                .table(Affiliation::Table)
                .col(Affiliation::OrganizationType)
                .col(Affiliation::EmailHmac)
                .unique()
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_organization_id_idx")
                .table(Affiliation::Table)
                .col(Affiliation::OrganizationId)
                .to_owned(),
        )
        .await
}

async fn create_affiliation_event(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(AffiliationEvent::Table)
                .col(
                    ColumnDef::new(AffiliationEvent::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(ColumnDef::new(AffiliationEvent::UserId).text().not_null())
                .col(
                    ColumnDef::new(AffiliationEvent::OrganizationId)
                        .uuid()
                        .not_null(),
                )
                .col(ColumnDef::new(AffiliationEvent::Action).text().not_null())
                .col(
                    ColumnDef::new(AffiliationEvent::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("affiliation_event_user_id_fkey")
                        .from(AffiliationEvent::Table, AffiliationEvent::UserId)
                        .to(User::Table, User::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("affiliation_event_organization_id_fkey")
                        .from(AffiliationEvent::Table, AffiliationEvent::OrganizationId)
                        .to(Organization::Table, Organization::Id)
                        .on_delete(ForeignKeyAction::Restrict),
                )
                .check(Check::named(
                    "affiliation_event_action_check",
                    Expr::col(AffiliationEvent::Action).is_in([
                        "verified",
                        "renewed",
                        "changed",
                        "left",
                        "displaced",
                        "revoked",
                    ]),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_event_organization_time_idx")
                .table(AffiliationEvent::Table)
                .col(AffiliationEvent::OrganizationId)
                .col(AffiliationEvent::CreatedAt)
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_event_user_id_idx")
                .table(AffiliationEvent::Table)
                .col(AffiliationEvent::UserId)
                .to_owned(),
        )
        .await
}

async fn create_affiliation_email_verification(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(AffiliationEmailVerification::Table)
                .col(
                    ColumnDef::new(AffiliationEmailVerification::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::UserId)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::OrganizationType)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::EmailHmac)
                        .binary()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::EmailDomain)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::MaskedEmail)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::CandidateOrganizationIds)
                        .json_binary()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::CodeHmac)
                        .binary()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::FailedAttempts)
                        .integer()
                        .not_null()
                        .default(0),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::ExpiresAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AffiliationEmailVerification::ConsumedAt)
                        .timestamp_with_time_zone(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("affiliation_email_verification_user_id_fkey")
                        .from(
                            AffiliationEmailVerification::Table,
                            AffiliationEmailVerification::UserId,
                        )
                        .to(User::Table, User::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check(Check::named(
                    "affiliation_email_verification_type_check",
                    Expr::col(AffiliationEmailVerification::OrganizationType)
                        .is_in(ORGANIZATION_TYPES),
                ))
                .check(Check::named(
                    "affiliation_email_verification_attempts_check",
                    Expr::col(AffiliationEmailVerification::FailedAttempts).gte(0),
                ))
                .check(Check::named(
                    "affiliation_email_verification_candidates_check",
                    Expr::cust(
                        "jsonb_typeof(\"candidate_organization_ids\") = 'array' \
                         AND jsonb_array_length(\"candidate_organization_ids\") > 0",
                    ),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_email_verification_user_time_idx")
                .table(AffiliationEmailVerification::Table)
                .col(AffiliationEmailVerification::UserId)
                .col(AffiliationEmailVerification::CreatedAt)
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_email_verification_email_time_idx")
                .table(AffiliationEmailVerification::Table)
                .col(AffiliationEmailVerification::EmailHmac)
                .col(AffiliationEmailVerification::CreatedAt)
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("affiliation_email_verification_created_at_idx")
                .table(AffiliationEmailVerification::Table)
                .col(AffiliationEmailVerification::CreatedAt)
                .to_owned(),
        )
        .await
}

/// The counts of an organization at freeze time. A row exists while the organization is
/// frozen. `reach_time` is null exactly when the organization had no member.
async fn create_organization_standing_freeze(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(OrganizationStandingFreeze::Table)
                .col(
                    ColumnDef::new(OrganizationStandingFreeze::OrganizationId)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(OrganizationStandingFreeze::MemberCount)
                        .big_integer()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(OrganizationStandingFreeze::WeeklyNewCount)
                        .big_integer()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(OrganizationStandingFreeze::ReachTime)
                        .timestamp_with_time_zone(),
                )
                .col(ColumnDef::new(OrganizationStandingFreeze::ActorUserId).text())
                .col(
                    ColumnDef::new(OrganizationStandingFreeze::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("organization_standing_freeze_organization_id_fkey")
                        .from(
                            OrganizationStandingFreeze::Table,
                            OrganizationStandingFreeze::OrganizationId,
                        )
                        .to(Organization::Table, Organization::Id)
                        .on_delete(ForeignKeyAction::Restrict),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("organization_standing_freeze_actor_user_id_fkey")
                        .from(
                            OrganizationStandingFreeze::Table,
                            OrganizationStandingFreeze::ActorUserId,
                        )
                        .to(User::Table, User::Id)
                        .on_delete(ForeignKeyAction::SetNull),
                )
                .check(Check::named(
                    "organization_standing_freeze_counts",
                    Expr::cust(
                        "\"member_count\" >= 0 \
                         AND \"weekly_new_count\" >= 0 \
                         AND \"weekly_new_count\" <= \"member_count\" \
                         AND (\"member_count\" = 0) = (\"reach_time\" IS NULL)",
                    ),
                ))
                .to_owned(),
        )
        .await
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Organization {
    Table,
    Id,
    #[sea_orm(iden = "organization_type")]
    Type,
    SourceKey,
    EnglishName,
    ChineseName,
    RegionCode,
    State,
    ImportedAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum OrganizationDomain {
    Table,
    Domain,
    OrganizationId,
    Kind,
    Source,
}

#[derive(DeriveIden)]
enum Affiliation {
    Table,
    UserId,
    OrganizationType,
    OrganizationId,
    State,
    EmailHmac,
    EmailDomain,
    VerifiedAt,
    CountedSince,
    OrganizationSince,
    ExpiresAt,
    EndedAt,
}

#[derive(DeriveIden)]
enum AffiliationEvent {
    Table,
    Id,
    UserId,
    OrganizationId,
    Action,
    CreatedAt,
}

#[derive(DeriveIden)]
enum AffiliationEmailVerification {
    Table,
    Id,
    UserId,
    OrganizationType,
    EmailHmac,
    EmailDomain,
    MaskedEmail,
    CandidateOrganizationIds,
    CodeHmac,
    FailedAttempts,
    CreatedAt,
    ExpiresAt,
    ConsumedAt,
}

#[derive(DeriveIden)]
enum OrganizationStandingFreeze {
    Table,
    OrganizationId,
    MemberCount,
    WeeklyNewCount,
    ReachTime,
    ActorUserId,
    CreatedAt,
}
