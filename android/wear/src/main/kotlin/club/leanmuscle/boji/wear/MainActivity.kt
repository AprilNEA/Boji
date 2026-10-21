package club.leanmuscle.boji.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import club.leanmuscle.boji.wear.ui.WatchApp
import club.leanmuscle.boji.wear.ui.WatchViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: WatchViewModel by viewModels { WatchViewModel.Factory }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { WatchApp(viewModel) }
    }
}
