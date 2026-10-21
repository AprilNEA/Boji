import { APP_STORE_URL } from "@/lib/app";

/** App Store 下载按钮。浅色背景用黑底，深色区块传 onDark 用白底。 */
export function AppStoreButton({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-pill ${onDark ? "bg-white text-ink hover:bg-paper" : "bg-ink text-white hover:bg-smoke"} ${className}`}
    >
      在 App Store 下载
      <span aria-hidden>↗</span>
    </a>
  );
}
