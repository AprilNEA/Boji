import type { Metadata } from "next";
import { FoundersPage } from "@/components/founders/FoundersPage";

export const metadata: Metadata = {
  title: "创始人",
  description: "薄肌俱乐部领导层：薄肌理论创始人邵艾伦 Alan，首席践行官孙宇晨 Justin。",
};

export default function Page() {
  return <FoundersPage />;
}
