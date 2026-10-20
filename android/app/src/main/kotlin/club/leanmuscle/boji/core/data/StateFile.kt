package club.leanmuscle.boji.core.data

import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/** Reads and replaces one file. A write never leaves a partly written target file. */
internal class StateFile(private val target: File) {

    /** Returns null when the file does not exist yet. */
    @Throws(IOException::class)
    fun readOrNull(): String? = if (target.exists()) target.readText(Charsets.UTF_8) else null

    @Throws(IOException::class)
    fun write(content: String) {
        val directory = target.absoluteFile.parentFile ?: throw IOException("没有可用的存储目录。")
        if (!directory.isDirectory && !directory.mkdirs()) throw IOException("无法创建存储目录。")
        val temporary = File(directory, "${target.name}.tmp")
        FileOutputStream(temporary).use { stream ->
            stream.write(content.toByteArray(Charsets.UTF_8))
            stream.fd.sync()
        }
        Files.move(temporary.toPath(), target.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    }

    @Throws(IOException::class)
    fun delete() {
        Files.deleteIfExists(target.toPath())
    }
}
