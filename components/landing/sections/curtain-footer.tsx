import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Disclosure } from "@/components/shared/demo-tag";
import { LogoLockup } from "@/components/shared/logo";
import { COPY } from "@/lib/copy";
import { APP_ROUTES_ENABLED } from "@/lib/demo-flag";
import { FooterSlogan } from "./footer-slogan";
import { GridField } from "./grid-field";

/** Where each footer label goes. Labels without an entry are placeholders and render as plain text. */
const HREF: Record<string, string> = {
  "How it works": "#how",
  "Credit limit": "#features",
  Repayments: "#features",
  "Credit profile": "/dashboard/profile",
  Verify: "/verify",
  FAQ: "#faq",
  Support: "/dashboard/support",
  "Become a partner": "/vendor/onboarding",
  Settlement: "/vendor/onboarding",
  "Vendor FAQ": "#faq",
  Privacy: "/legal/privacy",
  Terms: "/legal/terms",
  "Key facts": "/legal/key-facts",
};

/** Footer labels that open an app screen; on the deployed site (no app screens) they are plain text. */
const APP_LINKS = new Set(["Credit profile", "Verify", "Support", "Become a partner", "Settlement"]);

/**
 * Curtain footer: on screens wide and tall enough to show all of it (.curtain[data-fit] in globals.css), it is sticky at the
 * bottom *behind* the page (main sits above at z-10), so the last section lifts away like a curtain to reveal it.
 * Elsewhere it is an ordinary footer, so no part of it is ever unreachable.
 */
export function CurtainFooter() {
  const t = COPY.landing.footer;
  return (
    <footer data-nav-theme="dark" className="curtain relative z-0 bg-[#06060a] text-white">
      <GridField curtain seed={7} className="text-white [mask-image:radial-gradient(70%_95%_at_82%_0%,#000,transparent)]" />
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
                  const href = APP_ROUTES_ENABLED || !APP_LINKS.has(l) ? HREF[l] : undefined;
                  return (
                    <li key={l}>
                      {href ? (
                        <Link href={href} className="link-slide inline-flex min-h-8 items-center text-[14.5px] text-white/80 hover:text-white">
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


        <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 text-[12.5px] leading-relaxed text-white/60 md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-2.5">
            <LogoLockup className="h-8 text-white" />
          </div>
          <div className="space-y-1.5">
            <Disclosure className="text-white/70" />
            <p>{COPY.legal.notLender}</p>
            <p>
              {COPY.legal.nudge} {t.waitlist}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span>{COPY.legal.footer}</span>
            </div>
          </div>
        </div>
        <FooterSlogan text={t.slogan} />
      </div>
    </footer>
  );
}
