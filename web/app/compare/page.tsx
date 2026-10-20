import type { Metadata } from "next";
import { ComparePage } from "@/components/compare/ComparePage";

export const metadata: Metadata = {
  title: "比较型号",
  description: "哪一款适合你？比较厚肌、饿瘦、薄肌与孙宇晨 · 薄肌版。",
};

export default function Page() {
  return <ComparePage />;
}
