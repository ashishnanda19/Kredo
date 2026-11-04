"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Home, QrCode, ReceiptText, UserRound, type LucideIcon } from "lucide-react";
import { RoleSwitcher } from "@/components/demo/role-switcher";
import { Logo } from "@/components/shared/logo";
import { VENDOR } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";
import { cn } from "@/lib/utils";
import { VendorGate } from "./vendor-gate";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/vendor", label: VENDOR.nav.home, icon: Home },
  { href: "/vendor/payments", label: VENDOR.nav.payments, icon: CreditCard },
  { href: "/vendor/qr", label: VENDOR.nav.qr, icon: QrCode },
  { href: "/vendor/settlements", label: VENDOR.nav.settlements, icon: ReceiptText },
  { href: "/vendor/profile", label: VENDOR.nav.profile, icon: UserRound },
];

export function VendorShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const vendor = useWorld((s) => (s.session.vendorId ? s.world.vendors[s.session.vendorId] : undefined));
  const onboarding = path.startsWith("/vendor/onboarding");
  const active = (href: string) => (href === "/vendor" ? path === href : path.startsWith(href));
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-3xl flex-wrap print:hidden items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="min-w-0">
          <Logo href="/start" />
          {vendor && !onboarding && <p className="mt-1 truncate text-sm font-semibold">{vendor.stallName}</p>}
        </div>
        <RoleSwitcher />
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        <VendorGate>{children}</VendorGate>
      </main>
      {!onboarding && vendor?.status === "accepted" && (
        <nav aria-label="Vendor" className="pointer-events-none fixed inset-x-3 bottom-3 z-40 pb-safe print:hidden">
          <div className="frost pointer-events-auto mx-auto max-w-md rounded-full p-1.5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.25)]">
            <ul className="grid grid-cols-5 gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors", active(n.href) ? "bg-pill text-pill-fg" : "text-ink")}>
                    <n.icon className="size-5" aria-hidden />
                    <span>{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
