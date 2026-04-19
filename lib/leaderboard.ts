/**
 * Leaderboard types + in-memory fallback.
 * The real persistent impl lives in lib/store.ts (GitHub repo as DB).
 * This file keeps the type contract clean and provides a fallback
 * for local dev when STORE_GITHUB_TOKEN is not set.
 */

export interface LeaderboardEntry {
  username:  string;
  score:     number;
  level:     string;
  toolCount: number;
  scannedAt: string;
}

// ── In-memory fallback (local dev / store not configured) ─────────────────────
const _entries = new Map<string, LeaderboardEntry>();
const _scores:  number[] = [];

export function recordScanMemory(entry: LeaderboardEntry): void {
  _entries.set(entry.username.toLowerCase(), entry);
  _scores.push(entry.score);
  if (_scores.length > 500) _scores.shift();
}

export function getLeaderboardMemory(limit = 10): LeaderboardEntry[] {
  return Array.from(_entries.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getAllScoresMemory(): number[] {
  return [..._scores];
}

export function getTotalScansMemory(): number {
  return _entries.size;
}
