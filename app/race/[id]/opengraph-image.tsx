import { ImageResponse } from "next/og";
import { allRaces, getRace } from "@/lib/data";
import { money, raceTitle } from "@/lib/format";
import { ogFonts } from "@/lib/og";
import { namedSpenders } from "@/lib/share";

export const alt = "Who's buying this race: outside spending from FEC filings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allRaces().map((r) => ({ id: r.id }));
}

// The receipt card people see when the link is shared.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = getRace(id);
  const title = race ? raceTitle(race) : "Your 2026 election";
  const spenders = race ? namedSpenders(race).slice(0, 3) : [];
  const display = { fontFamily: "Anton", textTransform: "uppercase" as const };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#141414", padding: 36 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fffdf8",
            color: "#141414",
            padding: "40px 56px",
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", ...display, fontSize: 30, letterSpacing: 3, color: "#c8261b" }}>
            Who&rsquo;s buying
          </div>
          <div style={{ display: "flex", ...display, fontSize: 64, lineHeight: 1.05 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
            <div style={{ display: "flex", ...display, fontSize: 112, lineHeight: 1.1, background: "#ffd84d", padding: "0 18px" }}>
              {race && race.outsideTotal > 0 ? money(race.outsideTotal) : "$0"}
            </div>
            <div style={{ display: "flex", fontSize: 34, marginLeft: 22, maxWidth: 360 }}>
              in outside money{spenders.length ? ", led by:" : " reported so far"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, borderTop: "3px dashed #c9c2b2", paddingTop: 12 }}>
            {spenders.map((s) => (
              <div key={s.committeeId} style={{ display: "flex", justifyContent: "space-between", fontSize: 30, marginTop: 6 }}>
                <div style={{ display: "flex", maxWidth: 840, overflow: "hidden", whiteSpace: "nowrap" }}>{s.displayName}</div>
                <div style={{ display: "flex", ...display }}>{money(s.total)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "auto", fontSize: 22, color: "#5d5a53" }}>
            Source: FEC filings · Tap to see who funds them
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
