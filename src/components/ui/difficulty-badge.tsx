import type { DIFFICULTY } from "@/db/enums";

type Difficulty = (typeof DIFFICULTY)[number];

const STYLE: Record<Difficulty, string> = {
  easy: "bg-easy-soft text-easy",
  medium: "bg-medium-soft text-medium",
  hard: "bg-hard-soft text-hard",
};

const LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** Colour plus a text label, so difficulty never depends on colour alone. */
export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[level]}`}>
      <span className="sr-only">Difficulty: </span>
      {LABEL[level]}
    </span>
  );
}
