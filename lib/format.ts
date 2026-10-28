import { STATE_NAMES, type Candidate, type Race } from './data';

export function money(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(abs >= 1e8 ? 0 : 1)}M`;
  if (abs >= 1e4) return `$${Math.round(n / 1e3)}K`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export const moneyExact = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const SMALL_WORDS = new Set(['of', 'for', 'and', 'the', 'in', 'to', 'on', 'a', 'an', 'at', 'by']);
const KEEP_UPPER = new Set(['PAC', 'USA', 'US', 'LLC', 'II', 'III', 'IV', 'AFL-CIO', 'SEIU', 'NRA', 'AFSCME', 'UAW', 'NEA', 'AFT', 'DC', 'LCV', 'NRCC', 'DCCC', 'NRSC', 'DSCC', 'CLF', 'SLF', 'HMP', 'LGBTQ', 'AAPI', 'AIPAC', 'UDP', 'IBEW', 'UFCW', 'GOP', 'MAGA', 'FWD', 'AI']);

/** FEC names are ALL CAPS. Make them readable without mangling acronyms. */
export function titleCase(s: string | null | undefined): string {
  if (!s) return 'Unnamed filer';
  return s
    .toLowerCase()
    .split(/(\s+|-|\/|\()/)
    .map((w, i) => {
      const up = w.toUpperCase();
      if (KEEP_UPPER.has(up.replace(/[^A-Z-]/g, ''))) return up;
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      return (w.charAt(0).toUpperCase() + w.slice(1))
        .replace(/^Mc(\w)/, (_, c) => `Mc${c.toUpperCase()}`)
        .replace(/^O'(\w)/, (_, c) => `O'${c.toUpperCase()}`);
    })
    .join('');
}

const NAME_JUNK = /^(MR|MRS|MS|DR|HON|REV|SEN|REP)\.?$/i;
const SUFFIX = /^(JR|SR|II|III|IV|V)\.?$/i;

/** "OSSOFF, T. JONATHAN" -> "T. Jonathan Ossoff"; "COLLINS, MICHAEL A JR" -> "Michael A. Collins Jr." */
export function personName(fecName: string): string {
  const [last, rest = ''] = fecName.split(',').map((s) => s.trim());
  const parts = rest.split(/\s+/).filter((p) => p && !NAME_JUNK.test(p));
  const given = parts
    .filter((p) => !SUFFIX.test(p))
    .map((p) => p.replace(/\.$/, ''))
    .map((p) => (p.length === 1 ? `${p.toUpperCase()}.` : titleCase(p)));
  const suffixes = parts
    .filter((p) => SUFFIX.test(p))
    .map((p) => p.replace(/\.$/, '').toUpperCase())
    .map((p) => (p === 'JR' || p === 'SR' ? `${p[0]}${p[1].toLowerCase()}.` : p));
  return [...given, titleCase(last), ...suffixes].join(' ');
}

export const lastName = (fecName: string) => titleCase(fecName.split(',')[0].trim());

const PARTY_SHORT: Record<string, string> = {
  DEM: 'Democrat',
  REP: 'Republican',
  IND: 'Independent',
  LIB: 'Libertarian',
  GRE: 'Green',
  NNE: 'No party',
  NPA: 'No party',
  UN: 'Unaffiliated',
  UNK: 'Unknown',
};

export const partyLabel = (c: Candidate) => PARTY_SHORT[c.party] ?? titleCase(c.partyFull || c.party || 'Other');

export function raceTitle(r: Pick<Race, 'office' | 'state' | 'district'>): string {
  const st = STATE_NAMES[r.state] ?? r.state;
  if (r.office === 'S') return `${st} U.S. Senate`;
  if (r.district === '00') return `${st} U.S. House (at-large)`;
  return `${st} House District ${Number(r.district)}`;
}

export function raceShort(r: Pick<Race, 'office' | 'state' | 'district'>): string {
  if (r.office === 'S') return `${r.state} Senate`;
  if (r.district === '00') return `${r.state} at-large`;
  return `${r.state}-${Number(r.district)}`;
}

export function longDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export const fecCandidateUrl = (id: string) => `https://www.fec.gov/data/candidate/${id}/`;
export const fecCommitteeUrl = (id: string) => `https://www.fec.gov/data/committee/${id}/`;
export function fecRaceOutsideUrl(r: Pick<Race, 'office' | 'state' | 'district'>) {
  const q = new URLSearchParams({
    data_type: 'processed',
    cycle: '2026',
    candidate_office: r.office,
    candidate_office_state: r.state,
  });
  if (r.office === 'H' && r.district) q.set('candidate_office_district', r.district);
  return `https://www.fec.gov/data/independent-expenditures/?${q}`;
}
