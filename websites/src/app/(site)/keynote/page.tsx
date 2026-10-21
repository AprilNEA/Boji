import type { Metadata } from "next";
import { FoundersHero } from "@/components/keynote/FoundersHero";
import { ProductReveal } from "@/components/keynote/ProductReveal";
import { ChipSection } from "@/components/keynote/ChipSection";
import { WaterSleepSection } from "@/components/keynote/WaterSleep";
import { IntelligenceSection } from "@/components/keynote/IntelligenceSection";
import { CompareTeaser, PriceTeaser } from "@/components/keynote/Teasers";
import { OneMoreThing } from "@/components/keynote/OneMoreThing";
import { SHARE_DESCRIPTION, SHARE_TITLE } from "@/lib/content";

/** 发布会页在搜索结果里的描述：严肃搞怪的新闻稿腔，50–160 字。 */
const KEYNOTE_DESCRIPTION =
  "今天，薄肌俱乐部正式发布薄肌。穿衣显瘦，脱衣有肉：体脂长期低于 13%，每天喝 1700 mL 水，每晚睡 7–9 小时。搭载 M13 意志力芯片，Regardless of how you feel，今天照样去练。薄肌，¥0 起。付款方式：戒掉含糖饮料。";

export const metadata: Metadata = {
  title: "2026 秋季发布会",
  description: KEYNOTE_DESCRIPTION,
  keywords: ["薄肌", "薄肌理论", "薄肌俱乐部", "薄肌身材", "邵艾伦", "孙宇晨", "体脂率"],
  // 社交平台分享链接时预加载的卡片：只要一行。
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    siteName: "薄肌俱乐部",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export default function KeynotePage() {
  return (
    <>
      <FoundersHero />
      <ProductReveal />
      <ChipSection />
      <WaterSleepSection />
      <IntelligenceSection />
      <CompareTeaser />
      <PriceTeaser />
      <OneMoreThing />
    </>
  );
}
