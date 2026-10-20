"use client";

import { motion } from "motion/react";
import { PillLink, TextLink } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { Silhouette } from "@/components/ui/Silhouette";
import { COMPARE_MODELS, IMG } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

const TEASER_MODELS = COMPARE_MODELS.filter((m) => m.id !== "justin");

export function CompareTeaser() {
  return (
    <section className="bg-paper section-pad text-ink">
      <div className="container-apple text-center">
        <Reveal>
          <h2 className="t-headline">哪一款适合你？</h2>
          <div className="mt-6 flex items-center justify-center">
            <TextLink href="/compare/">比较所有型号</TextLink>
          </div>
        </Reveal>

        <div className="mt-20 grid grid-cols-3 gap-4 sm:gap-10">
          {TEASER_MODELS.map((m, i) => {
            const isThin = m.id === "pro";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.1, delay: i * 0.12, ease: EASE_APPLE }}
                className="flex flex-col items-center"
              >
                <Silhouette model={m.id} className={`h-[clamp(120px,18vw,200px)] w-auto ${isThin ? "text-ink" : "text-silver"}`} />
                <div className="mt-6 h-5 text-[12px] font-semibold">{m.badge && <span className="badge-new">{m.badge}</span>}</div>
                <h3 className={`mt-1 text-[clamp(19px,2.4vw,28px)] font-semibold tracking-[-0.02em] ${isThin ? "t-brand" : ""}`}>{m.name}</h3>
                <p className="mt-2 min-h-[42px] text-[clamp(12px,1.4vw,15px)] text-ash">{m.tagline}</p>
                <dl className="mt-6 w-full space-y-4 border-t border-black/10 pt-6 text-[clamp(12px,1.4vw,15px)]">
                  <div>
                    <dt className="text-ash">穿 T 恤效果</dt>
                    <dd className="mt-0.5 font-semibold">{m.values.tshirt}</dd>
                  </div>
                  <div>
                    <dt className="text-ash">多巴胺来源</dt>
                    <dd className="mt-0.5 font-semibold">{m.values.dopamine}</dd>
                  </div>
                  <div>
                    <dt className="text-ash">获取成本</dt>
                    <dd className="mt-0.5 font-semibold">{m.values.cost}</dd>
                  </div>
                </dl>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export function PriceTeaser() {
  return (
    <section className="bg-mist section-pad overflow-x-clip text-ink">
      <div className="container-wide text-center">
        <Reveal>
          <h2 className="t-hero">
            <span className="t-brand">薄肌</span>，¥0 起。
          </h2>
          <p className="t-subhead mt-4 text-ash">另需：戒掉含糖饮料。</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <PillLink href="/store/">选购</PillLink>
            <TextLink href="/join/">入会宣誓</TextLink>
          </div>
        </Reveal>
        <motion.img
          src={IMG.teeLineup}
          alt="三件并排的 T 恤：西兰花绿、白色、黑色"
          className="mx-auto mt-12 w-[min(100%,980px)] object-contain"
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, ease: EASE_APPLE }}
          draggable={false}
        />
      </div>
    </section>
  );
}
