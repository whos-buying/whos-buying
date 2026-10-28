import snapshotJson from '@/data/snapshot.json';

export type Stance = 'support' | 'oppose';

export type Candidate = {
  id: string;
  name: string;
  party: string;
  partyFull: string;
  office: 'S' | 'H';
  state: string;
  district: string | null;
  incumbent: boolean;
  openSeat: boolean;
  receipts: number;
  fromBigDonors: number;
  fromPacs: number;
  cashOnHand: number;
  coverageEnd: string;
  outsideFor: number;
  outsideAgainst: number;
};

export type Spender = {
  committeeId: string;
  name: string;
  total: number;
  targets: { candidateId: string; stance: Stance; amount: number }[];
};

export type Race = {
  id: string;
  office: 'S' | 'H';
  state: string;
  district: string | null;
  candidates: Candidate[];
  outsideTotal: number;
  spenders: Spender[];
  spenderCount: number;
};

export type Donor = {
  name: string;
  entity: string;
  employer: string | null;
  state: string | null;
  amount: number;
  count: number;
  filingUrl: string | null;
};

export type Committee = {
  id: string;
  name: string;
  type: string;
  kind: string;
  orgType: string | null;
  connectedOrg: string | null;
  donorsHidden: boolean;
  topDonors: Donor[] | null;
  totalAllRaces: number;
};

type Snapshot = {
  generatedAt: string;
  cycle: number;
  electionDate: string;
  source: string;
  races: Record<string, Race>;
  committees: Record<string, Committee>;
};

export const snapshot = snapshotJson as unknown as Snapshot;

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export const allRaces = () => Object.values(snapshot.races);
export const getRace = (id: string): Race | undefined => snapshot.races[id.toUpperCase()];
export const getCommittee = (id: string): Committee | undefined => snapshot.committees[id];

export function racesInState(state: string) {
  const st = state.toUpperCase();
  const races = allRaces().filter((r) => r.state === st);
  return {
    senate: races.filter((r) => r.office === 'S'),
    house: races
      .filter((r) => r.office === 'H')
      .sort((a, b) => Number(a.district) - Number(b.district)),
  };
}

export const statesWithRaces = () =>
  [...new Set(allRaces().map((r) => r.state))].filter((s) => STATE_NAMES[s]).sort();

export const mostBoughtRaces = (n: number) =>
  allRaces()
    .filter((r) => r.outsideTotal > 0)
    .sort((a, b) => b.outsideTotal - a.outsideTotal)
    .slice(0, n);

export const biggestSpenders = (n: number) =>
  Object.values(snapshot.committees)
    .sort((a, b) => b.totalAllRaces - a.totalAllRaces)
    .slice(0, n);

export const nationalOutsideTotal = () => allRaces().reduce((sum, r) => sum + r.outsideTotal, 0);

// "LATEST FILING DATE" shown on pages: the newest coverage date among candidates.
export const coverageThrough = () =>
  allRaces()
    .flatMap((r) => r.candidates.map((c) => c.coverageEnd))
    .sort()
    .at(-1) ?? '';
