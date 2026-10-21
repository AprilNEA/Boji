import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { Reveal } from "@/components/ui/Reveal";
import { COURSES, EXERCISE_GIF, SCREENS, exercisePoster } from "@/lib/app";

const TOTAL_EXERCISES = COURSES.reduce((n, c) => n + c.exercises.length, 0);

/** 课程：四套课程的动作海报，然后是动作动画和逐组跟练。 */
export function CoursesSection() {
  return (
    <>
      <section className="bg-paper section-pad text-ink">
        <div className="container-wide">
          <Reveal className="text-center">
            <p className="t-eyebrow text-ash">课程</p>
            <h2 className="t-headline mt-3">在家，或者在健身房。</h2>
            <p className="t-body-lg mx-auto mt-6 max-w-[620px] text-ash">
              {COURSES.length} 套课程，{TOTAL_EXERCISES} 个动作。首次打开时选择居家或健身房，训练页据此推荐课程，之后随时切换。
            </p>
          </Reveal>

          <div className="mx-auto mt-16 grid max-w-[1080px] gap-5 md:grid-cols-2">
            {COURSES.map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) * 0.08}>
                <article className="h-full rounded-[28px] bg-white p-7 sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[clamp(21px,2.2vw,26px)] font-semibold tracking-[-0.02em]">{c.title}</h3>
                    <span className="t-num shrink-0 text-[14px] text-ash">
                      {c.minutes} 分钟 · {c.exercises.length} 个动作
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] text-ash">{c.subtitle}</p>
                  <ul className="mt-6 grid grid-cols-5 gap-2">
                    {c.exercises.map((e) => (
                      <li key={e.id} className="text-center">
                        <img
                          src={exercisePoster(e.id)}
                          alt={`${e.name}的代表姿势`}
                          width={240}
                          height={240}
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full rounded-[14px]"
                          draggable={false}
                        />
                        <span className="mt-1.5 block text-[12px] leading-tight text-ash-dark">{e.name}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="on-dark bg-black section-pad text-white">
        <div className="container-wide grid items-center gap-16 md:grid-cols-2 md:gap-20">
          <div>
            <Reveal>
              <p className="t-eyebrow text-haze">动作与跟练</p>
              <h2 className="t-headline mt-3">
                先看清，
                <br />
                <span className="t-brand">再开始练。</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <ul className="mt-10 space-y-6 text-[17px] text-haze">
                <li>
                  <strong className="font-semibold text-white">动作动画。</strong>
                  每个动作都有循环动画，用颜色标出主要发力的肌群，跟随系统切换深浅色。
                </li>
                <li>
                  <strong className="font-semibold text-white">动作要点。</strong>
                  列出组数、次数、要点和主要肌群。开启减少动态效果后，显示代表姿势。
                </li>
                <li>
                  <strong className="font-semibold text-white">逐组跟练。</strong>
                  完成一组后自动开始 30 秒休息倒计时，可以跳过，也可以随时暂停。
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.16}>
              <figure className="mt-12 flex items-center gap-5">
                <img
                  src={EXERCISE_GIF.src}
                  alt={EXERCISE_GIF.alt}
                  width={240}
                  height={240}
                  loading="lazy"
                  className="h-[120px] w-[120px] rounded-[22px] bg-white"
                  draggable={false}
                />
                <figcaption className="text-[14px] text-haze">
                  徒手深蹲
                  <br />
                  臀部和大腿前侧是主要发力肌群
                </figcaption>
              </figure>
            </Reveal>
          </div>

          <div className="flex items-start justify-center gap-[clamp(14px,2.4vw,28px)]">
            <Reveal className="w-[46%] max-w-[300px]">
              <PhoneFrame {...SCREENS.exercise} className="!bg-smoke" />
            </Reveal>
            <Reveal delay={0.12} className="mt-[12%] w-[46%] max-w-[300px]">
              <PhoneFrame {...SCREENS.session} className="!bg-smoke" />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
