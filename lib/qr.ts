/**
 * The stall QR: a signed, versioned payload. Scanning an old version, a forged payload or a stall that is not active
 * is refused with a plain reason.
 *
 * DEMO STAND-IN: the signature here is a non-secret checksum so the whole demo runs in the browser. A real build signs
 * on the server with an HMAC key the client never sees, and verifies there too.
 */
import { isVendorActive } from "./domain/vendors";
import type { WorldState } from "./domain/types";

const DEMO_KEY = "kredo-demo-qr-key";
const PREFIX = "kredo://pay/";

function checksum(text: string): string {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export const qrSignature = (vendorId: string, version: number) => checksum(`${vendorId}|${version}|${DEMO_KEY}`);

/** What the QR encodes. */
export const qrPayload = (vendorId: string, version: number): string => `${PREFIX}${vendorId}?v=${version}&sig=${qrSignature(vendorId, version)}`;

export type QrCode = "MALFORMED" | "BAD_SIGNATURE" | "UNKNOWN_STALL" | "REVOKED" | "INACTIVE";
export type QrCheck = { ok: true; vendorId: string } | { ok: false; code: QrCode; message: string };

export const QR_MESSAGE: Record<QrCode, string> = {
  MALFORMED: "That doesn't look like a Kredo stall QR.",
  BAD_SIGNATURE: "That QR can't be verified. Ask the stall for a fresh one.",
  UNKNOWN_STALL: "That stall isn't on Kredo.",
  REVOKED: "That QR is out of date. Ask the stall for its current QR.",
  INACTIVE: "This stall isn't active right now.",
};

const fail = (code: QrCode): QrCheck => ({ ok: false, code, message: QR_MESSAGE[code] });

/** Reads a scanned payload and checks it against the world. Order: format, signature, stall, version, then active. */
export function checkQr(world: WorldState, text: string): QrCheck {
  if (!text.startsWith(PREFIX)) return fail("MALFORMED");
  const m = /^kredo:\/\/pay\/([A-Za-z0-9-]+)\?v=(\d+)&sig=([0-9a-f]{8})$/.exec(text);
  if (!m) return fail("MALFORMED");
  const [, vendorId, v, sig] = m;
  if (qrSignature(vendorId, Number(v)) !== sig) return fail("BAD_SIGNATURE");
  const vendor = world.vendors[vendorId];
  if (!vendor) return fail("UNKNOWN_STALL");
  if (Number(v) !== vendor.qrVersion) return fail("REVOKED");
  if (!isVendorActive(vendor)) return fail("INACTIVE");
  return { ok: true, vendorId };
}
