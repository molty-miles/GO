"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ExternalLink } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";

export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Open menu"
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-background shadow-lg z-50 py-1">
            <Link
              href="/doc"
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={closeMenu}
            >
              <ExternalLink className="h-4 w-4" />
              Docs
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={closeMenu}
            >
              Leaderboard
            </Link>

            <button
              onClick={() => {
                closeMenu();
                setFeedbackOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-accent hover:text-accent-foreground"
            >
              Help
            </button>
          </div>
        )}
      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
