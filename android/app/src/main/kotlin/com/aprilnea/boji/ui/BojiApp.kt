package com.aprilnea.boji.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.aprilnea.boji.R
import com.aprilnea.boji.ui.navigation.BojiDestination
import com.aprilnea.boji.ui.theme.BojiTheme

/**
 * App shell. NavigationSuiteScaffold shows a navigation bar on compact windows
 * and a navigation rail on medium and expanded windows.
 */
@Composable
fun BojiApp(modifier: Modifier = Modifier) {
    var current by rememberSaveable { mutableStateOf(BojiDestination.Start) }

    NavigationSuiteScaffold(
        modifier = modifier,
        navigationSuiteItems = {
            BojiDestination.entries.forEach { destination ->
                val selected = destination == current
                item(
                    selected = selected,
                    onClick = { current = destination },
                    icon = {
                        Icon(
                            painter = painterResource(
                                if (selected) destination.selectedIcon else destination.icon,
                            ),
                            // The label below names the item for accessibility services.
                            contentDescription = null,
                        )
                    },
                    label = { Text(stringResource(destination.label)) },
                    modifier = Modifier.testTag(destination.tabTag),
                )
            }
        },
    ) {
        PlaceholderScreen(destination = current)
    }
}

/** Temporary screen until the matching iOS feature is ported. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlaceholderScreen(destination: BojiDestination, modifier: Modifier = Modifier) {
    Scaffold(
        modifier = modifier.testTag(destination.screenTag),
        topBar = { TopAppBar(title = { Text(stringResource(destination.label)) }) },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                painter = painterResource(destination.icon),
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp),
            )
            Spacer(Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.placeholder_title),
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.placeholder_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Preview(name = "Phone", device = "spec:width=411dp,height=891dp")
@Preview(name = "Tablet", device = "spec:width=1280dp,height=800dp,dpi=240")
@Composable
private fun BojiAppPreview() {
    BojiTheme { BojiApp() }
}
