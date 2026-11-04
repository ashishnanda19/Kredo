"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { LoanSummaryCard } from "@/components/loans/loan-summary-card";
import { LimitHeroCard } from "@/components/dashboard/limit-hero-card";
import { LimitIncreaseSheet, NotificationsSheet, RepaySheet } from "@/components/dashboard/sheets";
import { LoansSection } from "@/components/dashboard/loans-section";
import { NextDueCard } from "@/components/dashboard/next-due-card";
import { NudgeBanner } from "@/components/dashboard/nudge-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ScoreCard } from "@/components/dashboard/score-card";
import { AuraWidget } from "@/components/aura/aura-widget";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { SpendingCard } from "@/components/dashboard/spending-card";
import { VendorCarousel } from "@/components/dashboard/vendor-carousel";
import { VirtualCard } from "@/components/dashboard/virtual-card";
import { Reveal } from "@/components/shared/reveal";
import { ErrorState } from "@/components/shared/states";
import { CoinRain } from "@/components/three/coin-rain";
import { StudentHome } from "@/components/student/student-home";
import { WorldOr } from "@/components/student/world-or";
import { useDemoState } from "@/lib/hooks";
import { loans, nextDue, transactions } from "@/lib/mock-data";

// with the Phase 2 flag on, Aura replaces the illustrative score card
const PHASE2 = process.env.NEXT_PUBLIC_PHASE2_CREDIT_PROFILE !== "false";

function LegacyDashboard() {
  const { state, retry } = useDemoState(450);
  const [repayOpen, setRepayOpen] = useState(false);
  const [increaseOpen, setIncreaseOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  /** coin-rain trigger counter: each replay remounts a fresh shower and re-pulses the limit number */
  const [rain, setRain] = useState(0);

  const empty = state === "empty";
  const ready = state === "ready" || empty;
  const recent = empty ? [] : [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-5">
      <DashboardHeader onBell={() => setBellOpen(true)} />

      {state === "error" ? (
        <div className="glass rounded-[24px]">
          <ErrorState onRetry={retry} />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {/* renders immediately (cached figures): keeps first paint fast and the count-up from restarting */}
          <LimitHeroCard used={empty ? 0 : undefined} pulseKey={rain} onReplay={ready ? () => setRain((n) => n + 1) : undefined} />
          {ready ? (
            <>
              <Reveal y={20}>
                <VirtualCard />
              </Reveal>

              <div className="md:col-span-2">
                <QuickActions onRepay={() => setRepayOpen(true)} onIncrease={() => setIncreaseOpen(true)} />
              </div>

              <div className="md:col-span-2">
                <LoanSummaryCard />
              </div>

              {/* two columns that balance: what you owe and where it went, beside how you are doing */}
              <div className="space-y-5">
                <Reveal>
                  <NextDueCard amount={nextDue.amount} dueDate={nextDue.dueDate} clear={empty} onRepay={() => setRepayOpen(true)} />
                </Reveal>
                <Reveal>
                  <SpendingCard empty={empty} />
                </Reveal>
              </div>
              <div className="space-y-5">
                <Reveal delay={0.05}>{PHASE2 ? <AuraWidget /> : <ScoreCard />}</Reveal>
                <Reveal delay={0.05}>
                  <RecentActivity items={recent} />
                </Reveal>
              </div>

              <div className="md:col-span-2">
                <LoansSection loans={empty ? [] : loans} />
              </div>
              <div className="min-w-0 md:col-span-2">
                <VendorCarousel />
              </div>
              <div className="md:col-span-2">
                <NudgeBanner />
              </div>
            </>
          ) : (
            <DashboardSkeleton />
          )}
        </div>
      )}

      <CoinRain trigger={rain} />
      <RepaySheet open={repayOpen} onOpenChange={setRepayOpen} amount={nextDue.amount} dueDate={nextDue.dueDate} title={nextDue.title} />
      <LimitIncreaseSheet open={increaseOpen} onOpenChange={setIncreaseOpen} />
      <NotificationsSheet open={bellOpen} onOpenChange={setBellOpen} />
    </div>
  );
}

/** The original portal home, or the demo-world home when a seeded or newly verified student is signed in to the world. */
export default function DashboardPage() {
  return (
    <WorldOr world={<StudentHome />}>
      <LegacyDashboard />
    </WorldOr>
  );
}
