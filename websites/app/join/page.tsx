import type { Metadata } from "next";
import { JoinPage } from "@/components/join/JoinPage";

export const metadata: Metadata = {
  title: "入会",
  description: "入会宣誓。请逐条确认：戒掉含糖饮料，每天喝够 1700 mL 水，睡够 7–9 小时。庄严入会后，领取一张激光刻印的薄肌俱乐部会员卡。",
};

export default function Page() {
  return <JoinPage />;
}
