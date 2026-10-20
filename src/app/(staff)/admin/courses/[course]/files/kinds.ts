import { FORMAT_INFO, PREVIEW_RULE, RESOURCE_RULES } from "@/lib/files/sniff";
import { formatBytes } from "@/lib/format";
import type { ResourceKind } from "@/server/admin/resources";

export const KIND_LABEL: Record<ResourceKind, string> = {
  presentation: "Slides",
  pdf: "PDF",
  handout: "Handout",
  image: "Picture",
  code: "Code",
  assignment: "Assignment",
};

/** "PowerPoint (.pptx) or PDF, up to 95 MB" */
export function acceptedText(kind: ResourceKind | "preview"): string {
  const rule = kind === "preview" ? { original: PREVIEW_RULE.formats, maxBytes: PREVIEW_RULE.maxBytes } : RESOURCE_RULES[kind]!;
  const names = rule.original.map((f) => FORMAT_INFO[f].label);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : names[0];
  return `${list}, up to ${formatBytes(rule.maxBytes)}`;
}

/** The file picker's accept list (a hint only: the server checks the bytes). */
export function acceptAttr(kind: ResourceKind | "preview"): string {
  const formats = kind === "preview" ? PREVIEW_RULE.formats : RESOURCE_RULES[kind]!.original;
  return formats.map((f) => (f === "text" ? ".txt,.cpp,.cc,.h,.hpp,.py,.md,.csv,.json" : f === "jpeg" ? ".jpg,.jpeg" : `.${FORMAT_INFO[f].extension}`)).join(",");
}
