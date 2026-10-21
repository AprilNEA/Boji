type PhoneFrameProps = {
  src: string;
  alt: string;
  className?: string;
  /** 首屏图片设为 eager，其余延迟加载。 */
  eager?: boolean;
};

/**
 * 把 App 截图放进一台简化的 iPhone 机身。截图是 603 × 1311 的模拟器原图，自带状态栏。
 * 圆角按宽高分别取百分比，所以机身在任何宽度下比例不变。宽度由 className 决定。
 */
export function PhoneFrame({ src, alt, className = "", eager = false }: PhoneFrameProps) {
  return (
    <div className={`rounded-[15%/7%] bg-ink p-[3.2%] shadow-[0_40px_100px_rgba(30,29,27,0.22)] ${className}`}>
      <img
        src={src}
        alt={alt}
        width={603}
        height={1311}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="block h-auto w-full rounded-[12.5%/5.8%]"
      />
    </div>
  );
}
