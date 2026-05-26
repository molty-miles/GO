"use client";

import { useState } from "react";
import { useAccas } from "@/hooks/useAccas";
import { PositionCard } from "@/components/positions/PositionCard";
import { AccaDetail } from "@/components/positions/AccaDetail";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarketGridSkeleton } from "@/components/ui/SkeletonCard";
import { cn } from "@/lib/utils";
import type { AccaPosition } from "@/hooks/useAccas";

const tabs = [
  { key: "OPEN", label: "Live" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
] as const;

export function PositionList() {
  const [activeTab, setActiveTab] = useState<string>("OPEN");
  const [selectedAcca, setSelectedAcca] = useState<AccaPosition | null>(null);
  const { activeAccas, wonAccas, lostAccas, isLoading } = useAccas();

  const positionsMap: Record<string, AccaPosition[]> = {
    OPEN: activeAccas,
    WON: wonAccas,
    LOST: lostAccas,
  };

  const filtered = positionsMap[activeTab] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <MarketGridSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} positions`}
          description={
            activeTab === "OPEN"
              ? "Place your first acca to see it here"
              : "Settled positions will appear here"
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pos) => (
            <PositionCard
              key={pos.id}
              id={pos.id}
              legs={pos.legs.map((l) => ({
                question: l.question,
                venue: l.venue,
                outcome: l.selectedOutcome,
                odds: l.odds,
                state: l.state,
              }))}
              stake={pos.stake}
              projectedPayout={pos.projectedPayout}
              status={pos.status}
              onView={(id) => {
                const found = [...activeAccas, ...wonAccas, ...lostAccas].find((a) => a.id === id);
                if (found) setSelectedAcca(found);
              }}
            />
          ))}
        </div>
      )}

      {selectedAcca && <AccaDetail acca={selectedAcca} onClose={() => setSelectedAcca(null)} />}
    </div>
  );
}
