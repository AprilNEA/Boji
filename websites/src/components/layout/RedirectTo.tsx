"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 旧链接 /calculator 已合并进选购页：静态站点里在客户端跳转过去。 */
export function RedirectTo({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);

  return (
    <section className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[17px] text-ash">正在前往{label}…</p>
      <Link href={href} className="link-apple mt-3 text-[17px]">
        <span>没有自动跳转？点这里</span>
        <span className="chev">›</span>
      </Link>
    </section>
  );
}
