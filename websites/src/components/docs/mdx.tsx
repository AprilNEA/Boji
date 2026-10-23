import defaultMdxComponents from "fumadocs-ui/mdx";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Cloud, FileDown, GraduationCap, KeyRound, QrCode, School, WalletCards } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { AssetImage, ExerciseLoop, ExerciseRow, Row, Screenshot, Screenshots, ShotWithText } from "@/components/docs/Screenshots";

/**
 * 文档 MDX 可用的组件：Fumadocs 默认组件（Callout、Card、Cards 等）、步骤和标签页，
 * 用户指南的截图与动作图组件，再加上调用方传入的组件。
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    Tab,
    Tabs,
    AssetImage,
    ExerciseLoop,
    ExerciseRow,
    Screenshot,
    Screenshots,
    ShotWithText,
    Row,
    // Card 图标。MDX 页面不能 import，所以在这里提供用户指南用到的 Lucide 图标。
    Cloud,
    FileDown,
    GraduationCap,
    KeyRound,
    QrCode,
    School,
    WalletCards,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
