import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { pageMetadata } from "@/server/seo";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Accessibility",
    description: `How ${SITE_NAME} is built to be usable with a keyboard, a screen reader, zoom and reduced motion.`,
    path: "/accessibility",
  });
}

// OWNER REVIEW: add a contact address for accessibility problems once there is one.
export default function AccessibilityPage() {
  return (
    <InfoPage title="Accessibility" description={`${SITE_NAME} should work for every student, whatever device or help they use.`}>
      <h2>What we do</h2>
      <ul>
        <li>Every page works with a keyboard alone, with a visible focus outline and a &quot;Skip to main content&quot; link.</li>
        <li>Text and controls meet the WCAG 2.2 AA contrast ratios in both the light and dark themes. These ratios are checked by automated tests.</li>
        <li>Pictures in lectures have text descriptions, and each one can be downloaded at full size.</li>
        <li>Code examples are real text, not images, so they can be read aloud, zoomed and copied.</li>
        <li>Output from a program that runs is announced to screen readers as it appears.</li>
        <li>If your device asks for reduced motion, code appears at once instead of typing itself, and nothing pulses or shakes.</li>
        <li>Pages reflow down to a 320 px wide screen without sideways scrolling.</li>
      </ul>
      <h2>Known limits</h2>
      <ul>
        <li>The first time you press Run on a Python example, your browser downloads the Python runtime: up to about 13 MB of files. On a slow connection this takes a while. The code and the output it should print are on the page before you press Run.</li>
        <li>Downloadable slides are made by course staff and may not be fully accessible. The lecture page has the same content as text.</li>
      </ul>
    </InfoPage>
  );
}
