package club.leanmuscle.boji.feature.training.session

import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.activity.compose.BackHandler
import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.feature.training.ExerciseAnimation
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.ContentMaxWidth
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.OrbitArtwork
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.iconRes
import club.leanmuscle.boji.ui.components.repsText
import club.leanmuscle.boji.ui.components.textLocale
import club.leanmuscle.boji.ui.theme.BojiThemeColors

/** Full-screen session. System back asks for confirmation, like the iOS 结束 button. */
@Composable
fun TrainingSessionScreen(
    workout: Workout,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TrainingSessionViewModel =
        hiltViewModel<TrainingSessionViewModel, TrainingSessionViewModel.Factory>(key = workout.id) { it.create(workout) },
) {
    val session by viewModel.session.collectAsStateWithLifecycle()
    val animationCacheVersion by viewModel.animationCacheVersion.collectAsStateWithLifecycle()
    var confirmEnd by rememberSaveable { mutableStateOf(false) }

    // Leaving the foreground pauses the session, as on iOS. A configuration change (rotation,
    // light or dark mode) also recreates the activity, but the session keeps running then.
    val activity = LocalActivity.current
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) {
        if (activity?.isChangingConfigurations != true) viewModel.setRunning(false)
    }

    val requestEnd = {
        viewModel.setRunning(false)
        confirmEnd = true
    }
    BackHandler(enabled = !session.finished, onBack = requestEnd)
    BackHandler(enabled = session.finished, onBack = onClose)

    BojiScaffold(
        title = stringResource(if (session.finished) R.string.session_finished_title else R.string.session_title),
        modifier = modifier.testTag("screen_Session"),
        actions = {
            if (!session.finished) {
                TextButton(onClick = requestEnd, modifier = Modifier.testTag("session_end")) {
                    Icon(painterResource(R.drawable.ic_close), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.session_end), modifier = Modifier.padding(start = 4.dp))
                }
            }
        },
    ) { padding ->
        if (session.finished) {
            FinishedContent(session = session, onDone = onClose, modifier = Modifier.padding(padding))
        } else {
            ActiveContent(
                session = session,
                onPrimary = viewModel::primaryAction,
                onToggleRunning = { viewModel.setRunning(!session.running) },
                animationCacheVersion = animationCacheVersion,
                cachedAnimation = viewModel::cachedAnimation,
                modifier = Modifier.padding(padding),
            )
        }
    }

    if (confirmEnd) {
        AlertDialog(
            onDismissRequest = {
                confirmEnd = false
                viewModel.setRunning(true)
            },
            title = { Text(stringResource(R.string.session_end_confirm_title)) },
            text = { Text(stringResource(R.string.session_end_confirm_text)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmEnd = false
                        onClose()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.testTag("session_end_confirm"),
                ) { Text(stringResource(R.string.session_end_confirm)) }
            },
            dismissButton = {
                TextButton(onClick = {
                    confirmEnd = false
                    viewModel.setRunning(true)
                }) { Text(stringResource(R.string.session_resume)) }
            },
        )
    }
}

@Composable
private fun ActiveContent(
    session: TrainingSession,
    onPrimary: () -> Unit,
    onToggleRunning: () -> Unit,
    animationCacheVersion: Int,
    cachedAnimation: (String, Boolean) -> club.leanmuscle.boji.feature.training.CachedRemoteAnimation?,
    modifier: Modifier = Modifier,
) {
    val workout = session.workout
    val calm = BojiThemeColors.current.calm
    val progressLabel = stringResource(R.string.session_progress_a11y, session.completedSets, workout.totalSets)
    Column(modifier = modifier) {
        PageColumn(modifier = Modifier.weight(1f), spacing = 20.dp) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    stringResource(R.string.session_progress, session.index + 1, workout.exercises.size),
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    formatClock(session.elapsedSeconds),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            LinearProgressIndicator(
                progress = { session.completedSets.toFloat() / workout.totalSets },
                modifier = Modifier.fillMaxWidth().clearAndSetSemantics { contentDescription = progressLabel },
            )
            // One fixed square for both states, so the layout does not move between sets and rests.
            Box(Modifier.align(Alignment.CenterHorizontally).size(ArtworkSize), contentAlignment = Alignment.Center) {
                if (session.isResting) {
                    OrbitArtwork(icon = R.drawable.ic_self_improvement, color = calm)
                } else {
                    val primary = MaterialTheme.colorScheme.primary
                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = BojiThemeColors.current.card,
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        val dark = BojiThemeColors.isDark
                        val remoteAnimation = remember(session.exercise.id, dark, animationCacheVersion) {
                            cachedAnimation(session.exercise.id, dark)
                        }
                        ExerciseAnimation(
                            exerciseId = session.exercise.id,
                            playing = session.running,
                            remoteAnimation = remoteAnimation,
                            modifier = Modifier.fillMaxSize().padding(8.dp),
                        ) {
                            OrbitArtwork(icon = session.exercise.icon.iconRes, color = primary)
                        }
                    }
                }
            }
            Text(
                text = if (session.isResting) stringResource(R.string.session_rest) else stringResource(session.exercise.name),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().semantics { heading() },
            )
            if (session.isResting) {
                val restLabel = pluralStringResource(R.plurals.session_rest_a11y, session.restRemaining, session.restRemaining)
                Text(
                    text = "${session.restRemaining}",
                    fontSize = 62.sp,
                    fontWeight = FontWeight.Light,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clearAndSetSemantics { contentDescription = restLabel },
                )
                Text(
                    stringResource(R.string.session_rest_hint),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            } else {
                Text(
                    text = stringResource(R.string.session_set, session.currentSet, session.exercise.sets, repsText(session.exercise.reps)),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
                )
                BojiCard(contentPadding = PaddingValues(16.dp)) {
                    Text(stringResource(session.exercise.tip), style = MaterialTheme.typography.bodyMedium)
                }
            }
            if (!session.running) {
                FootNote(
                    text = stringResource(R.string.session_paused),
                    icon = R.drawable.ic_pause_circle,
                    iconTint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                )
            }
        }
        Surface(color = MaterialTheme.colorScheme.background) {
            Box(Modifier.fillMaxWidth().navigationBarsPadding(), contentAlignment = Alignment.Center) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp).widthIn(max = ContentMaxWidth),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    PrimaryButton(
                        text = stringResource(if (session.isResting) R.string.session_skip_rest else R.string.session_complete_set),
                        icon = R.drawable.ic_check,
                        onClick = onPrimary,
                        enabled = session.running,
                        modifier = Modifier.testTag("session_primary"),
                    )
                    OutlinedButton(
                        onClick = onToggleRunning,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("session_toggle"),
                    ) {
                        Icon(
                            painterResource(if (session.running) R.drawable.ic_pause else R.drawable.ic_play),
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                        )
                        Text(
                            stringResource(if (session.running) R.string.session_pause else R.string.session_resume),
                            modifier = Modifier.padding(start = 8.dp),
                        )
                    }
                    Text(
                        stringResource(R.string.session_footnote),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}

@Composable
private fun FinishedContent(session: TrainingSession, onDone: () -> Unit, modifier: Modifier = Modifier) {
    val minutes = session.elapsedSeconds / 60
    val seconds = session.elapsedSeconds % 60
    Column(modifier = modifier.testTag("session_finished")) {
        PageColumn(modifier = Modifier.weight(1f), spacing = 18.dp) {
            Icon(
                painterResource(R.drawable.ic_verified),
                contentDescription = null,
                tint = BojiThemeColors.current.calm,
                modifier = Modifier.size(74.dp).align(Alignment.CenterHorizontally).padding(top = 24.dp),
            )
            Text(
                stringResource(R.string.session_finished_headline),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().semantics { heading() },
            )
            Text(
                stringResource(R.string.session_finished_summary, stringResource(session.workout.title), minutes, seconds),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                stringResource(R.string.session_finished_rest),
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Box(Modifier.fillMaxWidth().navigationBarsPadding(), contentAlignment = Alignment.Center) {
            PrimaryButton(
                text = stringResource(R.string.action_done),
                icon = R.drawable.ic_check,
                onClick = onDone,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp).widthIn(max = ContentMaxWidth).testTag("session_done"),
            )
        }
    }
}

@Composable
@ReadOnlyComposable
private fun formatClock(totalSeconds: Int): String =
    String.format(textLocale, "%02d:%02d", totalSeconds / 60, totalSeconds % 60)

private val ArtworkSize = 240.dp
