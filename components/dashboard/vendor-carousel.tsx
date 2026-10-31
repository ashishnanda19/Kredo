"use client";

import { BadgeCheck, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { CategoryIcon } from "@/components/shared/category-icon";
import { BRAND } from "@/lib/config";

import { CATEGORY_LABEL, vendors } from "@/lib/mock-data";

export function VendorCarousel() {
  return (
    <section aria-labelledby="vendors-h">
      <h2 id="vendors-h" className="mb-3 text-base font-bold">
        Campus vendors near you
      </h2>
      <ul
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        aria-label="Vendors that accept the app"
      >
        {vendors.map((v) => (
          <motion.li
            key={v.id}
            whileHover={{ y: -3 }}
            className="glass rounded-[24px] w-[220px] shrink-0 snap-start  p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <CategoryIcon category={v.category} />
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[11px] font-bold text-success">
                <BadgeCheck className="size-3.5" aria-hidden /> Accepts {BRAND.name}
              </span>
            </div>
            <h3 className="mt-3 truncate font-bold">{v.name}</h3>
            <p className="text-sm text-muted">{CATEGORY_LABEL[v.category]}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted">
              <MapPin className="size-3.5" aria-hidden /> {v.distance} · {v.hours}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
