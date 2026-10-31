"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileText, ImageIcon, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { cn } from "@/lib/utils";

interface FileDropProps {
  id: string;
  label: string;
  /** e.g. ["image/jpeg","image/png","image/heic"] */
  accept: string[];
  maxMB?: number;
  allowCamera?: boolean;
  /** rough in-browser blur check for images */
  checkBlur?: boolean;
  tips?: readonly string[];
  copy: { drop: string; hint: string; camera: string; choose: string; retake: string; remove: string; blur: string; scanning: string; preview: string };
  /** called with true when a valid file is held, false when cleared. The File itself never leaves this component. */
  onChange: (has: boolean) => void;
  invalid?: boolean;
}

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);

async function looksBlurry(url: string): Promise<boolean> {
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = 220;
    const h = Math.max(40, Math.round((img.naturalHeight / img.naturalWidth) * w));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return false;
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        sum += lap;
        sumSq += lap * lap;
        n++;
      }
    const variance = sumSq / n - (sum / n) ** 2;
    return variance < 35;
  } catch {
    return false;
  }
}

/**
 * Upload zone: drag and drop + file picker + optional camera. PRIVACY: the file is only shown as a
 * browser object URL. It is never stored (no localStorage / store), never sent anywhere, and the URL is
 * revoked on remove, retake, replace and unmount.
 */
export function FileDropZone({ id, label, accept, maxMB = 5, allowCamera, checkBlur, tips, copy, onChange, invalid }: FileDropProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"image" | "heic" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [drag, setDrag] = useState(false);
  const urlRef = useRef<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function clear() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setUrl(null);
    setName("");
    setKind(null);
    setWarn(false);
    setScanning(false);
    onChange(false);
  }

  async function accepted(file?: File | null) {
    if (!file) return;
    const okType = accept.includes(file.type) || (accept.includes("image/heic") && isHeic(file));
    if (!okType) {
      setError(`That file type isn't allowed. Use ${accept.map((a) => a.split("/")[1].toUpperCase().replace("JPEG", "JPG")).join(", ")}.`);
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setError(`That file is over ${maxMB} MB. Choose a smaller one.`);
      return;
    }
    setError(null);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const u = URL.createObjectURL(file);
    urlRef.current = u;
    const k = file.type === "application/pdf" ? "pdf" : isHeic(file) ? "heic" : "image";
    setUrl(u);
    setName(file.name);
    setKind(k);
    setWarn(false);
    onChange(true);
    if (checkBlur && k === "image") {
      setScanning(true);
      const blurry = await looksBlurry(u);
      if (urlRef.current === u) {
        setWarn(blurry);
        setScanning(false);
      }
    }
  }

  const input = (ref: React.RefObject<HTMLInputElement | null>, aria: string, capture?: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={accept.concat(accept.includes("image/heic") ? [".heic", ".heif"] : []).join(",")}
      capture={capture ? "environment" : undefined}
      className="sr-only"
      tabIndex={-1}
      aria-label={aria}
      onChange={(e) => {
        void accepted(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  return (
    <div>
      <p className="mb-2 text-sm font-bold" id={`${id}-label`}>
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void accepted(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative overflow-hidden rounded-[22px] border-2 border-dashed bg-ink/[0.05] p-3 text-center backdrop-blur-xl transition-[border-color,box-shadow,background-color]",
          drag ? "border-ink bg-accent-soft" : "border-ink/25",
          (error || invalid) && "border-bad",
        )}
      >
        {url ? (
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-black/30">
              {kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={url} alt={copy.preview} className="mx-auto max-h-48 w-full object-cover" />
              ) : (
                <div className="grid h-40 place-items-center text-ink-2">
                  {kind === "pdf" ? <FileText className="size-10" aria-hidden /> : <ImageIcon className="size-10" aria-hidden />}
                  <span className="px-3 text-xs">{kind === "heic" ? "HEIC selected (preview not available in this browser)" : "PDF selected"}</span>
                </div>
              )}
              <span aria-hidden className="absolute inset-x-0 h-0.5 animate-scan bg-info-text shadow-[0_0_18px_6px_rgba(47,125,246,0.35)] motion-reduce:hidden" />
              {scanning && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-xs font-bold text-white">{copy.scanning}</span>}
            </div>
            <p className="mt-2 truncate text-xs text-ink-2">{name}</p>
            <div className="mt-1 flex justify-center gap-1">
              <GlassButton type="button" variant="ghost" size="sm" onClick={() => pick.current?.click()}>
                <RefreshCw className="size-4" aria-hidden /> {copy.retake}
              </GlassButton>
              <GlassButton type="button" variant="ghost" size="sm" onClick={clear}>
                <Trash2 className="size-4" aria-hidden /> {copy.remove}
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-ink">
              <UploadCloud className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-bold">{copy.drop}</p>
            <p className="text-xs text-ink-2">{copy.hint}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <GlassButton type="button" variant="secondary" size="sm" onClick={() => pick.current?.click()}>
                {copy.choose}
              </GlassButton>
              {allowCamera && (
                <GlassButton type="button" variant="soft" size="sm" onClick={() => cam.current?.click()}>
                  <Camera className="size-4" aria-hidden /> {copy.camera}
                </GlassButton>
              )}
            </div>
          </div>
        )}
        {input(pick, `Choose file for ${label}`)}
        {allowCamera && input(cam, `Use camera for ${label}`, true)}
      </div>
      {warn && (
        <p role="status" className="mt-2 text-sm font-medium text-warn-text">
          {copy.blur}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-bad-text">
          {error}
        </p>
      )}
      {tips && !url && (
        <ul className="mt-2 space-y-0.5 text-xs text-ink-2">
          {tips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
