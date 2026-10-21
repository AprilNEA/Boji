import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

// 英文版，内容源为 docs/sites/third-parties.en.mdx。中文版在 /third-parties/，两个版本的内容必须一致。
export function generateMetadata() {
  return getStandaloneMetadata("third-parties", "en");
}

export default function Page() {
  return <StandalonePage name="third-parties" lang="en" />;
}
