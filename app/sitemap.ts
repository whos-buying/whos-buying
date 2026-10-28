import type { MetadataRoute } from "next";
import { allRaces, snapshot, statesWithRaces } from "@/lib/data";

import { siteUrl as base } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = snapshot.generatedAt;
  return [
    { url: base, lastModified, priority: 1 },
    { url: `${base}/about`, lastModified, priority: 0.3 },
    ...statesWithRaces().map((st) => ({ url: `${base}/state/${st}`, lastModified, priority: 0.7 })),
    ...allRaces().map((r) => ({ url: `${base}/race/${r.id}`, lastModified, priority: 0.8 })),
  ];
}
