/**
 * India-time helpers. Due dates, days past due and the midnight cut-off are all India (IST, UTC+5:30) calendar dates,
 * on the simulated clock. Pure: nothing here reads the real clock.
 */
export const IST_OFFSET_MIN = 330;
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");

/** The India-time calendar date of an instant, "YYYY-MM-DD". */
export function istDate(ms: number): string {
  const d = new Date(ms + IST_OFFSET_MIN * MIN);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function istHour(ms: number): number {
  return new Date(ms + IST_OFFSET_MIN * MIN).getUTCHours();
}

function dateToUtcDay(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** The instant a given India-time date starts (00:00 IST), optionally at an hour of that day. */
export function istStartOf(date: string, hour = 0): number {
  return dateToUtcDay(date) + hour * HOUR - IST_OFFSET_MIN * MIN;
}

export function addDays(date: string, n: number): string {
  return istDate(istStartOf(date) + n * DAY + 12 * HOUR);
}

/** Whole days from `a` to `b` (b - a), both India-time dates. */
export function daysBetween(a: string, b: string): number {
  return Math.round((dateToUtcDay(b) - dateToUtcDay(a)) / DAY);
}

/** The first cut-off (at `hour` IST) strictly after `ms`. */
export function nextCutoff(ms: number, hour = 0): number {
  let t = istStartOf(istDate(ms), hour);
  while (t <= ms) t += DAY;
  return t;
}

/** The India-time business date a cut-off at `cutoff` closes (the day that just ended). */
export const batchDate = (cutoff: number): string => istDate(cutoff - 1);

/** Days past due at `ms` for a loan due on `dueDate` (0 on or before the due date). */
export function daysPastDue(dueDate: string, ms: number): number {
  return Math.max(0, daysBetween(dueDate, istDate(ms)));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "30 Oct" for a date string, "30 Oct, 09:00" for an instant. */
export function fmtDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms + IST_OFFSET_MIN * MIN);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
