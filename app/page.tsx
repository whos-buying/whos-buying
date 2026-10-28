import Link from "next/link";
import { RaceCard } from "@/components/RaceCard";
import { ZipForm } from "@/components/ZipForm";
import { Countdown } from "@/components/Countdown";
import { biggestSpenders, mostBoughtRaces, nationalOutsideTotal, snapshot, STATE_NAMES, statesWithRaces } from "@/lib/data";
import { money, titleCase } from "@/lib/format";

export default function Home() {
  const total = nationalOutsideTotal();
  const races = mostBoughtRaces(10);
  const spenders = biggestSpenders(8);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <section className="space-y-5">
        <p className="inline-block rounded bg-ink px-2 py-1 text-xs font-bold uppercase tracking-widest text-paper">
          <Countdown electionDate={snapshot.electionDate} />
        </p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-7xl">
          Who&rsquo;s buying <span className="mark">your</span> election?
        </h1>
        <p className="text-lg sm:text-xl">
          Super PACs and outside groups have reported spending{" "}
          <strong className="font-mono">{money(total)}</strong> to sway 2026 races for Congress.
          Most of it comes from a small number of very rich donors and organizations.
          See who&rsquo;s spending on your ballot, and who&rsquo;s paying them.
        </p>
        <ZipForm />
        <details className="text-sm">
          <summary className="cursor-pointer text-muted underline">Or pick your state</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {statesWithRaces().map((st) => (
              <Link
                key={st}
                href={`/state/${st}`}
                title={STATE_NAMES[st]}
                className="rounded border border-line bg-card px-2 py-1 font-mono hover:border-ink"
              >
                {st}
              </Link>
            ))}
          </div>
        </details>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">The most-bought races</h2>
        <p className="text-muted">Ranked by reported outside spending, for and against the candidates.</p>
        <div className="space-y-3">
          {races.map((r, i) => (
            <RaceCard key={r.id} race={r} rank={i + 1} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">The biggest buyers</h2>
        <p className="text-muted">Outside groups spending the most across all 2026 races.</p>
        <ol className="divide-y divide-line rounded-lg border-2 border-ink bg-card">
          {spenders.map((c, i) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  <span className="mr-1 font-mono text-muted">{i + 1}.</span>
                  {titleCase(c.name)}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {c.kind}
                  {c.donorsHidden && " · donors hidden"}
                </p>
              </div>
              <p className="shrink-0 font-mono font-semibold">{money(c.totalAllRaces)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
