import { ImageResponse } from "next/og";
import { nationalOutsideTotal } from "@/lib/data";
import { money } from "@/lib/format";
import { ogFonts } from "@/lib/og";

export const alt = "Who's buying your election? Outside spending in 2026 races for Congress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#141414",
          color: "#f5f2ea",
          padding: "60px 80px",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Anton", fontSize: 128, lineHeight: 1.05 }}>WHO&rsquo;S BUYING</div>
        <div style={{ display: "flex", fontFamily: "Anton", fontSize: 128, lineHeight: 1.05 }}>
          <span style={{ background: "#ffd84d", color: "#141414", padding: "0 18px" }}>YOUR</span>
          <span style={{ marginLeft: 28 }}>ELECTION?</span>
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 36 }}>
          {money(nationalOutsideTotal())} in outside money in 2026 races for Congress. Enter your ZIP.
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
