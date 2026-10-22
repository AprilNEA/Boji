import { defineDocs } from "fumadocs-mdx/macro";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/plugins/lucide-icons";
import type { Folder, Root } from "fumadocs-core/page-tree";

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
  // meta.json 和页面 front matter 中的 icon 是 Lucide 图标名，例如 "BookOpen"。插件把它渲染成图标，
  // 显示在栏目切换器和侧边栏中。图标名见 https://lucide.dev/icons/，写法用 PascalCase。
  plugins: [lucideIconsPlugin()],
  pageTree: {
    // 内容根目录没有 meta.json，Fumadocs 会把根节点命名为 "Docs"，搜索结果的面包屑
    // 就会多出这个英文名称。根目录不是一个栏目，所以把名称留空。
    transformers: [{ root: (node) => ({ ...node, name: "" }) }],
  },
});

/** 返回文档区的页面。slug 不含开头的 docs，例如 ["guide"] 对应 /docs/guide/。 */
export function getDocsPage(slug: string[]) {
  return source.getPage([DOCS_SECTION, ...slug]);
}

/**
 * 文档区所有页面的 slug，供 /docs/[[...slug]] 生成静态页面。
 * 文档区没有首页：空 slug 对应 /docs/，这个网址跳转到 DOCS_HOME。
 */
export function getDocsParams() {
  const pages = source
    .getPages("zh-CN")
    .filter((page) => page.slugs[0] === DOCS_SECTION)
    .map((page) => ({ slug: page.slugs.slice(1) }));
  return [{ slug: [] }, ...pages];
}

/** /docs/ 跳转的目标：用户指南栏目的首页。 */
export const DOCS_HOME = `/${DOCS_SECTION}/guide/`;

/**
 * 文档侧边栏的页面树：docs/ 下的两个栏目，不含独立页面。
 * docs/guide/ 和 docs/developers/ 的 meta.json 都设置了 "root": true，
 * 所以侧边栏顶部的切换器列出这两个栏目，侧边栏只显示当前栏目的页面。
 */
export function getDocsTree(): Root {
  // 开启 i18n 后，Fumadocs 给节点的 $id 加上语言前缀，例如 zh-CN:docs。
  const id = `zh-CN:${DOCS_SECTION}`;
  const folder = source
    .getPageTree("zh-CN")
    .children.find((node): node is Folder => node.type === "folder" && node.$id === id);
  if (!folder) {
    throw new Error(`页面树中没有 ${id}`);
  }
  return { $id: folder.$id, name: folder.name, children: folder.children };
}
