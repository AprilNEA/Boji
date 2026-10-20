import type { Metadata } from "next";
import { RedirectTo } from "@/components/layout/RedirectTo";

export const metadata: Metadata = {
  title: "选购薄肌",
  robots: { index: false, follow: true },
  alternates: { canonical: "/store/" },
};

export default function Page() {
  return <RedirectTo href="/store/" label="选购薄肌" />;
}
