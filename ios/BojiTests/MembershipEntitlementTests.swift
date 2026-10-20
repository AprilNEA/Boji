#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class MembershipEntitlementTests: XCTestCase {
    func testNewObjectEntitlementRoundTripsWithDefaultCoders() throws {
        let json = memberJSON(entitlements: """
        [{
          "id":"741079c8-5d71-4b2c-a9a6-07d3cc718296",
          "code":"local_tracking",
          "name":"本地记录",
          "description":"记录训练数据",
          "grantedAt":"2026-10-20T08:00:00.123Z",
          "expiresAt":"2026-11-20T08:00:00Z"
        }]
        """)

        let original = try JSONDecoder().decode(ClubMember.self, from: Data(json.utf8))
        let entitlement = try XCTUnwrap(original.entitlements.first)
        XCTAssertEqual(entitlement.id, "741079c8-5d71-4b2c-a9a6-07d3cc718296")
        XCTAssertEqual(entitlement.code, "local_tracking")
        XCTAssertEqual(entitlement.name, "本地记录")
        XCTAssertEqual(entitlement.description, "记录训练数据")
        XCTAssertFalse(entitlement.isLegacy)
        XCTAssertEqual(try XCTUnwrap(entitlement.grantedAt).timeIntervalSince1970, 1_792_483_200.123, accuracy: 0.001)
        XCTAssertEqual(entitlement.expiresAt?.timeIntervalSince1970, 1_795_161_600)

        let data = try JSONEncoder().encode(original)
        let roundTripped = try JSONDecoder().decode(ClubMember.self, from: data)
        XCTAssertEqual(roundTripped, original)
    }

    func testLegacyStringsKeepOnlyTheirCodeAndEncodeAsStrings() throws {
        let json = memberJSON(entitlements: "[\"local_tracking\"]")

        let card = try JSONDecoder().decode(ClubMember.self, from: Data(json.utf8))
        let entitlement = try XCTUnwrap(card.entitlements.first)
        XCTAssertTrue(entitlement.isLegacy)
        XCTAssertEqual(entitlement.code, "local_tracking")
        XCTAssertNil(entitlement.id)
        XCTAssertNil(entitlement.grantedAt)
        XCTAssertNil(entitlement.expiresAt)
        XCTAssertEqual(entitlement.name, "")
        XCTAssertEqual(entitlement.description, "")
        XCTAssertTrue(card.hasLegacyEntitlements)

        let data = try JSONEncoder().encode(card)
        let payload = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )
        XCTAssertEqual(payload["entitlements"] as? [String], ["local_tracking"])
    }

    func testInvalidNewObjectUUIDOrDateIsRejected() {
        let invalidUUID = memberJSON(entitlements: """
        [{
          "id":"not-a-uuid",
          "code":"local_tracking",
          "name":"本地记录",
          "description":"记录训练数据",
          "grantedAt":"2026-10-20T08:00:00Z",
          "expiresAt":null
        }]
        """)
        let invalidGrantedAt = memberJSON(entitlements: """
        [{
          "id":"741079c8-5d71-4b2c-a9a6-07d3cc718296",
          "code":"local_tracking",
          "name":"本地记录",
          "description":"记录训练数据",
          "grantedAt":"not-an-iso-8601-date",
          "expiresAt":null
        }]
        """)
        let invalidExpiresAt = memberJSON(entitlements: """
        [{
          "id":"741079c8-5d71-4b2c-a9a6-07d3cc718296",
          "code":"local_tracking",
          "name":"本地记录",
          "description":"记录训练数据",
          "grantedAt":"2026-10-20T08:00:00Z",
          "expiresAt":"not-an-iso-8601-date"
        }]
        """)

        for json in [invalidUUID, invalidGrantedAt, invalidExpiresAt] {
            XCTAssertThrowsError(
                try JSONDecoder().decode(ClubMember.self, from: Data(json.utf8))
            )
        }
    }

    func testUnknownEntitlementCodeDoesNotActivate() {
        let date = Date(timeIntervalSince1970: 1_792_483_200)
        let card = member(grantedEntitlements: [
            entitlement(code: "server_defined_feature", grantedAt: date)
        ])

        XCTAssertNil(card.activeEntitlement(for: "server_defined_feature", at: date))
    }

    func testExpiredFutureAndInactiveCardsDoNotActivateEntitlements() {
        let date = Date(timeIntervalSince1970: 1_792_483_200)
        let granted = entitlement(
            code: "local_tracking",
            grantedAt: date.addingTimeInterval(-1)
        )
        let expiredGrant = entitlement(
            code: "local_tracking",
            grantedAt: date.addingTimeInterval(-1),
            expiresAt: date
        )
        let futureGrant = entitlement(
            code: "local_tracking",
            grantedAt: date.addingTimeInterval(1)
        )

        XCTAssertNil(
            member(expiresAt: date, grantedEntitlements: [granted])
                .activeEntitlement(for: "local_tracking", at: date)
        )
        XCTAssertNil(
            member(grantedEntitlements: [expiredGrant])
                .activeEntitlement(for: "local_tracking", at: date)
        )
        XCTAssertNil(
            member(grantedEntitlements: [futureGrant])
                .activeEntitlement(for: "local_tracking", at: date)
        )
        XCTAssertNil(
            member(status: "suspended", grantedEntitlements: [granted])
                .activeEntitlement(for: "local_tracking", at: date)
        )
    }

    func testMixedLegacyAndNewEntitlementsFailsClosedForLegacyOnly() throws {
        let json = memberJSON(entitlements: """
        [
          "local_tracking",
          {
            "id":"741079c8-5d71-4b2c-a9a6-07d3cc718296",
            "code":"progress_history",
            "name":"进度历史",
            "description":"查看进度历史",
            "grantedAt":"2026-10-20T08:00:00Z",
            "expiresAt":null
          }
        ]
        """)
        let date = Date(timeIntervalSince1970: 1_792_483_201)

        let card = try JSONDecoder().decode(ClubMember.self, from: Data(json.utf8))
        XCTAssertTrue(card.hasLegacyEntitlements)
        XCTAssertNil(card.activeEntitlement(for: "local_tracking", at: date))
        XCTAssertNotNil(card.activeEntitlement(for: "progress_history", at: date))
    }

    private func memberJSON(entitlements: String) -> String {
        """
        {
          "id":"membership-1",
          "userId":"user-1",
          "memberNumber":"opaque-member-number",
          "displayName":"测试会员",
          "joinedAt":"2026-10-20T08:00:00Z",
          "tier":"community",
          "status":"active",
          "entitlements":\(entitlements),
          "expiresAt":null
        }
        """
    }

    private func member(
        status: String = "active",
        expiresAt: Date? = nil,
        grantedEntitlements: [MembershipEntitlement]
    ) -> ClubMember {
        ClubMember(
            id: "membership-1",
            userId: "user-1",
            memberNumber: "opaque-member-number",
            displayName: "测试会员",
            joinedAt: Date(timeIntervalSince1970: 1_792_483_200),
            tier: "community",
            status: status,
            grantedEntitlements: grantedEntitlements,
            expiresAt: expiresAt
        )
    }

    private func entitlement(
        code: String,
        grantedAt: Date,
        expiresAt: Date? = nil
    ) -> MembershipEntitlement {
        MembershipEntitlement(
            id: "741079c8-5d71-4b2c-a9a6-07d3cc718296",
            code: code,
            name: "测试权益",
            description: "测试权益描述",
            grantedAt: grantedAt,
            expiresAt: expiresAt
        )
    }
}
#endif
