package club.leanmuscle.boji.core.data

import androidx.datastore.core.CorruptionException
import androidx.datastore.core.Serializer
import club.leanmuscle.boji.core.model.BojiState
import java.io.InputStream
import java.io.OutputStream
import java.time.DateTimeException

/**
 * DataStore serializer for state.json. The bytes are the same JSON that iOS writes and that
 * data export produces, see [StateJson].
 *
 * A file that cannot be decoded raises [CorruptionException], which is an IOException. The
 * store has no corruption handler, so DataStore refuses every write and the file is never
 * overwritten. Any other exception would escape the store's error handling and crash the app.
 *
 * [defaultDisplayName] returns the nickname of a new state in the current text language. DataStore
 * reads [defaultValue] while state.json does not exist, so the first write stores that name.
 */
internal class BojiStateSerializer(
    private val defaultDisplayName: () -> String,
) : Serializer<BojiState> {
    override val defaultValue: BojiState
        get() = BojiState(displayName = defaultDisplayName())

    override suspend fun readFrom(input: InputStream): BojiState {
        val text = input.readBytes().toString(Charsets.UTF_8)
        return try {
            StateJson.decode(text)
        } catch (error: IllegalArgumentException) {
            // Includes SerializationException: invalid JSON, missing fields or wrong types.
            throw CorruptionException("state.json 无法解析。", error)
        } catch (error: DateTimeException) {
            // Iso8601InstantSerializer rejects a date that is not ISO 8601.
            throw CorruptionException("state.json 包含无效日期。", error)
        }
    }

    override suspend fun writeTo(t: BojiState, output: OutputStream) {
        output.write(StateJson.encode(t).toByteArray(Charsets.UTF_8))
    }
}
