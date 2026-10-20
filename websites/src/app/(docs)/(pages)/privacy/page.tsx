import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

// /privacy/ 是 App Store Connect 的隐私政策网址。不要改名或移动。
export function generateMetadata() {
  return getStandaloneMetadata("privacy");
}

export default function Page() {
  return <StandalonePage name="privacy" />;
}
