package club.leanmuscle.boji

import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.auth.DataCipher
import club.leanmuscle.boji.core.auth.KeystoreCipher
import club.leanmuscle.boji.core.di.AccountFileModule
import club.leanmuscle.boji.core.di.AuthSessionFile
import club.leanmuscle.boji.core.di.MembershipCacheFile
import club.leanmuscle.boji.core.di.NetworkModule
import club.leanmuscle.boji.core.membership.MembershipCacheStore
import club.leanmuscle.boji.core.network.MemberServiceConfig
import club.leanmuscle.boji.core.network.ServerEndpoint
import dagger.Module
import dagger.Provides
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import java.io.File
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import okhttp3.OkHttpClient

/**
 * The member service of the current test. Null means "not configured", so a UI test never reaches
 * the debug server on the host. A test sets it before the app first needs the member service.
 */
object TestNetwork {
    @Volatile
    var endpoint: ServerEndpoint? = null
}

@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [NetworkModule::class])
object TestNetworkModule {
    @Provides
    fun memberServiceConfig(): MemberServiceConfig = MemberServiceConfig(TestNetwork.endpoint)

    @Provides
    @Singleton
    fun okHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .followRedirects(false)
        .callTimeout(10, TimeUnit.SECONDS)
        .build()
}

/** Account files live in the test's directory. The key alias is separate from the app's key. */
@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [AccountFileModule::class])
object TestAccountFileModule {
    const val KEY_ALIAS = "boji.ui-test.v1"

    @Provides
    @AuthSessionFile
    fun authSessionFile(): File = File(TestFiles.directory, AuthSessionStore.FILE_NAME)

    @Provides
    @MembershipCacheFile
    fun membershipCacheFile(): File = File(TestFiles.directory, MembershipCacheStore.FILE_NAME)

    @Provides
    @Singleton
    fun dataCipher(): DataCipher = KeystoreCipher(KEY_ALIAS)
}
