import type { ResourceKind } from "@/server/content/resources";

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  presentation: "Slides",
  pdf: "PDF",
  handout: "Handout",
  image: "Image",
  code: "Code",
  assignment: "Assignment",
};
