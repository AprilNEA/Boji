import Link from "next/link";
import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared";
import type { Translations } from "fumadocs-ui/i18n";
import { DiscordIcon } from "@/components/ui/DiscordIcon";
import { Logo } from "@/components/ui/Logo";
import { DISCORD_URL } from "@/lib/content";

/**
 * 支持页和隐私政策。这两个地址用作 App Store Connect 的支持网址和隐私政策网址，
 * 修改前先更新商店资料。
 */
export const PAGE_LINKS = [
  { text: "支持", url: "/support/" },
  { text: "隐私政策", url: "/privacy/" },
] as const;

/** 图标链接在侧边栏中显示在底部、深浅色切换按钮的左边，在顶栏中显示在右侧。 */
const DISCORD_LINK: LinkItemType = {
  type: "icon",
  text: "Discord",
  label: "加入 Discord 社区",
  icon: <DiscordIcon className="size-4" />,
  url: DISCORD_URL,
  external: true,
};

/** 文档区（/docs/）的导航选项。支持和隐私政策由侧边栏底部的 PageLinks 显示。 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="h-[18px] w-auto" />
          <span className="font-semibold">薄肌俱乐部文档</span>
        </>
      ),
      url: "/docs/",
    },
    links: [{ text: "返回官网", url: "/" }, DISCORD_LINK],
  };
}

/** 独立页面（/support/、/privacy/）的导航选项。这些页面没有侧边栏，链接显示在顶栏。 */
export function pageOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="h-[18px] w-auto" />
          <span className="font-semibold">薄肌俱乐部</span>
        </>
      ),
      url: "/",
    },
    links: [{ text: "文档", url: "/docs/" }, ...PAGE_LINKS, DISCORD_LINK],
  };
}

/** 支持和隐私政策的文字链接，显示在文档侧边栏的最下面。 */
export function PageLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="支持与隐私" className={`flex gap-4 text-sm text-fd-muted-foreground ${className}`}>
      {PAGE_LINKS.map((link) => (
        <Link key={link.url} href={link.url} className="transition-colors hover:text-fd-accent-foreground">
          {link.text}
        </Link>
      ))}
    </nav>
  );
}

/** Fumadocs 界面文案的中文翻译。键由 fumadocs-ui 定义，升级 fumadocs-ui 后检查有没有新增的键。 */
export const DOCS_TRANSLATIONS = {
  "Search(search trigger)": "搜索",
  "Search(search dialog)": "搜索文档",
  "Open Search(search trigger)(aria-label)": "打开搜索",
  "Close Search(search dialog)(aria-label)": "关闭搜索",
  "No results found(search dialog)": "没有找到结果",
  "Search failed(search dialog)": "搜索失败",
  "On this page(table of contents)": "本页目录",
  "No Headings(table of contents)": "本页没有标题",
  "Table of Contents(inline table of contents)": "目录",
  "Next Page(pagination)": "下一页",
  "Previous Page(pagination)": "上一页",
  "Last updated on(page footer)": "最后更新于",
  "Edit on GitHub(edit page)": "在 GitHub 上编辑",
  "Toggle Theme(theme switcher)(aria-label)": "切换深浅色",
  "Light(theme switcher)(aria-label)": "浅色",
  "Dark(theme switcher)(aria-label)": "深色",
  "System(theme switcher)(aria-label)": "跟随系统",
  "Open Sidebar(sidebar)(aria-label)": "打开侧边栏",
  "Close Sidebar(sidebar)(aria-label)": "关闭侧边栏",
  "Close Sidebar(aria-label)": "关闭侧边栏",
  "Collapse Sidebar(sidebar)(aria-label)": "收起侧边栏",
  "Show Sidebar(sidebar)": "显示侧边栏",
  "Hide Sidebar(sidebar)": "隐藏侧边栏",
  "Toggle Menu(mobile menu)(aria-label)": "打开或关闭菜单",
  "Layout Tab(layout tab trigger)": "切换栏目",
  "Copy Text(code block)(aria-label)": "复制代码",
  "Copied Text(code block)(aria-label)": "已复制代码",
  "Copy Anchor Link(heading anchor)(aria-label)": "复制标题链接",
  "Copied Anchor Link(heading anchor)(aria-label)": "已复制标题链接",
  "Copy Link(accordion)(aria-label)": "复制链接",
  "Copied Link(accordion)(aria-label)": "已复制链接",
  "Copy Markdown(page actions)": "复制 Markdown",
  "Copied Markdown(page actions)": "已复制 Markdown",
  "View as Markdown(page actions)": "查看 Markdown",
  "Open(page actions)": "打开",
  "Image Viewer(image zoom)(aria-label)": "图片查看器",
  "Close(image zoom)(aria-label)": "关闭",
  "Next Image(image zoom)(aria-label)": "下一张",
  "Previous Image(image zoom)(aria-label)": "上一张",
  "Close Banner(banner)(aria-label)": "关闭横幅",
  "Choose a language(language switcher)": "选择语言",
  "Choose a language(language switcher)(aria-label)": "选择语言",
  "Page Not Found(404 page)": "页面不存在",
  "Back to Home(404 page)": "返回首页",
  "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 page)":
    "你要找的页面可能已被删除、改了名字，或者暂时无法访问。",
  "Prop(type table)": "属性",
  "Type(type table)": "类型",
  "Default(type table)": "默认值",
  "Parameters(type table)": "参数",
  "Returns(type table)": "返回值",
} satisfies Partial<Translations>;
