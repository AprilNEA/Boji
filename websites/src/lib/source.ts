import { defineDocs } from "fumadocs-mdx/macro";
import { loader } from "fumadocs-core/source";

/**
 * 文档内容来源：websites/content/docs/ 下的 MDX 和 meta.json。
 * 页面地址以 /docs 开头，content/docs/guide/index.mdx 对应 /docs/guide/。
 */
const docs = defineDocs({
  dir: "content/docs",
});

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
