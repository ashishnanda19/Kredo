import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoTag, Disclosure } from "@/components/shared/demo-tag";
import { LogoMark } from "@/components/shared/logo";
import { BRAND, GRIEVANCE } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { FooterSlogan } from "./footer-slogan";

/** Where each footer label goes. Labels without an entry are placeholders and render as plain text. */
const HREF: Record<string, string> = {
  "How it works": "#how",
  "Credit limit": "#features",
  Repayments: "#features",
  "Credit profile": "/dashboard/profile",
  Verify: "/verify",
  FAQ: "#faq",
  Support: "/dashboard/support",
  Grievance: `mailto:${GRIEVANCE.email}`,
  "Become a partner": "#vendors",
  Settlement: "#vendors",
  "Vendor FAQ": "#faq",
  Privacy: "/legal/privacy",
  Terms: "/legal/terms",
  "Key facts": "/legal/key-facts",
};

/**
 * Curtain footer: on screens wide and tall enough to show all of it (.curtain[data-fit] in globals.css), it is sticky at the
 * bottom *behind* the page (main sits above at z-10), so the last section lifts away like a curtain to reveal it.
 * Elsewhere it is an ordinary footer, so no part of it is ever unreachable.
 */
export function CurtainFooter() {
  const t = COPY.landing.footer;
  return (
    <footer data-nav-theme="dark" className="curtain relative z-0 bg-[#06060a] text-white">
      <div className="mx-auto max-w-[1180px] px-4 pb-0 pt-12 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-3xl text-balance text-[clamp(2.2rem,4.6vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.045em]">{t.curtainTitle}</p>
          <a href="#access" className="inline-flex min-h-12 shrink-0 items-center gap-1.5 self-start rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-ink transition-[filter] hover:brightness-95 lg:self-auto">
            {COPY.landing.nav.access} <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>

        <nav aria-label="Footer" className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          {t.columns.map((c) => (
            <div key={c.title}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">{c.title}</p>
              <ul className="mt-3 space-y-0.5">
                {c.links.map((l) => {
                  const href = HREF[l];
                  return (
                    <li key={l}>
                      {href ? (
                        <Link href={href} className="inline-flex min-h-8 items-center text-[14.5px] text-white/80 transition-colors hover:text-white">
                          {l}
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-8 items-center text-[14.5px] text-white/55">{l}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.locationsLabel}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {t.locations.map((l) => (
              <li key={l} className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-white/75">{l}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 text-[12.5px] leading-relaxed text-white/60 md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-2.5">
            <LogoMark inverted className="size-8" />
            <span className="text-[15px] font-semibold text-white">{BRAND.name}</span>
          </div>
          <div className="space-y-1.5">
            <Disclosure className="text-white/70" />
            <p>{COPY.legal.notLender}</p>
            <p>
              {COPY.legal.nudge} {t.waitlist}
            </p>
            <p>
              {GRIEVANCE.officer}:{" "}
              <a className="underline underline-offset-2 hover:text-white" href={`mailto:${GRIEVANCE.email}`}>
                {GRIEVANCE.email}
              </a>
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <DemoTag className="border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]" />
              <span>{COPY.legal.footer}</span>
            </div>
          </div>
        </div>
        <FooterSlogan text={t.slogan} />
      </div>
    </footer>
  );
}
