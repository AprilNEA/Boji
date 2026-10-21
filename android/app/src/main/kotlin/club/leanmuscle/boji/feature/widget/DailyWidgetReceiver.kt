package club.leanmuscle.boji.feature.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import club.leanmuscle.boji.core.companion.nextLocalMidnight
import java.time.ZonedDateTime

/**
 * Receives the system widget broadcasts. It also redraws the widget when the day, the time,
 * the time zone or the system language changes, because the content depends on all four.
 * The manifest does not export it: only the system and this app can send to it.
 */
class DailyWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = DailyWidget()

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action in REFRESH_ACTIONS) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DailyWidgetReceiver::class.java))
            // onUpdate runs the Glance update and schedules the next midnight.
            if (ids.isNotEmpty()) onUpdate(context, manager, ids)
            return
        }
        super.onReceive(context, intent)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        DailyWidgetAlarm.schedule(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        DailyWidgetAlarm.cancel(context)
    }

    private companion object {
        val REFRESH_ACTIONS = setOf(
            DailyWidgetAlarm.ACTION_REFRESH,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_LOCALE_CHANGED,
        )
    }
}

/**
 * Redraws the widget after local midnight, like the midnight timeline entry on iOS. The alarm is
 * inexact and does not wake the device: a widget only needs the new day when the screen is on.
 */
internal object DailyWidgetAlarm {
    const val ACTION_REFRESH = "club.leanmuscle.boji.widget.action.REFRESH"

    fun schedule(context: Context, now: ZonedDateTime = ZonedDateTime.now()) {
        val alarms = context.getSystemService(AlarmManager::class.java) ?: return
        alarms.set(AlarmManager.RTC, nextLocalMidnight(now).toEpochMilli(), refreshIntent(context))
    }

    fun cancel(context: Context) {
        context.getSystemService(AlarmManager::class.java)?.cancel(refreshIntent(context))
    }

    private fun refreshIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
        context,
        0,
        Intent(context, DailyWidgetReceiver::class.java).setAction(ACTION_REFRESH),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}
