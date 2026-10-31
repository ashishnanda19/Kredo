"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const GlassSheet = DialogPrimitive.Root;
export const GlassSheetTrigger = DialogPrimitive.Trigger;
export const GlassSheetClose = DialogPrimitive.Close;
export const GlassSheetTitle = DialogPrimitive.Title;
export const GlassSheetDescription = DialogPrimitive.Description;

/**
 * iOS-style bottom sheet (centred dialog from md up). Springs in, and can be dragged down
 * by its grabber to dismiss. Radix handles focus trapping, Escape and aria.
 */
export function GlassSheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const controls = useDragControls();
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_0.24s_ease-out]" />
      <DialogPrimitive.Content
        asChild
        // focus the sheet itself, not its first control (which could pop an info tooltip open)
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
        {...props}
      >
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.sheet}
          drag="y"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 600) closeRef.current?.click();
          }}
          className={cn(
            "glass glass-strong fixed inset-x-0 bottom-0 z-[90] max-h-[92dvh] overflow-y-auto rounded-t-[32px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none",
            "md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px]",
            className,
          )}
        >
          {/* grabber: drag down to dismiss (mobile) */}
          <div
            aria-hidden
            onPointerDown={(e) => controls.start(e)}
            className="mx-auto -mt-3 mb-3 flex h-6 w-24 cursor-grab touch-none items-center justify-center md:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-ink/20" />
          </div>
          {children}
          <DialogPrimitive.Close
            ref={closeRef}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full text-ink-2 transition-colors hover:bg-ink/10 hover:text-ink"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
