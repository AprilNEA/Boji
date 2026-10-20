package club.leanmuscle.boji.core.di

import android.content.ContentResolver
import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent

/** Android system services that view models use. */
@Module
@InstallIn(SingletonComponent::class)
object PlatformModule {
    @Provides
    fun contentResolver(@ApplicationContext context: Context): ContentResolver = context.contentResolver
}
