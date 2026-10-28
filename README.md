# Who's Buying Your Election?

Enter a ZIP code and see the super PACs and outside groups spending on your 2026 races for
Congress, who funds them, and how to vote. Every number comes from FEC filings and links to its source.

## Run it locally

```bash
npm install
npm run dev
```

The app reads two prebuilt data files, so it needs no API key to run:

- `data/snapshot.json`: candidates, outside spending and top funders (from the FEC)
- `data/zips.json`: ZIP code to congressional district (from the Census Bureau)

## Refresh the data

Get a free key at https://api.data.gov/signup and put it in `.env.local`:

```
FEC_API_KEY=your-key
```

Then:

```bash
npm run ingest
```

A full run takes about 5–10 minutes (the FEC allows ~60 requests a minute).
`npm run zips` rebuilds the ZIP table; it rarely needs to change.

## Deploy (free)

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import the repo, and deploy.
   No settings needed: share cards use Vercel's production URL automatically. If you add a custom
   domain later, set `NEXT_PUBLIC_SITE_URL` to it (e.g. `https://whosbuying.vote`).
3. In the GitHub repo, go to **Settings → Secrets and variables → Actions** and add `FEC_API_KEY`.
   The workflow in `.github/workflows/refresh-data.yml` then refreshes the data every 4 hours, and
   Vercel redeploys on each commit. Run it by hand from the **Actions** tab any time.

## How the numbers work

See `/about` on the site. In short:

- **On the ballot**: candidates who filed a pre-general report (through Oct. 14).
- **Outside money**: FEC-reported independent expenditures for the 2026 cycle, per candidate, for and against.
- **Funders**: the largest itemized contributions to each big spender in 2025–26, combined by donor.
- **Not included**: unreported "issue ads" and money from groups that don't disclose donors.
  The site says so on every race page.
