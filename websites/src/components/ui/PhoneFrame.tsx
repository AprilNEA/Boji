type PhoneFrameProps = {
  src: string;
  alt: string;
  className?: string;
  /** 首屏图片设为 eager，其余延迟加载。 */
  eager?: boolean;
};

/**
 * public/frames/iphone.webp 是 Apple Product Bezels 的 iPhone 机身，由
 * ios/app-store/screenshots/public/frames/iphone-portrait.png（1470 × 3000）缩小一半得到。
 * 屏幕开口在原图中是 x 75、y 66、宽 1320、高 2868，圆角半径 191。
 * 截图是 603 × 1311 的模拟器原图，宽高比与开口一致。
 */
const SCREEN = {
  left: `${(75 / 1470) * 100}%`,
  top: `${(66 / 3000) * 100}%`,
  width: `${(1320 / 1470) * 100}%`,
  height: `${(2868 / 3000) * 100}%`,
  borderRadius: `${(191 / 1320) * 100}% / ${(191 / 2868) * 100}%`,
};

/**
 * 把 App 截图放进真实的 iPhone 机身。宽度由 className 决定。
 * Apple 的营销规范要求机身原样使用：不裁切、不遮挡、不加阴影或倒影、不倾斜，屏幕上至少 200 px 高。
 */
export function PhoneFrame({ src, alt, className = "", eager = false }: PhoneFrameProps) {
  const loading = eager ? "eager" : "lazy";
  return (
    <div className={`relative aspect-[1470/3000] ${className}`}>
      <img
        src={src}
        alt={alt}
        width={603}
        height={1311}
        loading={loading}
        decoding="async"
        draggable={false}
        className="absolute object-cover object-top"
        style={SCREEN}
      />
      <img
        src="/frames/iphone.webp"
        alt=""
        aria-hidden
        width={735}
        height={1500}
        loading={loading}
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}
