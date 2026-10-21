package club.leanmuscle.boji

import android.content.pm.PackageManager
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The Digital Asset Links that credential providers read from the installed app. The resource
 * escapes its quotes, so the test reads the compiled string, as the system does.
 */
@RunWith(AndroidJUnit4::class)
class AssetStatementsTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test
    fun manifestPointsToTheStatements() {
        @Suppress("DEPRECATION") // ApplicationInfoFlags needs API 33; minSdk is 26.
        val info = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        assertEquals(R.string.asset_statements, info.metaData.getInt("asset_statements"))
    }

    @Test
    fun statementsIncludeTheWebsiteFile() {
        val statements = Json.parseToJsonElement(context.getString(R.string.asset_statements)).jsonArray
        val includes = statements.map { it.jsonObject.getValue("include").jsonPrimitive.content }
        assertEquals(listOf("https://leanmuscle.club/.well-known/assetlinks.json"), includes)
    }
}
