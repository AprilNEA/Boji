package club.leanmuscle.boji.feature.club

import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.feature.membership.MembershipEntry
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.ClubArticle
import club.leanmuscle.boji.core.model.ClubArticles
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.SectionHeading
import club.leanmuscle.boji.ui.components.SymbolTile
import club.leanmuscle.boji.ui.components.articleMeta
import club.leanmuscle.boji.ui.components.color
import club.leanmuscle.boji.ui.components.iconRes
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import java.time.temporal.WeekFields

/** Days with a workout this week that complete the local challenge. */
private const val CHALLENGE_DAYS = 2

@Composable
fun ClubScreen(
    snapshot: BojiSnapshot,
    membership: AccountState,
    onSetJoinedChallenge: (Boolean) -> Unit,
    weekFields: WeekFields,
    onOpenArticle: (ClubArticle) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenMembership: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BojiScaffold(
        title = stringResource(R.string.tab_club),
        modifier = modifier.testTag("screen_Club"),
        actions = {
            IconButton(onClick = onOpenSettings) {
                Icon(painterResource(R.drawable.ic_settings), contentDescription = stringResource(R.string.action_settings))
            }
        },
    ) { padding ->
        PageColumn(modifier = Modifier.padding(padding)) {
            PageHeading(
                eyebrow = stringResource(R.string.club_eyebrow),
                title = stringResource(R.string.club_title),
                subtitle = stringResource(R.string.club_subtitle),
            )
            MembershipEntry(state = membership, onOpen = onOpenMembership)
            ChallengeCard(
                joined = snapshot.state.joinedChallenge,
                trainingDays = snapshot.trainingDaysThisWeek(weekFields),
                onSetJoined = onSetJoinedChallenge,
            )
            SectionHeading(stringResource(R.string.club_guide_title), stringResource(R.string.club_guide_detail))
            ClubArticles.all.forEach { article ->
                BojiCard(
                    onClick = { onOpenArticle(article) },
                    contentPadding = PaddingValues(16.dp),
                    modifier = Modifier.testTag("article_${article.id}"),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        SymbolTile(icon = article.icon.iconRes, color = article.tone.color)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(stringResource(article.title), style = MaterialTheme.typography.titleMedium)
                            Text(
                                articleMeta(article),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            FootNote(stringResource(R.string.club_footnote), icon = R.drawable.ic_lock)
        }
    }
}

@Composable
private fun ChallengeCard(joined: Boolean, trainingDays: Int, onSetJoined: (Boolean) -> Unit) {
    val calm = BojiThemeColors.current.calm
    BojiCard(modifier = Modifier.testTag("challenge_card")) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                stringResource(R.string.club_challenge_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f).semantics { heading() },
            )
            Icon(painterResource(R.drawable.ic_sports_score), contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        }
        Spacer(Modifier.height(10.dp))
        Text(
            stringResource(R.string.club_challenge_text),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(16.dp))
        if (joined) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                repeat(CHALLENGE_DAYS) { day ->
                    val done = trainingDays > day
                    val status = stringResource(if (done) R.string.club_challenge_day_done else R.string.club_challenge_day_pending)
                    val description = stringResource(R.string.club_challenge_day, day + 1, status)
                    Icon(
                        painterResource(if (done) R.drawable.ic_check_circle else R.drawable.ic_radio_unchecked),
                        contentDescription = null,
                        tint = calm,
                        modifier = Modifier.size(30.dp).clearAndSetSemantics { contentDescription = description },
                    )
                }
                Spacer(Modifier.weight(1f))
                Text(
                    stringResource(R.string.club_challenge_progress, minOf(trainingDays, CHALLENGE_DAYS)),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                stringResource(if (trainingDays >= CHALLENGE_DAYS) R.string.club_challenge_done else R.string.club_challenge_pending),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            TextButton(onClick = { onSetJoined(false) }, modifier = Modifier.testTag("challenge_leave")) {
                Text(stringResource(R.string.club_challenge_leave))
            }
        } else {
            PrimaryButton(
                text = stringResource(R.string.club_challenge_join),
                icon = R.drawable.ic_add,
                onClick = { onSetJoined(true) },
                modifier = Modifier.testTag("challenge_join"),
            )
        }
    }
}

@Composable
fun ArticleScreen(article: ClubArticle, onBack: () -> Unit, modifier: Modifier = Modifier) {
    BojiScaffold(title = stringResource(R.string.article_screen_title), modifier = modifier.testTag("screen_Article"), onBack = onBack) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 20.dp) {
            SymbolTile(icon = article.icon.iconRes, color = article.tone.color)
            Text(
                stringResource(article.title),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.semantics { heading() },
            )
            Text(articleMeta(article), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            article.sections.forEach { section ->
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        stringResource(section.title),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        stringResource(section.body),
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            HorizontalDivider(Modifier.fillMaxWidth().padding(top = 4.dp))
            Text(
                stringResource(R.string.article_footer),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** 俱乐部 with its view model. Shows nothing until state.json has been read. */
@Composable
fun ClubScreen(
    weekFields: WeekFields,
    onOpenArticle: (ClubArticle) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenMembership: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ClubViewModel = hiltViewModel(),
) {
    val snapshot by viewModel.snapshot.collectAsStateWithLifecycle()
    val membership by viewModel.membership.collectAsStateWithLifecycle()
    snapshot?.let {
        ClubScreen(it, membership, viewModel::setJoinedChallenge, weekFields, onOpenArticle, onOpenSettings, onOpenMembership, modifier)
    }
}

/** One article by ID. An unknown ID closes the screen. */
@Composable
fun ArticleScreen(
    articleId: Int,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ArticleViewModel =
        hiltViewModel<ArticleViewModel, ArticleViewModel.Factory>(key = "article-$articleId") { it.create(articleId) },
) {
    val article = viewModel.article
    if (article == null) {
        LaunchedEffect(articleId) { onBack() }
    } else {
        ArticleScreen(article, onBack, modifier)
    }
}
