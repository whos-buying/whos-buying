import { Countdown } from "./Countdown";

const STEPS = [
  {
    label: "Check you're registered",
    note: "Takes 30 seconds. Many states let you register at the polls.",
    href: "https://www.vote.org/am-i-registered-to-vote/",
  },
  {
    label: "Find your polling place",
    note: "Or your early-voting site and hours.",
    href: "https://www.vote.org/polling-place-locator/",
  },
  {
    label: "Voting by mail?",
    note: "Check your state's return deadline. Some need it by Election Day.",
    href: "https://www.vote.org/absentee-ballot-deadlines/",
  },
  {
    label: "Your state's official election office",
    note: "The final word on rules, dates and ID.",
    href: "https://www.usa.gov/state-election-office",
  },
];

export function VotePlan({ electionDate }: { electionDate: string }) {
  return (
    <section className="rounded-lg border-2 border-ink bg-card p-5">
      <h2 className="font-display text-2xl uppercase tracking-wide">They spend. You decide.</h2>
      <p className="mt-1 font-semibold">
        <Countdown electionDate={electionDate} />
      </p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.href} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-paper">
              {i + 1}
            </span>
            <div>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                {s.label}
              </a>
              <p className="text-sm text-muted">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">
        Then bring three friends. Outside groups buy ads; they can&rsquo;t buy turnout in your group chat.
      </p>
    </section>
  );
}
