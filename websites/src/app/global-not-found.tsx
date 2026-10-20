import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "./globals.css";

// 官网和文档各有一个根布局，所以全站 404 用 global-not-found：它不经过任何布局，要自己引入样式和字体。
export const metadata: Metadata = {
  title: "404 · 薄肌俱乐部",
  icons: { icon: "/favicon.svg" },
};

export default function GlobalNotFound() {
  return (
    <html lang="zh-CN">
      <body>
        <section className="on-dark flex min-h-[100svh] flex-col items-center justify-center bg-black px-6 text-center text-white">
          <div className="t-num font-[Inter_Variable] text-[clamp(96px,18vw,200px)] font-[100] leading-none tracking-[-0.06em] text-smoke">404</div>
          <h1 className="t-title mt-6">该页面体脂超标，已被移除。</h1>
          <p className="t-body-lg mt-4 text-ash">我们正在帮它减脂。预计 3–6 个月后恢复。</p>
          <Link href="/" className="link-apple on-dark mt-10 text-[19px]">
            <span>返回发布会</span>
            <span className="chev">›</span>
          </Link>
        </section>
      </body>
    </html>
  );
}
