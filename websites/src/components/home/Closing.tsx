import { AppStoreButton } from "@/components/ui/AppStoreButton";
import { TextLink } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { APP_ICON } from "@/lib/app";

const PRIVACY = [
  { title: "保存在本机", body: "训练、打卡和足迹都保存在手机上，App 不会上传它们。" },
  { title: "不用注册", body: "基础记录不需要账号。只有领取会员卡时才需要登录。" },
  { title: "随时带走", body: "设置页可以把全部记录导出为 JSON，也可以一键删除全部本地数据。" },
] as const;

/** 本地优先，然后是下载按钮和俱乐部入口。 */
export function PrivacySection() {
  return (
    <section className="on-dark bg-black section-pad text-white">
      <div className="container-wide">
        <Reveal className="text-center">
          <p className="t-eyebrow text-haze">隐私</p>
          <h2 className="t-headline mt-3">
            你的数据，
            <span className="t-brand">留在你的手机上。</span>
          </h2>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-[1080px] gap-5 md:grid-cols-3">
          {PRIVACY.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <article className="h-full rounded-[28px] bg-smoke/60 p-8">
                <h3 className="text-[21px] font-semibold tracking-[-0.015em]">{p.title}</h3>
                <p className="mt-3 text-[17px] text-haze">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <TextLink href="/privacy/" className="text-[17px]">
            阅读隐私政策
          </TextLink>
        </Reveal>
      </div>
    </section>
  );
}

export function DownloadSection() {
  return (
    <section className="bg-paper section-pad text-ink">
      <div className="container-apple text-center">
        <Reveal>
          <img
            src={APP_ICON}
            alt="薄肌俱乐部 App 图标"
            width={128}
            height={128}
            loading="lazy"
            className="mx-auto h-[clamp(88px,10vw,128px)] w-auto"
            draggable={false}
          />
          <h2 className="t-hero mt-8">
            今天，<span className="t-brand">练一点。</span>
          </h2>
          <p className="t-subhead mt-5 text-ash">免费下载。不比较身材，只记录你自己。</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <AppStoreButton />
            <TextLink href="/docs/guide/" className="text-[17px]">
              阅读用户指南
            </TextLink>
          </div>
        </Reveal>

        <Reveal className="mt-24 border-t border-black/10 pt-12">
          <p className="text-[17px] text-ash">
            App 背后是一场严肃的恶搞发布会。
            <br className="sm:hidden" />
            想知道薄肌理论从哪来？
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[17px]">
            <TextLink href="/keynote/">观看 2026 秋季发布会</TextLink>
            <TextLink href="/theory/">阅读薄肌理论</TextLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
