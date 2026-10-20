import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { themeInitScript } from "@/components/layout/theme-script";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
// Self-hosted fonts (no requests to font CDNs). Imported here, not from globals.css,
// so Vite rewrites their url() paths and emits the .woff2 files.
// Lec style: Poppins for text and titles, DejaVu Sans Mono for code (Latin subsets only).
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/dejavu-mono/latin-400.css";
import "@fontsource/dejavu-mono/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  applicationName: SITE_NAME,
  description:
    "Free written programming lectures, presentations and practice for university students: C++, Python and computer vision with OpenCV.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070d1a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is set before paint by the inline script, so React must not complain about it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {/* Each area brings its own header and <main id="main">: (site)/layout.tsx and the admin shell. */}
        {children}
      </body>
    </html>
  );
}
