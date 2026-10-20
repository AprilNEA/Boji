// 由客户端页面（入会页、选购页）引入，自动作为客户端模块运行。
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { EASE_APPLE } from "@/lib/motion";

function memberNo(name: string): string {
  let h = 13;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 9973;
  return String(h).padStart(4, "0");
}

function dotted(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 会员卡：从选购页来的会刻上预计交付日期；直接入会的刻“正式会员”。 */
export function MemberCard({
  name,
  joinedAt,
  deliveryAt,
  onRestart,
}: {
  name: string;
  joinedAt: Date;
  deliveryAt?: Date;
  onRestart: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const no = memberNo(name);

  const save = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `薄肌俱乐部会员卡-No.${no}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="container-apple text-center">
      <motion.h1
        className="t-headline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_APPLE }}
      >
        欢迎加入薄肌俱乐部。
      </motion.h1>
      <p className="t-body-lg mt-4 text-ash">你的会员卡已激光刻印完成。移动鼠标，看看它的钛金属光泽。</p>

      <motion.div
        className="mt-14 flex justify-center"
        initial={{ opacity: 0, y: 80, rotateX: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: EASE_APPLE }}
        style={{ perspective: 1200 }}
      >
        <TiltCard>
          <div
            ref={cardRef}
            className="titanium relative aspect-[1.586] w-[min(440px,86vw)] overflow-hidden rounded-[22px] text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_1px_0_rgba(0,0,0,0.05)]"
          >
            <div className="titanium-brush absolute inset-0 opacity-70" />
            <div className="relative flex h-full flex-col justify-between p-[7%]">
              <div className="flex items-start justify-between">
                <Logo className="h-[30px] w-auto text-[#8e8e93] [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.9))]" />
                <span className="laser t-num text-right text-[12px] font-semibold leading-tight tracking-[0.02em]">
                  {deliveryAt ? (
                    <>
                      预计交付
                      <br />
                      {dotted(deliveryAt)}
                    </>
                  ) : (
                    "正式会员"
                  )}
                </span>
              </div>
              <div>
                <div className="laser text-[clamp(20px,5vw,26px)] font-semibold tracking-[0.01em]">{name}</div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="laser t-num font-[Inter_Variable] text-[13px] tracking-[0.12em]">No. {no}</div>
                  <div className="laser t-num font-[Inter_Variable] text-[12px] tracking-[0.08em]">MEMBER SINCE {dotted(joinedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </motion.div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
        <button type="button" onClick={save} disabled={saving} className="btn-pill btn-primary min-w-[200px]">
          {saving ? "正在刻印…" : "保存会员卡"}
        </button>
        <button type="button" onClick={onRestart} className="btn-pill btn-outline min-w-[160px] text-link">
          重新宣誓
        </button>
      </div>
      {!deliveryAt && (
        <Link href="/store/" className="link-apple mt-8 text-[17px]">
          <span>查询我的预计交付日期</span>
          <span className="chev">›</span>
        </Link>
      )}
      <p className="mt-8 text-[12px] text-ash">会员卡不具备任何支付功能。唯一可透支的，是你的意志力。</p>
    </section>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 150, damping: 18 });
  const sy = useSpring(my, { stiffness: 150, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-14, 14]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);
  const gx = useTransform(sx, [0, 1], [0, 100]);
  const gy = useTransform(sy, [0, 1], [0, 100]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 45%)`;

  return (
    <motion.div
      className="relative rounded-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      {children}
      <motion.div className="pointer-events-none absolute inset-0 rounded-[22px] mix-blend-soft-light" style={{ background: sheen }} />
    </motion.div>
  );
}
