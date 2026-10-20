package club.leanmuscle.boji.core.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.core.handlers.ReplaceFileCorruptionHandler
import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.auth.AuthState
import club.leanmuscle.boji.core.auth.DataCipher
import club.leanmuscle.boji.core.auth.EncryptedJsonSerializer
import club.leanmuscle.boji.core.auth.KeystoreCipher
import club.leanmuscle.boji.core.membership.MembershipCacheState
import club.leanmuscle.boji.core.membership.MembershipCacheStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.KSerializer
import java.io.File
import javax.inject.Qualifier
import javax.inject.Singleton

/** Location of the encrypted session file. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthSessionFile

/** Location of the encrypted card cache. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MembershipCacheFile

/** File locations and the cipher. UI tests replace this module. */
@Module
@InstallIn(SingletonComponent::class)
object AccountFileModule {

    @Provides
    @AuthSessionFile
    fun authSessionFile(@ApplicationContext context: Context): File =
        File(context.noBackupFilesDir, AuthSessionStore.FILE_NAME)

    @Provides
    @MembershipCacheFile
    fun membershipCacheFile(@ApplicationContext context: Context): File =
        File(context.noBackupFilesDir, MembershipCacheStore.FILE_NAME)

    @Provides
    @Singleton
    fun dataCipher(): DataCipher = KeystoreCipher(AuthSessionStore.KEY_ALIAS)
}

/**
 * The session and the card cache. Both files are in noBackupFilesDir and encrypted with the same
 * Keystore key. A file that cannot be decrypted is replaced with an empty value: signed out, no cache.
 */
@Module
@InstallIn(SingletonComponent::class)
object AccountModule {

    @Provides
    @Singleton
    fun authSessionStore(
        @AuthSessionFile file: File,
        cipher: DataCipher,
        @ApplicationScope scope: CoroutineScope,
        @IoDispatcher io: CoroutineDispatcher,
    ): AuthSessionStore = AuthSessionStore(
        encryptedDataStore(
            file = file,
            serializer = AuthState.serializer(),
            defaultValue = AuthState(),
            cipher = cipher,
            purpose = AuthSessionStore.PURPOSE,
            scope = CoroutineScope(scope.coroutineContext + io),
            isEmpty = { it.session == null },
        ),
    )

    @Provides
    @Singleton
    fun membershipCacheStore(
        @MembershipCacheFile file: File,
        cipher: DataCipher,
        @ApplicationScope scope: CoroutineScope,
        @IoDispatcher io: CoroutineDispatcher,
    ): MembershipCacheStore = MembershipCacheStore(
        encryptedDataStore(
            file = file,
            serializer = MembershipCacheState.serializer(),
            defaultValue = MembershipCacheState(),
            cipher = cipher,
            purpose = MembershipCacheStore.PURPOSE,
            scope = CoroutineScope(scope.coroutineContext + io),
            isEmpty = { it.entry == null },
        ),
    )
}

/**
 * A DataStore that keeps [serializer] values as encrypted JSON in [file]. A file that cannot be
 * decrypted or decoded is replaced with [defaultValue]. JVM tests build the stores with this function.
 */
internal fun <T> encryptedDataStore(
    file: File,
    serializer: KSerializer<T>,
    defaultValue: T,
    cipher: DataCipher,
    purpose: String,
    scope: CoroutineScope,
    isEmpty: (T) -> Boolean,
): DataStore<T> = DataStoreFactory.create(
    serializer = EncryptedJsonSerializer(serializer, defaultValue, cipher, purpose, isEmpty),
    corruptionHandler = ReplaceFileCorruptionHandler { defaultValue },
    scope = scope,
    produceFile = { file },
)
