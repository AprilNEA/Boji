import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

// 第三方信息共享清单，隐私政策的组成部分。英文版在 /en/third-parties/。
export function generateMetadata() {
  return getStandaloneMetadata("third-parties");
}

export default function Page() {
  return <StandalonePage name="third-parties" />;
}
