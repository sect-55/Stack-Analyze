import { NextResponse }                              from "next/server";
import { getUserReposWithPackages }                  from "@/lib/github";
import { detectTools }                               from "@/lib/detector";
import { calculateRisk, simulateFix, derivePercentile } from "@/lib/risk";
import { getCached, setCached }                      from "@/lib/cache";
import { validateUsername, securityHeaders, safeQueryParam } from "@/lib/security";
import { checkRateLimit }                            from "@/lib/ratelimit";
import { isStoreConfigured, getScan, updateLeaderboard, isOptedOut } from "@/lib/store";
import { recordScanMemory, getAllScoresMemory }       from "@/lib/leaderboard";
import { diffScans }                                 from "@/lib/diff";
import { AnalysisResult }                            from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = safeQueryParam(searchParams, "username");

  if (!username || !validateUsername(username)) {
    return NextResponse.json(
      { error: "Invalid GitHub username" },
      { status: 400, headers: securityHeaders() }
    );
  }

  // Rate limit
  const rawIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const allowed = await checkRateLimit(rawIp);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429, headers: { ...securityHeaders(), "Retry-After": "60" } }
    );
  }

  // Opt-out check
  if (isStoreConfigured() && await isOptedOut(username)) {
    return NextResponse.json(
      { error: "This user has opted out of scanning." },
      { status: 403, headers: securityHeaders() }
    );
  }

  // Cache check (L1 memory + L2 GitHub store)
  const cached = await getCached(username);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { ...securityHeaders(), "X-Cache": "HIT" },
    });
  }

  try {
    // Fetch previous scan for diff (non-blocking if store down)
    const previousScan = isStoreConfigured() ? await getScan(username.toLowerCase()) : null;
    const previousResult = previousScan?.previous ?? null;

    const repos  = await getUserReposWithPackages(username);
    const tools  = detectTools(repos);
    const risk   = calculateRisk(tools);
    const improved = simulateFix(tools);

    // Percentile: prefer real data from store, fall back to memory, fall back to formula
    let historicalScores: number[] = [];
    if (isStoreConfigured()) {
      // Scores are embedded in the leaderboard store
      const { getLeaderboardStore } = await import("@/lib/store");
      const lb = await getLeaderboardStore();
      historicalScores = lb?.scores ?? [];
    }
    if (historicalScores.length < 20) {
      historicalScores = getAllScoresMemory();
    }
    risk.percentile = historicalScores.length >= 20
      ? derivePercentile(risk.score, historicalScores)
      : Math.min(95, Math.round(risk.score * 8 + 15));

    // Diff against previous scan
    let diff = undefined;
    let previousScore = undefined;
    if (previousResult) {
      diff = diffScans(tools, previousResult.tools, risk.score, previousResult.risk.score);
      previousScore = previousResult.risk.score;
    }

    const result: AnalysisResult = {
      username,
      tools,
      risk,
      improved,
      repoCount: repos.length,
      analyzedAt: new Date().toISOString(),
      diff,
      previousScore,
    };

    // Persist (L1 + L2) and update leaderboard — both awaited so they
    // complete before Vercel terminates the serverless function.
    const entry = { username, score: risk.score, level: risk.level, toolCount: tools.length, scannedAt: result.analyzedAt };
    recordScanMemory(entry);
    if (isStoreConfigured()) {
      await Promise.allSettled([
        setCached(username, result),
        updateLeaderboard(entry),
      ]);
    } else {
      await setCached(username, result);
    }

    return NextResponse.json(result, {
      headers: { ...securityHeaders(), "X-Cache": "MISS" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "GitHub user not found" }, { status: 404, headers: securityHeaders() });
    }
    if (message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "GitHub API rate limit hit. Add a GITHUB_TOKEN to .env to fix this." },
        { status: 429, headers: securityHeaders() }
      );
    }
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Failed to analyze. Try again." }, { status: 500, headers: securityHeaders() });
  }
}
