// src/lib/subgraph.ts
// Real subgraph query for GO Market Leaderboard

export interface LeaderboardEntry {
  rank: number;
  address: string;
  volume: string;
  winRate: string;
  accasCreated: number;
}

interface RawEntry {
  address: string;
  totalVolume: string;
  winRate: string;
  accasCreated: string;
}

const LEADERBOARD_QUERY = `
  query GetLeaderboard($first: Int!) {
    leaderboardEntries(first: $first, orderBy: volume, orderDirection: desc) {
      id
      address
      totalVolume
      winRate
      accasCreated
    }
  }
`;

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

  if (!subgraphUrl) {
    console.warn("[Subgraph] NEXT_PUBLIC_SUBGRAPH_URL not set. Using mock data.");
    return getMockLeaderboard();
  }

  try {
    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: LEADERBOARD_QUERY,
        variables: { first: limit },
      }),
      // Next.js 16 caching
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error("[Subgraph] GraphQL errors:", json.errors);
      return getMockLeaderboard();
    }

    const entries = json.data?.leaderboardEntries ?? [];

    return entries.map((entry: RawEntry, index: number) => ({
      rank: index + 1,
      address: formatAddress(entry.address),
      volume: formatVolume(entry.totalVolume),
      winRate: `${(parseFloat(entry.winRate) * 100).toFixed(1)}%`,
      accasCreated: Number(entry.accasCreated),
    }));
  } catch (error) {
    console.error("[Subgraph] Fetch failed:", error);
    return getMockLeaderboard();
  }
}

function formatAddress(address: string): string {
  if (!address) return "0x0000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatVolume(volume: string | number): string {
  const num = Number(volume);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function getMockLeaderboard(): LeaderboardEntry[] {
  return [
    {
      rank: 1,
      address: "0x742d...35Ea",
      volume: "$1,245,890",
      winRate: "78.4%",
      accasCreated: 142,
    },
    { rank: 2, address: "0x9f3a...c7B2", volume: "$892,450", winRate: "71.9%", accasCreated: 98 },
    { rank: 3, address: "0x1b8c...4fD1", volume: "$654,200", winRate: "69.2%", accasCreated: 87 },
    { rank: 4, address: "0x3e2f...a9C4", volume: "$521,780", winRate: "65.8%", accasCreated: 73 },
    { rank: 5, address: "0x8d1a...2bE7", volume: "$487,300", winRate: "64.1%", accasCreated: 65 },
  ];
}
