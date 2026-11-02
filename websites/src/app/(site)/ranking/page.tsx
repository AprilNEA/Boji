import type { Metadata } from "next";
import { RankingPage } from "@/components/ranking/RankingPage";

export const metadata: Metadata = {
  title: "大学排名",
  description: "按学校统计持有会员卡、并通过学校邮箱认证的薄肌会员人数。不足 3 人的学校不公开显示。",
};

export default function Page() {
  return <RankingPage />;
}
