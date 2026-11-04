import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "./seed";
import { settlementPdf, statementPdf } from "./pdf";

const W = buildSeedWorld();

describe("PDF downloads", () => {
  it("the settlement report is a PDF that names the stall, and its totals", async () => {
    const s = Object.values(W.settlements).filter((x) => x.vendorId === "ven-gupta-chai").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 1);
    const out = (await settlementPdf(W, s)).output();
    expect(out.startsWith("%PDF-")).toBe(true);
    expect(out).toContain("Gupta Chai Tapri");
    expect(out).toContain(`Total Rs ${s[0].totalAmount}`);
    expect(out).toContain(s[0].reference!);
  });
  it("a student statement lists payments with their costs and the repayments, without rupee signs the PDF font cannot draw", async () => {
    const out = (await statementPdf(W, "stu-diya")).output();
    expect(out.startsWith("%PDF-")).toBe(true);
    expect(out).toContain("Diya");
    expect(out).toMatch(/total Rs \d+/);
    expect(out).toContain("Repayments");
    expect(out).not.toContain("₹");
  });
  it("an empty statement says so", async () => {
    const out = (await statementPdf(W, "stu-aarav")).output();
    expect(out).toContain("No payments yet.");
    expect(out).toContain("No repayments yet.");
  });
  it("long reports add pages", async () => {
    const all = Object.values(W.settlements).slice(0, 40);
    const doc = await settlementPdf(W, all);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
