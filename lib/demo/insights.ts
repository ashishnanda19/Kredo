/** A stall's own insights: today against yesterday, the last 7 days, busiest hours, ticket size and repeat customers. */
import { DAY, istDate, istHour, addDays } from "../domain/time";
import type { WorldState } from "../domain/types";

export interface StallInsights {
  today: { coins: number; count: number };
  yesterday: { coins: number; count: number };
  week: { date: string; coins: number; count: number }[];
  hours: { hour: number; count: number }[];
  avgTicket: number;
  customers30: number;
  repeatPercent: number;
  refunds30: { count: number; coins: number };
}

export function stallInsights(w: WorldState, vendorId: string): StallInsights {
  const now = w.clock.now;
  const today = istDate(now);
  const loans = Object.values(w.loans).filter((l) => l.vendorId === vendorId && l.status !== "refunded");
  const sum = (date: string) => loans.filter((l) => istDate(l.createdAt) === date).reduce((a, l) => ({ coins: a.coins + l.coins, count: a.count + 1 }), { coins: 0, count: 0 });
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return { date, ...sum(date) };
  });
  const recent = loans.filter((l) => l.createdAt > now - 30 * DAY);
  const perStudent = new Map<string, number>();
  for (const l of recent) perStudent.set(l.studentId, (perStudent.get(l.studentId) ?? 0) + 1);
  const repeat = [...perStudent.values()].filter((n) => n > 1).length;
  const refunds = w.refunds.filter((r) => r.vendorId === vendorId && r.status === "done" && r.requestedAt > now - 30 * DAY);
  return {
    today: sum(today),
    yesterday: sum(addDays(today, -1)),
    week,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: recent.filter((l) => istHour(l.createdAt) === hour).length })),
    avgTicket: recent.length ? Math.round(recent.reduce((s, l) => s + l.coins, 0) / recent.length) : 0,
    customers30: perStudent.size,
    repeatPercent: perStudent.size ? Math.round((repeat / perStudent.size) * 100) : 0,
    refunds30: { count: refunds.length, coins: refunds.reduce((s, r) => s + r.coins, 0) },
  };
}
