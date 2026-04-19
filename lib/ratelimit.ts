/**
 * Rate limiter that works on Vercel free tier (serverless / no Redis).
 *
 * Strategy: sliding window stored in the GitHub data repo.
 * - Each IP gets an entry in rate_limits/{hash}.json
 * - Entries older than windowMs are ignored
 * - Write is fire-and-forget (non-blocking)
 *
 * Fallback (store not configured): in-memory per-instance limit.
 * This is "best-effort" on serverless but better than nothing.
 *
 * The IP is hashed (SHA-256) before storage — we never store raw IPs.
 */

import { isStoreConfigured, storeGet, storePut } from "./store";
import { createHash } from "crypto";

const WINDOW_MS  = 60_000;  // 1 minute
const MAX_REQ    = 8;        // per window per IP

// ── In-memory fallback ────────────────────────────────────────────────────────
const memMap = new Map<string, { count: number; resetAt: number }>();

function checkMemory(ip: string): boolean {
  const now = Date.now();
  const entry = memMap.get(ip);
  if (!entry || now > entry.resetAt) {
    memMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQ) return false;
  entry.count += 1;
  return true;
}

// ── Hash IP (privacy) ─────────────────────────────────────────────────────────
function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT ?? "devtracker")).digest("hex").slice(0, 16);
}

interface RateLimitRecord {
  timestamps: number[];  // request timestamps in current window
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function checkRateLimit(rawIp: string): Promise<boolean> {
  const ip = rawIp.split(",")[0].trim();  // handle x-forwarded-for lists

  // Always apply memory check first (fast path)
  if (!checkMemory(ip)) return false;

  // If store not configured, memory check is all we have
  if (!isStoreConfigured()) return true;

  const hash = hashIp(ip);
  const key  = `rate_limits/${hash}.json`;
  const now  = Date.now();

  const existing = await storeGet<RateLimitRecord>(key);
  const record   = existing?.data ?? { timestamps: [] };

  // Prune timestamps outside current window
  record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQ) return false;

  record.timestamps.push(now);

  // Fire-and-forget — don't block the response
  storePut(key, record, existing?.sha).catch(() => {/* non-fatal */});

  return true;
}
