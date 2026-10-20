"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { Silhouette } from "@/components/ui/Silhouette";
import { FOUNDERS, type Founder } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

export function FoundersPage() {
  const [open, setOpen] = useState<Founder | null>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lenis]);

  return (
    <div className="bg-paper text-ink">
      <section className="pt-[calc(var(--nav-h)+clamp(56px,9vh,110px))]">
        <div className="container-wide">
          <motion.h1
            className="t-headline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_APPLE }}
          >
            薄肌俱乐部领导层
          </motion.h1>
          <motion.p
            className="t-body-lg mt-4 max-w-[620px] text-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.25 }}
          >
            下一位，就是你。
          </motion.p>
        </div>
      </section>

      <section className="pb-[clamp(80px,10vw,140px)] pt-14">
        <div className="container-wide grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDERS.map((f, i) => (
            <motion.button
              key={f.id}
              type="button"
              onClick={() => setOpen(f)}
              className="group text-left"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.3 + i * 0.12, ease: EASE_APPLE }}
            >
              <motion.div layoutId={`portrait-${f.id}`} className="relative overflow-hidden rounded-[22px] bg-black" transition={{ duration: 0.7, ease: EASE_APPLE }}>
                <img
                  src={f.image}
                  alt={`${f.name} ${f.en}`}
                  className="aspect-[4/5] w-full object-cover object-top transition-transform duration-[1200ms] [transition-timing-function:var(--ease-apple)] group-hover:scale-[1.03]"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-transparent to-black" />
              </motion.div>
              <motion.div layoutId={`name-${f.id}`} className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">
                {f.name} <span className="font-medium text-ash">{f.en}</span>
              </motion.div>
              <div className="mt-1 text-[17px] text-ash">{f.title}</div>
              <div className="link-apple mt-3 text-[17px]">
                <span>阅读简介</span>
                <span className="chev">›</span>
              </div>
            </motion.button>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.54, ease: EASE_APPLE }}
          >
            <Link href="/join/" className="group block">
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[22px] border-[1.5px] border-dashed border-black/20 bg-mist transition-colors duration-500 group-hover:border-black/40">
                <Silhouette model="pro" className="h-[46%] w-auto text-silver transition-colors duration-500 group-hover:text-ink" />
              </div>
              <div className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">你</div>
              <div className="mt-1 text-[17px] text-ash">下一位践行者 · 体脂待定</div>
              <div className="link-apple mt-3 text-[17px]">
                <span>入会宣誓</span>
                <span className="chev">›</span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>{open && <BioPanel founder={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

function BioPanel({ founder, onClose }: { founder: Founder; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]" data-lenis-prevent>
      <motion.div
        className="fixed inset-0 bg-black/45 backdrop-blur-[22px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={onClose}
      />
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={`${founder.name}简介`}
        className="relative w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.35)]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: EASE_APPLE }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
        >
          <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2 2 12" />
          </svg>
        </button>
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <motion.div layoutId={`portrait-${founder.id}`} className="relative bg-black" transition={{ duration: 0.7, ease: EASE_APPLE }}>
            <img src={founder.image} alt={`${founder.name} ${founder.en}`} className="aspect-[4/5] h-full w-full object-cover object-top" draggable={false} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-transparent to-black" />
          </motion.div>
          <div className="p-8 md:p-12">
            <motion.div layoutId={`name-${founder.id}`} className="text-[32px] font-bold tracking-[-0.03em]">
              {founder.name} <span className="font-medium text-ash">{founder.en}</span>
            </motion.div>
            <motion.div
              className="mt-1 text-[17px] text-ash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {founder.title}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8, ease: EASE_APPLE }}
            >
              <blockquote className="mt-8 border-l-2 border-green pl-4 text-[21px] font-semibold leading-snug tracking-[-0.01em]">
                {founder.quote}
                <footer className="mt-1 text-[13px] font-normal text-ash">— {founder.quoteSource}</footer>
              </blockquote>
              <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-graphite">
                {founder.bio.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-black/10 pt-6">
                {founder.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[12px] text-ash">{f.label}</dt>
                    <dd className="t-num mt-1 text-[15px] font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
