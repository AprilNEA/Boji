"use client";

import { motion } from "motion/react";
import { AppStoreButton } from "@/components/ui/AppStoreButton";
import { TextLink } from "@/components/ui/Buttons";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { APP_ICON, SCREENS } from "@/lib/app";
import { EASE_APPLE } from "@/lib/motion";

/** 首屏：App 图标、一句话、下载按钮，下面是三台同样大小的 iPhone。 */
export function AppHero() {
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease: EASE_APPLE },
  });

  return (
    <section className="bg-paper pt-[calc(var(--nav-h)+clamp(40px,7vh,88px))] text-ink">
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

      {/* Apple 的营销规范要求机身不裁切、不加阴影、不做位移动画，多台设备保持同一比例。 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.5, ease: EASE_APPLE }}
        className="container-wide mt-[clamp(48px,8vh,88px)] flex justify-center gap-[clamp(16px,3vw,40px)] pb-[clamp(64px,10vw,120px)]"
      >
        <PhoneFrame {...SCREENS.training} className="hidden w-[28%] max-w-[320px] md:block" />
        <PhoneFrame {...SCREENS.today} eager className="w-[min(72vw,320px)] md:w-[28%]" />
        <PhoneFrame {...SCREENS.progress} className="hidden w-[28%] max-w-[320px] md:block" />
      </motion.div>
    </section>
  );
}
