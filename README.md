# DevTracker — Stack Privacy Analyzer

> Scan your GitHub repos. Find out which tools are tracking your users, what data they collect, and how to fix it.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Required for full functionality

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT for scanning repos. Raises rate limit from 60 → 5000 req/hr. Scope: `public_repo` (read-only). |
| `STORE_GITHUB_TOKEN` | GitHub PAT for the persistent data store. Can be the same token. Scope: `repo` (read+write). |
| `STORE_REPO_OWNER` | Your GitHub username (owner of the store repo). |
| `STORE_REPO_NAME` | Name of your private store repo (e.g. `devtracker-data`). |
| `IP_HASH_SALT` | Random secret string. IPs are SHA-256 hashed with this before storage — never stored raw. |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://devtracker.vercel.app`). Used for share links + badge URLs. |

### Optional

All features degrade gracefully if store vars are missing — the app works locally with in-memory fallback.

---

## Persistent Store Setup (one-time, free)

The app uses a **private GitHub repo as a zero-cost persistent database**. This makes cache, leaderboard, rate limiting, and diff tracking work correctly on Vercel's free serverless tier.

1. Create a **private** GitHub repo, e.g. `devtracker-data`
2. Create a GitHub PAT at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` scope
3. Add the env vars to your `.env` (locally) and Vercel dashboard (production)

Files written to the store repo:
```
scans/{username}.json        # scan result + previous scan for diff
leaderboard.json             # all-time + weekly scores + rolling percentile data  
rate_limits/{ip-hash}.json   # per-IP rate limit timestamps (IPs are hashed)
```

---

## Deploy to Vercel (Free Tier)

```bash
npm install -g vercel
vercel
```

Add all env vars in **Vercel Dashboard → Settings → Environment Variables**.

---

## Architecture

```
app/
  page.tsx                          # Landing page
  middleware.ts                     # Global CSP + security headers (Edge)
  result/[username]/
    page.tsx                        # Server component — instant shared links
    ResultClient.tsx                # Client UI — loading animation, diff, leaderboard
  api/
    analyze/route.ts                # Core scan endpoint
    badge/route.ts                  # SVG badge (always works, reads from store)
    leaderboard/route.ts            # All-time + weekly leaderboard
    opt-out/route.ts                # POST to remove user data

lib/
  rules.ts        # 100+ tool definitions
  detector.ts     # Boundary-aware dep matching (no false positives)
  risk.ts         # Weighted scoring + fix simulation + real percentile
  github.ts       # Multi-language manifest fetching with 8s timeout
  store.ts        # GitHub repo as persistent DB (cache, leaderboard, rate limit, opt-out)
  cache.ts        # L1 memory + L2 persistent store
  ratelimit.ts    # Persistent rate limiter with hashed IP storage
  diff.ts         # Scan diff engine (added/removed tools, score change)
  leaderboard.ts  # Types + in-memory fallback
  security.ts     # Input validation, SVG escaping, security headers
  types.ts        # Shared TypeScript types
```

---

## Features

- **100+ tool mappings** — JS/TS, Python, Ruby, Java, Go, Rust
- **Multi-language scanning** — `package.json`, `requirements.txt`, `Gemfile`, `pom.xml`, `build.gradle`, `go.mod`, `Cargo.toml`
- **Diff tracking** — shows what changed since your last scan
- **Persistent leaderboard** — all-time + weekly, survives cold starts
- **Real percentile** — derived from actual scan history, not a formula
- **README badge** — `![Privacy Score](...)` always works even after cold start
- **Shareable URLs** — `/result/username` loads instantly for visitors (server-rendered)
- **Opt-out** — any user can remove their data from the leaderboard
- **Rate limiting** — persistent per-IP with hashed storage (privacy-safe)
- **Security headers** — CSP, X-Frame-Options, XSS protection via Edge middleware
- **SVG injection prevention** — all badge text is escaped before SVG rendering

---

## Badge

Add to your README after scanning:

```markdown
[![Privacy Score](https://yourapp.vercel.app/api/badge?username=YOUR_USERNAME)](https://yourapp.vercel.app/result/YOUR_USERNAME)
```

---

## Privacy

- Only public GitHub repos are scanned
- No private repo access, no login required
- IPs are SHA-256 hashed with a secret salt before any storage — raw IPs never persisted
- Users can opt out via the button on their result page (removes data from leaderboard)
- Opted-out users cannot be re-scanned and persisted
