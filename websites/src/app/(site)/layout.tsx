import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "../globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner, Loader, ScrollIndicator } from "@/components/layout/Chrome";
import { SHARE_DESCRIPTION, SHARE_TITLE } from "@/lib/content";

export const metadata: Metadata = {
  title: {
    default: "薄肌俱乐部 App · 把薄肌理论落到每一天",
    template: "%s · 薄肌俱乐部",
  },
  description: "薄肌。穿衣显瘦，脱衣有肉。¥0 起，另需戒掉含糖饮料。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    siteName: "薄肌俱乐部",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SmoothScroll>
          <Loader />
          <Nav />
          <main>{children}</main>
          <Footer />
          <CookieBanner />
          <ScrollIndicator />
        </SmoothScroll>
      </body>
    </html>
  );
}
