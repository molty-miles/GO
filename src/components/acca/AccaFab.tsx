"use client";

import { useState } from "react";
import { AccaSlip } from "@/components/acca/AccaSlip";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";

export function AccaFab() {
  const [open, setOpen] = useState(false);
  const { legCount } = useAccaBuilderContext();

  return (
    <>
      {/* Slide-up / sidebar panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-20 z-50 mx-3 max-h-[65vh] overflow-auto rounded-t-2xl border border-border bg-background p-4 shadow-2xl md:bottom-auto md:right-4 md:top-24 md:mx-0 md:w-80 md:max-h-[80vh] md:rounded-2xl">
            <AccaSlip onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 md:bottom-8"
        title={open ? "Close parlay slip" : "Open parlay slip"}
      >
        {legCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            {legCount}
          </span>
        )}
        {open ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </>
  );
}
