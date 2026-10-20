import type { ModelId } from "@/lib/content";

type Props = { model: ModelId; className?: string };

/** Minimal pictogram silhouettes for the compare page. */
export function Silhouette({ model, className = "h-36 w-auto" }: Props) {
  const shape = SHAPES[model];
  return (
    <svg viewBox="0 0 120 220" className={className} aria-hidden fill="currentColor">
      <circle cx="60" cy={shape.headY} r={shape.head} />
      <path d={shape.body} />
      {model === "justin" && (
        <text x="60" y="140" textAnchor="middle" fontSize="44" fontWeight="200" fill="#000" opacity="0.85">
          ?
        </text>
      )}
    </svg>
  );
}

const SHAPES: Record<ModelId, { head: number; headY: number; body: string }> = {
  // Bulky: very wide shoulders and arms.
  thick: {
    head: 15,
    headY: 26,
    body: "M14 62c6-10 22-14 46-14s40 4 46 14l8 46c1 6-3 10-8 10-4 0-7-3-8-7l-6-30-4 48-6 82c0 5-4 9-9 9s-9-4-9-9l-4-62-4 62c0 5-4 9-9 9s-9-4-9-9l-6-82-4-48-6 30c-1 4-4 7-8 7-5 0-9-4-8-10Z",
  },
  // Starved: narrow everything.
  starved: {
    head: 13,
    headY: 26,
    body: "M38 58c4-5 12-7 22-7s18 2 22 7l6 48c1 4-2 7-5 7-3 0-5-2-6-5l-5-32-2 44-3 86c0 4-3 7-7 7s-7-3-7-7l-2-64-2 64c0 4-3 7-7 7s-7-3-7-7l-3-86-2-44-5 32c-1 3-3 5-6 5-3 0-6-3-5-7Z",
  },
  // Lean: V-taper, balanced.
  pro: {
    head: 14,
    headY: 26,
    body: "M24 60c6-7 18-10 36-10s30 3 36 10l7 48c1 5-2 8-6 8-3 0-6-2-7-6l-6-32-6 44-4 86c0 4-4 8-8 8s-8-4-8-8l-3-62-3 62c0 4-4 8-8 8s-8-4-8-8l-4-86-6-44-6 32c-1 4-4 6-7 6-4 0-7-3-6-8Z",
  },
  // In progress: soft round shape with a question mark.
  justin: {
    head: 14,
    headY: 26,
    body: "M26 62c6-8 18-11 34-11s28 3 34 11l7 46c1 5-2 8-6 8-3 0-6-2-7-6l-5-28c2 10 2 22-2 34l-4 84c0 4-4 8-8 8s-8-4-8-8l-3-60-3 60c0 4-4 8-8 8s-8-4-8-8l-4-84c-4-12-4-24-2-34l-5 28c-1 4-4 6-7 6-4 0-7-3-6-8Z",
  },
};
