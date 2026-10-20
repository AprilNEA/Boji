import Link from "next/link";

export default function NotFound() {
  return (
    <section className="on-dark flex min-h-[100svh] flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="t-num font-[Inter_Variable] text-[clamp(96px,18vw,200px)] font-[100] leading-none tracking-[-0.06em] text-[#3a3a3c]">404</div>
      <h1 className="t-title mt-6">该页面体脂超标，已被移除。</h1>
      <p className="t-body-lg mt-4 text-[#86868b]">我们正在帮它减脂。预计 3–6 个月后恢复。</p>
      <Link href="/" className="link-apple on-dark mt-10 text-[19px]">
        <span>返回发布会</span>
        <span className="chev">›</span>
      </Link>
    </section>
  );
}
