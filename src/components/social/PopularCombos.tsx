"use client";

interface Combo {
  legs: string[];
  multiplier: string;
  venueCount: number;
  popularity: number;
}

const MOCK_COMBOS: Combo[] = [
  {
    legs: ["BTC > $100k", "ETH > $5k", "SOL > $200"],
    multiplier: "12.5x",
    venueCount: 2,
    popularity: 98,
  },
  {
    legs: ["Fed cuts rates", "US jobs > 200k", "S&P > 5500"],
    multiplier: "8.3x",
    venueCount: 2,
    popularity: 85,
  },
  { legs: ["Man City win PL", "Arsenal top 4"], multiplier: "4.2x", venueCount: 1, popularity: 72 },
];

export function PopularCombos() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-white">Popular Combos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_COMBOS.map((combo, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-indigo-600/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                {combo.multiplier}
              </span>
              <span className="text-xs text-zinc-500">
                {combo.venueCount} venue{combo.venueCount > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <svg className="h-3 w-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-zinc-500">{combo.popularity}%</span>
              </div>
            </div>
            <div className="space-y-1">
              {combo.legs.map((leg, j) => (
                <p key={j} className="text-sm text-zinc-300">
                  {j + 1}. {leg}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
