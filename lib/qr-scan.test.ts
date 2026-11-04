import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "./demo/seed";
import { decodeQrImage } from "./qr-scan";
import { checkQr, qrPayload } from "./qr";

/** Paints a QR as an RGBA image, dark on white with a quiet border, the way a screen or print would show it. */
function render(text: string, scale = 6, border = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const size = (n + border * 2) * scale;
  const px = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (qr.modules.get(x, y))
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const i = (((y + border) * scale + dy) * size + (x + border) * scale + dx) * 4;
            px[i] = px[i + 1] = px[i + 2] = 0;
          }
  return { px, size };
}

const W = buildSeedWorld();

describe("camera QR decoding", () => {
  it("reads back exactly the payload a stall's QR encodes", () => {
    const text = qrPayload("ven-gupta-chai", W.vendors["ven-gupta-chai"].qrVersion);
    const { px, size } = render(text);
    expect(decodeQrImage(px, size, size)).toBe(text);
  });
  it("what the camera reads is held to the same checks as a picked stall", () => {
    for (const [vendor, code] of [["ven-gupta-chai", true], ["ven-night-canteen", "INACTIVE"], ["ven-juice", "INACTIVE"]] as const) {
      const { px, size } = render(qrPayload(vendor, 1));
      const read = decodeQrImage(px, size, size)!;
      const r = checkQr(W, read);
      if (code === true) expect(r.ok).toBe(true);
      else expect(r).toMatchObject({ ok: false, code });
    }
  });
  it("an old (revoked) QR and a foreign QR are refused after being read", () => {
    const old = render(qrPayload("ven-gupta-chai", 7));
    expect(checkQr(W, decodeQrImage(old.px, old.size, old.size)!)).toMatchObject({ ok: false, code: "REVOKED" });
    const foreign = render("https://example.com/pay");
    expect(checkQr(W, decodeQrImage(foreign.px, foreign.size, foreign.size)!)).toMatchObject({ ok: false, code: "MALFORMED" });
  });
  it("returns null when there is no QR in the frame", () => {
    const blank = new Uint8ClampedArray(200 * 200 * 4).fill(255);
    expect(decodeQrImage(blank, 200, 200)).toBeNull();
  });
});
