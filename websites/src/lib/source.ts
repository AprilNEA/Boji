import { defineDocs } from "fumadocs-mdx/macro";
import { loader } from "fumadocs-core/source";
import type { Folder, Node, Root } from "fumadocs-core/page-tree";

/**
 * 网站的 MDX 内容来源：仓库根目录 docs/sites/。路径相对 websites/。
 * docs/sites/ 下的文件路径就是网址路径：
 *
 * - docs/sites/docs/guide/index.mdx 对应 /docs/guide/，属于文档区，显示文档侧边栏。
 * - docs/sites/privacy.mdx 对应 /privacy/，是独立页面，没有侧边栏。
 *   每个独立页面在 src/app/(docs)/(pages)/ 下有自己的路由文件。
 *
 * 只收录 .mdx 页面和 meta.json。docs/sites/ 中的其他文件（例如 AGENTS.md）不会发布，
 * docs/ 下 docs/sites/ 以外的内部文档也不会发布。
 */
const content = defineDocs({
  dir: "../docs/sites",
  docs: {
    files: ["**/*.mdx"],
  },
  meta: {
    files: ["**/meta.json"],
  },
});

export const source = loader({
  baseUrl: "/",
  source: content.toFumadocsSource(),
  pageTree: {
    // 内容根目录没有 meta.json，Fumadocs 会把根节点命名为 "Docs"，搜索结果的面包屑
    // 就会多出这个英文名称。根目录不是一个栏目，所以把名称留空。
    transformers: [{ root: (node) => ({ ...node, name: "" }) }],
  },
});

/** 文档区在 docs/sites/ 中的目录名，也是网址的第一段。 */
const DOCS_SECTION = "docs";

/** 返回文档区的页面。slug 不含开头的 docs，例如 ["guide"] 对应 /docs/guide/。 */
export function getDocsPage(slug: string[] = []) {
  return source.getPage([DOCS_SECTION, ...slug]);
}

/** 文档区所有页面的 slug，供 /docs/[[...slug]] 生成静态页面。 */
export function getDocsParams() {
  return source
    .generateParams()
    .filter(({ slug }) => slug[0] === DOCS_SECTION)
    .map(({ slug }) => ({ slug: slug.slice(1) }));
}

const DOCS_HOME_URL = `/${DOCS_SECTION}`;

function isDocsFolder(node: Node): node is Folder {
  return (
    node.type === "folder" &&
    (node.index?.url === DOCS_HOME_URL ||
      node.children.some((child) => child.type === "page" && child.url === DOCS_HOME_URL))
  );
}

/**
 * 文档侧边栏的页面树：只含 docs/sites/docs/ 下的页面，不含独立页面。
 * docs/meta.json 的 pages 列出了 index，所以首页通常已经是 children 的第一项。
 * 没有列出时，首页在 folder.index 中，这里把它放回第一项。
 */
export function getDocsTree(): Root {
  const folder = source.getPageTree().children.find(isDocsFolder);
  if (!folder) {
    throw new Error(`docs/sites/${DOCS_SECTION}/index.mdx 不存在`);
  }
  return {
    $id: folder.$id,
    name: folder.name,
    children: folder.index ? [folder.index, ...folder.children] : folder.children,
  };
}
