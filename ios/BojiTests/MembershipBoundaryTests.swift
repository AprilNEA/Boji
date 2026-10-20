#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class MembershipBoundaryTests: XCTestCase {
    func testServiceConfigurationRejectsUnsafeURLs() {
        let rejected = ["http://example.com", "https://user:pass@example.com", "https://example.com?token=x", "https://example.com#fragment", "file:///tmp/membership", "http://localhost.evil.test"]
        for url in rejected {
            XCTAssertNil(MembershipServiceConfiguration(validating: url, allowLoopbackHTTP: true))
        }
        XCTAssertNotNil(MembershipServiceConfiguration(validating: "https://example.com", allowLoopbackHTTP: false))
        XCTAssertNil(MembershipServiceConfiguration(validating: "http://localhost:3000", allowLoopbackHTTP: false))
        XCTAssertNotNil(MembershipServiceConfiguration(validating: "http://localhost:3000", allowLoopbackHTTP: true))
        XCTAssertEqual(MembershipServiceConfiguration(validating: "http://[::1]:3000", allowLoopbackHTTP: true)?.origin, "http://[::1]:3000")
    }

    func testUnknownTierStatusAndExpiredCardsFailClosed() {
        XCTAssertTrue(card().isActive)
        XCTAssertFalse(card(status: "suspended").isActive)
        XCTAssertFalse(card(status: "unknown").isActive)
        XCTAssertFalse(card(tier: "premium").isActive)
        XCTAssertFalse(card(expiresAt: Date(timeIntervalSince1970: 0)).isActive)
    }

    func testCacheWithoutTokenDoesNotRestoreAnIdentity() async {
        let cache = InMemoryMembershipCacheStore(initialRecord: record())
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: FailingTransport(), cacheStore: cache)
        await store.restore()
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertNil(cache.snapshot())
        XCTAssertNil(store.errorMessage)
    }

    func testCacheFromAnotherServiceIsDiscarded() async {
        let cache = InMemoryMembershipCacheStore(initialRecord: record())
        let store = MembershipStore.testing(serviceURL: URL(string: "https://another.test"), transport: FailingTransport(), tokenStore: InMemoryMembershipTokenStore(initialToken: "test-token"), cacheStore: cache)
        await store.restore()
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertNil(cache.snapshot())
    }

    func testServerFailureMarksCachedStatusAsStale() async {
        let cache = InMemoryMembershipCacheStore(initialRecord: record())
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: FailingTransport(status: 503), tokenStore: InMemoryMembershipTokenStore(initialToken: "test-token"), cacheStore: cache)
        await store.restore()
        XCTAssertNotNil(store.card)
        XCTAssertTrue(store.isOffline)
        XCTAssertNotNil(store.errorMessage)
    }

    func testCacheRoundTripKeepsIdentityAndDates() throws {
        let original = record()
        let data = try MembershipDateCoding.encoder().encode(original)
        let decoded = try MembershipDateCoding.decoder().decode(MembershipCacheRecord.self, from: data)
        XCTAssertEqual(decoded, original)
        XCTAssertFalse(String(decoding: data, as: UTF8.self).contains("Authorization"))
    }

    private func card(status: String = "active", tier: String = "community", expiresAt: Date? = nil) -> ClubMember {
        ClubMember(id: "card-1", userId: "user-1", memberNumber: "BJ-test", displayName: "测试会员", joinedAt: Date(timeIntervalSince1970: 1_792_483_200), tier: tier, status: status, entitlements: ["local_tracking"], expiresAt: expiresAt)
    }
    private func record() -> MembershipCacheRecord {
        MembershipCacheRecord(serviceOrigin: "https://example.test", account: MembershipAccount(id: "user-1", name: "测试会员", email: "member@example.test", emailVerified: true), card: card(), lastSyncedAt: Date(timeIntervalSince1970: 1_792_483_201))
    }
}

private struct FailingTransport: MembershipTransport {
    var status: Int? = nil
    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        if let status { return MembershipHTTPResponse(data: Data("{}".utf8), statusCode: status) }
        throw URLError(.notConnectedToInternet)
    }
}
#endif
