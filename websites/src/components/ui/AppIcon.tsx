import { MARK_BODY, MARK_HEAD } from "@/components/ui/Logo";

/**
 * Boji 的浅色 App 图标：浅灰绿底，深绿人形。用于 Cookie 提示、通知和选购摘要。
 * 底色和圆角在 globals.css 的 `.app-icon` 中定义。尺寸由 className 决定。
 */
export function AppIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span aria-hidden className={`app-icon inline-flex shrink-0 ${className}`}>
      <svg viewBox="0 0 1024 1024" className="h-full w-full" fill="currentColor">
        <circle {...MARK_HEAD} />
        <path fillRule="evenodd" d={MARK_BODY} />
      </svg>
    </span>
  );
}
