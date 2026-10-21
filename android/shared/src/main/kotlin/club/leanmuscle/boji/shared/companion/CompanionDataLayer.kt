package club.leanmuscle.boji.shared.companion

/**
 * The Wear OS Data Layer contract between the phone app and the watch app. Both apps must have the
 * same application ID and signing certificate, or the Data Layer does not deliver the messages.
 *
 * Only [MessageClient][com.google.android.gms.wearable.MessageClient] carries the snapshot. A
 * `DataItem` would be stored indefinitely and backed up to the cloud, so the apps do not use
 * `DataClient`. The watch keeps the last snapshot in its own app storage instead.
 */
object CompanionDataLayer {
    /** Phone to watch, `sendMessage`. The payload is [CompanionSnapshot.encode]. */
    const val SNAPSHOT_PATH = "/boji/companion/snapshot"

    /** Watch to phone, `sendRequest` with an empty payload. The phone replies with the snapshot. */
    const val REQUEST_PATH = "/boji/companion/request"

    /** Declared in `android_wear_capabilities` of the phone app. The watch sends requests to these nodes. */
    const val PHONE_CAPABILITY = "boji_phone_app"

    /** Declared in `android_wear_capabilities` of the watch app. The phone sends snapshots to these nodes. */
    const val WATCH_CAPABILITY = "boji_watch_app"
}
