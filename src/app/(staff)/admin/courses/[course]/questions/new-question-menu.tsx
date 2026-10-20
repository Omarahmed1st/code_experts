import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";

const KINDS = [
  { type: "mcq", ask: null, label: "Multiple choice" },
  { type: "trace", ask: null, label: "Trace the code (what does it print?)" },
  { type: "trace", ask: "count", label: "How many times does the loop run?" },
  { type: "trace", ask: "value", label: "Value of a variable at a point" },
  { type: "correct_code", ask: null, label: "Fix the code" },
  { type: "correct_code", ask: "blanks", label: "Fill in the blanks" },
  { type: "correct_code", ask: "order", label: "Put the lines in order" },
  { type: "write_code", ask: null, label: "Write the code (practice only)" },
] as const;

/** "New question" as a small menu of question kinds; works without JavaScript (<details>). */
export function NewQuestionMenu({ base }: { base: string }) {
  return (
    <details className="relative">
      <summary className={`${buttonClass("primary")} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        <Plus aria-hidden="true" className="size-4" /> New question <ChevronDown aria-hidden="true" className="size-4" />
      </summary>
      <ul className="absolute right-0 z-20 mt-2 grid w-72 gap-1 rounded-xl border border-line bg-surface p-2 shadow-lg">
        {KINDS.map((k) => (
          <li key={`${k.type}-${k.ask}`}>
            <Link
              href={`${base}/new?type=${k.type}${k.ask ? `&ask=${k.ask}` : ""}`}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-surface-2 focus-visible:bg-surface-2"
            >
              {k.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
