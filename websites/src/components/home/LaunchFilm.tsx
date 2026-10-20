"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { LAUNCH_FILM } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

export type LaunchFilmHandle = {
  /** Restart from the beginning with sound (call from a click handler), then bring the film into view. */
  playWithSound: () => void;
};

/**
 * Apple-style product film at the foot of the hero.
 * Muted ambient loop while in view; pauses when it leaves; sound and play/pause controls bottom-right.
 */
export function LaunchFilm({ ref }: { ref?: Ref<LaunchFilmHandle> }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const lenis = useLenis();
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const progress = useMotionValue(0);

  useAnimationFrame(() => {
    const v = videoRef.current;
    if (v && v.duration) progress.set(v.currentTime / v.duration);
  });

  // Ambient autoplay: muted, only while at least half of the frame is visible.
  useEffect(() => {
    const v = videoRef.current;
    const frame = frameRef.current;
    if (!v || !frame) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!reduce && !userPaused.current && v.paused && !v.ended) v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(frame);
    return () => io.disconnect();
  }, [reduce]);

  const play = (withSound: boolean) => {
    const v = videoRef.current;
    if (!v) return;
    userPaused.current = false;
    setEnded(false);
    if (withSound) {
      v.muted = false;
      v.loop = false;
      setMuted(false);
    }
    v.play().catch(() => {
      // Browser refused audible playback: fall back to a muted start.
      v.muted = true;
      v.loop = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.ended) v.currentTime = 0;
      play(false);
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    v.loop = next; // ambient loop when muted; plays once with sound
    setMuted(next);
    if (!next && v.paused) play(true);
  };

  useImperativeHandle(ref, () => ({
    playWithSound: () => {
      const v = videoRef.current;
      const el = frameRef.current;
      if (!v || !el) return;
      v.currentTime = 0;
      play(true);
      // Glide the film to the vertical center of the viewport.
      const offset = -Math.max(0, (window.innerHeight - el.offsetHeight) / 2);
      if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
    },
  }));

  const showOverlay = !playing;

  return (
    <div id="film" className="container-wide pb-[clamp(72px,12vh,140px)]">
      <motion.div
        className="mx-auto max-w-[1100px]"
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.3, ease: EASE_APPLE }}
      >
        <div
          ref={frameRef}
          className="group relative aspect-video overflow-hidden rounded-[clamp(18px,2.4vw,32px)] bg-[#0a0a0a] shadow-[0_40px_120px_rgba(140,213,188,0.1)] ring-1 ring-white/10"
        >
          <video
            ref={videoRef}
            className="h-full w-full cursor-pointer object-cover"
            src={LAUNCH_FILM.src}
            poster={LAUNCH_FILM.poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="薄肌俱乐部 2026 秋季发布会影片"
            onClick={togglePlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
          />

          {/* Center play affordance whenever the film is not playing. */}
          <AnimatePresence>
            {showOverlay && (
              <motion.button
                type="button"
                onClick={() => {
                  const v = videoRef.current;
                  if (v && (ended || v.ended)) v.currentTime = 0;
                  play(true);
                }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/25 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_APPLE }}
              >
                <motion.span
                  className="flex h-[clamp(56px,7vw,84px)] w-[clamp(56px,7vw,84px)] items-center justify-center rounded-full bg-white/20 backdrop-blur-xl ring-1 ring-white/25"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  {ended ? <ReplayIcon className="h-[38%] w-[38%]" /> : <PlayIcon className="ml-[6%] h-[38%] w-[38%]" />}
                </motion.span>
                <span className="text-[clamp(14px,1.4vw,17px)] font-semibold tracking-[-0.01em]">
                  {ended ? "重新播放" : "观看发布会影片"}
                  <span className="t-num ml-2 font-normal text-white/70">{LAUNCH_FILM.duration}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Corner controls */}
          <div className="absolute bottom-[clamp(12px,1.6vw,20px)] right-[clamp(12px,1.6vw,20px)] flex gap-2">
            <ControlButton label={muted ? "打开声音" : "静音"} onClick={toggleSound}>
              {muted ? <MutedIcon /> : <SoundIcon />}
            </ControlButton>
            <ControlButton label={playing ? "暂停" : "播放"} onClick={togglePlay}>
              {playing ? <PauseIcon /> : <PlayIcon className="ml-[2px] h-[14px] w-[14px]" />}
            </ControlButton>
          </div>

          {/* Hairline progress */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
            <motion.div className="h-full origin-left bg-white/80" style={{ scaleX: progress }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between px-1 text-[clamp(13px,1.3vw,15px)] text-ash">
          <span>薄肌俱乐部 · 2026 秋季发布会影片</span>
          <span className="t-num">{LAUNCH_FILM.duration}</span>
        </div>
      </motion.div>
    </div>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(31,30,28,0.55)] text-white backdrop-blur-xl ring-1 ring-white/15"
      whileHover={{ scale: 1.08, backgroundColor: "rgba(62,60,56,0.7)" }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      {children}
    </motion.button>
  );
}

function PlayIcon({ className = "h-[14px] w-[14px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11.4-7.2c.6-.4.6-1.4 0-1.8L8.6 3.9C7.9 3.5 7 4 7 4.8Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="currentColor" aria-hidden>
      <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path d="M18 6.5a7.8 7.8 0 0 1 0 11" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </svg>
  );
}
