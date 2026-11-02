import { describe, expect, it } from "vitest";
import { DAY, HOUR, addDays, batchDate, daysBetween, daysPastDue, istDate, istHour, istStartOf, nextCutoff } from "./time";

describe("simulated clock helpers (India time)", () => {
  it("converts a calendar date and hour to the same instant and back", () => {
    const t = istStartOf("2026-10-30", 9);
    expect(istDate(t)).toBe("2026-10-30");
    expect(istHour(t)).toBe(9);
  });
  it("India midnight is 18:30 UTC the day before", () => {
    expect(new Date(istStartOf("2026-10-30", 0)).toISOString()).toBe("2026-10-29T18:30:00.000Z");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
  });
  it("the next cut-off is strictly after now", () => {
    const m = istStartOf("2026-10-30", 0);
    expect(nextCutoff(m, 0)).toBe(m + DAY);
    expect(nextCutoff(m - 1, 0)).toBe(m);
  });
  it("a batch covers the business day that just ended", () => {
    expect(batchDate(istStartOf("2026-10-31", 0))).toBe("2026-10-30");
  });
  it("days past due is zero on or before the due date", () => {
    expect(daysPastDue("2026-10-30", istStartOf("2026-10-30", 23))).toBe(0);
    expect(daysPastDue("2026-10-30", istStartOf("2026-11-02", 1))).toBe(3);
    expect(HOUR).toBe(3_600_000);
  });
});
