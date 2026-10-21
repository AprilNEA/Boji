import { Reveal } from "@/components/ui/Reveal";
import { HABITS } from "@/lib/app";

/** 每天三件事：三项打卡各对应薄肌理论的一条原则。 */
export function HabitsSection() {
  return (
    <section id="features" className="bg-mist section-pad scroll-mt-[var(--nav-h)] text-ink">
      <div className="container-wide">
        <Reveal className="text-center">
          <p className="t-eyebrow text-ash">每天三件事</p>
          <h2 className="t-headline mt-3">练一点，喝够水，睡个好觉。</h2>
          <p className="t-body-lg mx-auto mt-6 max-w-[620px] text-ash">
            Boji 把薄肌理论拆成每天三项打卡。今天页显示三项的完成情况，并推荐一套当天的课程。主屏幕小组件和手表也能看到。
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-[1080px] gap-5 md:grid-cols-3">
          {HABITS.map((h, i) => (
            <Reveal key={h.habit} delay={i * 0.08}>
              <article className="h-full rounded-[28px] bg-white p-8 sm:p-10">
                <p className="text-[14px] font-semibold">
                  <span className={h.tone}>{h.habit}</span>
                  <span className="text-ash"> · {h.principle}</span>
                </p>
                <div className="t-num mt-4 text-[clamp(48px,5vw,64px)] font-bold leading-none tracking-[-0.04em]">
                  {h.value}
                  {h.unit && <span className="ml-1 text-[0.4em] font-semibold tracking-[-0.01em]">{h.unit}</span>}
                </div>
                <p className="mt-5 text-[17px] text-ash">{h.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-12 max-w-[720px] text-center">
          <p className="text-[19px]">
            <span className="font-semibold">还有一条，叫黄毛。</span>
            <span className="text-ash">不被外界评价左右，坚持自己判断过的方向。App 只记录你自己，不和别人比较。</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
