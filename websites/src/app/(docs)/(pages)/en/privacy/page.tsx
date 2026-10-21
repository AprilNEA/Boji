import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

// 英文版，内容源为 docs/sites/privacy.en.mdx。中文版在 /privacy/，两个版本的内容必须一致。
export function generateMetadata() {
  return getStandaloneMetadata("privacy", "en");
}

export default function Page() {
  return <StandalonePage name="privacy" lang="en" />;
}
