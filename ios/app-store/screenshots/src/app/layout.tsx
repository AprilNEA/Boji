import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boji App Store 截图编辑器",
  description: "在本机编辑并导出 App Store 截图。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body>{children}</body>
    </html>
  );
}
