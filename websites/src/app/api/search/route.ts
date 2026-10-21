import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// 静态导出时，这个接口在构建时生成一次索引文件，浏览器下载后在本地搜索。
// 默认的 multilingual 分词按 Unicode 规则切分中文，不需要额外配置。
// 索引包含文档区页面（docs/）和独立页面（docs/sites/），按语言分开。搜索框按界面语言 zh-CN 过滤。
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
