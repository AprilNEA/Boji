import type { ReactNode } from "react";
import { TextLink } from "@/components/ui/Buttons";

/** A centered message for the states without ranking data: loading, closed, error, not found. */
export function Notice({ title, children, busy = false }: { title: string; children?: ReactNode; busy?: boolean }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-14 text-center" role="status" aria-busy={busy}>
      <p className="t-subhead">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-ash-dark">{children}</div>}
    </div>
  );
}

export function ClosedNotice() {
  return (
    <Notice title="大学排名尚未开放">
      <p>开榜后，所有学校从 0 人同时开始计数。规则见用户指南。</p>
      <p className="mt-4">
        <TextLink href="/docs/guide/school-ranking/">了解大学排名的规则</TextLink>
      </p>
    </Notice>
  );
}

export function ErrorNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <Notice title="暂时无法读取排名">
      <p>请检查网络连接，稍后再试。</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-pill btn-outline mt-5">
          重试
        </button>
      )}
    </Notice>
  );
}
