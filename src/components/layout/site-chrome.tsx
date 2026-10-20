import type { ReactNode } from "react";
import { getAdsReadiness, getConsentSettings } from "@/server/ads/settings";
import { getNavigationCourses } from "@/server/courses/navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** The public site's header, main area and footer (the admin has its own shell). */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [courses, privacyChoices] = await Promise.all([getNavigationCourses(), showPrivacyChoices()]);
  return (
    <>
      <SiteHeader courses={courses} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter courses={courses} privacyChoices={privacyChoices} />
    </>
  );
}

/** The "Privacy choices" link: on unless an admin hid it, and always on while ads can load. */
async function showPrivacyChoices(): Promise<boolean> {
  try {
    const [consent, readiness] = await Promise.all([getConsentSettings(), getAdsReadiness()]);
    return consent.privacyChoicesLink || readiness.live;
  } catch {
    return true;
  }
}
