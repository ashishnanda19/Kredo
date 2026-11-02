"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, RefreshCw } from "lucide-react";
import { GlassButton, GlassCard, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { VENDOR } from "@/lib/copy-demo";
import { isVendorActive, regenerateQr } from "@/lib/domain/vendors";
import { qrPayload } from "@/lib/qr";
import { useWorld } from "@/lib/store/world";

const t = VENDOR.qr;

/** The stall's QR: real, scannable and versioned. Regenerating it revokes the old one. */
export function QrPage() {
  const vendorId = useWorld((s) => s.session.vendorId);
  const vendor = useWorld((s) => (s.session.vendorId ? s.world.vendors[s.session.vendorId] : undefined));
  const apply = useWorld((s) => s.apply);
  const [svg, setSvg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const active = isVendorActive(vendor);
  const payload = vendor && vendorId && active ? qrPayload(vendorId, vendor.qrVersion) : "";

  useEffect(() => {
    if (!payload) return;
    let live = true;
    void QRCode.toString(payload, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then((s) => live && setSvg(s));
    return () => {
      live = false;
    };
  }, [payload]);

  if (!vendor || !vendorId) return null;
  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{t.sub}</p>
      </div>

      {!active ? (
        <GlassCard radius="xl" className="p-6 text-sm text-ink-2">{vendor.status === "suspended" ? t.inactive : t.notReady}</GlassCard>
      ) : (
        <>
          <GlassCard radius="xl" strength="strong" className="mx-auto max-w-sm space-y-3 p-6 text-center">
            {/* a QR must stay black on white to scan, in either theme */}
            <div data-testid="stall-qr" data-version={vendor.qrVersion} role="img" aria-label={`${t.scanLine} ${vendor.stallName}`} className="mx-auto aspect-square w-full max-w-[260px] rounded-2xl bg-white p-2 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="text-base font-bold">{vendor.stallName}</p>
            <p className="text-xs text-ink-2">{t.version(vendor.qrVersion)}</p>
          </GlassCard>

          <div className="mx-auto flex max-w-sm gap-2 print:hidden">
            <GlassButton variant="secondary" className="flex-1" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> {t.print}</GlassButton>
            <GlassButton variant="outline" className="flex-1" onClick={() => { setDone(false); setConfirm(true); }}><RefreshCw className="size-4" aria-hidden /> {t.regenerate}</GlassButton>
          </div>
          {done && <p role="status" className="mx-auto max-w-sm text-center text-sm font-semibold print:hidden">{t.regenDone}</p>}

          <details className="mx-auto max-w-sm text-xs text-ink-2 print:hidden">
            <summary className="cursor-pointer font-semibold">{t.demoCode}</summary>
            <p className="mt-1">{t.demoCodeNote}</p>
            <code data-testid="qr-payload" className="mt-1 block break-all rounded-xl bg-card p-2">{payload}</code>
          </details>
        </>
      )}

      <GlassSheet open={confirm} onOpenChange={setConfirm}>
        <GlassSheetContent>
          <div className="space-y-4">
            <GlassSheetTitle className="text-xl font-extrabold">{t.regenTitle}</GlassSheetTitle>
            <GlassSheetDescription className="text-sm text-ink-2">{t.regenBody}</GlassSheetDescription>
            <div className="flex gap-2">
              <GlassButton variant="outline" className="flex-1" onClick={() => setConfirm(false)}>{t.cancel}</GlassButton>
              <GlassButton data-testid="confirm-regen" className="flex-1" onClick={() => { apply((w) => regenerateQr(w, vendorId, vendorId)); setConfirm(false); setDone(true); }}>{t.regenConfirm}</GlassButton>
            </div>
          </div>
        </GlassSheetContent>
      </GlassSheet>
    </div>
  );
}
