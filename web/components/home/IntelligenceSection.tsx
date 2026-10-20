"use client";

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NOTIFICATIONS } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

const STEPS = [0.12, 0.38, 0.64] as const;

export function IntelligenceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let idx = -1;
    STEPS.forEach((s, i) => {
      if (v >= s) idx = i;
    });
    setActive(idx);
  });

  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 220]);

  return (
    <section className="on-dark relative bg-black text-white">
      <div ref={ref} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pt-[var(--nav-h)]">
          <div className="container-wide grid w-full items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div className="text-center md:text-left">
              <h2 className="t-headline">
                <span className="intelligence-text">薄肌 Intelligence。</span>
              </h2>
              <p className="t-subhead mt-4 text-[#f5f5f7]">拍一下，就知道。</p>
              <p className="t-body-lg mx-auto mt-5 max-w-[460px] text-[#86868b] md:mx-0">
                饭前拍一张，AI 算好热量。训练录一段，AI 记好组数。睡眠戒指的数据，第二天早上已经整理成一份日报。
              </p>
              <ol className="mx-auto mt-10 hidden max-w-[420px] space-y-1 md:mx-0 md:block">
                {NOTIFICATIONS.map((n, i) => (
                  <li key={n.when} className="flex items-center gap-4">
                    <motion.span
                      className="h-[2px] rounded-full bg-white"
                      animate={{ width: active === i ? 36 : 12, opacity: active >= i ? 1 : 0.25 }}
                      transition={{ duration: 0.6, ease: EASE_APPLE }}
                    />
                    <motion.span
                      className="py-1.5 text-[19px] font-semibold"
                      animate={{ opacity: active === i ? 1 : 0.35 }}
                      transition={{ duration: 0.5 }}
                    >
                      {n.when}
                    </motion.span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-center">
              <Phone active={active} ringRotate={ringRotate} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Phone({ active, ringRotate }: { active: number; ringRotate: MotionValue<number> }) {
  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="absolute -inset-[3px] rounded-[58px] opacity-80 blur-[18px]"
        style={{
          rotate: ringRotate,
          background: "conic-gradient(from 0deg, #a8e063, #2997ff, #2f7d32, #c4ef7a, #0071e3, #a8e063)",
        }}
      />
      <div className="relative aspect-[9/19.5] h-[min(72vh,640px)] rounded-[54px] bg-[#1d1d1f] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div className="relative h-full w-full overflow-hidden rounded-[45px] bg-[radial-gradient(120%_70%_at_50%_0%,#1f3b1f_0%,#0b130b_45%,#000_100%)]">
          <div className="absolute left-1/2 top-[10px] h-[26px] w-[34%] -translate-x-1/2 rounded-full bg-black" />
          <div className="pt-[18%] text-center">
            <div className="text-[13px] font-semibold text-white/75">10月16日 星期五</div>
            <div className="t-num font-[Inter_Variable] text-[clamp(56px,7vh,76px)] font-semibold leading-none tracking-[-0.03em] text-white/95">
              9:41
            </div>
          </div>

          <div className="absolute inset-x-[5%] top-[33%] flex flex-col gap-2">
            {NOTIFICATIONS.map((n, i) => (
              <motion.div
                key={n.title}
                className="rounded-[20px] bg-[rgba(60,60,64,0.55)] p-3 backdrop-blur-[24px]"
                initial={false}
                animate={
                  active >= i
                    ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                    : { opacity: 0, y: 40, scale: 0.92, filter: "blur(6px)" }
                }
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-black text-broc-light">
                    <Logo className="h-[16px] w-auto" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-white">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-white/55">{i === Math.max(active, 0) ? "现在" : n.time}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-[1.35] text-white/85">{n.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[36%] -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
