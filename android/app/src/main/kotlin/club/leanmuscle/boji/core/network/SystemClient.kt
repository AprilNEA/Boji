package club.leanmuscle.boji.core.network

import club.leanmuscle.boji.v1.ServerConfig
import club.leanmuscle.boji.v1.SystemServiceClientInterface
import club.leanmuscle.boji.v1.getServerConfigRequest

/**
 * `boji.v1.SystemService` calls. They need no session. Clients read [ServerConfig] before they show
 * an entry for an optional feature, as `MembershipStore.loadCapabilities` does on iOS.
 */
class SystemClient(private val service: SystemServiceClientInterface) {

    suspend fun serverConfig(): ServerConfig =
        connectCall { service.getServerConfig(getServerConfigRequest { name = SERVER_CONFIG }) }

    companion object {
        /** The resource name of the singleton. */
        const val SERVER_CONFIG = "serverConfig"
    }
}
