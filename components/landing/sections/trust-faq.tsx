import { Landmark, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COPY } from "@/lib/copy";
import { GridField, GridRule } from "./grid-field";
import { TwoTone } from "./two-tone";

const ICONS = [ShieldCheck, Landmark, MessageSquareWarning];

/** Trust cards (#trust) and the FAQ (#faq) as Flighty-style list rows with hairline dividers. */
export function TrustFaq() {
  const trust = COPY.trust;
  const faq = COPY.faq;
  return (
    <>
      <section id="trust" aria-labelledby="trust-title" className="relative isolate scroll-mt-24 bg-page pt-32 sm:pt-40">
        <GridField seed={5} beams={4} className="top-16 h-[560px] [mask-image:radial-gradient(60%_70%_at_82%_42%,#000,transparent)]" />
        <div data-reveal className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{trust.eyebrow}</p>
          <TwoTone id="trust-title" a={trust.title} b={COPY.legal.disclosure} className="mt-3 max-w-3xl" />
          <ul data-stagger className="mt-12 grid gap-3 md:grid-cols-3">
            {trust.cards.map((c, i) => {
              const Icon = ICONS[i];
              return (
                <li key={c.title}>
                  <Reveal delay={i * 0.05} className="flex h-full flex-col">
                    <div data-tilt data-spotlight className="spotlight glow-ring flex flex-1 flex-col rounded-[16px] bg-card p-6">
                      <span data-lift className="grid size-10 place-items-center rounded-[12px] bg-elevated ring-1 ring-hairline [--lift:8px]">
                        <Icon className="size-5 text-ink" aria-hidden />
                      </span>
                      <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em] text-ink">{c.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{c.body}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-ink-2">{COPY.legal.notLender}</p>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-24 bg-page py-24 sm:py-32">
        <GridRule className="top-10 sm:top-14" />
        <div data-reveal className="mx-auto grid max-w-[1180px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{faq.eyebrow}</p>
            <h2 id="faq-title" className="mt-3 text-[clamp(1.9rem,4.2vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">{faq.title}</h2>
          </div>
          <Accordion type="single" collapsible className="border-t border-hairline">
            {faq.items.map((it, i) => (
              <AccordionItem key={it.q} value={`q${i}`} className="rounded-none border-0 border-b border-hairline bg-transparent shadow-none data-[state=open]:shadow-none">
                <AccordionTrigger className="px-0 text-[17px] font-semibold tracking-[-0.01em] text-ink">{it.q}</AccordionTrigger>
                <AccordionContent className="px-0 text-[15.5px] leading-relaxed text-ink-2">{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
