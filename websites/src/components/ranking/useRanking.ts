"use client";

import { useEffect, useState } from "react";
import { rankingClients, type RankingClients } from "@/lib/ranking";

export type RankingState =
  | { status: "loading" }
  /** The build has no member service URL, or the server has not turned on the ranking. */
  | { status: "closed" }
  | { status: "error" }
  | { status: "open"; clients: RankingClients };

/**
 * Checks `ServerConfig.organization_ranking_enabled` before a page reads the ranking, so that the
 * pages show the ranking only when the server offers it.
 */
export function useRanking(): RankingState {
  const [state, setState] = useState<RankingState>({ status: "loading" });

  useEffect(() => {
    const clients = rankingClients();
    if (!clients) {
      setState({ status: "closed" });
      return;
    }
    let cancelled = false;
    clients.system
      .getServerConfig({ name: "serverConfig" })
      .then((config) => {
        if (!cancelled) setState(config.organizationRankingEnabled ? { status: "open", clients } : { status: "closed" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
