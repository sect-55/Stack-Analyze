/**
 * Two-layer cache:
 *   L1: in-memory (fast, per-instance, lost on cold start)
 *   L2: GitHub store (persistent, survives cold starts)
 *
 * Read order:  L1 → L2 → miss
 * Write order: L1 + L2 simultaneously
 *
 * L1 TTL: 5 min  (keeps hot requests fast)
 * L2 TTL: 24 hr  (check analyzedAt in stored data)
 */

import { isStoreConfigured, getScan, saveScan } from "./store";
import { AnalysisResult } from "./types";

interface CacheEntry {
  value:     AnalysisResult;
  timestamp: number;
}

const L1 = new Map<string, CacheEntry>();
const L1_TTL = 5 * 60 * 1000;        // 5 min
const L2_TTL = 24 * 60 * 60 * 1000;  // 24 hr

export async function getCached(username: string): Promise<AnalysisResult | null> {
  const key = username.toLowerCase();

  // L1
  const l1 = L1.get(key);
  if (l1 && Date.now() - l1.timestamp < L1_TTL) return l1.value;

  // L2 (persistent)
  if (!isStoreConfigured()) return null;
  const stored = await getScan(key);
  if (!stored) return null;
  if (stored.optedOut) return null;

  const age = Date.now() - new Date(stored.current.analyzedAt).getTime();
  if (age > L2_TTL) return null;

  // Warm L1
  L1.set(key, { value: stored.current, timestamp: Date.now() });
  return stored.current;
}

export async function setCached(username: string, result: AnalysisResult): Promise<void> {
  const key = username.toLowerCase();

  // L1 always
  L1.set(key, { value: result, timestamp: Date.now() });

  // L2 — awaited so it completes within the serverless function lifetime
  if (isStoreConfigured()) {
    await saveScan(key, result).catch(() => {/* non-fatal */});
  }
}

export function setCachedSync(username: string, result: AnalysisResult): void {
  L1.set(username.toLowerCase(), { value: result, timestamp: Date.now() });
}
