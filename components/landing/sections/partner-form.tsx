"use client";

import { useState } from "react";
import { GlassButton, GlassFieldError, GlassInput, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { SuccessCheck } from "@/components/shared/success-check";
import { Label } from "@/components/ui/label";
import { COPY } from "@/lib/copy";
import { validateName, validateRequired } from "@/lib/validation";

/** Vendor interest form shown in a sheet. Preview only: nothing is sent. */
export function PartnerForm() {
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
        <GlassSheetDescription className="mt-1 text-sm text-ink-2">{f.doneBody}</GlassSheetDescription>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <GlassSheetTitle className="text-xl font-bold">{f.title}</GlassSheetTitle>
        <GlassSheetDescription className="mt-1 text-sm text-ink-2">{f.intro}</GlassSheetDescription>
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
