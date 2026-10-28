import { longDate } from "@/lib/format";
import { snapshot } from "@/lib/data";

export const metadata = { title: "How it works" };

const SOURCES = [
  {
    what: "Outside spending",
    how: "Independent expenditures for the 2025–26 cycle reported to the FEC, including the 24- and 48-hour reports groups must file in the final weeks. Added up per candidate, split into money to help and money to attack.",
    href: "https://www.fec.gov/data/independent-expenditures/",
  },
  {
    what: "Who funds the spenders",
    how: "The largest contributions each outside group reported for 2025–26, combined by donor. Every row links to the scanned filing it came from.",
    href: "https://www.fec.gov/data/receipts/",
  },
  {
    what: "Candidates on the ballot",
    how: "Candidates whose campaign filed a pre-general-election report (covering Oct. 1–14). Some campaigns that lost a primary file one anyway, so when one party has two such candidates in a race, we keep the one actually raising and spending in that period. (In California, Washington, Alaska and Louisiana, two candidates from the same party can both be on the ballot, so we keep everyone.) Candidates who raised under $5,000 don't have to file, so they may be missing.",
    href: "https://www.fec.gov/data/candidates/",
  },
  {
    what: "Campaign money",
    how: "Each campaign's receipts for 2025–26 (earlier campaigns by the same candidate are left out), money from PACs, and money from individuals giving over $200 (the FEC only names donors above $200).",
    href: "https://www.fec.gov/data/candidates/",
  },
  {
    what: "ZIP code to district",
    how: "Census Bureau relationship file for 2024 congressional districts. Several states redrew lines for 2026, so treat the match as a starting point.",
    href: "https://www.census.gov/geographies/reference-files/time-series/geo/relationship-files.html",
  },
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="font-display text-5xl uppercase leading-none">Receipts, not opinions</h1>
        <p className="text-lg">
          Every number on this site comes from public filings with the Federal Election Commission. We add them up,
          sort them, and link to the source. We don&rsquo;t score candidates, guess motives, or use AI to fill gaps.
          The same rules apply to every party.
        </p>
        <p className="text-muted">Data last pulled {longDate(snapshot.generatedAt)}.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">Where the numbers come from</h2>
        <dl className="space-y-4">
          {SOURCES.map((s) => (
            <div key={s.what} className="rounded-lg border border-line bg-card p-4">
              <dt className="font-semibold">{s.what}</dt>
              <dd className="mt-1 text-sm text-muted">
                {s.how}{" "}
                <a href={s.href} className="underline" target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">What you can&rsquo;t see</h2>
        <p>
          Reported outside spending is only part of the money. Ads that talk about a candidate without saying
          &ldquo;vote for&rdquo; or &ldquo;vote against&rdquo; often never get reported. Nonprofits known as
          &ldquo;dark money&rdquo; groups can spend without naming their donors, and they can give to super PACs, which
          then list the nonprofit, not the people behind it. When you see &ldquo;donors hidden&rdquo; or an
          organization as a top funder, that&rsquo;s where the trail goes dark.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">Spot an error?</h2>
        <p>
          Check the linked FEC filing first: groups sometimes amend reports. If our number doesn&rsquo;t match the
          filing, it&rsquo;s our mistake and we want to fix it.
        </p>
      </section>
    </div>
  );
}
