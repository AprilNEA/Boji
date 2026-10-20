package club.leanmuscle.boji.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberDecoratedNavEntries
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.ClubArticles
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.feature.club.ArticleScreen
import club.leanmuscle.boji.feature.club.ClubScreen
import club.leanmuscle.boji.feature.onboarding.WelcomeScreen
import club.leanmuscle.boji.feature.progress.ProgressScreen
import club.leanmuscle.boji.feature.settings.SettingsScreen
import club.leanmuscle.boji.feature.today.TodayScreen
import club.leanmuscle.boji.feature.training.TrainingScreen
import club.leanmuscle.boji.feature.training.WorkoutDetailScreen
import club.leanmuscle.boji.feature.training.session.TrainingSessionScreen
import club.leanmuscle.boji.ui.components.storageErrorMessage
import club.leanmuscle.boji.ui.navigation.ArticleRoute
import club.leanmuscle.boji.ui.navigation.BojiDestination
import club.leanmuscle.boji.ui.navigation.ClubRoute
import club.leanmuscle.boji.ui.navigation.HomeRoute
import club.leanmuscle.boji.ui.navigation.ProgressRoute
import club.leanmuscle.boji.ui.navigation.SessionRoute
import club.leanmuscle.boji.ui.navigation.SettingsRoute
import club.leanmuscle.boji.ui.navigation.TodayRoute
import club.leanmuscle.boji.ui.navigation.TrainingRoute
import club.leanmuscle.boji.ui.navigation.WorkoutRoute
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import java.time.temporal.WeekFields
import java.util.Locale
import kotlinx.coroutines.delay

/** How often the shell checks for a new day while the app is in the foreground. */
private const val DAY_REFRESH_MILLIS = 60_000L

/**
 * App root. It shows onboarding until a plan is chosen, then the tabs. A storage error is
 * shown above every screen, as on iOS.
 */
@Composable
fun BojiApp(
    store: BojiStore,
    appearance: Appearance,
    onAppearanceChange: (Appearance) -> Unit,
    modifier: Modifier = Modifier,
    weekFields: WeekFields = WeekFields.of(Locale.getDefault(Locale.Category.FORMAT)),
) {
    val snapshot by store.snapshot.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(store, lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) {
                store.refreshDay()
                delay(DAY_REFRESH_MILLIS)
            }
        }
    }

    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        // Null only until state.json is read, which normally takes less than one frame.
        val current = snapshot ?: return@Surface
        val error = current.storageError
        Column {
            if (error != null) StorageBanner(error)
            Box(Modifier.weight(1f).then(if (error != null) Modifier.consumeWindowInsets(WindowInsets.statusBars) else Modifier)) {
                if (current.state.hasOnboarded) {
                    AppNavigation(rememberUpdatedState(current), store, rememberUpdatedState(appearance), onAppearanceChange, weekFields)
                } else {
                    WelcomeScreen(onStart = store::completeOnboarding)
                }
            }
        }
    }
}

@Composable
private fun StorageBanner(error: StorageError) {
    val message = storageErrorMessage(error)
    val description = stringResource(R.string.storage_error_a11y, message)
    val colors = BojiThemeColors.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.errorContainer)
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(horizontal = 16.dp, vertical = 10.dp)
            .testTag("storage_banner")
            .clearAndSetSemantics {
                contentDescription = description
                liveRegion = LiveRegionMode.Polite
            },
    ) {
        Icon(
            painterResource(R.drawable.ic_health_and_safety),
            contentDescription = null,
            tint = colors.error,
            modifier = Modifier.padding(end = 8.dp).size(18.dp),
        )
        Text(message, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}

/**
 * Top level: the tabs, with the training session above them, like the iOS full-screen cover.
 * Entries receive [State] objects, not values, so a cached entry always reads the latest data.
 */
@Composable
private fun AppNavigation(
    snapshot: State<BojiSnapshot>,
    store: BojiStore,
    appearance: State<Appearance>,
    onAppearanceChange: (Appearance) -> Unit,
    weekFields: WeekFields,
) {
    val appStack = rememberNavBackStack(HomeRoute)
    NavDisplay(
        backStack = appStack,
        onBack = { appStack.removeLastOrNull() },
        entryDecorators = listOf(rememberSaveableStateHolderNavEntryDecorator(), rememberViewModelStoreNavEntryDecorator()),
        entryProvider = entryProvider {
            entry<HomeRoute> {
                HomeTabs(
                    snapshot = snapshot,
                    store = store,
                    appearance = appearance,
                    onAppearanceChange = onAppearanceChange,
                    weekFields = weekFields,
                    onStartSession = { workout -> appStack.add(SessionRoute(workout.id)) },
                )
            }
            entry<SessionRoute> { key ->
                val workout = WorkoutLibrary.byId(key.workoutId)
                if (workout == null) {
                    LaunchedEffect(key) { appStack.remove(key) }
                } else {
                    TrainingSessionScreen(workout = workout, store = store, onClose = { appStack.remove(key) })
                }
            }
        },
    )
}

/**
 * Tabs with one back stack each. Every tab decorates its own entries, so a hidden tab keeps
 * its scroll position and inputs. The display shows the start tab under the current tab, so
 * back from another tab's root returns to the start tab.
 */
@Composable
private fun HomeTabs(
    snapshot: State<BojiSnapshot>,
    store: BojiStore,
    appearance: State<Appearance>,
    onAppearanceChange: (Appearance) -> Unit,
    weekFields: WeekFields,
    onStartSession: (Workout) -> Unit,
) {
    var current by rememberSaveable { mutableStateOf(BojiDestination.Start) }
    val stacks = BojiDestination.entries.associateWith { rememberNavBackStack(it.root) }
    val entries = BojiDestination.entries.associateWith { destination ->
        val stack = stacks.getValue(destination)
        rememberDecoratedNavEntries(
            stack,
            listOf(rememberSaveableStateHolderNavEntryDecorator()),
            tabEntryProvider(destination, stack, snapshot, store, appearance, onAppearanceChange, weekFields, onStartSession),
        )
    }
    val start = entries.getValue(BojiDestination.Start)
    val shown = if (current == BojiDestination.Start) start else start + entries.getValue(current)

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            BojiDestination.entries.forEach { destination ->
                val selected = destination == current
                item(
                    selected = selected,
                    onClick = {
                        if (selected) {
                            stacks.getValue(destination).popToRoot()
                        } else {
                            current = destination
                        }
                    },
                    icon = {
                        // The label below names the item for accessibility services.
                        Icon(painterResource(if (selected) destination.selectedIcon else destination.icon), contentDescription = null)
                    },
                    label = { Text(stringResource(destination.label)) },
                    modifier = Modifier.testTag(destination.tabTag),
                )
            }
        },
    ) {
        NavDisplay(
            entries = shown,
            onBack = {
                val stack = stacks.getValue(current)
                if (stack.size > 1) stack.removeLastOrNull() else current = BojiDestination.Start
            },
        )
    }
}

private fun NavBackStack<NavKey>.popToRoot() {
    while (size > 1) removeAt(lastIndex)
}

/** Entries of one tab. Content keys carry the tab name, because two tabs can show the same route. */
private fun tabEntryProvider(
    tab: BojiDestination,
    stack: NavBackStack<NavKey>,
    snapshot: State<BojiSnapshot>,
    store: BojiStore,
    appearance: State<Appearance>,
    onAppearanceChange: (Appearance) -> Unit,
    weekFields: WeekFields,
    onStartSession: (Workout) -> Unit,
): (NavKey) -> NavEntry<NavKey> {
    val tabKey: (Any) -> Any = { key -> "${tab.name}/$key" }
    val back: () -> Unit = { stack.removeLastOrNull() }
    val openWorkout: (Workout) -> Unit = { stack.add(WorkoutRoute(it.id)) }
    val openSettings: () -> Unit = { stack.add(SettingsRoute) }
    return entryProvider {
        entry<TodayRoute>(tabKey) {
            TodayScreen(snapshot = snapshot.value, store = store, onOpenWorkout = openWorkout, onOpenSettings = openSettings)
        }
        entry<TrainingRoute>(tabKey) {
            TrainingScreen(snapshot = snapshot.value, store = store, onOpenWorkout = openWorkout)
        }
        entry<ProgressRoute>(tabKey) {
            ProgressScreen(snapshot = snapshot.value, store = store)
        }
        entry<ClubRoute>(tabKey) {
            ClubScreen(
                snapshot = snapshot.value,
                store = store,
                weekFields = weekFields,
                onOpenArticle = { stack.add(ArticleRoute(it.id)) },
                onOpenSettings = openSettings,
            )
        }
        entry<WorkoutRoute>(tabKey) { key ->
            val workout = WorkoutLibrary.byId(key.workoutId)
            if (workout == null) {
                LaunchedEffect(key) { stack.remove(key) }
            } else {
                WorkoutDetailScreen(
                    workout = workout,
                    completedToday = snapshot.value.isCompletedToday(workout),
                    onBack = back,
                    onStart = { onStartSession(workout) },
                )
            }
        }
        entry<ArticleRoute>(tabKey) { key ->
            val article = ClubArticles.byId(key.articleId)
            if (article == null) {
                LaunchedEffect(key) { stack.remove(key) }
            } else {
                ArticleScreen(article = article, onBack = back)
            }
        }
        entry<SettingsRoute>(tabKey) {
            SettingsScreen(
                snapshot = snapshot.value,
                store = store,
                appearance = appearance.value,
                onAppearanceChange = onAppearanceChange,
                onBack = back,
            )
        }
    }
}
