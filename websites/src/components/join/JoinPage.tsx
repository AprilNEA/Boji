"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useState } from "react";
import { MemberCard } from "@/components/membership/MemberCard";
import { Oath } from "@/components/membership/Oath";
import { Steps } from "@/components/membership/Steps";
import { EASE_APPLE } from "@/lib/motion";

type Stage = "oath" | "card";

const JOIN_STEPS = ["入会宣誓", "领取会员卡"] as const;

/** 入会：不用先选配置，直接庄严宣誓，领取激光刻印的会员卡。 */
export function JoinPage() {
  const [stage, setStage] = useState<Stage>("oath");
  const [name, setName] = useState("");
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const lenis = useLenis();

  const go = (s: Stage) => {
    setStage(s);
    if (lenis) lenis.scrollTo(0, { duration: 0.8 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100svh] bg-paper text-ink">
      <div className="pb-[clamp(96px,12vw,160px)] pt-[calc(var(--nav-h)+clamp(40px,7vh,80px))]">
        <Steps steps={JOIN_STEPS} current={stage === "oath" ? 0 : 1} />
        <AnimatePresence mode="wait">
          {stage === "oath" && (
            <Panel key="oath">
              <Oath
                name={name}
                setName={setName}
                onDone={() => {
                  setJoinedAt(new Date());
                  go("card");
                }}
              />
            </Panel>
          )}
          {stage === "card" && joinedAt && (
            <Panel key="card">
              <MemberCard name={name.trim()} joinedAt={joinedAt} onRestart={() => go("oath")} />
            </Panel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.7, ease: EASE_APPLE }}
    >
      {children}
    </motion.div>
  );
}
