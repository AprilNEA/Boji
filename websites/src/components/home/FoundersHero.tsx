"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { FOUNDERS, type Founder } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";
import { LaunchFilm, type LaunchFilmHandle } from "@/components/home/LaunchFilm";

export function FoundersHero() {
  const ref = useRef<HTMLDivElement>(null);
  const filmRef = useRef<LaunchFilmHandle>(null);
  const reduce = useReducedMotion();
  // Scroll fade applies to the founders block only; the film below stays crisp.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // Start playback inside the click so sound is allowed; the film then glides itself into view.
  const watch = () => filmRef.current?.playWithSound();

  return (
    <section className="on-dark relative overflow-x-clip bg-black text-white">
      <div ref={ref}>
      <motion.div style={reduce ? undefined : { scale, opacity, y }} className="origin-top pt-[calc(var(--nav-h)+clamp(40px,7vh,88px))]">
        <div className="container-wide flex flex-col items-center text-center">
          <motion.p
            className="t-eyebrow text-haze"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0, ease: EASE_APPLE }}
          >
            薄肌俱乐部 · 2026 秋季发布会
          </motion.p>

          <motion.h1
            className="t-hero think-thin mt-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.1, ease: EASE_APPLE }}
          >
            Think Thin.
          </motion.h1>

          <motion.div
            className="mt-8 flex items-center gap-7 text-[19px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.1, ease: EASE_APPLE }}
          >
            <button type="button" onClick={watch} className="link-apple on-dark">
              <span>观看发布会</span>
              <span className="chev">›</span>
            </button>
            <Link href="/store/" className="link-apple on-dark">
              <span>选购薄肌</span>
              <span className="chev">›</span>
            </Link>
          </motion.div>
        </div>

        <div className="container-wide mt-[clamp(40px,7vh,72px)] pb-[clamp(56px,10vh,120px)]">
          <div
            className="mx-auto grid grid-cols-2 gap-[clamp(12px,3vw,36px)]"
            style={{ maxWidth: "clamp(560px, calc((100svh - 300px) * 1.6 + 36px), 900px)" }}
          >
            {FOUNDERS.map((f, i) => (
              <FounderPortrait key={f.id} founder={f} delay={1.45 + i * 0.18} />
            ))}
          </div>
        </div>
      </motion.div>
      </div>

      <LaunchFilm ref={filmRef} />
    </section>
  );
}

function FounderPortrait({ founder, delay }: { founder: Founder; delay: number }) {
  const [hover, setHover] = useState(false);
  const isSun = founder.id === "sun";

  return (
    <motion.figure
      className="group relative"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.4, delay, ease: EASE_APPLE }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onClick={() => setHover((h) => !h)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-black">
        <motion.img
          src={founder.image}
          alt={`${founder.name} ${founder.en}`}
          className="h-full w-full object-cover object-top"
          animate={{ scale: hover ? 1.035 : 1 }}
          transition={{ duration: 1.2, ease: EASE_APPLE }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,transparent_55%,rgba(0,0,0,0.65)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent to-black" />

        <AnimatePresence>
          {hover && (
            <motion.blockquote
              className="absolute inset-x-3 bottom-3 rounded-[18px] border border-white/10 bg-[rgba(31,30,28,0.62)] px-4 py-3.5 text-left backdrop-blur-[24px] sm:inset-x-4 sm:bottom-4 sm:px-5 sm:py-4"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.55, ease: EASE_APPLE }}
            >
              <p className="text-[clamp(15px,1.6vw,21px)] font-semibold leading-snug tracking-[-0.01em] text-white">{founder.quote}</p>
              <footer className="mt-1 text-[12px] text-haze">— {founder.quoteSource}</footer>
            </motion.blockquote>
          )}
        </AnimatePresence>
      </div>

      <figcaption className="mt-5 text-center">
        <div className="text-[clamp(19px,2vw,24px)] font-semibold tracking-[-0.015em]">
          {founder.name} <span className="font-[Inter_Variable] font-medium text-haze">{founder.en}</span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-2 text-[clamp(13px,1.4vw,17px)] text-haze">
          {isSun && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
          )}
          <span>{founder.title}</span>
        </div>
      </figcaption>
    </motion.figure>
  );
}
