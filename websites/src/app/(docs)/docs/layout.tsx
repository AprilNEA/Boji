import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions, PageLinks } from "@/lib/docs";
import { getDocsTree } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={getDocsTree()}
      // footer 显示在侧边栏最下面，Discord 和深浅色切换按钮的下方。
      sidebar={{ footer: <PageLinks className="mt-3 px-2" /> }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
