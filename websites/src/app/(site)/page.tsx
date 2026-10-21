import type { Metadata } from "next";
import { AppHero } from "@/components/home/AppHero";
import { HabitsSection } from "@/components/home/HabitsSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { ProgressSection } from "@/components/home/ProgressSection";
import { DownloadSection, PrivacySection } from "@/components/home/Closing";
import { APP_SHARE_DESCRIPTION, APP_SHARE_TITLE } from "@/lib/content";

/** 首页在搜索结果里的描述，50–160 字。 */
const HOME_DESCRIPTION =
  "薄肌俱乐部 App 把薄肌理论落到每一天：训练、饮水、睡眠三项打卡，4 套居家和健身房课程，动作动画标出发力肌群，逐组跟练，记录体重和腰围的变化。支持 iPhone、Apple Watch 和 Android，数据保存在本机，基础记录无需注册。";

export const metadata: Metadata = {
  description: HOME_DESCRIPTION,
  keywords: ["薄肌", "薄肌俱乐部", "薄肌理论", "健身 App", "居家健身", "饮水记录", "睡眠记录", "Boji"],
  openGraph: {
    title: APP_SHARE_TITLE,
    description: APP_SHARE_DESCRIPTION,
    siteName: "薄肌俱乐部",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: APP_SHARE_TITLE,
    description: APP_SHARE_DESCRIPTION,
  },
  // 让 Safari 在页面顶部显示 App Store 横幅。
  other: { "apple-itunes-app": "app-id=6824964768" },
};

export default function HomePage() {
  return (
    <>
      <AppHero />
      <HabitsSection />
      <CoursesSection />
      <ProgressSection />
      <PrivacySection />
      <DownloadSection />
    </>
  );
}
