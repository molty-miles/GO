"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "1-introduction", label: "1. Introduction" },
  { id: "2-the-problem-go-market-solves", label: "2. The Problem" },
  { id: "3-how-go-market-works-the-big-picture", label: "3. How It Works" },
  { id: "4-protocol-participants", label: "4. Participants" },
  { id: "5-the-accumulator-acca-mechanic", label: "5. Acca Mechanic" },
  { id: "6-the-go-liquidity-pool", label: "6. Liquidity Pool" },
  { id: "7-pricing-the-overround-engine", label: "7. Pricing" },
  { id: "8-real-execution-the-hedge-engine", label: "8. Hedge Engine" },
  { id: "9-venue-integrations", label: "9. Venues" },
  { id: "10-settlement-oracle-layer", label: "10. Settlement" },
  { id: "11-non-custodial-vault-architecture", label: "11. Vault" },
  { id: "12-smart-contract-architecture", label: "12. Contracts" },
  { id: "13-fee-structure-revenue-distribution", label: "13. Fees" },
  { id: "14-risk-management", label: "14. Risk" },
  { id: "15-user-guide", label: "15. User Guide" },
  { id: "16-liquidity-provider-guide", label: "16. LP Guide" },
  { id: "17-developer-guide", label: "17. Dev Guide" },
  { id: "18-glossary", label: "18. Glossary" },
  { id: "19-faq", label: "19. FAQ" },
];

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
          aria-label="Open documentation menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Docs</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-200 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="overflow-y-auto p-3 space-y-0.5" style={{ height: "calc(100% - 57px)" }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-h-screen flex-1 min-w-0 overflow-x-hidden pt-14 md:pt-0">{children}</div>
    </div>
  );
}
