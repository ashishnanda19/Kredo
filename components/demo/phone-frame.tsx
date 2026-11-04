import { cn } from "@/lib/utils";

/** A phone with a real page inside it (an iframe on this same app), so every screen on the stage is the real screen. */
export function PhoneFrame({ title, src, presenter, testId }: { title: string; src: string; presenter?: boolean; testId: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold uppercase tracking-wider text-ink-2">{title}</p>
      <div className={cn("w-full overflow-hidden rounded-[36px] border-[10px] border-[#111113] bg-page shadow-xl dark:border-[#2a2a33]", presenter ? "max-w-[430px]" : "max-w-[360px]")}>
        <iframe data-testid={testId} title={title} src={src} className={cn("block w-full border-0", presenter ? "h-[820px]" : "h-[680px]")} />
      </div>
    </div>
  );
}
