"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/forms/field";
import { FileDropZone } from "@/components/forms/file-drop";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassInput, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { COPY } from "@/lib/copy";
import { TICKET_CATEGORIES, type TicketCategory } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";

const T = COPY.support;
const schema = z.object({
  category: z.enum(["KYC", "Repayment", "Coin terms", "Account access", "Other"], { message: "Choose a category." }),
  subject: z.string().trim().min(5, "Add a short subject (at least 5 characters).").max(80, "Keep it under 80 characters."),
  description: z.string().trim().min(15, "Describe what happened (at least 15 characters).").max(1000, "Keep it under 1000 characters."),
});
type Values = z.infer<typeof schema>;

const drop = { drop: "Drag and drop, or choose a file", hint: "Image or PDF, up to 5 MB", camera: "Camera", choose: "Choose file", retake: "Replace", remove: "Remove", blur: "", scanning: "", preview: "Preview of your attachment" };

function Form({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const add = useStore((s) => s.addTicket);
  const [done, setDone] = useState<{ ref: string; id: string } | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { category: undefined as unknown as TicketCategory, subject: "", description: "" } });
  const { errors, isSubmitting } = form.formState;

  async function submit(v: Values) {
    await new Promise((r) => setTimeout(r, 800));
    const t = add(v);
    setDone({ ref: t.ref, id: t.id });
  }

  if (done)
    return (
      <div className="space-y-3 text-center">
        <GlassSheetTitle className="text-xl font-extrabold">Ticket raised</GlassSheetTitle>
        <GlassSheetDescription className="text-sm text-ink-2">{T.created(done.ref)}</GlassSheetDescription>
        <ReferenceNumber value={done.ref} label="Complaint" />
        <GlassButton size="lg" className="w-full" onClick={() => { onCreated(done.id); onClose(); }}>
          Open ticket
        </GlassButton>
      </div>
    );

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
      <GlassSheetTitle className="text-xl font-extrabold">{T.newTicket}</GlassSheetTitle>
      <GlassSheetDescription className="text-sm text-ink-2">Tell us what is wrong. For anything about money or identity, share facts only.</GlassSheetDescription>
      <Field id="t-cat" label={T.category} error={errors.category?.message}>
        <GlassSelect id="t-cat" invalid={!!errors.category} aria-describedby="t-cat-err" disabled={isSubmitting} defaultValue="" {...form.register("category")}>
          <option value="">Choose</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </GlassSelect>
      </Field>
      <Field id="t-sub" label={T.subject} error={errors.subject?.message}>
        <GlassInput id="t-sub" invalid={!!errors.subject} aria-describedby="t-sub-err" disabled={isSubmitting} {...form.register("subject")} />
      </Field>
      <Field id="t-desc" label={T.description} error={errors.description?.message}>
        <GlassTextarea id="t-desc" invalid={!!errors.description} aria-describedby="t-desc-err" disabled={isSubmitting} {...form.register("description")} />
      </Field>
      <div className="space-y-2">
        <p className="text-sm font-bold">{T.attach}</p>
        <p className="text-xs text-ink-2">{T.attachHint}</p>
        <FileDropZone id="att-1" label="Attachment 1" accept={["image/jpeg", "image/png", "application/pdf"]} copy={drop} onChange={() => {}} />
        <FileDropZone id="att-2" label="Attachment 2" accept={["image/jpeg", "image/png", "application/pdf"]} copy={drop} onChange={() => {}} />
      </div>
      <GlassButton type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          T.submit
        )}
      </GlassButton>
    </form>
  );
}

export function TicketSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  return (
    <GlassSheet open={open} onOpenChange={onOpenChange}>
      <GlassSheetContent>{open && <Form onClose={() => onOpenChange(false)} onCreated={onCreated} />}</GlassSheetContent>
    </GlassSheet>
  );
}
