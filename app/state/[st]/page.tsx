import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RaceCard } from "@/components/RaceCard";
import { YourDistricts } from "@/components/YourDistricts";
import { racesInState, STATE_NAMES, statesWithRaces } from "@/lib/data";
import { money } from "@/lib/format";

export function generateStaticParams() {
  return statesWithRaces().map((st) => ({ st }));
}

export async function generateMetadata({ params }: PageProps<"/state/[st]">) {
  const { st } = await params;
  const name = STATE_NAMES[st.toUpperCase()] ?? st;
  return {
    title: `Who's buying ${name}'s elections?`,
    description: `Outside money in ${name}'s 2026 races for Congress, and who's behind it.`,
  };
}

export default function StatePage({ params }: PageProps<"/state/[st]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-muted">Loading races…</div>}>
      <StateContent params={params} />
    </Suspense>
  );
}

async function StateContent({ params }: { params: PageProps<"/state/[st]">["params"] }) {
  const { st } = await params;
  const state = st.toUpperCase();
  const name = STATE_NAMES[state];
  if (!name) notFound();
  const { senate, house } = racesInState(state);
  if (!senate.length && !house.length) notFound();

  const total = [...senate, ...house].reduce((s, r) => s + r.outsideTotal, 0);
  const cards = Object.fromEntries(
    house.map((r) => [r.district!, <RaceCard key={r.id} race={r} highlight="Your House race (likely)" />]),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <section>
        <Link href="/" className="text-sm text-muted underline">All states</Link>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none">{name}</h1>
        <p className="mt-3 text-lg">
          <strong className="font-mono">{money(total)}</strong> in reported outside spending on {name}&rsquo;s
          2026 races for Congress.
        </p>
      </section>

      <Suspense fallback={null}>
        <YourDistricts
          cards={cards}
          statewide={senate.map((r) => (
            <RaceCard key={r.id} race={r} highlight="Your Senate race" />
          ))}
          stateName={name}
        />
      </Suspense>

      {senate.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl uppercase tracking-wide">U.S. Senate</h2>
          {senate.map((r) => (
            <RaceCard key={r.id} race={r} highlight="Statewide: on every ballot" />
          ))}
        </section>
      )}

      {house.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl uppercase tracking-wide">U.S. House</h2>
          {house.map((r) => (
            <RaceCard key={r.id} race={r} />
          ))}
        </section>
      )}
    </div>
  );
}
