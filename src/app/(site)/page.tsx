import { BookOpen, Play, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseGrid } from "@/components/courses/course-grid";
import { CodePlayground, type PlaygroundVariant } from "@/components/home/code-playground";
import { HotTitle } from "@/components/layout/page-hero";
import { AdSlot } from "@/components/ads/ad-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClass } from "@/components/ui/button-styles";
import type { CodeAnnotations } from "@/lib/lesson/annotations";
import { buildStage } from "@/lib/lesson/stage";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { getCatalog } from "@/server/courses/catalog";
import { pageAds } from "@/server/ads/settings";
import { siteVerificationTags } from "@/server/site/verification";
import { absoluteUrl, pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const base = pageMetadata({
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description:
      "Free programming lectures written in full, with code you can run in your browser: C++ fundamentals, Python applications and computer vision with OpenCV.",
    path: "/",
  });
  // Ownership tags for Google Search Console and AdSense, only once the owner has entered them at /admin/site.
  const tags = await siteVerificationTags().catch(() => null);
  return tags ? { ...base, ...tags } : base;
}

const PRINCIPLES = [
  {
    icon: BookOpen,
    title: "Lectures written in full",
    body: "Not just slides: every idea is explained in plain words, step by step, with the mistakes students really make.",
  },
  {
    icon: Play,
    title: "Press Run",
    body: "Python and C++ examples run right in your browser. Change the code and run it again; nothing to install.",
  },
  {
    icon: ShieldCheck,
    title: "Every output is real",
    body: "Each program was run before it was published, and its output box shows exactly what it printed.",
  },
];

// The code box on the home page: real lesson-style stages that run in the
// browser, one per language, behind Python / C++ tabs.
interface Demo {
  key: string;
  label: string;
  title: string;
  code: string;
  output: string;
  notes: CodeAnnotations;
}

const DEMOS: Demo[] = [
  {
    // Checked with python3: it printed P, n and Pyt.
    key: "python",
    label: "Python",
    title: "Try it: indexing a String",
    code: 'word = "Python"\nprint(word[0])\nprint(word[-1])\nprint(word[0:3])',
    output: "P\nn\nPyt\n",
    notes: {
      notes: [
        { line: 2, match: "[0]", text: "first character", shape: "circle", color: "sky" },
        { line: 3, match: "[-1]", text: "last character", shape: "diamond", color: "coral" },
        { line: 4, match: "[0:3]", text: "stops before 3", shape: "square", color: "green" },
      ],
      strips: [{ line: 1, match: '"Python"', kind: "chr", items: ["P", "y", "t", "h", "o", "n"], negative: true, color: "yel" }],
    },
  },
  {
    // Compiled with g++ -std=c++17 -Wall -Wextra and run: it printed 12345.
    key: "cpp",
    label: "C++",
    title: "Try it: a for loop in C++",
    code: "#include <iostream>\nusing namespace std;\nint main()\n{\n    for (int i = 1; i <= 5; i++)\n    {\n        cout << i;\n    }\n    cout << endl;\n    return 0;\n}",
    output: "12345\n",
    notes: {
      notes: [
        { line: 5, match: "int i = 1", text: "start: runs once", shape: "circle", color: "sky" },
        { line: 5, match: "i <= 5", text: "check before each pass", shape: "square", color: "yel" },
        { line: 5, match: "i++", text: "add 1 after each pass", shape: "diamond", color: "green" },
      ],
      strips: [],
    },
  },
];

const PLAYGROUND: PlaygroundVariant[] = DEMOS.map((demo) => ({
  key: demo.key,
  label: demo.label,
  title: demo.title,
  language: demo.key,
  code: demo.code,
  lines: buildStage(demo.code, demo.key, demo.notes),
  runnable: true,
  sampleInput: "",
  expectedOutput: demo.output,
  wide: false,
}));

export default async function HomePage() {
  const [{ courses, lectureCounts }, ads] = await Promise.all([
    getCatalog(),
    pageAds({ template: "home", path: "/", courseId: null }, ["after_courses", "after_how_it_works"]),
  ]);
  const site = absoluteUrl("/");
  return (
    <>
      {site ? (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: site, inLanguage: "en" }} />
      ) : null}
      <section className="lec-cinema border-b border-[#24365e]" aria-labelledby="home-title">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          {/* Top-aligned (not centred on the tall code box), so it sits higher and stays put when the tabs change. */}
          <div className="lg:pt-28">
            <p className="lec-chapter">
              <b>01</b>
              <i />
              Learn by running code
            </p>
            <h1 id="home-title" className="mt-4 text-4xl font-bold sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
              <HotTitle text="Programming lectures you can *run*" />
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--lec-mute)]">
              Free lectures for C++, Python and computer vision, written in full on the site. Read the idea, watch the
              code, press the yellow button.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#courses" className={buttonClass("primary")}>
                Choose a course
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-xl border border-[#2b4373] px-5 text-sm font-semibold text-[#f2f5fa] hover:bg-[#14213d]"
              >
                How it works
              </Link>
            </div>
          </div>
          <CodePlayground variants={PLAYGROUND} />
        </div>
      </section>

      <section id="courses" aria-labelledby="courses-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <h2 id="courses-heading" className="text-3xl font-bold">
          Courses
        </h2>
        <p className="mt-2 max-w-2xl text-muted">Each course is a separate learning space with its own lectures, files and search.</p>
        <div className="mt-8">
          <CourseGrid courses={courses} lectureCounts={lectureCounts} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot ads={ads} position="after_courses" gap="mt-16" />
      </div>

      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 id="how-heading" className="text-3xl font-bold">
          How {SITE_NAME} works
        </h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-navy text-[#ffd43b]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot ads={ads} position="after_how_it_works" gap="mt-16" />
      </div>
    </>
  );
}
