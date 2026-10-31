import { CATEGORY_LABEL, type Transaction } from "@/lib/mock-data";
import { formatINR, relativeDay } from "@/lib/format";
import { CategoryIcon } from "@/components/shared/category-icon";
import { StatusChip } from "@/components/shared/status-chip";

export function TransactionRow({ tx, onDispute }: { tx: Transaction; onDispute?: (id: string) => void }) {
  return (
    <div>
    <div className="flex min-h-[64px] items-center gap-3 py-2">
      <CategoryIcon category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{tx.vendor}</p>
        <p className="truncate text-sm text-muted">
          {CATEGORY_LABEL[tx.category]} · {relativeDay(tx.date)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="font-bold tabular-nums">{formatINR(tx.amount)}</p>
        <StatusChip status={tx.status} />
      </div>
    </div>
    {onDispute && (
      <button type="button" onClick={() => onDispute(tx.id)} className="mb-2 ml-14 inline-flex min-h-9 items-center text-xs font-bold text-neon-blue">
        Something looks wrong?
      </button>
    )}
    </div>
  );
}
