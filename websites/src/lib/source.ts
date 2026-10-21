import { defineDocs } from "fumadocs-mdx/macro";
import { loader } from "fumadocs-core/source";
import type { Folder, Node, Root } from "fumadocs-core/page-tree";

/**
 * 网站的 MDX 内容来源，路径相对 websites/：
 *
 * - 仓库的 docs/ 是文档区，网址在 /docs/ 下，显示文档侧边栏。例如 docs/guide/index.mdx 对应 /docs/guide/。
 *   docs/ 中只收录 .mdx 页面和 meta.json，同一目录下的内部 .md 文档不会发布。
 * - 仓库的 docs/sites/ 是独立页面，没有侧边栏。例如 docs/sites/privacy.mdx 对应 /privacy/。
 *   每个独立页面在 src/app/(docs)/(pages)/ 下有自己的路由文件。
 *
 * 页面的英文版与中文版放在同一目录，文件名带 .en，例如 docs/sites/privacy.en.mdx 对应 /en/privacy/。
 */
const docs = defineDocs({
  dir: "../docs",
  docs: {
    files: ["**/*.mdx", "!sites/**"],
  },
  meta: {
    files: ["**/meta.json", "!sites/**"],
  },
});

const pages = defineDocs({
  dir: "../docs/sites",
  docs: {
    files: ["*.mdx"],
  },
  meta: {
    files: [],
  },
});

/** 文档区的网址第一段，也是文档区在 source 中的虚拟目录名。 */
const DOCS_SECTION = "docs";

export const LANGUAGES = ["zh-CN", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const source = loader({
  baseUrl: "/",
  i18n: {
    languages: [...LANGUAGES],
    defaultLanguage: "zh-CN",
    // 中文版不带语言前缀，英文版在 /en/ 下。
    hideLocale: "default-locale",
    // 只有中文版的页面（例如文档区和支持页）不生成英文网址。
    fallbackLanguage: null,
  },
  source: {
    files: [
      ...docs.toFumadocsSource({ baseDir: DOCS_SECTION }).files,
      ...pages.toFumadocsSource().files,
    ],
  },
  pageTree: {
    // 内容根目录没有 meta.json，Fumadocs 会把根节点命名为 "Docs"，搜索结果的面包屑
    // 就会多出这个英文名称。根目录不是一个栏目，所以把名称留空。
    transformers: [{ root: (node) => ({ ...node, name: "" }) }],
  },
});

/** 返回文档区的页面。slug 不含开头的 docs，例如 ["guide"] 对应 /docs/guide/。 */
export function getDocsPage(slug: string[] = []) {
  return source.getPage([DOCS_SECTION, ...slug]);
}

/** 文档区所有页面的 slug，供 /docs/[[...slug]] 生成静态页面。 */
export function getDocsParams() {
  return source
    .getPages("zh-CN")
    .filter((page) => page.slugs[0] === DOCS_SECTION)
    .map((page) => ({ slug: page.slugs.slice(1) }));
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
 * 文档侧边栏的页面树：只含 docs/ 下的页面，不含独立页面。
 * docs/meta.json 的 pages 列出了 index，所以首页通常已经是 children 的第一项。
 * 没有列出时，首页在 folder.index 中，这里把它放回第一项。
 */
export function getDocsTree(): Root {
  const folder = source.getPageTree("zh-CN").children.find(isDocsFolder);
  if (!folder) {
    throw new Error("docs/index.mdx 不存在");
  }
  return {
    $id: folder.$id,
    name: folder.name,
    children: folder.index ? [folder.index, ...folder.children] : folder.children,
  };
}
