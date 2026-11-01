import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DemoControls, PortalRuntime } from "@/components/portal/demo-controls";
import { Providers } from "@/components/shared/providers";
import { BRAND } from "@/lib/config";
import { COPY } from "@/lib/copy";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name}: pay at campus, settle later`, template: `%s | ${BRAND.name}` },
  description: `A small credit limit for verified college students, to use at campus vendors. ${COPY.legal.disclosure} ${COPY.legal.demoTag}.`,
  applicationName: BRAND.name,
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#06060a" },
  ],
  colorScheme: "light dark",
};

/** Marks the page as script-enabled before first paint, so the JS-only start states (hero intro, splash) apply at once. */
const BAR_SCRIPT = `document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${mono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BAR_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-10 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-3 focus:text-accent-ink">
          Skip to content
        </a>
        <Providers>
          <PortalRuntime />
          <DemoControls />
          {children}
        </Providers>
      </body>
    </html>
  );
}
