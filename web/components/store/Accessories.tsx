import { Reveal } from "@/components/ui/Reveal";
import { ACCESSORIES } from "@/lib/content";

/** 配件：鸡胸肉、西兰花这些食材只在这里出现。 */
export function Accessories() {
  return (
    <section id="accessories" className="bg-mist section-pad">
      <div className="container-wide">
        <Reveal>
          <h2 className="t-title">配件。</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {ACCESSORIES.map((a, i) => (
            <Reveal key={a.name} delay={i * 0.08}>
              <article className="group h-full rounded-[22px] bg-white p-6">
                <div className="flex aspect-square items-center justify-center">
                  <img
                    src={a.img}
                    alt={a.name}
                    className="h-[78%] w-[78%] object-contain transition-transform duration-[900ms] [transition-timing-function:var(--ease-apple)] group-hover:scale-[1.05]"
                    draggable={false}
                  />
                </div>
                <h3 className="mt-4 text-[19px] font-semibold">{a.name}</h3>
                <p className="mt-1 text-[14px] leading-snug text-ash">{a.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
