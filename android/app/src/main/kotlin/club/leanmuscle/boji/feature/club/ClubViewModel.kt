package club.leanmuscle.boji.feature.club

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.MembershipRepository
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.ClubArticle
import club.leanmuscle.boji.core.model.ClubArticles
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ClubViewModel @Inject constructor(
    private val store: BojiStore,
    membership: MembershipRepository,
) : ViewModel() {
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    /** The member card at the top of the page, as on iOS. */
    val membership: StateFlow<AccountState> = membership.state

    fun setJoinedChallenge(joined: Boolean) {
        viewModelScope.launch { store.setJoinedChallenge(joined) }
    }
}

/** One guide article. [article] is null when the route names an article that does not exist. */
@HiltViewModel(assistedFactory = ArticleViewModel.Factory::class)
class ArticleViewModel @AssistedInject constructor(@Assisted articleId: Int) : ViewModel() {
    val article: ClubArticle? = ClubArticles.byId(articleId)

    @AssistedFactory
    interface Factory {
        fun create(articleId: Int): ArticleViewModel
    }
}
