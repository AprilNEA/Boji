import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { pageOptions } from "@/lib/docs";

/**
 * 独立页面（/support/、/privacy/、/terms/）的布局：顶栏加正文，没有文档侧边栏。
 * 它和文档区共用 src/app/(docs)/layout.tsx 根布局，所以两边之间跳转不会整页加载。
 */
export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...pageOptions()}>{children}</HomeLayout>;
}
