"use client";

import { useEffect, useRef, useState } from "react";
import { GlassButton } from "@/components/glass";
import { decodeQrImage } from "@/lib/qr-scan";
import { STUDENT } from "@/lib/copy-demo";

const t = STUDENT.pay.camera;

/**
 * A real camera scan. The video stays on this device: frames are read into a canvas, decoded in the browser, and
 * discarded. The camera stops as soon as a code is read, the panel is closed, or the page is left.
 */
export function CameraScanner({ onCode, onClose }: { onCode: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const v = video.current;
      if (stopped || !v || !ctx) return;
      if (v.readyState >= 2 && v.videoWidth > 0) {
        const w = Math.min(640, v.videoWidth);
        const h = Math.round((w / v.videoWidth) * v.videoHeight);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(v, 0, 0, w, h);
        const text = decodeQrImage(ctx.getImageData(0, 0, w, h).data, w, h);
        if (text) {
          stopped = true;
          onCode(text);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) return stream.getTracks().forEach((x) => x.stop());
        const v = video.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        setReady(true);
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setError(e instanceof DOMException && e.name === "NotAllowedError" ? t.denied : t.unavailable);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((x) => x.stop());
    };
    // the callbacks are read once when a code is found; the camera must not restart if the parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-testid="camera-panel" className="space-y-2 rounded-2xl border border-hairline bg-card p-3">
      {error ? (
        <p role="alert" data-testid="camera-error" className="text-sm font-medium text-bad-text">{error}</p>
      ) : (
        <>
          <video ref={video} muted playsInline aria-label={t.label} data-ready={ready} className="aspect-square w-full max-w-sm rounded-xl bg-black object-cover" />
          <p role="status" className="text-xs text-ink-2">{ready ? t.hint : t.starting}</p>
        </>
      )}
      <GlassButton size="sm" variant="outline" data-testid="camera-close" onClick={onClose}>{t.close}</GlassButton>
    </div>
  );
}
