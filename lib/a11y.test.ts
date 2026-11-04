import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** WCAG 2.x contrast ratio of two #rrggbb colours. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
/** Colour tokens declared in the first block that starts with the given selector. */
function tokens(selector: RegExp): Record<string, string> {
  const m = selector.exec(css);
  if (!m) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(m.index, css.indexOf("\n}", m.index));
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((x) => [x[1], x[2]]));
}

const light = tokens(/:root,\s*\.theme-light\s*\{/);
const dark = { ...light, ...tokens(/\n\.dark[^{]*\{/) };

describe("colour contrast (WCAG AA)", () => {
  it("the yellow accent carries its dark ink at AAA, in both themes", () => {
    expect(ratio(light.accent, light["accent-ink"])).toBeGreaterThanOrEqual(7);
    expect(ratio(dark.accent, dark["accent-ink"])).toBeGreaterThanOrEqual(7);
  });
  it("body and secondary text are readable on the page and on cards", () => {
    for (const [name, t] of [["light", light], ["dark", dark]] as const) {
      expect(ratio(t.ink, t.page), `${name} ink on page`).toBeGreaterThanOrEqual(7);
      expect(ratio(t["ink-2"], t.page), `${name} secondary on page`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t["ink-2"], t.card), `${name} secondary on card`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("status text colours are readable on the page", () => {
    for (const [name, t] of [["light", light], ["dark", dark]] as const) {
      for (const k of ["ok-text", "bad-text", "warn-text", "info-text"]) expect(ratio(t[k], t.page), `${name} ${k}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("the pill button text is readable on its fill", () => {
    expect(ratio(light["pill-fg"], light["pill-bg"])).toBeGreaterThanOrEqual(7);
    expect(ratio(dark["pill-fg"], dark["pill-bg"])).toBeGreaterThanOrEqual(7);
  });
});
