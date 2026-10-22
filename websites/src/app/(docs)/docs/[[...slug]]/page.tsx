import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/docs/mdx";
import { DocsRedirect } from "@/components/docs/DocsRedirect";
import { DOCS_HOME, getDocsPage, getDocsParams, source } from "@/lib/source";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <DocsRedirect href={DOCS_HOME} />;
  const page = getDocsPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // MDX 中可以用相对文件路径链接其他页面，例如 [大学排名](./school-ranking.mdx)。
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return getDocsParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  // /docs/ 只负责跳转到用户指南，不进入搜索引擎索引。
  if (slug.length === 0) return { robots: { index: false, follow: true }, alternates: { canonical: DOCS_HOME } };
  const page = getDocsPage(slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}
