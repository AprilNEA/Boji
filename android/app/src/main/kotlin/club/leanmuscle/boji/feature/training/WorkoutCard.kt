package club.leanmuscle.boji.feature.training

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.ui.components.CardShape
import club.leanmuscle.boji.ui.components.OrbitArtwork
import club.leanmuscle.boji.ui.theme.BojiThemeColors

/** Course banner. Without [onClick] it is decorative, as on the detail screen. */
@Composable
fun WorkoutCard(workout: Workout, modifier: Modifier = Modifier, onClick: (() -> Unit)? = null) {
    val content: @Composable () -> Unit = {
        Box(Modifier.fillMaxWidth().heightIn(min = 202.dp)) {
            OrbitArtwork(
                icon = R.drawable.ic_fitness_center,
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.7f),
                iconSize = 88.dp,
                modifier = Modifier.align(Alignment.CenterEnd).offset(x = 46.dp, y = 10.dp),
            )
            Column(
                modifier = Modifier.align(Alignment.CenterStart).padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(13.dp),
            ) {
                Text(
                    text = stringResource(R.string.workout_card_eyebrow),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(
                    text = workout.title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.widthIn(max = 210.dp),
                )
                Text(
                    text = stringResource(R.string.workout_card_meta, workout.minutes, workout.level),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (onClick != null) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        Icon(painterResource(R.drawable.ic_play), contentDescription = null, modifier = Modifier.size(18.dp))
                        Text(stringResource(R.string.workout_card_action), style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }
    }
    val color = BojiThemeColors.current.workoutCard
    if (onClick != null) {
        Surface(onClick = onClick, shape = CardShape, color = color, modifier = modifier.fillMaxWidth(), content = content)
    } else {
        Surface(shape = CardShape, color = color, modifier = modifier.fillMaxWidth(), content = content)
    }
}
