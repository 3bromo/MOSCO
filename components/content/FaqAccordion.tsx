"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-silver-200 border-y border-silver-200">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={i}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                className="group flex w-full items-start justify-between gap-6 py-6 text-start"
              >
                <span
                  className={cn(
                    "text-[16px] font-medium leading-snug transition-colors sm:text-[17px]",
                    isOpen ? "text-ice-950" : "text-ice-800 group-hover:text-ice-950",
                  )}
                >
                  {item.q}
                </span>
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                    isOpen
                      ? "rotate-45 bg-ice-900 text-white"
                      : "bg-ice-100 text-ice-700 group-hover:bg-ice-200",
                  )}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </button>
            </h3>

            <div
              id={`faq-${i}`}
              role="region"
              className={cn(
                "grid transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-7 pe-12 text-[15px] leading-[1.75] text-ice-700">{item.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
