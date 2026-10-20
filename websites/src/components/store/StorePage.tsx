"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useState } from "react";
import { MemberCard } from "@/components/membership/MemberCard";
import { Oath } from "@/components/membership/Oath";
import { Steps } from "@/components/membership/Steps";
import { Accessories } from "@/components/store/Accessories";
import { Configurator, useDelivery, type Config } from "@/components/store/Configurator";
import { EASE_APPLE } from "@/lib/motion";

type Stage = "config" | "checkout" | "card";

const STORE_STEPS = ["选购配置", "入会宣誓", "领取会员卡"] as const;

/** 选购：配置 → 结账（入会宣誓）→ 领取会员卡。会员卡上刻着预计交付日期。 */
export function StorePage() {
  const [stage, setStage] = useState<Stage>("config");
  const [config, setConfig] = useState<Config>({ start: null, freq: null, sugar: null });
  const [name, setName] = useState("");
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const delivery = useDelivery(config);
  const lenis = useLenis();

  const go = (s: Stage) => {
    setStage(s);
    if (lenis) lenis.scrollTo(0, { duration: 0.8 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100svh] bg-paper text-ink">
      <AnimatePresence mode="wait">
        {stage === "config" && (
          <Panel key="config">
            <Configurator config={config} setConfig={setConfig} onCheckout={() => go("checkout")} />
            <Accessories />
          </Panel>
        )}
        {stage === "checkout" && (
          <Panel key="checkout" padded>
            <Steps steps={STORE_STEPS} current={1} />
            <Oath
              name={name}
              setName={setName}
              eyebrow="结账"
              subtitle="付款方式：戒掉含糖饮料。请逐条确认。"
              onBack={() => go("config")}
              backLabel="返回修改配置"
              onDone={() => {
                setJoinedAt(new Date());
                go("card");
              }}
            />
          </Panel>
        )}
        {stage === "card" && joinedAt && delivery && (
          <Panel key="card" padded>
            <Steps steps={STORE_STEPS} current={2} />
            <MemberCard name={name.trim()} joinedAt={joinedAt} deliveryAt={delivery.date} onRestart={() => go("checkout")} />
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({ children, padded = false }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <motion.div
      className={padded ? "pb-[clamp(96px,12vw,160px)] pt-[calc(var(--nav-h)+clamp(40px,7vh,80px))]" : ""}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.7, ease: EASE_APPLE }}
    >
      {children}
    </motion.div>
  );
}
