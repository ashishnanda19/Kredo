"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { GlassInput } from "@/components/glass";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  id: string;
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
  onNotListed?: () => void;
  notListedLabel?: string;
  placeholder?: string;
  noResults: string;
  "aria-describedby"?: string;
  invalid?: boolean;
}

/** Accessible type-ahead (WAI-ARIA combobox with listbox): arrow keys, Enter, Escape. */
export function Combobox({ id, options, value, onSelect, onNotListed, notListedLabel, placeholder, noResults, invalid, ...rest }: ComboboxProps) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useId();
  const ref = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (n ? options.filter((o) => o.toLowerCase().includes(n)) : options).slice(0, 8);
  }, [q, options]);
  const total = matches.length + (onNotListed ? 1 : 0);

  function choose(i: number) {
    if (i < matches.length) {
      onSelect(matches[i]);
      setQ(matches[i]);
    } else onNotListed?.();
    setOpen(false);
  }

  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-ink-2" />
      <GlassInput
        ref={ref}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={list}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${list}-${active}` : undefined}
        aria-describedby={rest["aria-describedby"]}
        autoComplete="off"
        placeholder={placeholder}
        className="pl-12"
        invalid={invalid}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onSelect("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(total - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && open && total > 0) {
            e.preventDefault();
            choose(active);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul id={list} role="listbox" className="glass glass-strong absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-[20px] p-1.5">
          {matches.length === 0 && <li className="px-3 py-3 text-sm text-ink-2">{noResults}</li>}
          {matches.map((o, i) => (
            <li
              key={o}
              id={`${list}-${i}`}
              role="option"
              aria-selected={o === value}
              onPointerDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-sm", i === active && "bg-ink/10")}
            >
              {o}
              {o === value && <Check className="size-4 text-ok-text" aria-hidden />}
            </li>
          ))}
          {onNotListed && (
            <li
              id={`${list}-${matches.length}`}
              role="option"
              aria-selected={false}
              onPointerDown={(e) => {
                e.preventDefault();
                choose(matches.length);
              }}
              onMouseEnter={() => setActive(matches.length)}
              className={cn("min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-bold text-info-text", active === matches.length && "bg-ink/10")}
            >
              {notListedLabel}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
