import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Disclosure } from "@/components/shared/demo-tag";

/** Centered glass sheet for auth, verification and KYC screens. */
export function PortalShell({ children, width = "max-w-md", back }: { children: React.ReactNode; width?: string; back?: { href: string; label: string } }) {
  return (
    <div className="flex min-h-[calc(100dvh-var(--bar-h))] flex-col">
      <header className={`mx-auto flex w-full items-center justify-between gap-2 px-4 pt-3 ${width}`}>
        <Logo />
        <div className="flex items-center gap-1">
          {back && (
            <Link href={back.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink-2 hover:text-ink">
              {back.label}
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className={`mx-auto flex w-full flex-1 flex-col px-4 pb-8 pt-4 ${width}`}>
        <GlassCard radius="xl" strength="strong" className="flex-1 p-5 sm:p-7">
          {children}
        </GlassCard>
        <div className="mt-5 flex flex-col items-center gap-2">
          <Disclosure />
        </div>
      </main>
    </div>
  );
}
