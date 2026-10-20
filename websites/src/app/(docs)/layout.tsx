import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import "@fontsource-variable/inter";
import "../docs.css";
import { DOCS_TRANSLATIONS } from "@/lib/docs";

export const metadata: Metadata = {
  title: {
    default: "薄肌俱乐部文档",
    template: "%s · 薄肌俱乐部文档",
  },
  description: "Boji App 的用户指南和开发者文档。",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#131312" },
  ],
};

/**
 * 文档站的根布局。它和官网的 src/app/(site)/layout.tsx 是两个根布局：
 * 两边各自加载自己的 CSS，在两边之间跳转时浏览器会整页加载。
 */
export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          i18n={{ locale: "zh-CN", translations: DOCS_TRANSLATIONS }}
          search={{ options: { type: "static" } }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
