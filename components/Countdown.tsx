"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

function daysUntil(electionDate: string) {
  const [y, m, d] = electionDate.split("-").map(Number);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

// Read on the client so the static page doesn't freeze the day count at build time.
export function Countdown({ electionDate }: { electionDate: string }) {
  const days = useSyncExternalStore(noSubscribe, () => daysUntil(electionDate), () => null);

  if (days == null) return <span>Election Day is Tuesday, Nov. 3</span>;
  if (days > 1) return <span>{days} days until Election Day (Tue, Nov. 3)</span>;
  if (days === 1) return <span>Election Day is tomorrow</span>;
  if (days === 0) return <span>Today is Election Day. Polls are open</span>;
  return <span>Election Day was Nov. 3</span>;
}
