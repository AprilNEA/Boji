import { createClient, type Client } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import type { LocalizedText } from "@/gen/google/type/localized_text_pb";
import { OrganizationService } from "@/gen/boji/v1/organization_service_pb";
import { SystemService } from "@/gen/boji/v1/system_service_pb";

/**
 * The member service (bizserver) of the school ranking. The build inlines
 * NEXT_PUBLIC_BOJI_API_BASE_URL. Without a value, the ranking pages show that the ranking is not
 * open and send no request. Production builds accept https only; http is for a local bizserver.
 */
const RAW_API_BASE_URL = (process.env.NEXT_PUBLIC_BOJI_API_BASE_URL ?? "").trim();

function apiBaseUrl(): string | null {
  if (!RAW_API_BASE_URL) return null;
  try {
    const url = new URL(RAW_API_BASE_URL);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
    if (url.search || url.hash) return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export type RankingClients = {
  organizations: Client<typeof OrganizationService>;
  system: Client<typeof SystemService>;
};

let clients: RankingClients | null | undefined;

/** The Connect clients, or null when the build has no valid member service URL. */
export function rankingClients(): RankingClients | null {
  if (clients !== undefined) return clients;
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return (clients = null);
  const transport = createConnectTransport({ baseUrl });
  clients = {
    organizations: createClient(OrganizationService, transport),
    system: createClient(SystemService, transport),
  };
  return clients;
}

/** The filter of the school ranking and the school search. */
export const SCHOOL_FILTER = "type = SCHOOL";

/** Number of standings per page. The server caps it at 100. */
export const RANKING_PAGE_SIZE = 50;

/** The public threshold of `SCHOOL`. The server owns the value; the pages only explain it. */
export const SCHOOL_THRESHOLD = 3;

/**
 * The AIP-160 filter of a school search. The text becomes a quoted string, so quotes and
 * backslashes are dropped. Returns null when the text is empty after trimming.
 */
export function schoolSearchFilter(text: string): string | null {
  const query = text.replace(/["\\]/g, "").trim().slice(0, 64);
  return query ? `${SCHOOL_FILTER} AND "${query}"` : null;
}

/** The Chinese name when the list has one, else the English name, which the server always sends first. */
export function displayName(names: LocalizedText[]): string {
  return (names.find((n) => n.languageCode === "zh-Hans") ?? names[0])?.text ?? "未命名学校";
}

/** The English name when it differs from `displayName`. */
export function secondaryName(names: LocalizedText[]): string | null {
  const en = names.find((n) => n.languageCode === "en")?.text;
  return en && en !== displayName(names) ? en : null;
}

/** `organizations/{id}` → `{id}`. */
export function organizationId(name: string): string {
  return name.replace(/^organizations\//, "").replace(/\/standing$/, "");
}

/** The UUID form of an organization ID. Other values never reach the server. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOrganizationId(id: string): boolean {
  return UUID.test(id);
}

export function schoolHref(id: string): string {
  return `/ranking/school/?id=${encodeURIComponent(id)}`;
}

const BEIJING = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-10-21 18:40" in China Standard Time, the time zone of the whole ranking. */
export function formatBeijingTime(time: Timestamp | undefined): string | null {
  if (!time) return null;
  const parts = Object.fromEntries(BEIJING.formatToParts(timestampDate(time)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
