import type { Metadata } from "next";
import { TheoryPage } from "@/components/theory/TheoryPage";

export const metadata: Metadata = {
  title: "薄肌理论",
  description: "不是一种身材。是一种选择。薄肌理论全文很短：薄肌、黄毛、大水、大睡。",
};

export default function Page() {
  return <TheoryPage />;
}
