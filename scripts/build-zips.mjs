// Builds data/zips.json: ZIP code -> congressional districts it overlaps.
//
//   node scripts/build-zips.mjs
//
// Source: Census Bureau 2020 ZCTA <-> 119th Congress district relationship file.
// These are the district lines used in 2024. Several states redrew lines for
// 2026, so the app presents this as a starting guess and lets people pick.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_natl.txt';

const FIPS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
  '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
};

const text = await (await fetch(SOURCE)).text();
const [header, ...lines] = text.replace(/^﻿/, '').split(/\r?\n/);
const col = Object.fromEntries(header.split('|').map((h, i) => [h, i]));

const zips = {};
for (const line of lines) {
  const f = line.split('|');
  const zip = f[col.GEOID_ZCTA5_20];
  const geoid = f[col.GEOID_CD119_20];
  if (!zip || !geoid) continue;
  const state = FIPS[geoid.slice(0, 2)];
  if (!state) continue;
  let district = geoid.slice(2);
  if (district === '98' || district === 'ZZ') district = '00';
  const zipLand = Number(f[col.AREALAND_ZCTA5_20]);
  const partLand = Number(f[col.AREALAND_PART]);
  const share = zipLand > 0 ? partLand / zipLand : 1;
  if (share < 0.02) continue;
  (zips[zip] ??= []).push([state, district, Math.round(share * 100) / 100]);
}
for (const list of Object.values(zips)) list.sort((a, b) => b[2] - a[2]);

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'zips.json'), JSON.stringify(zips));
console.log(`${Object.keys(zips).length} ZIP codes written`);
