package club.leanmuscle.boji.feature.membership

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.core.content.FileProvider
import club.leanmuscle.boji.core.di.IoDispatcher
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Writes the member share image to `cache/share/`, the only directory that the FileProvider
 * exposes (res/xml/share_paths.xml). Each share replaces the previous file, so at most one image
 * stays on the device, and the system may delete it with the cache.
 */
@Singleton
class MembershipShareImage @Inject constructor(
    @param:ApplicationContext private val context: Context,
    @param:IoDispatcher private val io: CoroutineDispatcher,
) {
    /** Returns a content URI that the share target can read, or null when writing failed. */
    suspend fun write(bitmap: Bitmap): Uri? = withContext(io) {
        try {
            val directory = File(context.cacheDir, DIRECTORY).apply { mkdirs() }
            val file = File(directory, FILE_NAME)
            file.outputStream().use { output ->
                if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)) return@withContext null
            }
            FileProvider.getUriForFile(context, "${context.packageName}.share", file)
        } catch (e: IOException) {
            null
        } catch (e: IllegalArgumentException) {
            null
        }
    }

    private companion object {
        const val DIRECTORY = "share"
        const val FILE_NAME = "boji-member-card.png"
    }
}
