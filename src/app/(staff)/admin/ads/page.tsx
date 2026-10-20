import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, Notice, StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { AD_POSITIONS, AD_TEMPLATES, HARD_SLOT_CAP, NEVER_AD_PATHS } from "@/lib/ads/policy";
import { describeAction } from "@/lib/admin/audit-text";
import { formatAdminTime } from "@/lib/admin/time";
import { courseReadiness, previewLinks } from "@/server/ads/readiness";
import { getAdsReadiness, getAdsSettings, getConsentSettings, listExclusions, listPlacements } from "@/server/ads/settings";
import { listAudit } from "@/server/admin/audit";
import { requireSite } from "@/server/auth/staff";
import { listPublishedCourses } from "@/server/courses/scope";
import { getSiteOwner, missingOwnerFacts } from "@/server/site/owner";
import { AdsSettingsForm, ConsentForm, ExclusionManager } from "./ads-forms";
import { TEMPLATE_LABEL } from "./placements/labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Advertising" };

export default async function AdsPage() {
  await requireSite("manageAds", "/admin/ads");
  const [readiness, ads, consent, placements, exclusions, courses, readinessByCourse, links, owner, history] = await Promise.all([
    getAdsReadiness(),
    getAdsSettings(),
    getConsentSettings(),
    listPlacements(),
    listExclusions(),
    listPublishedCourses(),
    courseReadiness(),
    previewLinks(),
    getSiteOwner(),
    listAudit({ courseIds: null, limit: 20, actionPrefixes: ["ads.", "consent."] }),
  ]);
  const missing = missingOwnerFacts(owner);
  const byKey = new Map(placements.map((p) => [p.placementKey, p]));

  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Site"
        title="Advertising"
        description="Ads are off until every item in the checklist passes. This page never shows revenue: real numbers only come from your AdSense account."
      />

      <Card title={readiness.live ? "Live ads can load" : "Ads are off"}>
        <ul className="grid gap-2">
          {readiness.items.map((item) => (
            <li key={item.key} className="flex items-start gap-2.5">
              {item.ok ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-easy" />
              ) : (
                <XCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-hard" />
              )}
              <span>
                <span className="font-semibold">{item.label}</span>
                <span className="sr-only">{item.ok ? ": done" : ": not done"}</span>
                <span className="block text-sm text-muted">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3">
          <Notice tone="warn">
            Keep <strong>Auto ads switched off</strong> in your AdSense account. This site places ads only in its own fixed
            positions; Auto ads could put an ad next to a Run button, an answer or a timer. And never click your own ads,
            even to test them: Google counts that as invalid traffic.
          </Notice>
          {missing.length > 0 ? (
            <Notice tone="info">
              The privacy policy and other legal pages are drafts until you fill in the {missing.length} missing detail{missing.length === 1 ? "" : "s"} on the{" "}
              <Link href="/admin/site" className="font-semibold underline">
                Site details
              </Link>{" "}
              page and have them reviewed.
            </Notice>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <AdsSettingsForm
          initial={{
            enabled: ads.enabled,
            publisherId: ads.publisherId ?? "",
            hideForStaff: ads.hideForStaff,
            maxSlots: Object.fromEntries(AD_TEMPLATES.map((t) => [t, String(ads.maxSlots[t] ?? HARD_SLOT_CAP[t])])),
          }}
          caps={HARD_SLOT_CAP}
          labels={TEMPLATE_LABEL}
        />
        <ConsentForm initial={{ provider: consent.provider, notes: consent.notes, privacyChoicesLink: consent.privacyChoicesLink }} scriptUrl={consent.cmpScriptUrl} />
      </div>

      <Card
        title="Placements"
        actions={
          <Link href="/admin/ads/placements/new" className={buttonClass("primary")}>
            New placement
          </Link>
        }
      >
        <p className="mb-4 text-sm text-muted">
          Every position an ad may ever take. A position without a placement, or with one that is switched off, shows nothing.
        </p>
        <div className="grid gap-5">
          {AD_TEMPLATES.map((template) => (
            <section key={template} aria-labelledby={`tpl-${template}`}>
              <h3 id={`tpl-${template}`} className="font-semibold">
                {TEMPLATE_LABEL[template]} <span className="text-sm font-normal text-muted">(at most {HARD_SLOT_CAP[template]} per page)</span>
              </h3>
              <ul className="mt-2 grid gap-2">
                {AD_POSITIONS[template].map((pos) => {
                  const key = `${template}.${pos.position}`;
                  const p = byKey.get(key);
                  return (
                    <li key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {pos.label} <code className="ml-1 text-xs text-muted">{key}</code>
                        </p>
                        <p className="text-sm text-muted">{pos.where}</p>
                        {p ? (
                          <p className="mt-1 text-xs text-muted">
                            Ad unit {p.adUnitId ?? "not set"} · {p.format} · {p.devices === "all" ? "all screens" : `${p.devices} only`} · edited{" "}
                            {formatAdminTime(p.updatedAt)}
                            {p.updatedByName ? ` by ${p.updatedByName}` : ""}
                          </p>
                        ) : null}
                      </div>
                      {p ? (
                        <>
                          <StatusBadge status={p.enabled ? "live" : "draft"} label={p.enabled ? "on" : "off"} />
                          <Link href={`/admin/ads/placements/${p.id}`} className={buttonClass("secondary")}>
                            Edit
                          </Link>
                        </>
                      ) : (
                        <StatusBadge status="archived" label="not set up" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Card>

      <ExclusionManager
        exclusions={exclusions.map((e) => ({ id: e.id, kind: e.kind, pathGlob: e.pathGlob, courseTitle: e.courseTitle, pageType: e.pageType, reason: e.reason }))}
        courses={courses.map((c) => ({ id: c.courseId, title: c.title }))}
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Card title="Never shows ads (fixed in code)">
          <p className="text-sm text-muted">These pages never carry an ad, whatever the settings above say.</p>
          <ul className="mt-3 grid gap-1 text-sm">
            {NEVER_AD_PATHS.map((rule) => (
              <li key={rule.pattern}>
                <code>{rule.pattern}</code> <span className="text-muted">({rule.why})</span>
              </li>
            ))}
            <li className="text-muted">Also: course lists, topic pages, the question library, quiz and exam lists, error pages, demo questions and file pages without a description.</li>
          </ul>
        </Card>
        <Card title="Preview the positions">
          <p className="text-sm text-muted">
            Opens a real page with labelled boxes where ads would go. Only signed-in staff see the boxes, and no ad is requested.
          </p>
          <ul className="mt-3 grid gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary-text hover:underline">
                  {link.label}
                  <ExternalLink aria-hidden="true" className="size-4" />
                  <span className="sr-only">(new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Content before applying to AdSense">
        <p className="text-sm text-muted">
          Google asks for original content that is useful to people and pages that aren&apos;t under construction; it publishes no minimum number of pages.
          Topics marked &quot;Coming soon&quot; on a course page can look unfinished to a reviewer. Details: <code className="break-all">docs/PHASE_6_CONTENT_READINESS.md</code>.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3">Course</th>
              <th scope="col" className="py-2 pr-3">Lectures</th>
              <th scope="col" className="py-2">Topics without a lecture</th>
            </tr>
          </thead>
          <tbody>
            {readinessByCourse.map((c) => (
              <tr key={c.courseId} className="border-b border-line">
                <td className="py-2 pr-3">{c.title}</td>
                <td className="py-2 pr-3">{c.lectures}</td>
                <td className="py-2">
                  {c.emptyTopics} of {c.topics}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Changes to these settings">
        {history.length === 0 ? (
          <p className="text-sm text-muted">No changes yet.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                <span className="font-medium">{h.actorName ?? h.actorEmail ?? "Someone"}</span> {describeAction(h.action, h.entityType)}{" "}
                <span className="text-muted">· {formatAdminTime(h.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link href="/admin/audit-log" className="font-semibold text-primary-text hover:underline">
            Full audit log
          </Link>
        </p>
      </Card>
    </div>
  );
}
