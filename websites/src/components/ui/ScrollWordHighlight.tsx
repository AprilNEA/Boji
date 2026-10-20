"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { COLORS } from "@/lib/colors";

type Props = {
  text: string;
  className?: string;
  dim?: string;
  bright?: string;
};

/** Apple-manifesto style: characters light up one by one as you scroll. */
export function ScrollWordHighlight({ text, className = "", dim = COLORS.smoke, bright = COLORS.paper }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const tokens = segment(text);

  return (
    <p ref={ref} className={className}>
      {tokens.map((tok, i) => (
        <Token key={i} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} dim={dim} bright={bright}>
          {tok}
        </Token>
      ))}
    </p>
  );
}

function Token({
  children,
  progress,
  range,
  dim,
  bright,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  dim: string;
  bright: string;
}) {
  const color = useTransform(progress, range, [dim, bright]);
  return <motion.span style={{ color }}>{children}</motion.span>;
}

/** Split CJK text into characters and keep Latin words together. */
function segment(text: string): string[] {
  const out: string[] = [];
  const re = /[A-Za-z0-9%.\-–']+\s?|\s+|./gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}
