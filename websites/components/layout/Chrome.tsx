"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { EASE_APPLE } from "@/lib/motion";

const COOKIE_LAST_SHOWN_KEY = "boji-cookie-last-shown";
const COOKIE_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

function readLastShown(): number {
  try {
    return Number(localStorage.getItem(COOKIE_LAST_SHOWN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastShown(time: number) {
  try {
    localStorage.setItem(COOKIE_LAST_SHOWN_KEY, String(time));
  } catch {
    // 存储不可用时（如隐私模式）不记录，下次照常弹出。
  }
}

/** "本站不使用 Cookie。含糖量过高。" 每三天最多弹出一次，以上次弹出时间为准。 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Date.now() - readLastShown() < COOKIE_INTERVAL_MS) return;
    const t = setTimeout(() => {
      writeLastShown(Date.now());
      setShow(true);
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookie 说明"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.8, ease: EASE_APPLE }}
          className="glass-light fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-[560px] items-center gap-4 rounded-[22px] border border-black/5 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:bottom-6"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-black text-broc-light">
            <Logo className="h-5 w-auto" />
          </div>
          <div className="min-w-0 flex-1 text-[14px] leading-snug text-ink">
            <p className="font-semibold">本站不使用 Cookie。</p>
            <p className="text-ash">含糖量过高。</p>
          </div>
          <button type="button" onClick={dismiss} className="btn-pill btn-primary !min-h-0 !px-4 !py-2 text-[14px]">
            无糖确认
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * First-load overlay: "正在燃脂…".
 * Pure CSS (see `.boot-loader` in globals.css) so it always exits on its own,
 * even before hydration or if JavaScript fails to load.
 */
export function Loader() {
  return (
    <div className="boot-loader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white" aria-hidden>
      <div className="boot-logo">
        <Logo className="h-14 w-auto text-white" />
      </div>
      <div className="mt-10 h-[3px] w-40 overflow-hidden rounded-full bg-white/15">
        <div className="boot-bar h-full rounded-full bg-white" />
      </div>
      <p className="mt-4 text-[13px] tracking-[0.02em] text-white/60">正在燃脂…</p>
    </div>
  );
}

/** Custom scrollbar that gets thinner as you scroll down. */
export function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 160, damping: 28, mass: 0.4 });
  const width = useTransform(smooth, [0, 1], [7, 1.5]);
  const top = useTransform(smooth, (p) => `calc(${p} * (100vh - 120px) + 52px)`);
  const opacity = useTransform(smooth, [0, 0.02, 1], [0.35, 0.55, 0.55]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed right-[3px] z-[55] h-[56px] rounded-full bg-[#86868b] mix-blend-difference"
      style={{ width, top, opacity }}
    />
  );
}
