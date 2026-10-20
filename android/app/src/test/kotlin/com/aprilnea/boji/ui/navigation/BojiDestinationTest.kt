package com.aprilnea.boji.ui.navigation

import org.junit.Assert.assertEquals
import org.junit.Test

class BojiDestinationTest {
    @Test
    fun destinationsMatchIosTabOrder() {
        assertEquals(
            listOf("Today", "Training", "Progress", "Club"),
            BojiDestination.entries.map { it.name },
        )
    }

    @Test
    fun appStartsOnToday() {
        assertEquals(BojiDestination.Today, BojiDestination.Start)
    }

    @Test
    fun eachDestinationHasDistinctResources() {
        val entries = BojiDestination.entries
        assertEquals(entries.size, entries.map { it.label }.toSet().size)
        assertEquals(entries.size, entries.map { it.icon }.toSet().size)
        assertEquals(entries.size, entries.map { it.selectedIcon }.toSet().size)
        assertEquals(entries.size, entries.map { it.tabTag }.toSet().size)
    }
}
