package com.aprilnea.boji

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.aprilnea.boji.ui.BojiApp
import com.aprilnea.boji.ui.navigation.BojiDestination
import com.aprilnea.boji.ui.theme.BojiTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BojiAppTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun startsOnTodayAndSwitchesEveryTab() {
        composeRule.setContent { BojiTheme { BojiApp() } }

        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsSelected()
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()

        BojiDestination.entries.forEach { destination ->
            composeRule.onNodeWithTag(destination.tabTag).performClick().assertIsSelected()
            composeRule.onNodeWithTag(destination.screenTag).assertIsDisplayed()
        }
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsNotSelected()
    }

    @Test
    fun keepsSelectedTabAfterStateRestore() {
        val restorationTester = StateRestorationTester(composeRule)
        restorationTester.setContent { BojiTheme { BojiApp() } }

        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        restorationTester.emulateSavedInstanceStateRestore()

        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).assertIsSelected()
        composeRule.onNodeWithTag(BojiDestination.Training.screenTag).assertIsDisplayed()
    }
}
