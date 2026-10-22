package club.leanmuscle.boji.core.di

import club.leanmuscle.boji.BuildConfig
import club.leanmuscle.boji.core.network.MemberServiceConfig
import club.leanmuscle.boji.core.network.ServerEndpoint
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.time.Clock
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/** The member service URL and the HTTP client. UI tests replace this module. */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    /** Debug builds also accept http for the local hosts in [ServerEndpoint.LOCAL_HTTP_HOSTS]. */
    @Provides
    fun memberServiceConfig(): MemberServiceConfig = MemberServiceConfig(
        endpoint = ServerEndpoint.parse(BuildConfig.BOJI_API_BASE_URL, allowLocalHttp = BuildConfig.DEBUG),
        googleServerClientId = BuildConfig.GOOGLE_SERVER_CLIENT_ID.ifBlank { null },
    )

    /**
     * One client for Better Auth and Connect. Like the iOS transport, it keeps no cookies and no
     * cache, follows no redirects and limits a call to 20 seconds.
     */
    @Provides
    @Singleton
    fun okHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .followRedirects(false)
        .followSslRedirects(false)
        .connectTimeout(10, TimeUnit.SECONDS)
        .callTimeout(20, TimeUnit.SECONDS)
        .build()
}

@Module
@InstallIn(SingletonComponent::class)
object ClockModule {
    @Provides
    fun clock(): Clock = Clock.systemUTC()
}
