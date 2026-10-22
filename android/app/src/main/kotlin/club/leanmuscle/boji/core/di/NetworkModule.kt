package club.leanmuscle.boji.core.di

import club.leanmuscle.boji.BuildConfig
import club.leanmuscle.boji.core.network.MemberServiceConfig
import club.leanmuscle.boji.core.network.ServerEndpoint
import club.leanmuscle.boji.feature.training.EXERCISE_ANIMATION_BASE_URL
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.time.Clock
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

/** The public asset client cannot gain member-service identity behavior. */
@Qualifier
@Retention(AnnotationRetention.RUNTIME)
annotation class AssetAnimationClient

/** The public animation endpoint is injectable so tests never reach the asset host. */
@Qualifier
@Retention(AnnotationRetention.RUNTIME)
annotation class ExerciseAnimationBaseUrl

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

    /** Dedicated public-asset client. It has no cookie jar, cache, auth, or member interceptors. */
    @Provides
    @Singleton
    @AssetAnimationClient
    fun assetAnimationClient(client: OkHttpClient): OkHttpClient = client.newBuilder()
        .followRedirects(false)
        .followSslRedirects(false)
        .cookieJar(okhttp3.CookieJar.NO_COOKIES)
        .cache(null)
        .callTimeout(15, TimeUnit.SECONDS)
        .build()

    @Provides
    @ExerciseAnimationBaseUrl
    fun exerciseAnimationBaseUrl(): String = EXERCISE_ANIMATION_BASE_URL
}

@Module
@InstallIn(SingletonComponent::class)
object ClockModule {
    @Provides
    fun clock(): Clock = Clock.systemUTC()
}
