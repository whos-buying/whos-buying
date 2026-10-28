import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/ShareButton";
import { VotePlan } from "@/components/VotePlan";
import { allRaces, getCommittee, getRace, snapshot, STATE_NAMES, type Candidate, type Donor, type Spender } from "@/lib/data";
import { shareLine } from "@/lib/share";
import {
  fecCandidateUrl,
  fecCommitteeUrl,
  fecRaceOutsideUrl,
  lastName,
  longDate,
  money,
  moneyExact,
  partyLabel,
  pct,
  personName,
  raceTitle,
  titleCase,
} from "@/lib/format";

export function generateStaticParams() {
  return allRaces().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/race/[id]">) {
  const { id } = await params;
  const race = getRace(id);
  if (!race) return {};
  return {
    title: `Who's buying the ${raceTitle(race)} race?`,
    description: shareLine(race).replace(/:$/, "."),
  };
}

export default function RacePage({ params }: PageProps<"/race/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-muted">Loading the receipts…</div>}>
      <RaceContent params={params} />
    </Suspense>
  );
}

async function RaceContent({ params }: { params: PageProps<"/race/[id]">["params"] }) {
  const { id } = await params;
  const race = getRace(id);
  if (!race) notFound();

  const maxOutside = Math.max(1, ...race.candidates.map((c) => Math.max(c.outsideFor, c.outsideAgainst)));
  const nameOf = (candidateId: string) => {
    const c = race.candidates.find((x) => x.id === candidateId);
    return c ? lastName(c.name) : "another candidate";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <section>
        <Link href={`/state/${race.state}`} className="text-sm text-muted underline">
          {STATE_NAMES[race.state] ?? race.state}
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-against">Who&rsquo;s buying</p>
        <h1 className="font-display text-4xl uppercase leading-none sm:text-6xl">{raceTitle(race)}</h1>
        {race.outsideTotal > 0 ? (
          <p className="mt-4 text-lg">
            <span className="mark font-mono text-3xl font-semibold sm:text-4xl">{money(race.outsideTotal)}</span>
            <br />
            in reported outside spending from {race.spenderCount}{" "}
            {race.spenderCount === 1 ? "group" : "groups"}: money the candidates don&rsquo;t control and
            didn&rsquo;t raise.
          </p>
        ) : (
          <p className="mt-4 text-lg">
            No outside spending reported in this race yet. Here&rsquo;s where the campaigns&rsquo; own money comes from.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl uppercase tracking-wide">The candidates</h2>
        {race.candidates.map((c) => (
          <CandidateCard key={c.id} c={c} maxOutside={maxOutside} />
        ))}
      </section>

      {race.spenders.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl uppercase tracking-wide">The buyers</h2>
          <p className="text-muted">
            The biggest outside spenders in this race, and the largest checks they&rsquo;ve received this cycle.
          </p>
          {race.spenders.map((s) => (
            <SpenderCard key={s.committeeId} s={s} nameOf={nameOf} />
          ))}
          {race.spenderCount > race.spenders.length && (
            <p className="text-sm text-muted">
              Plus {race.spenderCount - race.spenders.length} smaller spenders.{" "}
              <a href={fecRaceOutsideUrl(race)} className="underline" target="_blank" rel="noopener noreferrer">
                See every filing at the FEC
              </a>
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <ShareButton text={shareLine(race)} path={`/race/${race.id}`} />
        <p className="text-center text-sm text-muted">
          The link shows a receipt card in group chats and on social media.
        </p>
      </section>

      <VotePlan electionDate={snapshot.electionDate} />

      <section className="rounded-lg border border-line p-4 text-sm text-muted">
        <h2 className="mb-1 font-semibold text-ink">What this doesn&rsquo;t show</h2>
        <p>
          These are independent expenditures reported to the FEC, through filings received around{" "}
          {longDate(snapshot.generatedAt)}. TV and online &ldquo;issue ads&rdquo; that avoid saying &ldquo;vote for&rdquo;
          or &ldquo;vote against,&rdquo; and money routed through nonprofits that don&rsquo;t name their donors, often
          never show up here. The real total is higher.{" "}
          <Link href="/about" className="underline">How we got these numbers</Link>
        </p>
      </section>
    </div>
  );
}

function CandidateCard({ c, maxOutside }: { c: Candidate; maxOutside: number }) {
  const status = c.incumbent ? "Incumbent" : c.openSeat ? "Open seat" : "Challenger";
  return (
    <article className="rounded-lg border-2 border-ink bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-xl font-bold">{personName(c.name)}</h3>
        <p className="text-sm text-muted">
          {partyLabel(c)} · {status}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Campaign raised" value={money(c.receipts)} />
        <Stat label="From PACs" value={`${pct(c.fromPacs, c.receipts)}%`} sub={money(c.fromPacs)} />
        <Stat label="From $200+ donors" value={`${pct(c.fromBigDonors, c.receipts)}%`} sub={money(c.fromBigDonors)} />
      </dl>

      {(c.outsideFor > 0 || c.outsideAgainst > 0) && (
        <div className="mt-4 space-y-2">
          <Bar label="Outside money to help" amount={c.outsideFor} max={maxOutside} tone="for" />
          <Bar label="Outside money to attack" amount={c.outsideAgainst} max={maxOutside} tone="against" />
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        Campaign totals through {longDate(c.coverageEnd)}.{" "}
        <a href={fecCandidateUrl(c.id)} className="underline" target="_blank" rel="noopener noreferrer">
          FEC record
        </a>
      </p>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md bg-paper px-2 py-2">
      <dd className="font-mono text-lg font-semibold">{value}</dd>
      {sub && <dd className="font-mono text-xs text-muted">{sub}</dd>}
      <dt className="text-[11px] uppercase leading-tight tracking-wide text-muted">{label}</dt>
    </div>
  );
}

function Bar({ label, amount, max, tone }: { label: string; amount: number; max: number; tone: "for" | "against" }) {
  const width = amount > 0 ? Math.max(2, (amount / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className={tone === "for" ? "font-semibold text-for" : "font-semibold text-against"}>{label}</span>
        <span className="font-mono">{money(amount)}</span>
      </div>
      <div className="mt-1 h-2.5 rounded-full bg-paper">
        <div
          className={tone === "for" ? "h-full rounded-full bg-for" : "h-full rounded-full bg-against"}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SpenderCard({ s, nameOf }: { s: Spender; nameOf: (id: string) => string }) {
  const committee = getCommittee(s.committeeId);
  const name = titleCase(committee?.name ?? s.name);
  return (
    <article className="overflow-hidden rounded-lg border-2 border-ink bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold leading-tight">{name}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">
              {committee?.kind ?? "Outside group"}
              {committee?.connectedOrg && ` · tied to ${titleCase(committee.connectedOrg)}`}
            </p>
          </div>
          <p className="shrink-0 font-mono text-lg font-semibold">{money(s.total)}</p>
        </div>
        <ul className="mt-2 space-y-0.5 text-sm">
          {s.targets.map((t) => (
            <li key={t.candidateId + t.stance}>
              <span className={t.stance === "support" ? "font-semibold text-for" : "font-semibold text-against"}>
                {t.stance === "support" ? "For" : "Against"}
              </span>{" "}
              {nameOf(t.candidateId)}: <span className="font-mono">{money(t.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="receipt-edge rotate-180 bg-paper" aria-hidden />
      <div className="bg-paper px-4 pb-4 pt-1">
        <Funders committee={committee} committeeId={s.committeeId} />
      </div>
    </article>
  );
}

function Funders({ committee, committeeId }: { committee: ReturnType<typeof getCommittee>; committeeId: string }) {
  const fecLink = /^C\d{8}$/.test(committeeId) ? (
    <a href={fecCommitteeUrl(committeeId)} className="underline" target="_blank" rel="noopener noreferrer">
      FEC filings
    </a>
  ) : null;

  if (committee?.donorsHidden) {
    return (
      <p className="text-sm">
        <strong className="text-against">Donors hidden.</strong> This group files as a nonprofit or independent
        group, so it doesn&rsquo;t have to tell voters who funds it. {fecLink}
      </p>
    );
  }
  if (committeeId === "OTHER") {
    return <p className="text-sm text-muted">Individuals and small groups that file without a committee.</p>;
  }
  if (!committee?.topDonors) {
    return <p className="text-sm text-muted">See who funds this group: {fecLink ?? "not available"}</p>;
  }
  if (!committee.topDonors.length) {
    return <p className="text-sm text-muted">No itemized contributions reported for 2025–26. {fecLink}</p>;
  }
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Largest funders, 2025–26</p>
      <ul className="mt-1 divide-y divide-dashed divide-line font-mono text-sm">
        {committee.topDonors.slice(0, 5).map((d) => (
          <DonorRow key={d.name} d={d} />
        ))}
      </ul>
      {committee.topDonors.slice(0, 5).some((d) => d.entity === "Organization") && (
        <p className="mt-2 text-xs text-muted">
          * Companies and nonprofits that give to super PACs don&rsquo;t have to say where their money came from.
        </p>
      )}
      <p className="mt-1 text-xs text-muted">Full list: {fecLink}</p>
    </div>
  );
}

function DonorRow({ d }: { d: Donor }) {
  const who = d.entity === "Individual" && d.name.includes(",") ? personName(d.name) : titleCase(d.name);
  const detail =
    d.entity === "Individual"
      ? d.employer && !/^(N\/A|NONE|SELF|SELF-EMPLOYED|RETIRED|INFORMATION REQUESTED.*)$/i.test(d.employer)
        ? titleCase(d.employer)
        : null
      : d.entity;
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="truncate">{who}</p>
        {detail && <p className="truncate text-xs text-muted">{detail}{d.entity === "Organization" && " *"}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold" title={moneyExact(d.amount)}>{money(d.amount)}</p>
        {d.filingUrl && (
          <a href={d.filingUrl} className="text-xs underline" target="_blank" rel="noopener noreferrer">
            receipt
          </a>
        )}
      </div>
    </li>
  );
}
