"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * /docs/ 没有首页，在客户端跳转到第一个栏目。静态导出不支持服务端重定向。
 * 跳转前显示一个链接，JavaScript 不可用时也能进入文档。
 */
export function DocsRedirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);

  return (
    <p className="p-8 text-fd-muted-foreground">
      正在打开用户指南… <Link href={href} className="text-fd-primary underline">没有自动跳转？点这里</Link>
    </p>
  );
}
