import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/docs/mdx";
import { type Language, source } from "@/lib/source";

/**
 * 独立页面的名称，也是 docs/sites/ 下的文件名和网址，例如 privacy 对应 docs/sites/privacy.mdx 和 /privacy/。
 * 英文版是同名的 .en.mdx 文件，网址在 /en/ 下。
 */
export type StandalonePageName = "privacy" | "support" | "terms" | "third-parties";

function getStandalonePage(name: StandalonePageName, lang: Language) {
  const page = source.getPage([name], lang);
  if (!page) notFound();
  return page;
}

/**
 * 渲染 docs/sites/<name>.mdx 或其英文版。页面没有侧边栏和目录，样式与文档正文相同。
 * 文档根布局的 <html lang> 固定为 zh-CN，英文页面在正文上标注语言。
 */
export function StandalonePage({ name, lang = "zh-CN" }: { name: StandalonePageName; lang?: Language }) {
  const page = getStandalonePage(name, lang);
  const MDX = page.data.body;

  return (
    <article
      lang={lang === "en" ? "en" : undefined}
      className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-4 py-10 md:px-6 md:py-14"
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // 例如 privacy.mdx 中的 [支持](./support.mdx) 链接到 /support/。
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </article>
  );
}

/** 独立页面不属于文档区，标题不套用 "%s · 薄肌俱乐部文档" 模板。 */
export function getStandaloneMetadata(name: StandalonePageName, lang: Language = "zh-CN"): Metadata {
  const page = getStandalonePage(name, lang);
  const site = lang === "en" ? "Lean Muscle Club" : "薄肌俱乐部";
  return {
    title: { absolute: `${page.data.title} · ${site}` },
    description: page.data.description,
  };
}
