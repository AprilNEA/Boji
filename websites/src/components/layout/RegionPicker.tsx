"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { EASE_APPLE } from "@/lib/motion";

/**
 * Apple puts the country/region selector in the bottom-right of its footer.
 * The club has no fixed region; the quote says the rest without explanation.
 */
export function RegionPicker() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="footer-link inline-flex items-center gap-1.5"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 16 16" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M1.5 8h13M8 1.5c2 2.1 2.9 4.2 2.9 6.5S10 12.4 8 14.5M8 1.5C6 3.6 5.1 5.7 5.1 8S6 12.4 8 14.5" />
        </svg>
        <span>逐水草而居</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="选择国家或地区"
            className="absolute bottom-[calc(100%+12px)] left-0 z-20 w-[300px] origin-bottom-left rounded-[18px] border border-black/[0.06] bg-white/90 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:left-auto sm:right-0 sm:origin-bottom-right"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE_APPLE }}
          >
            <p className="text-[12px] font-semibold text-ash">选择国家或地区</p>

            <blockquote className="mt-3 border-l-2 border-green pl-3">
              <p className="text-[17px] font-semibold tracking-[-0.01em] text-ink">“逐水草而居。”</p>
              <footer className="mt-0.5 text-[11px] text-ash">— 孙宇晨，与邵艾伦的播客对谈</footer>
            </blockquote>

            <p className="mt-3 text-[13px] leading-[1.5] text-ink/80">薄肌俱乐部不设地区。</p>

            <p className="mt-4 border-t border-black/[0.08] pt-3 text-[12px] text-ash">
              肌肉，是唯一可以拎了就走的资产。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
