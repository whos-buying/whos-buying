// Pulls 2026 general-election money data from the FEC API into data/snapshot.json.
//
//   FEC_API_KEY=... node scripts/ingest.mjs
//
// The key is a free api.data.gov key. The FEC allows ~60 requests/minute, so
// requests are paced at one per second; a full run takes several minutes.
//
// Everything written here is straight from FEC records. Nothing is inferred
// beyond sums and sorting, and every record keeps a link back to its source.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.open.fec.gov/v1';
const CYCLE = 2026;
// Pre-general reports cover through Oct 14. Candidates still on the ballot
// file one; candidates who lost a primary stop at the Sept 30 quarterly.
const GENERAL_COVERAGE_CUTOFF = '2026-10-01';
// Spenders below this (across all races) don't get their donors looked up.
const DONOR_LOOKUP_MIN = 100_000;
const SPENDERS_PER_RACE = 8;
const DONOR_MAX_AGE_MS = process.argv.includes('--fresh') ? 0 : 12 * 3600_000;

function loadPreviousCommittees() {
  try {
    const prev = JSON.parse(readFileSync(join(ROOT, 'data', 'snapshot.json'), 'utf8'));
    // Older snapshots have no per-committee timestamp; use the snapshot's own.
    for (const c of Object.values(prev.committees ?? {})) c.donorsFetchedAt ??= prev.generatedAt;
    return prev.committees ?? {};
  } catch {
    return {};
  }
}

function loadKey() {
  if (process.env.FEC_API_KEY) return process.env.FEC_API_KEY.trim();
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
    const m = env.match(/^FEC_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^"|"$/g, '');
  } catch {}
  throw new Error('Set FEC_API_KEY (env var or .env.local).');
}

const KEY = loadKey();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
let calls = 0;

async function fec(path, params = {}, { retries = 6 } = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) {
    for (const item of Array.isArray(v) ? v : [v]) url.searchParams.append(k, String(item));
  }
  url.searchParams.set('api_key', KEY);

  for (let attempt = 0; attempt < retries; attempt++) {
    const wait = lastCall + 1050 - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    calls++;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries - 1) await sleep(15_000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${path}: ${(await res.text()).slice(0, 200)}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(5_000 * (attempt + 1));
    }
  }
  throw new Error(`Gave up on ${path}`);
}

async function fecAllPages(path, params, maxPages = 200) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const body = await fec(path, { ...params, per_page: 100, page });
    out.push(...body.results);
    if (page >= (body.pagination?.pages ?? 1)) break;
  }
  return out;
}

// The raw e-filing feed has the odd record that makes the FEC server return a
// 500 for any page containing it. Re-fetch a failing page in slices of 10 and
// drop only the slice that still fails.
async function efilePagesSkippingBadRecords(path, params) {
  const out = [];
  let skipped = 0;
  for (let page = 1, pages = 1; page <= pages; page++) {
    try {
      const body = await fec(path, { ...params, per_page: 100, page }, { retries: 2 });
      out.push(...body.results);
      pages = body.pagination?.pages ?? 1;
    } catch {
      for (let small = (page - 1) * 10 + 1; small <= page * 10; small++) {
        try {
          out.push(...(await fec(path, { ...params, per_page: 10, page: small }, { retries: 2 })).results);
        } catch {
          skipped += 10;
        }
      }
    }
  }
  if (skipped) console.warn(`${path}: skipped ${skipped} records the FEC server couldn't return`);
  return out;
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const num = (v) => (v == null || v === '' ? 0 : Number(v)) || 0;
const log = (...a) => console.log(`[${calls} calls]`, ...a);

function raceId(office, state, district) {
  return office === 'S' ? `S-${state}` : `H-${state}-${String(district).padStart(2, '0')}`;
}

// --- 1. Candidates on the November ballot -----------------------------------

// Campaigns still in the general election file a pre-general ("12G") report.
// A candidate's own latest-report field isn't enough: a side committee closing
// shows up as a "termination" even while the main campaign keeps filing.
// Processed reports lag by days, so also scan the raw e-filing feed, which is
// immediate but ignores the report_type filter.
async function loadPreGeneralFilers() {
  const processed = await fecAllPages('/reports/house-senate/', { cycle: CYCLE, report_type: '12G' });
  // Pre-general reports are due Oct 22 and cover through Oct 14.
  const raw = await efilePagesSkippingBadRecords('/efile/reports/house-senate/', { min_receipt_date: `${CYCLE}-10-15` });
  // committee -> money in and out during the Oct 1-14 pre-general period
  const activity = new Map();
  for (const r of [...processed, ...raw.filter((x) => x.report_type === '12G')]) {
    const amount = num(r.total_receipts_period) + num(r.total_disbursements_period);
    activity.set(r.committee_id, Math.max(activity.get(r.committee_id) ?? 0, amount));
  }
  log(`${activity.size} committees filed a pre-general report`);
  return activity;
}

// States where two candidates from one party can both be on the November
// ballot (top-two / top-four primaries, and Louisiana's 2026 party primaries).
const MULTI_SAME_PARTY_STATES = new Set(['CA', 'WA', 'AK', 'LA']);

// Some committees file a pre-general report even though their candidate lost
// the primary or retired. Within one party in one race, the nominee is the
// campaign actually raising and spending in the pre-general period.
function keepNominees(cands, activityOf) {
  const kept = [];
  const dropped = [];
  const byRace = new Map();
  for (const c of cands) {
    const key = `${c.office}-${c.state}-${c.district ?? ''}`;
    byRace.set(key, [...(byRace.get(key) ?? []), c]);
  }
  for (const group of byRace.values()) {
    const byParty = new Map();
    for (const c of group) {
      const multi = MULTI_SAME_PARTY_STATES.has(c.state) || !['DEM', 'REP'].includes(c.party);
      const key = multi ? c.id : c.party;
      byParty.set(key, [...(byParty.get(key) ?? []), c]);
    }
    for (const list of byParty.values()) {
      list.sort((a, b) => activityOf(b) - activityOf(a));
      kept.push(list[0]);
      dropped.push(...list.slice(1));
    }
  }
  for (const c of dropped) {
    log(`dropped ${c.name} (${c.party}, ${c.state}${c.district ? '-' + c.district : ''}): less pre-general activity than their party's nominee`);
  }
  return kept;
}

async function loadPrincipalCommittees(candidateIds) {
  const out = new Map();
  for (const ids of chunk(candidateIds, 50)) {
    const rows = await fecAllPages('/candidates/search/', { candidate_id: ids });
    for (const r of rows) out.set(r.candidate_id, (r.principal_committees ?? []).map((c) => c.committee_id));
  }
  return out;
}

async function loadCandidates() {
  const all = [];
  for (const office of ['S', 'H']) {
    // Two-year (2025-26) totals. Full-term Senate totals span six years and
    // would fold in a candidate's earlier campaigns.
    const rows = await fecAllPages('/candidates/totals/', {
      election_year: CYCLE,
      office,
      election_full: false,
      has_raised_funds: true,
      sort: '-receipts',
    });
    log(`${office}: ${rows.length} candidates with money`);
    all.push(...rows);
  }
  const recent = all.filter((c) => (c.coverage_end_date ?? '') >= GENERAL_COVERAGE_CUTOFF);
  const activity = await loadPreGeneralFilers();
  const committees = await loadPrincipalCommittees(recent.map((c) => c.candidate_id));
  // Pre-general filer, attributed to one candidate even if a committee is
  // linked to duplicate candidate records.
  const seenCommittee = new Set();
  const filed = [];
  for (const c of recent.sort((a, b) => num(b.receipts) - num(a.receipts))) {
    const ids = (committees.get(c.candidate_id) ?? []).filter((id) => activity.has(id));
    if (!ids.length || ids.some((id) => seenCommittee.has(id))) continue;
    ids.forEach((id) => seenCommittee.add(id));
    filed.push({ ...c, periodActivity: Math.max(...ids.map((id) => activity.get(id))) });
  }
  log(`${filed.length} of ${recent.length} recent filers filed a pre-general report`);
  const onBallot = keepNominees(
    filed.map((c) => ({ ...c, id: c.candidate_id, district: c.office === 'H' ? c.district : null })),
    (c) => c.periodActivity,
  );
  log(`${onBallot.length} general-election candidates after removing primary losers and duplicates`);
  return onBallot
    .map((c) => ({
      id: c.candidate_id,
      name: c.name,
      party: c.party ?? '',
      partyFull: c.party_full ?? '',
      office: c.office,
      state: c.state,
      district: c.office === 'H' ? String(c.district ?? '00').padStart(2, '0') : null,
      incumbent: c.incumbent_challenge === 'I',
      openSeat: c.incumbent_challenge === 'O',
      receipts: num(c.receipts),
      fromBigDonors: num(c.individual_itemized_contributions),
      fromPacs: num(c.other_political_committee_contributions),
      cashOnHand: num(c.cash_on_hand_end_period),
      coverageEnd: c.coverage_end_date,
    }));
}

// --- 2. Outside spending (independent expenditures) -------------------------

async function loadOutsideSpending(candidateIds) {
  const rows = [];
  for (const ids of chunk(candidateIds, 40)) {
    rows.push(...(await fecAllPages('/schedules/schedule_e/by_candidate/', {
      cycle: CYCLE,
      // Defaults to true, which for Senate candidates means the whole six-year
      // term (2021-26): a candidate who also ran in 2024, like Mike Rogers,
      // would carry that race's spending into 2026. Rows still say cycle 2026.
      election_full: false,
      candidate_id: ids,
      sort: '-total',
    })));
    log(`outside spending rows: ${rows.length}`);
  }
  return rows
    .filter((r) => num(r.total) > 0)
    .map((r) => ({
      candidateId: r.candidate_id,
      committeeId: r.committee_id,
      committeeName: r.committee_name ?? r.committee_id,
      stance: r.support_oppose_indicator === 'O' ? 'oppose' : 'support',
      amount: num(r.total),
      count: r.count ?? 0,
    }));
}

// --- 3. Who the spenders are, and who funds them ----------------------------

const DARK_TYPES = new Set(['I']); // independent expenditor (person or group), e.g. 501(c)(4)s

function spenderKind(type) {
  if (type === 'O' || type === 'U') return 'Super PAC';
  if (type === 'V' || type === 'W') return 'Hybrid PAC';
  if (type === 'X' || type === 'Y' || type === 'Z') return 'Party committee';
  if (type === 'I') return 'Nonprofit or group';
  if (type === 'N' || type === 'Q') return 'PAC';
  return 'Committee';
}

async function loadCommittees(ids) {
  const out = {};
  // A few filers (individuals, some groups) don't have a standard C######## ID.
  for (const batch of chunk(ids.filter((id) => /^C\d{8}$/.test(id ?? '')), 50)) {
    const body = await fec('/committees/', { committee_id: batch, per_page: 100 });
    for (const c of body.results) {
      out[c.committee_id] = {
        id: c.committee_id,
        name: c.name,
        type: c.committee_type,
        kind: spenderKind(c.committee_type),
        orgType: c.organization_type_full ?? null,
        connectedOrg: c.affiliated_committee_name && c.affiliated_committee_name !== 'NONE' ? c.affiliated_committee_name : null,
        donorsHidden: DARK_TYPES.has(c.committee_type),
        topDonors: null,
      };
    }
  }
  return out;
}

const ENTITY_LABEL = {
  IND: 'Individual',
  ORG: 'Organization',
  PAC: 'PAC',
  COM: 'Committee',
  PTY: 'Party',
  CCM: 'Candidate committee',
};

async function loadTopDonors(committeeId) {
  const body = await fec('/schedules/schedule_a/', {
    committee_id: committeeId,
    two_year_transaction_period: CYCLE,
    sort: '-contribution_receipt_amount',
    per_page: 100,
  });
  const byDonor = new Map();
  for (const r of body.results) {
    if (r.memo_code === 'X') continue; // memo lines repeat money already counted
    const amount = num(r.contribution_receipt_amount);
    if (amount < 1000) continue; // "largest funders" means real money, not $100 checks
    const name = (r.contributor_name ?? '').trim().toUpperCase();
    if (!name) continue;
    const key = r.contributor_id || name;
    const prev = byDonor.get(key);
    if (prev) {
      prev.amount += amount;
      prev.count += 1;
      if (amount > prev.largest) Object.assign(prev, { largest: amount, filingUrl: r.pdf_url ?? prev.filingUrl });
    } else {
      byDonor.set(key, {
        name,
        entity: ENTITY_LABEL[r.entity_type] ?? r.entity_type ?? 'Other',
        employer: r.entity_type === 'IND' ? (r.contributor_employer ?? null) : null,
        state: r.contributor_state ?? null,
        amount,
        count: 1,
        largest: amount,
        filingUrl: r.pdf_url ?? null,
      });
    }
  }
  return [...byDonor.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map((d) => {
      delete d.largest;
      return d;
    });
}

// --- Assemble --------------------------------------------------------------

async function main() {
  const started = Date.now();
  const candidates = await loadCandidates();
  log(`${candidates.length} general-election candidates`);

  const outside = await loadOutsideSpending(candidates.map((c) => c.id));

  const races = {};
  for (const c of candidates) {
    const id = raceId(c.office, c.state, c.district);
    races[id] ??= {
      id,
      office: c.office,
      state: c.state,
      district: c.district,
      candidates: [],
      outsideTotal: 0,
      spenders: [],
    };
    races[id].candidates.push({ ...c, outsideFor: 0, outsideAgainst: 0 });
  }

  const candRace = new Map(Object.values(races).flatMap((r) => r.candidates.map((c) => [c.id, r])));
  const spenderTotals = new Map();
  for (const row of outside) {
    const race = candRace.get(row.candidateId);
    if (!race) continue;
    const cand = race.candidates.find((c) => c.id === row.candidateId);
    if (row.stance === 'support') cand.outsideFor += row.amount;
    else cand.outsideAgainst += row.amount;
    race.outsideTotal += row.amount;

    // Filers without a committee ID (some individuals and groups) are pooled.
    const spenderId = row.committeeId ?? 'OTHER';
    let s = race.spenders.find((x) => x.committeeId === spenderId);
    if (!s) {
      const name = row.committeeId ? row.committeeName : 'Other filers without an FEC committee ID';
      s = { committeeId: spenderId, name, total: 0, targets: [] };
      race.spenders.push(s);
    }
    s.total += row.amount;
    const target = s.targets.find((t) => t.candidateId === row.candidateId && t.stance === row.stance);
    if (target) target.amount += row.amount;
    else s.targets.push({ candidateId: row.candidateId, stance: row.stance, amount: row.amount });
    spenderTotals.set(spenderId, (spenderTotals.get(spenderId) ?? 0) + row.amount);
  }

  for (const race of Object.values(races)) {
    race.candidates.sort((a, b) => b.receipts + b.outsideFor - (a.receipts + a.outsideFor));
    race.spenders.sort((a, b) => b.total - a.total);
    race.spenderCount = race.spenders.length;
    race.spenders = race.spenders.slice(0, SPENDERS_PER_RACE);
    for (const s of race.spenders) s.targets.sort((a, b) => b.amount - a.amount);
  }

  const shownIds = [...new Set(Object.values(races).flatMap((r) => r.spenders.map((s) => s.committeeId)))];
  const committees = await loadCommittees(shownIds);
  log(`${shownIds.length} spenders shown; looking up donors for the biggest`);

  // Funder lists are the slowest part of a run and change slowly, so reuse
  // ones pulled within the last 12 hours (pass --fresh to re-pull all).
  const previous = loadPreviousCommittees();
  const lookups = shownIds
    .filter((id) => committees[id] && !committees[id].donorsHidden && (spenderTotals.get(id) ?? 0) >= DONOR_LOOKUP_MIN)
    .sort((a, b) => spenderTotals.get(b) - spenderTotals.get(a));
  let reused = 0;
  for (const [i, id] of lookups.entries()) {
    const prev = previous[id];
    if (prev?.topDonors && Date.now() - Date.parse(prev.donorsFetchedAt ?? 0) < DONOR_MAX_AGE_MS) {
      Object.assign(committees[id], { topDonors: prev.topDonors, donorsFetchedAt: prev.donorsFetchedAt });
      reused++;
      continue;
    }
    try {
      committees[id].topDonors = await loadTopDonors(id);
      committees[id].donorsFetchedAt = new Date().toISOString();
    } catch (err) {
      console.warn(`donors for ${id} failed: ${err.message}`);
    }
    if (i % 25 === 0) log(`donors ${i + 1}/${lookups.length}`);
  }
  log(`reused ${reused} recent funder lists`);
  for (const id of shownIds) {
    if (committees[id]) committees[id].totalAllRaces = spenderTotals.get(id) ?? 0;
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    cycle: CYCLE,
    electionDate: '2026-11-03',
    source: 'Federal Election Commission (api.open.fec.gov)',
    races,
    committees,
  };
  mkdirSync(join(ROOT, 'data'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'snapshot.json'), JSON.stringify(snapshot));
  log(`done: ${Object.keys(races).length} races in ${Math.round((Date.now() - started) / 1000)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
