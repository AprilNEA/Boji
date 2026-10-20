import type { Metadata } from "next";
import { ProPage } from "@/components/pro/ProPage";

export const metadata: Metadata = {
  title: "薄肌",
  description: "薄肌。穿衣显瘦，脱衣有肉。体脂长期低于 13%，每天喝 1700 mL 水，每晚睡 7–9 小时，戒掉含糖饮料。¥0 起。",
};

export default function Page() {
  return <ProPage />;
}
