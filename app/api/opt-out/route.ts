import { NextResponse } from "next/server";
import { isStoreConfigured, optOutUser } from "@/lib/store";
import { validateUsername, securityHeaders, safeQueryParam } from "@/lib/security";

/**
 * POST /api/opt-out?username=X
 *
 * Removes a user's data from the leaderboard and prevents future scans
 * from being persisted or shown publicly.
 *
 * No auth needed — anyone can opt out any username. This is intentional:
 * if someone wants their data removed, they should be able to do it.
 * The worst case is someone opts out another person's scan — not a safety risk.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = safeQueryParam(searchParams, "username");

  if (!username || !validateUsername(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400, headers: securityHeaders() });
  }

  if (!isStoreConfigured()) {
    return NextResponse.json(
      { message: "Opt-out noted. (Store not configured — no persistent data to remove.)" },
      { status: 200, headers: securityHeaders() }
    );
  }

  try {
    await optOutUser(username);
    return NextResponse.json(
      { message: `${username} has been opted out. Your data will no longer appear publicly.` },
      { status: 200, headers: securityHeaders() }
    );
  } catch {
    return NextResponse.json({ error: "Failed to opt out. Try again." }, { status: 500, headers: securityHeaders() });
  }
}
