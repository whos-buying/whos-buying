"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

// The state page is static; the ZIP lookup adds ?d=05,06 and this picks those cards out.
export function YourDistricts({
  cards,
  statewide,
  stateName,
}: {
  cards: Record<string, ReactNode>;
  statewide: ReactNode[];
  stateName: string;
}) {
  const params = useSearchParams();
  const wanted = (params.get("d") ?? "").split(",").filter((d) => cards[d]);
  if (!wanted.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-3xl uppercase tracking-wide">Your races</h2>
      {statewide}
      {wanted.map((d) => (
        <div key={d}>{cards[d]}</div>
      ))}
      <p className="text-sm text-muted">
        {wanted.length > 1 ? "Your ZIP code crosses more than one district. " : ""}
        We match ZIP codes to districts using 2024 Census maps. Some states, possibly including {stateName},
        redrew their lines for 2026, so{" "}
        <a href="https://www.usa.gov/state-election-office" className="underline" target="_blank" rel="noopener noreferrer">
          check your district with your state
        </a>{" "}
        or look at your sample ballot.
      </p>
    </section>
  );
}
