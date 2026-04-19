/**
 * Persistent store using a private GitHub repo as a free key-value database.
 *
 * Why GitHub repo as store?
 * - Vercel free tier has no persistent storage (no Redis, no KV on free plan)
 * - A private GitHub repo gives us free, persistent JSON storage
 * - GitHub API has 5000 req/hr with a token — more than enough
 * - Data survives cold starts, redeploys, and multiple serverless instances
 *
 * Setup (one-time):
 * 1. Create a PRIVATE GitHub repo, e.g. "devtracker-data"
 * 2. Set STORE_GITHUB_TOKEN (a PAT with repo scope) in .env
 * 3. Set STORE_REPO_OWNER and STORE_REPO_NAME in .env
 *
 * File layout inside the store repo:
 *   scans/{username}.json   — latest scan result + previous scan for diff
 *   leaderboard.json        — top scores all-time + weekly
 *   scores.json             — rolling array of scores for percentile
 *   opted_out.json          — set of usernames that opted out
 */

import { AnalysisResult } from "./types";
import { LeaderboardEntry } from "./leaderboard";

function storeConfig() {
  return {
    token: process.env.STORE_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? "",
    owner: process.env.STORE_REPO_OWNER ?? "",
    repo:  process.env.STORE_REPO_NAME  ?? "",
  };
}

function storeBaseUrl() {
  const { owner, repo } = storeConfig();
  return `https://api.github.com/repos/${owner}/${repo}/contents`;
}

function storeHeaders() {
  return {
    Accept:        "application/vnd.github.v3+json",
    Authorization: `Bearer ${storeConfig().token}`,
    "User-Agent":  "dev-tracker-store/1.0",
  };
}

export function isStoreConfigured(): boolean {
  const { token, owner, repo } = storeConfig();
  return !!(token && owner && repo);
}

interface GHFile {
  content: string;   // base64
  sha:     string;
  name:    string;
}

// ── Low-level read/write ───────────────────────────────────────────────────────

export async function storeGet<T>(path: string): Promise<{ data: T; sha: string } | null> {
  try {
    const res = await fetch(`${storeBaseUrl()}/${path}`, {
      headers: storeHeaders(),
      // bypass Next.js cache so we always get fresh data
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const file: GHFile = await res.json();
    const decoded = Buffer.from(file.content, "base64").toString("utf8");
    return { data: JSON.parse(decoded) as T, sha: file.sha };
  } catch {
    return null;
  }
}

export async function storePut<T>(path: string, data: T, existingSha?: string): Promise<boolean> {
  if (!isStoreConfigured()) return false;
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const body: Record<string, string> = {
      message: `update ${path}`,
      content,
    };
    if (existingSha) body.sha = existingSha;

    const res = await fetch(`${storeBaseUrl()}/${path}`, {
      method:  "PUT",
      headers: { ...storeHeaders(), "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok && res.status !== 201) {
      const errText = await res.text().catch(() => res.status.toString());
      console.error(`[store] PUT ${path} failed (${res.status}):`, errText);
    }
    return res.ok || res.status === 201;
  } catch (err) {
    console.error(`[store] PUT ${path} threw:`, err);
    return false;
  }
}

// ── Scan storage ───────────────────────────────────────────────────────────────

export interface StoredScan {
  current:   AnalysisResult;
  previous?: AnalysisResult;   // last scan before this one — enables diff
  optedOut:  boolean;
}

export async function getScan(username: string): Promise<StoredScan | null> {
  const result = await storeGet<StoredScan>(`scans/${username.toLowerCase()}.json`);
  return result?.data ?? null;
}

export async function saveScan(username: string, current: AnalysisResult): Promise<void> {
  if (!isStoreConfigured()) return;

  const key = `scans/${username.toLowerCase()}.json`;
  const existing = await storeGet<StoredScan>(key);

  const payload: StoredScan = {
    current,
    previous: existing?.data?.current,
    optedOut: existing?.data?.optedOut ?? false,
  };

  await storePut(key, payload, existing?.sha);
}

export async function optOutUser(username: string): Promise<void> {
  if (!isStoreConfigured()) return;
  const key = `scans/${username.toLowerCase()}.json`;
  const existing = await storeGet<StoredScan>(key);
  if (!existing) return;
  const payload: StoredScan = { ...existing.data, optedOut: true };
  await storePut(key, payload, existing.sha);
}

export async function isOptedOut(username: string): Promise<boolean> {
  if (!isStoreConfigured()) return false;
  const scan = await getScan(username);
  return scan?.optedOut ?? false;
}

// ── Leaderboard storage ────────────────────────────────────────────────────────

export interface LeaderboardStore {
  allTime: LeaderboardEntry[];
  weekly:  Record<string, LeaderboardEntry[]>; // weekKey → entries
  scores:  number[];  // rolling last 2000 scores for percentile
}

function getWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function updateLeaderboard(entry: LeaderboardEntry): Promise<void> {
  if (!isStoreConfigured()) return;

  const key = "leaderboard.json";
  const existing = await storeGet<LeaderboardStore>(key);
  const store: LeaderboardStore = existing?.data ?? { allTime: [], weekly: {}, scores: [] };

  // Update all-time: upsert by username, keep top 50
  const atIdx = store.allTime.findIndex((e) => e.username.toLowerCase() === entry.username.toLowerCase());
  if (atIdx >= 0) {
    store.allTime[atIdx] = entry;
  } else {
    store.allTime.push(entry);
  }
  store.allTime = store.allTime.sort((a, b) => b.score - a.score).slice(0, 50);

  // Update weekly
  const wk = getWeekKey();
  if (!store.weekly[wk]) store.weekly[wk] = [];
  const wIdx = store.weekly[wk].findIndex((e) => e.username.toLowerCase() === entry.username.toLowerCase());
  if (wIdx >= 0) {
    store.weekly[wk][wIdx] = entry;
  } else {
    store.weekly[wk].push(entry);
  }
  store.weekly[wk] = store.weekly[wk].sort((a, b) => b.score - a.score).slice(0, 20);

  // Prune old weeks (keep last 4)
  const weeks = Object.keys(store.weekly).sort().reverse();
  for (const w of weeks.slice(4)) delete store.weekly[w];

  // Rolling scores for percentile
  store.scores.push(entry.score);
  if (store.scores.length > 2000) store.scores = store.scores.slice(-2000);

  await storePut(key, store, existing?.sha);
}

export async function getLeaderboardStore(): Promise<LeaderboardStore | null> {
  const result = await storeGet<LeaderboardStore>("leaderboard.json");
  return result?.data ?? null;
}

export function getCurrentWeekKey(): string {
  return getWeekKey();
}
