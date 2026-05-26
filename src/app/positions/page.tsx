"use client";

import { PositionList } from "@/components/positions/PositionList";

export default function PositionsPage() {
  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Positions</h1>
        <p className="text-sm text-muted-foreground">
          Track your active and settled accumulator tickets
        </p>
      </div>
      <PositionList />
    </div>
  );
}
