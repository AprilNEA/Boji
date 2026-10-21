"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_FOOTNOTES } from "@/lib/app";
import { CONTACT_EMAIL, DISCUSSIONS_URL, FOOTNOTES } from "@/lib/content";
import { GitHubIcon } from "@/components/ui/GitHubIcon";
import { Logo } from "@/components/ui/Logo";
import { RegionPicker } from "@/components/layout/RegionPicker";

const COLUMNS = [
  {
    title: "App",
    links: [
      { href: "/", label: "薄肌俱乐部 App" },
      { href: "/#features", label: "功能" },
      { href: "/docs/guide/", label: "用户指南" },
      { href: "/support/", label: "支持" },
    ],
  },
  {
    title: "俱乐部",
    links: [
      { href: "/keynote/", label: "2026 秋季发布会" },
      { href: "/theory/", label: "薄肌理论" },
      { href: "/pro/", label: "薄肌" },
      { href: "/compare/", label: "比较型号" },
      { href: "/founders/", label: "领导层" },
    ],
  },
  {
    title: "选购",
    links: [
      { href: "/store/", label: "选购薄肌" },
      { href: "/store/", label: "预计交付日期" },
      { href: "/store/#accessories", label: "配件" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/privacy/", label: "隐私政策" },
  { href: "/terms/", label: "用户协议" },
  { href: "/third-parties/", label: "第三方信息共享" },
  { href: "/docs/developers/", label: "开发者" },
] as const;

export function Footer() {
  // 首页介绍 App，只需要 App 的声明；其他页面是发布会恶搞，沿用原来的声明。
  const notes = usePathname() === "/" ? APP_FOOTNOTES : FOOTNOTES;
  return (
    <footer className="bg-mist text-[12px] leading-[1.34] text-ash">
      <div className="container-apple pb-5 pt-10">
        <ol className="space-y-3 border-b border-black/10 pb-5">
          {notes.map((note, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="t-num">{i + 1}.</span>
              <span>{note}</span>
            </li>
          ))}
        </ol>

        <p className="border-b border-black/10 py-5 text-ink/80">
          如果你对本站内容有任何疑问或投诉，或者感到被冒犯，请发送邮件至{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-deep underline-offset-2 hover:underline">
            {CONTACT_EMAIL}
          </a>
          。我们会认真对待每一封来信，并及时修改或删除相关内容。
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-black/10 py-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-2.5 font-semibold text-ink">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="footer-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-2.5 font-semibold text-ink">联系我们</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={DISCUSSIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link inline-flex items-center gap-1.5"
                >
                  <GitHubIcon />
                  GitHub Discussions
                  <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                问题与投诉：
                <br />
                <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">
                  thinmuscle-club
                  <wbr />
                  @proton.me
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-[14px] w-auto text-ink/70" />
            <span>Copyright © 2026 薄肌俱乐部。保留所有线条。</span>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {LEGAL_LINKS.map((l, i) => (
              <li key={l.href} className="flex items-center gap-3">
                {i > 0 && <span className="text-black/20">|</span>}
                <Link href={l.href} className="footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <RegionPicker />
        </div>
      </div>
    </footer>
  );
}
