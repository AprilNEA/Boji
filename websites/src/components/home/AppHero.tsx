"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { AppStoreButton } from "@/components/ui/AppStoreButton";
import { TextLink } from "@/components/ui/Buttons";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { APP_ICON, SCREENS } from "@/lib/app";
import { EASE_APPLE } from "@/lib/motion";

/** 首屏：App 图标、一句话、下载按钮，下面是三台 iPhone。 */
export function AppHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const leftX = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const rightX = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease: EASE_APPLE },
  });

  return (
    <section ref={ref} className="overflow-x-clip bg-paper pt-[calc(var(--nav-h)+clamp(40px,7vh,88px))] text-ink">
      <div className="container-wide flex flex-col items-center text-center">
        <motion.img
          {...enter(1.1)}
          src={APP_ICON}
          alt="薄肌俱乐部 App 图标"
          width={96}
          height={96}
          className="h-[clamp(72px,8vw,96px)] w-auto"
          draggable={false}
        />
        <motion.p {...enter(1.2)} className="t-eyebrow mt-5">
          薄肌俱乐部 App
        </motion.p>
        <motion.h1 {...enter(1.3)} className="t-hero mt-3">
          把<span className="t-brand-anim">薄肌</span>理论，
          <br />
          落到每一天。
        </motion.h1>
        <motion.p {...enter(1.45)} className="t-subhead mt-6 text-ash">
          训练、饮水、睡眠，每天三件事。
        </motion.p>
        <motion.div {...enter(1.6)} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <AppStoreButton />
          <TextLink href="#features" className="text-[17px]">
            看看它能做什么
          </TextLink>
        </motion.div>
        <motion.p {...enter(1.7)} className="mt-5 text-[14px] text-ash">
          免费下载，需要 iOS 26 或更高版本。Android 版即将推出。
        </motion.p>
      </div>

      {/* 三台手机从下方升起，两侧的手机落在中间那台的后方偏下；向下滚动时两侧向外散开，滚回顶部时向中间聚拢。 */}
      <div className="relative mx-auto mt-[clamp(48px,8vh,88px)] max-w-[1080px] px-[22px] pb-[clamp(64px,10vw,120px)]">
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.5, ease: EASE_APPLE }}
          className="flex items-start justify-center gap-[clamp(16px,3vw,40px)]"
        >
          <motion.div style={reduce ? undefined : { x: leftX, y: sideY }} className="mt-[8%] hidden w-[26%] md:block">
            <PhoneFrame {...SCREENS.training} />
          </motion.div>
          <PhoneFrame {...SCREENS.today} eager className="relative z-10 w-[min(72vw,320px)] md:w-[30%] md:max-w-none" />
          <motion.div style={reduce ? undefined : { x: rightX, y: sideY }} className="mt-[8%] hidden w-[26%] md:block">
            <PhoneFrame {...SCREENS.progress} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
