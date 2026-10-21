package club.leanmuscle.boji.wear.data

import android.util.AtomicFile
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException

/** Keeps the last snapshot from the phone. Calls block, so call them on an I/O dispatcher. */
interface SnapshotStore {
    /** The saved bytes, or null when nothing is saved or the file cannot be read. */
    fun load(): ByteArray?

    /** @throws IOException when the file cannot be written. */
    fun save(bytes: ByteArray)
}

/**
 * One file in [directory], normally `noBackupFilesDir`, like the Application Support file of the
 * iOS watch app. Android keeps it in credential-encrypted storage, which unlocks at the first
 * unlock after boot. AtomicFile keeps the previous file when a write fails half way.
 */
class FileSnapshotStore(directory: File) : SnapshotStore {
    private val file = AtomicFile(File(directory, FILE_NAME))

    override fun load(): ByteArray? = try {
        file.readFully()
    } catch (_: FileNotFoundException) {
        null
    } catch (_: IOException) {
        null
    }

    override fun save(bytes: ByteArray) {
        val stream = file.startWrite()
        try {
            stream.write(bytes)
            file.finishWrite(stream)
        } catch (error: IOException) {
            file.failWrite(stream)
            throw error
        }
    }

    private companion object {
        const val FILE_NAME = "companion-snapshot.json"
    }
}
