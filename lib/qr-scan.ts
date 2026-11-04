/**
 * Reading a stall QR from a camera frame. The decoded text goes through the same `checkQr` as a picked stall or a pasted
 * code, so a camera scan is held to exactly the same checks. Pure: it takes pixels, it does not touch the camera.
 */
import jsQR from "jsqr";

/** The text of the first QR found in an RGBA image, or null. */
export function decodeQrImage(rgba: Uint8ClampedArray, width: number, height: number): string | null {
  const r = jsQR(rgba, width, height, { inversionAttempts: "dontInvert" });
  return r?.data ?? null;
}
