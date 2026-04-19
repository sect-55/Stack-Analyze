import { NextResponse }        from "next/server";
import { isStoreConfigured, getScan } from "@/lib/store";
import { getCached }           from "@/lib/cache";
import { securityHeaders, escapeSvg, safeQueryParam, validateUsername } from "@/lib/security";
import { AnalysisResult }      from "@/lib/types";

const LEVEL_COLORS: Record<string, string> = {
  Low:      "#00e5ff",
  Medium:   "#d29922",
  High:     "#e3722c",
  Critical: "#f85149",
};

const LEVEL_BG: Record<string, string> = {
  Low:      "#001f2e",
  Medium:   "#2e1f00",
  High:     "#3d1f0a",
  Critical: "#3d0f0f",
};

function buildSvg(score: string | number, level: string): string {
  // Escape all user-derived strings before inserting into SVG
  const safeScore = escapeSvg(String(score));
  const safeLevel = escapeSvg(level);
  const color  = LEVEL_COLORS[level] ?? "#8b949e";
  const bg     = LEVEL_BG[level]     ?? "#161b22";
  const value  = score !== "?" ? `${safeScore}/10 · ${safeLevel}` : "not scanned";
  const labelW = 105;
  const valueW = score !== "?" ? 120 : 95;
  const totalW = labelW + valueW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="privacy score: ${value}">
  <title>privacy score: ${value}</title>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#161b22"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${bg}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="JetBrains Mono,DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="15" fill="#8b949e">privacy score</text>
    <text x="${labelW + valueW / 2}" y="15" fill="${color}">${value}</text>
  </g>
</svg>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = safeQueryParam(searchParams, "username");

  if (!username || !validateUsername(username)) {
    return new NextResponse(buildSvg("?", "Unknown"), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, max-age=0",
        ...securityHeaders({ "X-Frame-Options": "ALLOWALL" }), // badges must be embeddable
      },
    });
  }

  // Try L1 memory cache first (fast)
  let result: AnalysisResult | null = null;

  // Try memory cache (non-async — won't be populated on cold start)
  // Then try persistent store so badge always works even cold
  result = await getCached(username);
  if (!result && isStoreConfigured()) {
    const stored = await getScan(username.toLowerCase());
    if (stored && !stored.optedOut) result = stored.current;
  }

  const score = result?.risk.score ?? "?";
  const level = result?.risk.level ?? "Unknown";

  return new NextResponse(buildSvg(score, level), {
    headers: {
      "Content-Type": "image/svg+xml",
      // Short cache so badge updates within an hour of re-scan
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...securityHeaders({ "X-Frame-Options": "ALLOWALL" }),
    },
  });
}
