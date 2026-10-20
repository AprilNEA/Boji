import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

// /support/ 是 App Store Connect 的支持网址。不要改名或移动。
export function generateMetadata() {
  return getStandaloneMetadata("support");
}

export default function Page() {
  return <StandalonePage name="support" />;
}
