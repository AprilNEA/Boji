"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NAV_LINKS } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

type Panel = null | "bag" | "search" | "menu";

const QUICK_LINKS = [
  { href: "/#features", label: "了解薄肌俱乐部 App" },
  { href: "/keynote/", label: "观看 2026 秋季发布会" },
  { href: "/pro/", label: "了解薄肌" },
  { href: "/store/", label: "查询预计交付日期" },
  { href: "/compare/", label: "比较厚肌、饿瘦与薄肌" },
  { href: "/theory/", label: "阅读薄肌理论" },
];

/** Pages whose first screen is white get Apple's light glass nav; everything else stays dark. */
const LIGHT_ROUTES = ["/pro", "/compare", "/store", "/calculator", "/founders", "/join"];

/** The home link "/" is a prefix of every path, so it only matches exactly. */
const isActive = (pathname: string | null, href: string) =>
  href === "/" ? pathname === "/" : !!pathname?.startsWith(href.replace(/\/$/, ""));

export function Nav() {
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  const light = pathname === "/" || LIGHT_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => setPanel(null), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));
  const open = panel !== null;

  return (
    <>
      <header
        className={`nav-glass fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${light ? "nav-light" : "nav-dark"} ${
          open ? "bg-[var(--nav-solid)]" : scrolled ? "bg-[var(--nav-bg)]" : "bg-[var(--nav-bg-top)]"
        }`}
      >
        <nav className="container-apple flex h-[var(--nav-h)] items-center justify-between text-[12px] text-[var(--nav-fg)] transition-colors duration-500">
          <Link href="/" aria-label="薄肌俱乐部首页" className="flex h-full items-center px-2 opacity-90 transition-opacity hover:opacity-100">
            <Logo className="h-[17px] w-auto" />
          </Link>

          <ul className="hidden h-full flex-1 items-center justify-center gap-[clamp(18px,3.4vw,40px)] md:flex">
            {NAV_LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`nav-link font-[Inter_Variable] transition-[opacity,font-weight] duration-500 ${
                      active ? "opacity-100" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex h-full items-center gap-1">
            <IconButton label="搜索" onClick={() => toggle("search")} active={panel === "search"}>
              <svg viewBox="0 0 17 17" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="7.2" cy="7.2" r="5.6" />
                <path d="m11.4 11.4 4.4 4.4" strokeLinecap="round" />
              </svg>
            </IconButton>
            <IconButton label="购物袋" onClick={() => toggle("bag")} active={panel === "bag"}>
              <svg viewBox="0 0 17 19" className="h-[16px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 6.2h13l-.9 10.3a1.6 1.6 0 0 1-1.6 1.5H4.5a1.6 1.6 0 0 1-1.6-1.5Z" strokeLinejoin="round" />
                <path d="M5.6 6.2V5a2.9 2.9 0 0 1 5.8 0v1.2" />
              </svg>
            </IconButton>
            <IconButton label="菜单" onClick={() => toggle("menu")} active={panel === "menu"} className="md:hidden">
              <svg viewBox="0 0 18 18" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <motion.path
                  d="M2 6.5h14"
                  initial={false}
                  animate={{ d: panel === "menu" ? "M3 3L15 15" : "M2 6.5L16 6.5" }}
                  transition={{ duration: 0.4, ease: EASE_APPLE }}
                />
                <motion.path
                  d="M2 11.5h14"
                  initial={false}
                  animate={{ d: panel === "menu" ? "M3 15L15 3" : "M2 11.5L16 11.5" }}
                  transition={{ duration: 0.4, ease: EASE_APPLE }}
                />
              </svg>
            </IconButton>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              key={panel}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE_APPLE }}
              className="overflow-hidden bg-[var(--nav-solid)]"
            >
              <div className="container-apple pb-14 pt-8 text-[var(--nav-fg)]">
                {panel === "bag" && <BagPanel />}
                {panel === "search" && <SearchPanel />}
                {panel === "menu" && <MenuPanel />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[18px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            onClick={() => setPanel(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      onClick={onClick}
      className={`flex h-[var(--nav-h)] w-9 items-center justify-center transition-opacity ${
        active ? "opacity-100" : "opacity-80 hover:opacity-100"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_APPLE } },
};

function BagPanel() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.h2 variants={item} className="text-[28px] font-semibold tracking-[-0.02em] text-[var(--nav-strong)]">
        您的购物袋是空的。
      </motion.h2>
      <motion.p variants={item} className="mt-2 text-[17px] text-[var(--nav-muted)]">
        薄肌无法用钱购买。
      </motion.p>
      <motion.div variants={item} className="mt-8 text-[12px] text-[var(--nav-muted)]">
        我的资料
      </motion.div>
      <motion.ul variants={stagger} className="mt-3 space-y-3 text-[14px] font-semibold">
        {[
          { href: "/store/", label: "选购薄肌（¥0 起）" },
          { href: "/store/", label: "查询我的预计交付日期" },
          { href: "/join/", label: "领取我的会员卡" },
          { href: "/theory/", label: "阅读薄肌理论" },
        ].map((l) => (
          <motion.li variants={item} key={l.label}>
            <Link href={l.href} className="nav-link">
              {l.label}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function SearchPanel() {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const hasQuery = q.trim().length > 0;
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center gap-3">
        <svg viewBox="0 0 17 17" className="h-6 w-6 shrink-0 text-[var(--nav-muted)]" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7.2" cy="7.2" r="5.6" />
          <path d="m11.4 11.4 4.4 4.4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索 薄肌俱乐部"
          className="w-full bg-transparent text-[24px] font-semibold tracking-[-0.02em] text-[var(--nav-strong)] placeholder:text-ash focus:outline-none"
        />
      </motion.div>
      <motion.div variants={item} className="mt-8 text-[12px] text-[var(--nav-muted)]">
        {hasQuery ? "搜索结果" : "快速链接"}
      </motion.div>
      {hasQuery ? (
        <motion.p variants={item} className="mt-3 text-[14px] text-[var(--nav-fg)]">
          未找到与“{q.trim()}”相关的捷径。薄肌没有捷径。
        </motion.p>
      ) : (
        <motion.ul variants={stagger} className="mt-3 space-y-3 text-[14px] font-semibold">
          {QUICK_LINKS.map((l) => (
            <motion.li variants={item} key={l.href}>
              <Link href={l.href} className="nav-link">
                <span className="mr-2 text-[var(--nav-muted)]">→</span>
                {l.label}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}

function MenuPanel() {
  return (
    <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {NAV_LINKS.map((l) => (
        <motion.li variants={item} key={l.href}>
          <Link href={l.href} className="nav-link text-[28px] font-semibold tracking-[-0.02em] text-[var(--nav-strong)]">
            {l.label}
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
