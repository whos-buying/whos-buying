import Link from "next/link";
import type { Race } from "@/lib/data";
import { lastName, money, partyLabel, raceTitle } from "@/lib/format";
import { namedSpenders } from "@/lib/share";

export function RaceCard({ race, rank, highlight }: { race: Race; rank?: number; highlight?: string }) {
  const top = namedSpenders(race)[0];
  return (
    <Link
      href={`/race/${race.id}`}
      className="block rounded-lg border-2 border-ink bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
    >
      {highlight && (
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-against">{highlight}</p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">
            {rank != null && <span className="mr-1 font-mono text-muted">{rank}.</span>}
            {raceTitle(race)}
          </p>
          <p className="mt-1 truncate text-sm text-muted">
            {race.candidates
              .slice(0, 3)
              .map((c) => `${lastName(c.name)} (${partyLabel(c).charAt(0)})`)
              .join(" vs. ")}
          </p>
        </div>
        {race.outsideTotal > 0 ? (
          <div className="shrink-0 text-right">
            <p className="font-mono text-xl font-semibold">{money(race.outsideTotal)}</p>
            <p className="text-xs text-muted">outside money</p>
          </div>
        ) : (
          <p className="shrink-0 text-right text-xs text-muted">
            No outside
            <br />
            money reported
          </p>
        )}
      </div>
      {top && (
        <p className="mt-2 truncate text-sm">
          <span className="text-muted">Top spender:</span> {top.displayName} · {money(top.total)}
        </p>
      )}
    </Link>
  );
}
