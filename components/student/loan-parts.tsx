"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { STUDENT } from "@/lib/copy-demo";
import { amountDue, displayStatus, type DisplayStatus } from "@/lib/domain/selectors";
import { fmtDate } from "@/lib/domain/time";
import type { Loan, WorldState } from "@/lib/domain/types";

const TONE: Record<DisplayStatus, "neutral" | "warning" | "danger" | "success"> = { upcoming: "neutral", due_today: "warning", overdue: "danger", paid: "success", defaulted: "danger", refunded: "neutral" };

export function StatusBadge({ loan, now }: { loan: Loan; now: number }) {
  const st = displayStatus(loan, now);
  return <Badge tone={TONE[st]} data-testid="loan-status">{STUDENT.loans.status[st]}</Badge>;
}

/** One payment as a row: stall, what is owed, the due date and its status. Links to the detail. */
export function LoanRow({ world, loan }: { world: WorldState; loan: Loan }) {
  const owed = amountDue(loan);
  return (
    <li>
      <Link href={`/dashboard/loans/${loan.id}`} data-testid="loan-row" className="flex min-h-14 items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{world.vendors[loan.vendorId]?.stallName ?? "Stall"}</p>
          <p className="text-xs text-ink-2">{owed > 0 ? `Due ${fmtDate(loan.dueDate)}` : `Paid ${loan.closedAt ? fmtDate(loan.dueDate) : ""}`.trim()}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-base font-bold tabular-nums">{owed > 0 ? `₹${owed}` : `${loan.coins} coins`}</p>
          <StatusBadge loan={loan} now={world.clock.now} />
        </div>
      </Link>
    </li>
  );
}
