import { readFileSync } from "node:fs";
import QRCode from "qrcode";
import { expect, test, type Page } from "@playwright/test";

// Milestone 8 (stretch): PDF downloads, a real camera scan, and spoken captions for scenario auto-play.
// The camera is faked with a canvas that paints a real QR, so the scan path is genuinely exercised.

const payload = (vendor: string, v = 1) => `kredo://pay/${vendor}?v=${v}&sig=`; // signature is added by the app's own helper below

/** Replaces the camera with a canvas stream that shows the given QR text. */
async function fakeCamera(page: Page, text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const bits = Array.from({ length: n * n }, (_, i) => qr.modules.get(i % n, Math.floor(i / n)));
  await page.addInitScript(
    ({ n, bits }) => {
      navigator.mediaDevices.getUserMedia = async () => {
        const scale = 8;
        const border = 4;
        const size = (n + border * 2) * scale;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const g = canvas.getContext("2d")!;
        const draw = () => {
          g.fillStyle = "#fff";
          g.fillRect(0, 0, size, size);
          g.fillStyle = "#000";
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (bits[y * n + x]) g.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
          requestAnimationFrame(draw);
        };
        draw();
        return canvas.captureStream(15);
      };
    },
    { n, bits },
  );
}

async function qrFor(page: Page, vendorId: string): Promise<string> {
  // the stall's real, signed payload, read from its own QR page
  await page.goto("/start");
  await page.getByTestId(`persona-${vendorId === "ven-gupta-chai" ? "v-gupta" : "v-night"}`).click();
  if (vendorId === "ven-gupta-chai") {
    await page.goto("/vendor/qr");
    await page.getByText("Demo: the code inside this QR").click();
    return (await page.getByTestId("qr-payload").innerText()).trim();
  }
  return payload(vendorId);
}

test("a settlement report and a student statement download as real PDFs", async ({ page }) => {
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/settlements");
  const [report] = await Promise.all([page.waitForEvent("download"), page.getByTestId("dl-pdf").first().click()]);
  expect(report.suggestedFilename()).toMatch(/^SET-ven-gupta-chai-L-\d+\.pdf$/);
  const body = readFileSync((await report.path())!);
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");

  await page.goto("/start");
  await page.getByTestId("persona-diya").click();
  await page.goto("/dashboard/loans");
  const [statement] = await Promise.all([page.waitForEvent("download"), page.getByTestId("statement-pdf").click()]);
  expect(statement.suggestedFilename()).toBe("statement.pdf");
  expect(readFileSync((await statement.path())!).subarray(0, 5).toString()).toBe("%PDF-");
});

test("the camera reads a stall's QR and the stall is picked, held to the same checks as the list", async ({ page }) => {
  const text = await qrFor(page, "ven-gupta-chai");
  await fakeCamera(page, text);
  await page.goto("/start");
  await page.getByTestId("persona-aarav").click();
  await page.goto("/dashboard/pay");
  await page.getByTestId("camera-open").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned: Gupta Chai Tapri", { timeout: 15_000 });
  await expect(page.getByTestId("camera-panel")).toHaveCount(0); // the camera stops once a code is read
  await page.getByLabel("Amount in coins").fill("40");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("quote")).toBeVisible();
});

test("a camera scan of a QR that is not valid is refused with the same plain message", async ({ page }) => {
  await fakeCamera(page, "https://example.com/pay");
  await page.goto("/start");
  await page.getByTestId("persona-aarav").click();
  await page.goto("/dashboard/pay");
  await page.getByTestId("camera-open").click();
  await expect(page.getByTestId("scan-error")).toHaveText("That doesn't look like a Kredo stall QR.", { timeout: 15_000 });
});

test("when the camera is blocked, the person is told and can pick a stall instead", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
  });
  await page.goto("/start");
  await page.getByTestId("persona-aarav").click();
  await page.goto("/dashboard/pay");
  await page.getByTestId("camera-open").click();
  await expect(page.getByTestId("camera-error")).toContainText("The camera is blocked");
  await page.getByTestId("camera-close").click();
  await page.getByTestId("stall-ven-gupta-chai").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
});

test("scenario captions can be read aloud, with amounts and codes spoken naturally", async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      constructor(t: string) {
        this.text = t;
      }
    }
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = Utterance;
    Object.defineProperty(window, "speechSynthesis", { value: { speak: (u: Utterance) => spoken.push(u.text), cancel: () => {} }, configurable: true });
  });
  await page.goto("/demo?scenario=2&auto=1&fast=1");
  await expect(page.locator('main[data-ready="true"]')).toBeVisible();
  await page.getByTestId("voice-toggle").check();
  await expect(page.getByTestId("scenario-done")).toBeVisible({ timeout: 60_000 });
  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken.length).toBeGreaterThan(0);
  expect(spoken.join(" ")).not.toContain("₹");
  await page.getByTestId("scenario-2").click(); // restart with voice on: the title and first caption are read
  await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).join(" ")).toContain("The happy path");
});
