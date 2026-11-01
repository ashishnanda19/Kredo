import { StatusPill } from "@/components/portal/status-chip";
import { formatDate, formatINR } from "@/lib/format";
import type { Instalment } from "@/lib/mock-portal";

/** Repayment schedule as a real table (works with screen readers), scrollable on small screens. */
export function ScheduleTable({ schedule, caption = "Repayment schedule" }: { schedule: Instalment[]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-ink/[0.05]">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs uppercase tracking-wider text-ink-2">
          <tr>
            <th scope="col" className="px-4 py-3">#</th>
            <th scope="col" className="px-2 py-3">Due date</th>
            <th scope="col" className="px-2 py-3 text-right">Principal</th>
            <th scope="col" className="px-2 py-3 text-right">Charges</th>
            <th scope="col" className="px-2 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {schedule.map((i) => (
            <tr key={i.n}>
              <td className="px-4 py-3 font-semibold">{i.n}</td>
              <td className="px-2 py-3">{formatDate(i.dueDate)}</td>
              <td className="px-2 py-3 text-right tabular-nums">{formatINR(i.principal)}</td>
              <td className="px-2 py-3 text-right tabular-nums">{formatINR(i.charges)}</td>
              <td className="px-2 py-3 text-right font-semibold tabular-nums">{formatINR(i.amount)}</td>
              <td className="px-4 py-3">
                <StatusPill kind="instalment" value={i.state} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
