import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// 静态导出时，这个接口在构建时生成一次索引文件，浏览器下载后在本地搜索。
// 默认的 multilingual 分词按 Unicode 规则切分中文，不需要额外配置。
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
