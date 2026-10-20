package club.leanmuscle.boji.core.data

import club.leanmuscle.boji.core.model.BojiState
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

/**
 * JSON for state.json and data export. The output matches the iOS encoder: pretty printed,
 * keys sorted, dates in ISO 8601, and absent optionals omitted.
 */
internal object StateJson {
    @OptIn(ExperimentalSerializationApi::class)
    private val json = Json {
        prettyPrint = true
        prettyPrintIndent = "  "
        encodeDefaults = true
        explicitNulls = false
        ignoreUnknownKeys = true
    }

    fun encode(state: BojiState): String {
        val tree = json.encodeToJsonElement(BojiState.serializer(), state)
        return json.encodeToString(JsonElement.serializer(), tree.withSortedKeys())
    }

    fun decode(text: String): BojiState = json.decodeFromString(BojiState.serializer(), text)

    private fun JsonElement.withSortedKeys(): JsonElement = when (this) {
        is JsonObject -> JsonObject(entries.sortedBy { it.key }.associate { it.key to it.value.withSortedKeys() })
        is JsonArray -> JsonArray(map { it.withSortedKeys() })
        else -> this
    }
}
