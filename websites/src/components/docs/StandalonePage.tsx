import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/docs/mdx";
import { source } from "@/lib/source";

/** 独立页面的名称，也是 docs/sites/ 下的文件名和网址，例如 privacy 对应 docs/sites/privacy.mdx 和 /privacy/。 */
export type StandalonePageName = "privacy" | "support";

function getStandalonePage(name: StandalonePageName) {
  const page = source.getPage([name]);
  if (!page) notFound();
  return page;
}

/** 渲染 docs/sites/<name>.mdx。页面没有侧边栏和目录，样式与文档正文相同。 */
export function StandalonePage({ name }: { name: StandalonePageName }) {
  const page = getStandalonePage(name);
  const MDX = page.data.body;

  return (
    <article className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-4 py-10 md:px-6 md:py-14">
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
export function getStandaloneMetadata(name: StandalonePageName): Metadata {
  const page = getStandalonePage(name);
  return {
    title: { absolute: `${page.data.title} · 薄肌俱乐部` },
    description: page.data.description,
  };
}
