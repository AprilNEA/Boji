"use client";

import { Code, ConnectError } from "@connectrpc/connect";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TextLink } from "@/components/ui/Buttons";
import type { OrganizationStanding } from "@/gen/boji/v1/organization_pb";
import {
  displayName,
  formatBeijingTime,
  organizationId,
  RANKING_PAGE_SIZE,
  SCHOOL_FILTER,
  SCHOOL_THRESHOLD,
  schoolHref,
  secondaryName,
  type RankingClients,
} from "@/lib/ranking";
import { ClosedNotice, ErrorNotice, Notice } from "./Notice";
import { SchoolSearch } from "./SchoolSearch";
import { useRanking } from "./useRanking";

export function RankingPage() {
  const ranking = useRanking();

  return (
    <div className="bg-paper text-ink">
      <section className="pt-[calc(var(--nav-h)+clamp(56px,9vh,110px))]">
        <div className="container-apple max-w-[880px] text-center">
          <p className="t-eyebrow text-green">大学排名</p>
          <h1 className="t-headline mt-2">哪所学校的薄肌会员最多？</h1>
          <p className="t-body-lg mt-4 text-ash-dark">
            按学校统计持有会员卡、并通过学校邮箱认证的会员人数。不给个人排名，也不比体重、照片或训练量。
          </p>
        </div>
      </section>

      <section className="pb-[clamp(96px,12vw,160px)] pt-12">
        <div className="container-apple max-w-[880px]">
          {ranking.status === "loading" && <Notice title="正在读取排名…" busy />}
          {ranking.status === "closed" && <ClosedNotice />}
          {ranking.status === "error" && <ErrorNotice />}
          {ranking.status === "open" && (
            <>
              <SchoolSearch clients={ranking.clients} />
              <RankingTable clients={ranking.clients} />
            </>
          )}
          <Rules />
        </div>
      </section>
    </div>
  );
}

type Table =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; standings: OrganizationStanding[]; nextPageToken: string; loadingMore: boolean };

function RankingTable({ clients }: { clients: RankingClients }) {
  const [table, setTable] = useState<Table>({ status: "loading" });

  const loadFirstPage = useCallback(async () => {
    setTable({ status: "loading" });
    try {
      const response = await clients.organizations.listOrganizationStandings({
        parent: "organizations/-",
        filter: SCHOOL_FILTER,
        pageSize: RANKING_PAGE_SIZE,
      });
      setTable({
        status: "done",
        standings: response.organizationStandings,
        nextPageToken: response.nextPageToken,
        loadingMore: false,
      });
    } catch {
      setTable({ status: "error" });
    }
  }, [clients]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (table.status !== "done" || !table.nextPageToken) return;
    setTable({ ...table, loadingMore: true });
    try {
      const response = await clients.organizations.listOrganizationStandings({
        parent: "organizations/-",
        filter: SCHOOL_FILTER,
        pageSize: RANKING_PAGE_SIZE,
        pageToken: table.nextPageToken,
      });
      setTable({
        status: "done",
        standings: [...table.standings, ...response.organizationStandings],
        nextPageToken: response.nextPageToken,
        loadingMore: false,
      });
    } catch (error) {
      // The server computed a new ranking since the first page. Mixing two rankings would show
      // wrong positions, so read again from the first page.
      if (ConnectError.from(error).code === Code.InvalidArgument) void loadFirstPage();
      else setTable({ ...table, loadingMore: false });
    }
  };

  if (table.status === "loading") return <div className="mt-10"><Notice title="正在读取排名…" busy /></div>;
  if (table.status === "error") return <div className="mt-10"><ErrorNotice onRetry={loadFirstPage} /></div>;

  const computed = formatBeijingTime(table.standings[0]?.computeTime);

  if (table.standings.length === 0) {
    return (
      <div className="mt-10">
        <Notice title={`还没有学校达到 ${SCHOOL_THRESHOLD} 人`}>
          <p>不足 {SCHOOL_THRESHOLD} 人的学校不公开显示。搜索你的学校，查看本校的状态。</p>
        </Notice>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="overflow-x-auto rounded-[28px] bg-white">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">大学排名：按计入人数从多到少排列</caption>
          <thead>
            <tr className="border-b border-black/10 text-[13px] text-ash-dark">
              <th scope="col" className="w-[72px] px-5 py-4 font-semibold">名次</th>
              <th scope="col" className="px-5 py-4 font-semibold">大学</th>
              <th scope="col" className="w-[88px] px-5 py-4 text-right font-semibold">人数</th>
              <th scope="col" className="w-[104px] px-5 py-4 text-right font-semibold">本周新增</th>
            </tr>
          </thead>
          <tbody>
            {table.standings.map((standing) => {
              const id = organizationId(standing.name);
              const en = secondaryName(standing.organizationDisplayNames);
              return (
                <tr key={standing.name} className="border-b border-black/5 last:border-b-0">
                  <td className="t-num px-5 py-4 text-[17px] font-semibold">{standing.rank}</td>
                  <th scope="row" className="px-5 py-4 font-normal">
                    <Link href={schoolHref(id)} className="group inline-flex flex-col">
                      <span className="text-[16px] font-semibold text-ink group-hover:underline">
                        {displayName(standing.organizationDisplayNames)}
                        {standing.frozen && <UnderReview />}
                      </span>
                      {en && <span className="text-[13px] text-ash-dark">{en}</span>}
                    </Link>
                  </th>
                  <td className="t-num px-5 py-4 text-right text-[17px] font-semibold">{standing.memberCount}</td>
                  <td className="t-num px-5 py-4 text-right text-[15px] text-ash-dark">
                    {standing.weeklyNewMemberCount > 0 ? `+${standing.weeklyNewMemberCount}` : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
        {computed && <p className="text-[13px] text-ash-dark">截至 {computed}（北京时间）</p>}
        {table.nextPageToken && (
          <button type="button" onClick={loadMore} disabled={table.loadingMore} className="btn-pill btn-outline">
            {table.loadingMore ? "正在加载…" : "显示更多学校"}
          </button>
        )}
      </div>
    </div>
  );
}

export function UnderReview() {
  return (
    <span className="ml-2 inline-block rounded-full bg-mist px-2 py-0.5 align-middle text-[12px] font-semibold text-accent-deep">
      核查中
    </span>
  );
}

function Rules() {
  return (
    <div className="mt-16 rounded-[28px] bg-mist px-6 py-8 sm:px-10">
      <h2 className="t-eyebrow">排名规则</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-graphite">
        <li>只计入持有有效会员卡、并且学校邮箱认证在有效期内的会员。</li>
        <li>人数多的学校在前。人数相同时，先凑齐当前人数的学校在前。</li>
        <li>不足 {SCHOOL_THRESHOLD} 人的学校不公开显示，以免数字让别人认出具体是谁。</li>
        <li>本周新增从北京时间周一 0:00 起计算，续期不算新增。</li>
        <li>标有「核查中」的学校人数增长异常，运营人员核查期间显示暂停时的数字。</li>
        <li>公开页面只显示每所学校的数字，不显示会员的昵称或邮箱。</li>
      </ul>
      <p className="mt-6">
        <TextLink href="/docs/guide/school-ranking/">阅读完整规则</TextLink>
      </p>
    </div>
  );
}
