import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { Reveal } from "@/components/ui/Reveal";
import { PLATFORMS, SCREENS } from "@/lib/app";

/** 足迹，以及手表、小组件和健康数据。 */
export function ProgressSection() {
  return (
    <>
      <section className="bg-mist section-pad text-ink">
        <div className="container-wide grid items-center gap-16 md:grid-cols-[minmax(0,360px)_1fr] md:gap-20">
          <Reveal y={0} className="order-2 mx-auto w-[min(78vw,340px)] md:order-1 md:w-full">
            <PhoneFrame {...SCREENS.progress} />
          </Reveal>
          <div className="order-1 md:order-2">
            <Reveal>
              <p className="t-eyebrow text-ash">足迹</p>
              <h2 className="t-headline mt-3">
                看自己的变化，
                <br />
                不看别人的身材。
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <ul className="mt-10 space-y-5 text-[17px] text-ash">
                <li>
                  <strong className="font-semibold text-ink">累计和最近 7 天。</strong>
                  训练次数、活跃天数和最近一周的记录。
                </li>
                <li>
                  <strong className="font-semibold text-ink">体重和腰围。</strong>
                  趋势图可以手动添加，也可以从系统健康数据读取。
                </li>
                <li>
                  <strong className="font-semibold text-ink">一键分享。</strong>
                  通过系统分享面板分享足迹。
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-paper section-pad text-ink">
        <div className="container-wide">
          <Reveal className="text-center">
            <p className="t-eyebrow text-ash">手表、小组件与健康数据</p>
            <h2 className="t-headline mt-3">抬手就能看到今天。</h2>
            <p className="t-body-lg mx-auto mt-6 max-w-[640px] text-ash">
              开启「共享当天打卡状态」后，在主屏幕和手表上查看三项是否完成。只共享是否完成和训练场景，不共享具体数值。
            </p>
          </Reveal>

          <div className="mx-auto mt-16 grid max-w-[1080px] items-center gap-12 md:grid-cols-[minmax(0,420px)_1fr] md:gap-16">
            {/* 同一份打卡数据：iPhone 今天页和手表的今日进度。Apple 营销规范要求多台设备保持真实的相对大小：iPhone 机身高 163 mm，表壳高 49 mm，表壳约占手表图高度的 5/8，所以手表宽度是 iPhone 的 0.614 倍。 */}
            <Reveal y={0} className="mx-auto flex w-[min(86vw,420px)] items-end gap-[6%] md:w-full">
              <PhoneFrame {...SCREENS.today} className="w-[56%]" />
              <img
                src={SCREENS.watch.src}
                alt={SCREENS.watch.alt}
                width={600}
                height={960}
                loading="lazy"
                decoding="async"
                className="mb-[6%] h-auto w-[34.4%]"
                draggable={false}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <table className="w-full text-left text-[15px]">
                <thead>
                  <tr className="border-b border-black/10 text-[13px] text-ash">
                    <th scope="col" className="py-3 pr-4 font-normal">
                      <span className="sr-only">功能</span>
                    </th>
                    <th scope="col" className="py-3 pr-4 font-semibold text-ink">
                      iPhone
                    </th>
                    <th scope="col" className="py-3 font-semibold text-ink">
                      Android
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLATFORMS.map((p) => (
                    <tr key={p.label} className="border-b border-black/10 align-top">
                      <th scope="row" className="py-4 pr-4 font-normal text-ash">
                        {p.label}
                      </th>
                      <td className="py-4 pr-4">{p.ios}</td>
                      <td className="py-4">{p.android}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-[14px] text-ash">共享打卡状态和健康数据连接都默认关闭。健康数据只读展示，与手动记录分开。</p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
