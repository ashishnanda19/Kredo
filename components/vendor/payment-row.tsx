"use client";

import { Badge } from "@/components/ui/badge";
import { VENDOR } from "@/lib/copy-demo";
import { fmtDateTime } from "@/lib/domain/time";
import { vendorFacingStudent } from "@/lib/domain/selectors";
import type { Loan, WorldState } from "@/lib/domain/types";

const TONE = { received: "warning", settled: "success", refunded: "neutral", disputed: "danger" } as const;

/** One payment as the vendor sees it: first name and last initial, the amount, the time, and where it is in settlement. */
export function PaymentRow({ world, loan, action }: { world: WorldState; loan: Loan; action?: React.ReactNode }) {
  const net = loan.coins - loan.refundedCoins;
  const status = loan.status === "refunded" ? "refunded" : loan.vendorStatus;
  return (
    <div data-testid="payment-row" className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{vendorFacingStudent(world, loan.studentId)}</p>
        <p className="text-xs text-ink-2">{fmtDateTime(loan.createdAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-base font-bold tabular-nums">{net} <span className="text-xs font-semibold text-ink-2">{VENDOR.coins}</span></p>
        <Badge tone={TONE[status]}>{VENDOR.chip[status]}</Badge>
        {action}
      </div>
    </div>
  );
}
