#if DEBUG
import Foundation
import XCTest
@testable import Boji

final class MembershipPresentationTests: XCTestCase {
    func testPledgesMatchClubRules() {
        XCTAssertEqual(MembershipPledge.all.map(\.id), ["belonging", "pace", "privacy"])
        XCTAssertEqual(MembershipPledge.all.map(\.title), [
            "人人都有位置",
            "尊重自己的节奏",
            "尊重他人与隐私"
        ])
        XCTAssertEqual(MembershipPledge.all.map(\.detail), [
            "不以身材、体重或体脂决定是否可以加入。",
            "不排名，不鼓励极端减脂；不舒服时停止训练。",
            "不冒用他人身份，不在昵称中包含他人隐私。"
        ])
    }

    func testDraftNormalizesAndValidatesNameBoundaries() {
        var draft = MembershipEnrollmentDraft()
        XCTAssertEqual(draft.normalizedName, "")
        XCTAssertNotNil(draft.nameError)

        draft.name = "  小王 😀  "
        XCTAssertEqual(draft.normalizedName, "小王 😀")
        XCTAssertNil(draft.nameError)

        draft.name = String(repeating: "😀", count: 24)
        XCTAssertEqual(draft.normalizedName.count, 24)
        XCTAssertNil(draft.nameError)

        draft.name = String(repeating: "好", count: 25)
        XCTAssertNotNil(draft.nameError)

        draft.name = "会员\n昵称"
        XCTAssertNotNil(draft.nameError)

        draft.name = "会员\u{0000}昵称"
        XCTAssertNotNil(draft.nameError)

        draft.name = "训练者👩‍💻"
        XCTAssertNil(draft.nameError)
        draft.name = "会员\u{2028}昵称"
        XCTAssertNotNil(draft.nameError)
    }

    func testDraftRequiresEachPledgeAndDataUseConsent() {
        var draft = MembershipEnrollmentDraft(name: "会员")
        XCTAssertFalse(draft.canReview)
        XCTAssertFalse(draft.canSubmit)

        for (index, pledge) in MembershipPledge.all.enumerated() {
            draft.confirmedPledges.insert(pledge.id)
            XCTAssertEqual(draft.confirmedCount, index + 1)
            XCTAssertEqual(draft.canReview, index == MembershipPledge.all.count - 1)
        }

        XCTAssertTrue(draft.canReview)
        XCTAssertFalse(draft.canSubmit)

        draft.acceptedDataUse = true
        XCTAssertTrue(draft.canSubmit)

        draft.confirmedPledges.remove("pace")
        XCTAssertEqual(draft.confirmedCount, 2)
        XCTAssertFalse(draft.canReview)
        XCTAssertFalse(draft.canSubmit)
    }

    func testUnknownPledgeDoesNotCountTowardReview() {
        var draft = MembershipEnrollmentDraft(name: "会员")
        draft.confirmedPledges = Set(MembershipPledge.all.map(\.id))
        draft.confirmedPledges.insert("future-server-pledge")

        XCTAssertEqual(draft.confirmedCount, MembershipPledge.all.count)
        XCTAssertTrue(draft.canReview)

        draft.confirmedPledges = ["future-server-pledge"]
        XCTAssertEqual(draft.confirmedCount, 0)
        XCTAssertFalse(draft.canReview)
    }

    func testShareSnapshotPreservesOrHidesOpaqueMemberNumber() {
        let opaqueNumber = "00/会员-A7-🪪"
        let card = makeCard(memberNumber: opaqueNumber)
        let shown = MembershipShareSnapshot(
            card: card,
            options: MembershipShareOptions(showsMemberNumber: true),
            isOffline: true,
            isTest: true,
            generatedAt: fixedDate
        )
        let hidden = MembershipShareSnapshot(
            card: card,
            options: MembershipShareOptions(),
            isOffline: false,
            isTest: false,
            generatedAt: fixedDate
        )

        XCTAssertEqual(shown.memberNumber, opaqueNumber)
        XCTAssertNil(hidden.memberNumber)
        XCTAssertEqual(shown.displayName, card.displayName)
        XCTAssertEqual(shown.joinedAt, card.joinedAt)
        XCTAssertEqual(shown.generatedAt, fixedDate)
        XCTAssertTrue(shown.isOffline)
        XCTAssertTrue(shown.isTest)
    }

    func testShareSnapshotJSONContainsOnlyPublicFields() throws {
        let snapshot = MembershipShareSnapshot(
            card: makeCard(memberNumber: "opaque-number"),
            options: MembershipShareOptions(showsMemberNumber: true),
            isOffline: false,
            isTest: false,
            generatedAt: fixedDate
        )

        let data = try JSONEncoder().encode(snapshot)
        let payload = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )

        XCTAssertEqual(
            Set(payload.keys),
            ["displayName", "memberNumber", "joinedAt", "generatedAt", "isOffline", "isTest"]
        )
        for privateKey in ["id", "userId", "email", "entitlements", "token"] {
            XCTAssertNil(payload[privateKey])
        }
    }

    func testCardConditionResolvesAllStatesWithRequiredPrecedence() {
        let date = fixedDate

        XCTAssertEqual(
            MembershipCardCondition.resolve(card: makeCard(), isOffline: false, at: date),
            .active
        )
        XCTAssertEqual(
            MembershipCardCondition.resolve(card: makeCard(), isOffline: true, at: date),
            .offline
        )
        XCTAssertEqual(
            MembershipCardCondition.resolve(
                card: makeCard(status: "suspended", expiresAt: date),
                isOffline: true,
                at: date
            ),
            .suspended
        )
        XCTAssertEqual(
            MembershipCardCondition.resolve(
                card: makeCard(expiresAt: date),
                isOffline: false,
                at: date
            ),
            .expired
        )
        XCTAssertEqual(
            MembershipCardCondition.resolve(
                card: makeCard(tier: "unknown"),
                isOffline: false,
                at: date
            ),
            .unavailable
        )
        XCTAssertEqual(
            MembershipCardCondition.resolve(
                card: makeCard(status: "unknown"),
                isOffline: false,
                at: date
            ),
            .unavailable
        )
    }

    private var fixedDate: Date {
        Date(timeIntervalSince1970: 1_792_483_200)
    }

    private func makeCard(
        memberNumber: String = "opaque-member-number",
        tier: String = "community",
        status: String = "active",
        expiresAt: Date? = nil
    ) -> ClubMember {
        ClubMember(
            id: "membership-internal-id",
            userId: "user-internal-id",
            memberNumber: memberNumber,
            displayName: "测试会员",
            joinedAt: fixedDate.addingTimeInterval(-60),
            tier: tier,
            status: status,
            entitlements: ["local_tracking"],
            expiresAt: expiresAt
        )
    }
}
#endif
