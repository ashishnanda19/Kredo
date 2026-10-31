import { Coffee, Printer, PenLine, Shirt, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  canteen: UtensilsCrossed,
  cafe: Coffee,
  stationery: PenLine,
  photocopy: Printer,
  laundry: Shirt,
};

/** Fixed slot per category (colour follows the entity, never its rank). Palette validated with the dataviz script. */
export const CATEGORY_COLOR: Record<Category, string> = {
  canteen: "var(--cat-1)",
  cafe: "var(--cat-2)",
  stationery: "var(--cat-3)",
  photocopy: "var(--cat-4)",
  laundry: "var(--cat-5)",
};

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-ink", className)}>
      <Icon className="size-5" />
    </span>
  );
}
