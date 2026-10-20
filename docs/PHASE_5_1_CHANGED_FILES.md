# Phase 5.1: files changed from the Phase 5 baseline

Compared with `CodeLab-phase5.zip` as delivered. Every change is explained in `PHASE_5_1_BUG_REPORT.md` (by bug) or is one of the new reports and browser checks. No file was deleted, and no applied migration (0001 to 0005) was changed.

| File | Change |
| --- | --- |
| `.gitignore` | changed |
| `README.md` | changed |
| `docs/ARCHITECTURE.md` | changed |
| `docs/DATABASE.md` | changed |
| `docs/PHASE_5_1_BUG_REPORT.md` | added |
| `docs/PHASE_5_1_DEPLOYMENT_READINESS.md` | added |
| `docs/PHASE_5_1_FUNCTIONAL_AUDIT.md` | added |
| `docs/PHASE_5_1_SECURITY_REVIEW.md` | added |
| `docs/PHASE_5_1_SUMMARY.md` | added |
| `docs/PHASE_5_1_TEST_REPORT.md` | added |
| `migrations/0006_phase5_1_hardening.sql` | added |
| `next.config.ts` | changed |
| `public/runner/python-worker.mjs` | changed |
| `src/app/(auth)/register/sign-up-form.tsx` | changed |
| `src/app/(site)/dashboard/[course]/history/page.tsx` | changed |
| `src/app/(site)/dashboard/[course]/progress/page.tsx` | changed |
| `src/app/(site)/dashboard/page.tsx` | changed |
| `src/app/(staff)/admin/courses/[course]/lectures/[id]/preview/page.tsx` | changed |
| `src/app/(staff)/admin/courses/[course]/questions/[id]/preview/page.tsx` | changed |
| `src/app/(staff)/admin/courses/[course]/students/page.tsx` | changed |
| `src/app/api/courses/[course]/[kind]/[slug]/[action]/route.ts` | changed |
| `src/app/globals.css` | changed |
| `src/components/account/me.ts` | changed |
| `src/components/admin/action-parts.tsx` | changed |
| `src/components/practice/attempt-runner.tsx` | changed |
| `src/components/practice/exercise-list.tsx` | changed |
| `src/components/practice/local-progress.ts` | changed |
| `src/components/practice/practice-question.tsx` | changed |
| `src/components/practice/practice-set.tsx` | changed |
| `src/components/practice/question-view.tsx` | changed |
| `src/components/ui/button-styles.ts` | changed |
| `src/db/schema/activity.ts` | changed |
| `src/lib/grading/practice-record.ts` | added |
| `src/server/students/attempts.ts` | changed |
| `src/server/students/export.ts` | changed |
| `src/server/students/history.ts` | changed |
| `src/server/students/progress.ts` | changed |
| `src/styles/lec.css` | changed |
| `src/styles/tokens.css` | changed |
| `tests/integration/health.test.ts` | changed |
| `tests/integration/phase5-1.test.ts` | added |
| `tests/unit/design-tokens.test.ts` | changed |
| `tests/unit/phase5-1.test.ts` | added |
| `tools/browser-checks/README.md` | added |
| `tools/browser-checks/a11y.mjs` | added |
| `tools/browser-checks/journey-ab.mjs` | added |
| `tools/browser-checks/journey-de.mjs` | added |
| `tools/browser-checks/journey-e2.mjs` | added |
| `tools/browser-checks/journey-extra.mjs` | added |
| `tools/browser-checks/journey-f.mjs` | added |
| `tools/browser-checks/journey-g.mjs` | added |
| `tools/browser-checks/journey-hj.mjs` | added |
| `tools/browser-checks/journey-i.mjs` | added |
| `tools/browser-checks/lib.mjs` | added |
| `tools/browser-checks/sweep.mjs` | added |

Lines: 56 files changed (23 added, 33 changed, none deleted), 2782 insertions(+), 109 deletions(-).
