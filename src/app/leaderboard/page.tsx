"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/subgraph";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const data = await fetchLeaderboard(50);
        setEntries(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top performers on GO Market</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}. Showing fallback data.
          </div>
        )}

        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium">Volume</th>
                <th className="px-6 py-4 font-medium">Win Rate</th>
                <th className="px-6 py-4 font-medium">Accas Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No leaderboard data available yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      #{entry.rank}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{entry.address}</td>
                    <td className="px-6 py-4 font-medium">{entry.volume}</td>
                    <td className="px-6 py-4 text-green-500">{entry.winRate}</td>
                    <td className="px-6 py-4 text-muted-foreground">{entry.accasCreated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Data sourced from GO Market subgraph • Updated every 5 minutes
        </p>
      </div>
    </div>
  );
}
