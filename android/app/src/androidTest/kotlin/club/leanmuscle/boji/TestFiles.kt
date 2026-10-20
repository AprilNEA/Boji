package club.leanmuscle.boji

import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.data.StateJson
import club.leanmuscle.boji.core.di.DataFileModule
import club.leanmuscle.boji.core.di.SettingsPreferences
import club.leanmuscle.boji.core.di.StateFile
import club.leanmuscle.boji.core.model.BojiState
import dagger.Module
import dagger.Provides
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import java.io.File
import java.util.UUID
import org.junit.rules.ExternalResource

/**
 * Files of the current test. DataStore allows one active instance per file in a process, and
 * the previous test's instance stays active, so every test uses a new directory.
 */
object TestFiles {
    @Volatile
    var directory: File = newDirectory()
        private set

    val stateFile: File get() = File(directory, BojiStore.STATE_FILE_NAME)
    val settingsFile: File get() = File(directory, "settings.preferences_pb")

    fun reset() {
        directory = newDirectory()
    }

    private fun newDirectory(): File {
        val root = InstrumentationRegistry.getInstrumentation().targetContext.cacheDir
        return File(root, "ui-test/${UUID.randomUUID()}").apply { mkdirs() }
    }
}

@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [DataFileModule::class])
object TestDataFileModule {
    @Provides
    @StateFile
    fun stateFile(): File = TestFiles.stateFile

    @Provides
    @SettingsPreferences
    fun settingsFile(): File = TestFiles.settingsFile
}

/**
 * Gives the test a new directory and writes [state] to state.json before the activity starts.
 * Order it after `HiltAndroidRule` and before the compose rule. A null state leaves no file.
 */
class StateFileRule(private val state: BojiState?) : ExternalResource() {
    override fun before() {
        TestFiles.reset()
        state?.let { TestFiles.stateFile.writeText(StateJson.encode(it)) }
    }

    override fun after() {
        TestFiles.directory.deleteRecursively()
    }
}
