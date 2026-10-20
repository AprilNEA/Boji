package club.leanmuscle.boji.core.membership

import androidx.datastore.core.DataStore
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import java.io.IOException

/** The last card that the server confirmed for one account on one server. */
@Serializable
data class CachedMembership(
    val origin: String,
    val userId: String,
    val card: MembershipCard,
    val syncedAtMillis: Long,
)

/** File content of the card cache. */
@Serializable
data class MembershipCacheState(val entry: CachedMembership? = null)

/**
 * The offline copy of the card, encrypted like the session. The app shows it only for the same server
 * and the same account, and labels it 离线副本 until the server confirms it again.
 */
class MembershipCacheStore(private val dataStore: DataStore<MembershipCacheState>) {

    /** Returns null when the cache is empty, unreadable or belongs to another server or account. */
    suspend fun read(origin: String, userId: String): CachedMembership? {
        val entry = dataStore.data
            .map { it.entry }
            .catch { error -> if (error is IOException) emit(null) else throw error }
            .first()
        return entry?.takeIf { it.origin == origin && it.userId == userId }
    }

    suspend fun write(entry: CachedMembership) {
        dataStore.updateData { MembershipCacheState(entry) }
    }

    suspend fun clear() {
        dataStore.updateData { MembershipCacheState() }
    }

    companion object {
        const val FILE_NAME = "membership_cache.enc"
        const val PURPOSE = "club.leanmuscle.boji/membership-cache/v1"
    }
}
