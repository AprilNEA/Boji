"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import type { Organization } from "@/gen/boji/v1/organization_pb";
import {
  displayName,
  organizationId,
  schoolHref,
  schoolSearchFilter,
  secondaryName,
  type RankingClients,
} from "@/lib/ranking";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; query: string; schools: Organization[] };

/** Finds a school by Chinese name, English name or email domain, and links to its school page. */
export function SchoolSearch({ clients }: { clients: RankingClients }) {
  const inputId = useId();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result>({ status: "idle" });
  const request = useRef(0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const filter = schoolSearchFilter(text);
    if (!filter) return;
    const id = ++request.current;
    setResult({ status: "loading" });
    try {
      const response = await clients.organizations.listOrganizations({ filter, pageSize: 10 });
      if (id === request.current) setResult({ status: "done", query: text.trim(), schools: response.organizations });
    } catch {
      if (id === request.current) setResult({ status: "error" });
    }
  };

  return (
    <div>
      <form role="search" onSubmit={onSubmit} className="flex gap-3">
        <label htmlFor={inputId} className="sr-only">
          学校名称或邮箱域名
        </label>
        <input
          id={inputId}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={64}
          placeholder="搜索学校名称或邮箱域名，例如 xjtlu.edu.cn"
          className="min-h-[44px] min-w-0 flex-1 rounded-full bg-white px-5 text-[16px] text-ink outline-none ring-1 ring-black/10 placeholder:text-ash focus-visible:ring-2 focus-visible:ring-green"
        />
        <button type="submit" className="btn-pill btn-primary shrink-0" disabled={!schoolSearchFilter(text)}>
          搜索
        </button>
      </form>

      <div aria-live="polite" className="mt-3">
        {result.status === "loading" && <p className="px-2 text-[14px] text-ash-dark">正在搜索…</p>}
        {result.status === "error" && <p className="px-2 text-[14px] text-accent-deep">搜索失败，请稍后再试。</p>}
        {result.status === "done" && result.schools.length === 0 && (
          <p className="px-2 text-[14px] text-ash-dark">
            没有找到「{result.query}」。名单只收录 Hipo university-domains-list 中的学校。
          </p>
        )}
        {result.status === "done" && result.schools.length > 0 && (
          <ul className="overflow-hidden rounded-[20px] bg-white">
            {result.schools.map((school) => {
              const en = secondaryName(school.displayNames);
              return (
                <li key={school.name} className="border-b border-black/5 last:border-b-0">
                  <Link
                    href={schoolHref(organizationId(school.name))}
                    className="flex min-h-[44px] flex-col justify-center px-5 py-3 transition-colors hover:bg-mist"
                  >
                    <span className="text-[16px] font-semibold text-ink">{displayName(school.displayNames)}</span>
                    {en && <span className="text-[13px] text-ash-dark">{en}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
