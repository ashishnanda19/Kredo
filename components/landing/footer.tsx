import Link from "next/link";
import { DemoTag, Disclosure } from "@/components/shared/demo-tag";
import { Logo } from "@/components/shared/logo";
import { GRIEVANCE } from "@/lib/config";
import { COPY } from "@/lib/copy";

export function Footer() {
  return (
    <footer className="relative mt-8 border-t border-line">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent opacity-70" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm text-muted">
              {COPY.hero.titleA} {COPY.hero.titleB}
            </p>
            <DemoTag />
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {COPY.footer.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.label === "Grievance" ? `mailto:${GRIEVANCE.email}` : l.href}
                    className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-muted hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 space-y-2 border-t border-line pt-6 text-xs text-muted">
          <Disclosure />
          <p>{COPY.legal.notLender}</p>
          <p>{COPY.legal.footer}</p>
        </div>
      </div>
    </footer>
  );
}
