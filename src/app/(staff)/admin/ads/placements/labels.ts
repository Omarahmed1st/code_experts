import type { AdTemplate } from "@/lib/ads/policy";

/** How the admin names each kind of page that can carry ads. */
export const TEMPLATE_LABEL: Record<AdTemplate, string> = {
  home: "Home page",
  course: "Course page",
  lesson: "Lecture",
  exercise: "Single question",
  resource: "File page",
};
