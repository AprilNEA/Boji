import type { Metadata } from "next";
import { StorePage } from "@/components/store/StorePage";

export const metadata: Metadata = {
  title: "选购薄肌",
  description: "选择起点、训练频率和含糖饮料习惯，查询薄肌的预计交付日期。付款方式：戒掉含糖饮料。总计 ¥0。",
};

export default function Page() {
  return <StorePage />;
}
