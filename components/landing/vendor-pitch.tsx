"use client";

import { useRef, useState } from "react";
import { Banknote, HandCoins, Users } from "lucide-react";
import {
  GlassButton,
  GlassCard,
  GlassFieldError,
  GlassInput,
  GlassSheet,
  GlassSheetContent,
  GlassSheetDescription,
  GlassSheetTitle,
  GlassSheetTrigger,
} from "@/components/glass";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { SuccessCheck } from "@/components/shared/success-check";
import { Label } from "@/components/ui/label";
import { COPY } from "@/lib/copy";
import { validateName, validateRequired } from "@/lib/validation";
import { useRigSegment } from "./scenes/use-rig-segment";
import { SectionHeading } from "./section-heading";

const icons = [Users, Banknote, HandCoins];

function PartnerForm() {
  const f = COPY.vendors.form;
  const [shop, setShop] = useState("");
  const [campus, setCampus] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = { shop: validateName(shop) && "Enter your shop name.", campus: validateRequired(campus, "campus or college name") };
    setErrors(next);
    if (!next.shop && !next.campus) setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <SuccessCheck />
        <GlassSheetTitle className="mt-5 text-xl font-bold">{f.doneTitle}</GlassSheetTitle>
        <GlassSheetDescription className="mt-1 text-sm text-muted">{f.doneBody}</GlassSheetDescription>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <GlassSheetTitle className="text-xl font-bold">{f.title}</GlassSheetTitle>
        <GlassSheetDescription className="mt-1 text-sm text-muted">{f.intro}</GlassSheetDescription>
      </div>
      <div>
        <Label htmlFor="shop">{f.shop}</Label>
        <GlassInput id="shop" value={shop} onChange={(e) => setShop(e.target.value)} invalid={!!errors.shop} aria-describedby="shop-err" autoComplete="organization" />
        <GlassFieldError id="shop-err">{errors.shop}</GlassFieldError>
      </div>
      <div>
        <Label htmlFor="campus">{f.campus}</Label>
        <GlassInput id="campus" value={campus} onChange={(e) => setCampus(e.target.value)} invalid={!!errors.campus} aria-describedby="campus-err" />
        <GlassFieldError id="campus-err">{errors.campus}</GlassFieldError>
      </div>
      <GlassButton type="submit" className="w-full">
        {f.submit}
      </GlassButton>
    </form>
  );
}

export function VendorPitch() {
  const v = COPY.vendors;
  const ref = useRef<HTMLElement>(null);
  // the corner card fades away before the vendor strip
  useRigSegment(ref, { start: "top 80%", end: "top 30%", from: () => ({ opacity: 1 }), to: () => ({ opacity: 0 }) });
  return (
    <section id="vendors" ref={ref} className="relative py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <SectionHeading eyebrow={v.eyebrow} lines={["Run a shop", "near campus?"]} accent={1} />
          <Reveal className="mt-6">
            <p className="max-w-md text-lg leading-relaxed text-white/90 [html:not(.dark)_&]:text-foreground/85">{v.body}</p>
            <GlassSheet>
              <GlassSheetTrigger asChild>
                <GlassButton size="lg" className="mt-7">
                  {v.cta}
                </GlassButton>
              </GlassSheetTrigger>
              <GlassSheetContent>
                <PartnerForm />
              </GlassSheetContent>
            </GlassSheet>
          </Reveal>
        </div>

        <Stagger className="grid gap-4">
          {v.perks.map((p, i) => {
            const Icon = icons[i];
            return (
              <StaggerItem key={p.title}>
                <GlassCard radius="lg" interactive className="flex items-start gap-4 p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-neon-violet">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{p.title}</h3>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{p.body}</p>
                  </div>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
