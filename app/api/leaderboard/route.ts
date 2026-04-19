import { NextResponse } from "next/server";
import { isStoreConfigured, getLeaderboardStore, getCurrentWeekKey } from "@/lib/store";
import { getLeaderboardMemory, getTotalScansMemory }                  from "@/lib/leaderboard";
import { securityHeaders }                                             from "@/lib/security";

export async function GET() {
  if (isStoreConfigured()) {
    const store = await getLeaderboardStore();
    const wk    = getCurrentWeekKey();
    return NextResponse.json(
      {
        allTime:    store?.allTime.slice(0, 10)  ?? [],
        weekly:     store?.weekly[wk]?.slice(0, 10) ?? [],
        totalScans: store?.allTime.length ?? 0,
        weekKey:    wk,
      },
      { headers: securityHeaders() }
    );
  }

  // Memory fallback for local dev
  return NextResponse.json(
    {
      allTime:    getLeaderboardMemory(10),
      weekly:     [],
      totalScans: getTotalScansMemory(),
      weekKey:    "",
    },
    { headers: securityHeaders() }
  );
}
