"use client";

import { Reveal } from "@/components/shared/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COPY } from "@/lib/copy";
import { SectionHeading } from "./section-heading";

export function Faq() {
  const f = COPY.faq;
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow={f.eyebrow} lines={["Questions?", "Sorted."]} accent={1} align="center" />

        <Reveal delay={0.1} className="mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {f.items.map((it, i) => (
              <AccordionItem key={it.q} value={`q${i}`}>
                <AccordionTrigger>{it.q}</AccordionTrigger>
                <AccordionContent>{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
