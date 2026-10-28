import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Anton, IBM_Plex_Mono, Inter } from "next/font/google";
import { longDate } from "@/lib/format";
import { snapshot } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", weight: ["500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Who's Buying Your Election?",
    template: "%s · Who's Buying",
  },
  description:
    "See the super PACs and outside groups spending to win your 2026 congressional races, and who funds them. Straight from FEC filings.",
  openGraph: { siteName: "Who's Buying", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-display text-xl uppercase tracking-wide">
              Who&rsquo;s <span className="mark">Buying</span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/#zip" className="hover:underline">Find your races</Link>
              <Link href="/about" className="hover:underline">How it works</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line text-sm text-muted">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-1">
            <p>
              Every number comes from public filings with the Federal Election Commission.
              Data pulled {longDate(snapshot.generatedAt)}.
            </p>
            <p>
              Not affiliated with any campaign, party or candidate.{" "}
              <Link href="/about" className="underline">Sources and method</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
