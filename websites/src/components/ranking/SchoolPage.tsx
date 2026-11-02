"use client";

import { Code, ConnectError } from "@connectrpc/connect";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TextLink } from "@/components/ui/Buttons";
import { OrganizationStanding_Placement, type Organization, type OrganizationStanding } from "@/gen/boji/v1/organization_pb";
import {
  displayName,
  formatBeijingTime,
  isOrganizationId,
  SCHOOL_THRESHOLD,
  secondaryName,
  type RankingClients,
} from "@/lib/ranking";
import { ClosedNotice, ErrorNotice, Notice } from "./Notice";
import { UnderReview } from "./RankingPage";
import { useRanking } from "./useRanking";

/**
 * The page of one school at `/ranking/school/?id=<organization ID>`. The static export cannot
 * prerender a page per school, so the ID is a query parameter that the browser reads.
 */
export function SchoolPage() {
  const ranking = useRanking();
  const id = useSearchParams().get("id") ?? "";

  return (
    <div className="bg-paper text-ink">
      <section className="pb-[clamp(96px,12vw,160px)] pt-[calc(var(--nav-h)+clamp(40px,7vh,88px))]">
        <div className="container-apple max-w-[880px]">
          <p>
            <TextLink href="/ranking/">大学排名</TextLink>
          </p>
          <div className="mt-8">
            {!isOrganizationId(id) ? (
              <NotFound />
            ) : ranking.status === "loading" ? (
              <Notice title="正在读取…" busy />
            ) : ranking.status === "closed" ? (
              <ClosedNotice />
            ) : ranking.status === "error" ? (
              <ErrorNotice />
            ) : (
              <School clients={ranking.clients} id={id} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type Load =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "done"; school: Organization; standing: OrganizationStanding };

function School({ clients, id }: { clients: RankingClients; id: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });

  const read = useCallback(async () => {
    setLoad({ status: "loading" });
    const name = `organizations/${id}`;
    try {
      const [school, standing] = await Promise.all([
        clients.organizations.getOrganization({ name }),
        clients.organizations.getOrganizationStanding({ name: `${name}/standing` }),
      ]);
      setLoad({ status: "done", school, standing });
    } catch (error) {
      setLoad({ status: ConnectError.from(error).code === Code.NotFound ? "not-found" : "error" });
    }
  }, [clients, id]);

  useEffect(() => {
    void read();
  }, [read]);

  useEffect(() => {
    if (load.status === "done") document.title = `${displayName(load.school.displayNames)} · 大学排名 · 薄肌俱乐部`;
  }, [load]);

  if (load.status === "loading") return <Notice title="正在读取…" busy />;
  if (load.status === "not-found") return <NotFound />;
  if (load.status === "error") return <ErrorNotice onRetry={read} />;

  const { school, standing } = load;
  const en = secondaryName(school.displayNames);
  const computed = formatBeijingTime(standing.computeTime);

  return (
    <>
      <h1 className="t-headline">{displayName(school.displayNames)}</h1>
      {en && <p className="t-body-lg mt-2 text-ash-dark">{en}</p>}

      <div className="mt-10 rounded-[28px] bg-white px-6 py-8 sm:px-10">
        {standing.frozen && (
          <p className="mb-6 text-[15px] text-graphite">
            <UnderReview />
            <span className="ml-2">本校人数增长异常，运营人员正在核查。核查期间显示暂停时的数字。</span>
          </p>
        )}
        <Standing standing={standing} />
        {computed && <p className="mt-6 text-[13px] text-ash-dark">截至 {computed}（北京时间）</p>}
      </div>

      <div className="mt-6 rounded-[28px] bg-mist px-6 py-8 sm:px-10">
        <h2 className="t-eyebrow">用学校邮箱认证</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">
          学校邮箱认证尚未开放。开放后，持有会员卡的会员可以用本校邮箱收取验证码，认证后计入本校人数。
        </p>
        {school.emailDomains.length > 0 && (
          <p className="mt-3 text-[15px] leading-relaxed text-graphite">
            本校可用于认证的邮箱域名：
            {school.emailDomains.map((domain, i) => (
              <span key={domain}>
                {i > 0 && "、"}
                <code className="rounded bg-white px-1.5 py-0.5 text-[14px]">{domain}</code>
              </span>
            ))}
            ，也包括其子域名。
          </p>
        )}
        <p className="mt-5">
          <TextLink href="/docs/guide/school-ranking/">了解认证规则</TextLink>
        </p>
      </div>
    </>
  );
}

function Standing({ standing }: { standing: OrganizationStanding }) {
  switch (standing.placement) {
    case OrganizationStanding_Placement.RANKED:
      return (
        <dl className="grid grid-cols-3 gap-4 text-center">
          <Stat label="名次" value={`第 ${standing.rank} 名`} />
          <Stat label="人数" value={`${standing.memberCount} 人`} />
          <Stat
            label="本周新增"
            value={standing.weeklyNewMemberCount > 0 ? `+${standing.weeklyNewMemberCount}` : "0"}
          />
        </dl>
      );
    case OrganizationStanding_Placement.BELOW_THRESHOLD:
      return (
        <div className="text-center">
          <p className="t-subhead">不足 {SCHOOL_THRESHOLD} 人</p>
          <p className="mt-2 text-[15px] text-ash-dark">
            本校已有会员计入。人数达到 {SCHOOL_THRESHOLD} 人后，本校进入公开排名。
          </p>
        </div>
      );
    case OrganizationStanding_Placement.NO_MEMBERS:
      return (
        <div className="text-center">
          <p className="t-subhead">还没有人：你是第一个</p>
          <p className="mt-2 text-[15px] text-ash-dark">本校还没有会员计入。</p>
        </div>
      );
    default:
      // A placement that this page does not know. The contract says to treat it as not ranked.
      return (
        <div className="text-center">
          <p className="t-subhead">本校暂不在公开排名中</p>
        </div>
      );
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ash-dark">{label}</dt>
      <dd className="t-num mt-1 text-[clamp(22px,4vw,34px)] font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function NotFound() {
  return (
    <Notice title="没有找到这所学校">
      <p>链接可能有误。请回到大学排名，搜索学校名称或邮箱域名。</p>
    </Notice>
  );
}
