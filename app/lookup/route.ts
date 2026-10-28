import { NextResponse, type NextRequest } from "next/server";
import zips from "@/data/zips.json";

type ZipRow = [state: string, district: string, share: number];
const table = zips as unknown as Record<string, ZipRow[]>;

// ZIP -> state page, with the likely districts highlighted. A ZIP can straddle
// districts (and occasionally states); the most-overlapping state wins.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const zip = String(form.get("zip") ?? "").trim();
  const rows = /^\d{5}$/.test(zip) ? table[zip] : undefined;

  if (!rows?.length) {
    return NextResponse.redirect(new URL("/zip-not-found", request.url), 303);
  }
  const state = rows[0][0];
  const districts = rows.filter((r) => r[0] === state).map((r) => r[1]);
  const url = new URL(`/state/${state}`, request.url);
  url.searchParams.set("d", districts.join(","));
  return NextResponse.redirect(url, 303);
}
