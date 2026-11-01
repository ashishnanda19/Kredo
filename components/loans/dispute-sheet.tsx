"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/forms/field";
import { FileDropZone } from "@/components/forms/file-drop";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { COPY } from "@/lib/copy";
import { DISPUTE_CATEGORIES } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";

const schema = z.object({
  category: z.string().min(1, "Choose a category."),
  description: z.string().trim().min(15, "Tell us what looks wrong (at least 15 characters).").max(600, "Keep it under 600 characters."),
});
type Values = z.infer<typeof schema>;

function Form({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const add = useStore((s) => s.addDispute);
  const [evidence, setEvidence] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { category: "", description: "" } });
  const { errors, isSubmitting } = form.formState;

  async function submit(v: Values) {
    await new Promise((r) => setTimeout(r, 800));
    const d = add({ paymentId, category: v.category, description: v.description, hasEvidence: evidence });
    setDone(d.ref);
  }

  if (done)
    return (
      <div className="space-y-3 text-center">
        <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">Dispute raised</GlassSheetTitle>
        <GlassSheetDescription className="text-sm text-ink-2">{COPY.loans.disputeSent(done)}</GlassSheetDescription>
        <div className="flex items-center justify-center gap-2">
          <ReferenceNumber value={done} label="Dispute" />
          <StatusPill kind="dispute" value="Raised" />
        </div>
        <GlassButton size="lg" className="w-full" onClick={onClose}>
          Done
        </GlassButton>
      </div>
    );

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
      <div>
        <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">{COPY.loans.disputeTitle}</GlassSheetTitle>
        <GlassSheetDescription className="mt-1 text-sm text-ink-2">Payment {paymentId}. We will look into it and keep you updated.</GlassSheetDescription>
      </div>
      <Field id="d-cat" label="Category" error={errors.category?.message}>
        <GlassSelect id="d-cat" invalid={!!errors.category} aria-describedby="d-cat-err" disabled={isSubmitting} {...form.register("category")}>
          <option value="">Choose</option>
          {DISPUTE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </GlassSelect>
      </Field>
      <Field id="d-desc" label="What looks wrong?" error={errors.description?.message}>
        <GlassTextarea id="d-desc" invalid={!!errors.description} aria-describedby="d-desc-err" disabled={isSubmitting} {...form.register("description")} />
      </Field>
      <FileDropZone
        id="d-evidence"
        label="Evidence (optional)"
        accept={["image/jpeg", "image/png", "application/pdf"]}
        copy={{ drop: "Drag and drop, or choose a file", hint: "Image or PDF, up to 5 MB. Previewed in your browser only.", camera: "Camera", choose: "Choose file", retake: "Replace", remove: "Remove", blur: "", scanning: "", preview: "Preview of your evidence" }}
        onChange={setEvidence}
      />
      <GlassButton type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          "Raise dispute"
        )}
      </GlassButton>
    </form>
  );
}

export function DisputeSheet({ paymentId, onOpenChange }: { paymentId: string | null; onOpenChange: (o: boolean) => void }) {
  return (
    <GlassSheet open={!!paymentId} onOpenChange={onOpenChange}>
      <GlassSheetContent>{paymentId && <Form paymentId={paymentId} onClose={() => onOpenChange(false)} />}</GlassSheetContent>
    </GlassSheet>
  );
}
