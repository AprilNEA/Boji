import { getStandaloneMetadata, StandalonePage } from "@/components/docs/StandalonePage";

export function generateMetadata() {
  return getStandaloneMetadata("terms");
}

export default function Page() {
  return <StandalonePage name="terms" />;
}
