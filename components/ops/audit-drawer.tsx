"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ScrollText, X } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { useStore } from "@/lib/store/store";
import { fmtDT } from "./common";

/** Side drawer listing the mock audit log: who, what, when, reason. Every ops action appends an entry. */
export function AuditDrawer() {
  const audit = useStore((s) => s.ops.audit);
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <GlassButton variant="secondary" size="sm">
          <ScrollText className="size-4" aria-hidden /> Audit log ({audit.length})
        </GlassButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content className="glass glass-strong fixed inset-y-0 right-0 z-[90] flex w-[min(100vw,420px)] flex-col rounded-l-[28px] p-5 outline-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-extrabold">Audit log</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">Mock entries. Every action here records who, what, when and why.</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close audit log" className="grid size-10 place-items-center rounded-full hover:bg-foreground/10">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <ol className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {audit.map((a) => (
              <li key={a.id} className="rounded-2xl bg-foreground/[0.06] p-3 text-sm">
                <p className="font-bold">{a.what}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {a.who} · {fmtDT(a.at)}
                </p>
                <p className="mt-1 text-xs">
                  <span className="font-semibold">Reason: </span>
                  {a.reason}
                </p>
              </li>
            ))}
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
