import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const t = (label: string, tone: Tone) => ({ label, tone });

/** One place for every status wording + colour, so chips are consistent across student and ops screens. */
export const CHIPS = {
  verification: { not_started: t("Not started", "neutral"), pending: t("Pending review", "warning"), accepted: t("Accepted", "success"), rejected: t("Rejected", "danger"), expired: t("Expired", "neutral"), resubmission: t("Resubmission required", "warning") },
  kyc: { not_started: t("Not started", "neutral"), in_progress: t("In progress", "accent"), provider_error: t("Provider error", "danger"), retry_limit: t("Retry limit reached", "danger"), escalated: t("Manual review", "warning"), verified: t("Verified", "success") },
  loanApp: { none: t("Not applied", "neutral"), draft: t("Draft", "neutral"), submitted: t("Submitted", "accent"), assessment: t("Under assessment", "accent"), more_info: t("More info needed", "warning"), offer_ready: t("Offer ready", "success"), accepted: t("Accepted", "success"), declined: t("Declined", "danger") },
  payment: { pending: t("Pending", "warning"), successful: t("Successful", "success"), failed: t("Failed", "danger"), reversed: t("Reversed", "neutral") },
  instalment: { paid: t("Paid", "success"), due: t("Due", "warning"), upcoming: t("Upcoming", "neutral"), overdue: t("Overdue", "danger") },
  ticket: { open: t("Open", "accent"), in_progress: t("In progress", "accent"), awaiting: t("Awaiting you", "warning"), resolved: t("Resolved", "success"), escalated: t("Escalated", "danger") },
  dispute: { Raised: t("Raised", "warning"), "Under review": t("Under review", "accent"), Resolved: t("Resolved", "success") },
  queue: { pending: t("Pending", "warning"), failed: t("Failed", "danger"), expired: t("Expired", "neutral"), escalated: t("Escalated", "accent"), accepted: t("Accepted", "success") },
  fraud: { open: t("Open", "danger"), investigating: t("Investigating", "warning"), escalated: t("Escalated", "accent"), closed: t("Closed", "neutral") },
  recon: { matched: t("Matched", "success"), mismatched: t("Mismatched", "danger"), missing: t("Missing", "warning") },
  event: { success: t("Success", "success"), failed: t("Failed", "danger"), retrying: t("Retrying", "warning") },
  priority: { low: t("Low", "neutral"), normal: t("Normal", "accent"), high: t("High", "warning"), urgent: t("Urgent", "danger") },
  request: { Received: t("Received", "warning"), "In progress": t("In progress", "accent"), Completed: t("Completed", "success") },
} as const;

export type ChipKind = keyof typeof CHIPS;

export function StatusPill({ kind, value, className }: { kind: ChipKind; value: string; className?: string }) {
  const entry = (CHIPS[kind] as Record<string, { label: string; tone: Tone }>)[value] ?? { label: value, tone: "neutral" as Tone };
  return (
    <Badge tone={entry.tone} className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {entry.label}
    </Badge>
  );
}
