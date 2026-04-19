/**
 * Server component — fetches data at request time.
 * Shared links load instantly (no client-side loading animation for visitors).
 * The owner sees the full loading experience only on first scan.
 */

import { Suspense }             from "react";
import { notFound }             from "next/navigation";
import { getCached, setCached } from "@/lib/cache";
import { isStoreConfigured, getScan, isOptedOut } from "@/lib/store";
import { getUserReposWithPackages }               from "@/lib/github";
import { detectTools }          from "@/lib/detector";
import { calculateRisk, simulateFix, derivePercentile } from "@/lib/risk";
import { getAllScoresMemory }    from "@/lib/leaderboard";
import { diffScans }            from "@/lib/diff";
import { validateUsername }     from "@/lib/security";
import { AnalysisResult }       from "@/lib/types";
import ResultClient             from "./ResultClient";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ fresh?: string }>;
}

async function fetchResult(username: string): Promise<AnalysisResult | null> {
  // Check cache first
  const cached = await getCached(username);
  if (cached) return cached;

  // Check persistent store (handles cold starts for shared links)
  if (isStoreConfigured()) {
    const stored = await getScan(username.toLowerCase());
    if (stored && !stored.optedOut && stored.current) {
      return stored.current;
    }
  }

  // Full scan
  try {
    const previousScan = isStoreConfigured() ? await getScan(username.toLowerCase()) : null;
    const repos   = await getUserReposWithPackages(username);
    const tools   = detectTools(repos);
    const risk    = calculateRisk(tools);
    const improved = simulateFix(tools);

    // Percentile
    let historicalScores: number[] = [];
    if (isStoreConfigured()) {
      const { getLeaderboardStore } = await import("@/lib/store");
      const lb = await getLeaderboardStore();
      historicalScores = lb?.scores ?? [];
    }
    if (historicalScores.length < 20) historicalScores = getAllScoresMemory();
    risk.percentile = historicalScores.length >= 20
      ? derivePercentile(risk.score, historicalScores)
      : Math.min(95, Math.round(risk.score * 8 + 15));

    // Diff
    const previousResult = previousScan?.previous ?? null;
    const diff = previousResult
      ? diffScans(tools, previousResult.tools, risk.score, previousResult.risk.score)
      : undefined;
    const previousScore = previousResult?.risk.score;

    const result: AnalysisResult = {
      username, tools, risk, improved,
      repoCount: repos.length,
      analyzedAt: new Date().toISOString(),
      diff,
      previousScore,
    };

    await setCached(username, result);

    // Record leaderboard async
    const { recordScanMemory } = await import("@/lib/leaderboard");
    const entry = { username, score: risk.score, level: risk.level, toolCount: tools.length, scannedAt: result.analyzedAt };
    recordScanMemory(entry);
    if (isStoreConfigured()) {
      const { updateLeaderboard } = await import("@/lib/store");
      updateLeaderboard(entry).catch(() => {});
    }

    return result;
  } catch {
    return null;
  }
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { fresh }    = await searchParams;
  const decoded      = decodeURIComponent(username);

  if (!validateUsername(decoded)) notFound();

  // Opt-out check
  if (isStoreConfigured() && await isOptedOut(decoded)) {
    notFound();
  }

  // If ?fresh=1 the user just submitted — skip server fetch, let client animate
  const isFreshScan = fresh === "1";

  let result: AnalysisResult | null = null;
  if (!isFreshScan) {
    result = await fetchResult(decoded);
  }

  return (
    <Suspense fallback={null}>
      <ResultClient
        username={decoded}
        initialData={result}
        isFreshScan={isFreshScan}
      />
    </Suspense>
  );
}

// Generate metadata for share previews
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  return {
    title: `${decoded}'s Privacy score`,
    description: `See how much ${decoded}'s GitHub repos expose about their users. Get your own score.`,
    openGraph: {
      title: `${decoded}'s Privacy score`,
      description: `How exposed is ${decoded}'s dev stack? Check yours too.`,
    },
    twitter: {
      card:  "summary_large_image",
      title: `${decoded}'s Privacy score`,
    },
  };
}
