"use client";

interface Pick {
  title: string;
  description: string;
  conviction: string;
}

const MOCK_PICKS: Pick[] = [
  {
    title: "Election Special",
    description: "Trump wins swing states + GOP holds Senate",
    conviction: "High conviction",
  },
  {
    title: "Crypto Quadfecta",
    description: "BTC ATH + ETH merge success + SOL outage-free quarter + DOT parachains live",
    conviction: "Medium conviction",
  },
  {
    title: "Fed Pivot Play",
    description: "Fed cuts 50bp in June + inflation below 3% + unemployment > 4.5%",
    conviction: "High conviction",
  },
];

export function EditorialPicks() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">Editorial Picks</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PICKS.map((pick, i) => (
          <div
            key={i}
            className="rounded-xl border border-primary/20 bg-primary/10 p-4 transition-colors hover:border-primary/40"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-md bg-primary/30 px-2 py-0.5 text-xs font-medium text-primary">
                Editor&apos;s Pick
              </span>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">{pick.title}</h3>
            <p className="mb-2 text-sm text-muted-foreground">{pick.description}</p>
            <span className="text-xs text-primary">{pick.conviction}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
