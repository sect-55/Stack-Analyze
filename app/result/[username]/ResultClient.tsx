"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter }   from "next/navigation";
import { AnalysisResult } from "@/lib/types";
import { Rule }           from "@/lib/rules";
import { ScanDiff }       from "@/lib/diff";
import { LeaderboardEntry } from "@/lib/leaderboard";

// ── Pixel decorations (same as home page) ────────────────────────────────────
function PixelCross({ size = 80, color = "#2244ff", className = "" }: {
  size?: number; color?: string; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 5 5" className={className}
      style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="1" height="1" fill={color} />
      <rect x="2" y="1" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="0" y="2" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="1" y="2" width="1" height="1" fill={color} />
      <rect x="2" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="3" y="2" width="1" height="1" fill={color} />
      <rect x="4" y="2" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="2" y="3" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="2" y="4" width="1" height="1" fill={color} />
    </svg>
  );
}
function PixelCluster({ color = "#2244ff" }: { color?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 6 6" style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="0" width="1" height="1" fill={color} />
      <rect x="0" y="1" width="1" height="1" fill={color} />
      <rect x="1" y="1" width="1" height="1" fill="#fff" />
      <rect x="2" y="1" width="1" height="1" fill={color} />
      <rect x="1" y="2" width="1" height="1" fill={color} />
      <rect x="3" y="3" width="1" height="1" fill={color} opacity="0.6" />
      <rect x="4" y="2" width="1" height="1" fill={color} opacity="0.4" />
    </svg>
  );
}
function PixelPlus({ color = "#2244ff" }: { color?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 3 3 3" style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="0" width="1" height="1" fill={color} />
      <rect x="0" y="1" width="1" height="1" fill={color} />
      <rect x="1" y="1" width="1" height="1" fill={color} />
      <rect x="2" y="1" width="1" height="1" fill={color} />
      <rect x="1" y="2" width="1" height="1" fill={color} />
    </svg>
  );
}

// ── Shared UI types ───────────────────────────────────────────────────────────
type Phase      = "loading" | "tension" | "score" | "full";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low:      "var(--cyan)",
  Medium:   "var(--warning)",
  High:     "var(--risk-high)",
  Critical: "var(--danger)",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Analytics:      "#2244ff",
  Monitoring:     "#d97700",
  Auth:           "#7c3aed",
  Hosting:        "#059669",
  Database:       "#dc2626",
  Payments:       "#ea580c",
  Email:          "#2563eb",
  Comms:          "#4466ff",
  CMS:            "#92400e",
  Search:         "#0284c7",
  "Feature Flags":"#7e22ce",
  "A/B Testing":  "#be185d",
  Storage:        "#16a34a",
  Infrastructure: "#c2410c",
  Support:        "#b91c1c",
  CRM:            "#dc2626",
  AI:             "#a21caf",
  DevOps:         "#475569",
  Testing:        "#0f766e",
  Build:          "#b45309",
  Observability:  "#0369a1",
  Framework:      "#1d4ed8",
  "Social Embed": "#e11d48",
  Fonts:          "#6d28d9",
  Maps:           "#0d9488",
  Data:           "#0891b2",
  Styling:        "#c026d3",
  Notifications:  "#f59e0b",
  Security:       "#15803d",
  Media:          "#7c3aed",
  Utility:        "#64748b",
};

// Privacy score: higher = better. risk 1 → priv 10, risk 10 → priv 1.
export function privScore(riskScore: number): number {
  return Math.min(10, Math.max(1, 11 - Math.max(1, riskScore)));
}
export function getRiskEmoji(score: number): string {
  if (score <= 2) return "😎";
  if (score <= 4) return "🙂";
  if (score <= 6) return "😬";
  if (score <= 8) return "😰";
  return "🚨";
}
// Emoji for a PRIVACY score (higher = better)
export function privEmoji(ps: number): string {
  if (ps >= 9) return "😎";
  if (ps >= 7) return "🙂";
  if (ps >= 5) return "😬";
  if (ps >= 3) return "😰";
  return "🚨";
}

const LOAD_STEPS = [
  "Analyzing your dev footprint...",
  "Scanning repositories...",
  "Detecting tracking signals...",
  "Evaluating privacy risks...",
  "Calculating exposure score...",
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = 20, style = {} }: {
  width?: string | number; height?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height,
      background: "linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-surface2) 50%,var(--bg-surface) 75%)",
      backgroundSize: "200% 100%",
      animation: "skeleton-shimmer 1.4s ease-in-out infinite",
      borderRadius: "4px", ...style,
    }} />
  );
}

// ── Share Button ──────────────────────────────────────────────────────────────
function ShareButton({ username, before, after }: { username: string; before: number; after: number }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const share = () => {
    const ps  = privScore(before);
    const psA = privScore(after);
    const isPerfect = ps === 10 && psA === 10;
    const text = isPerfect
      ? `I just scanned my dev stack privacy 👀\n\nPrivacy score: ${ps}/10 ${privEmoji(ps)}\n\nMost devs don't realize what's watching them 👇\n${appUrl}/result/${username}`
      : `I just scanned my dev stack privacy 👀\n\nPrivacy score: ${ps}/10 ${privEmoji(ps)}\nAfter fixes:   ${psA}/10 ${privEmoji(psA)}\n\nMost devs don't realize what's watching them 👇\n${appUrl}/result/${username}`;
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    const popup = window.open(shareUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = shareUrl;
  };

  return (
    <button onClick={share} style={{
      background: "#2244ff",
      border: "none",
      borderRadius: "0", color: "#fff",
      cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
      fontSize: "0.8125rem", padding: "0.625rem 1.25rem",
      transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "0.5rem",
    }}>
      {"\u{1F4CB} share your score"}
    </button>
  );
}

// ── Opt-out Button ────────────────────────────────────────────────────────────
function OptOutButton({ username }: { username: string }) {
  const [state, setState] = useState<"idle" | "confirming" | "done" | "error">("idle");

  const doOptOut = async () => {
    setState("done"); // optimistic
    try {
      await fetch(`/api/opt-out?username=${encodeURIComponent(username)}`, { method: "POST" });
    } catch {
      setState("error");
    }
  };

  if (state === "done") return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
      ✓ opted out — data removed from leaderboard
    </span>
  );

  return state === "confirming" ? (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>Remove from leaderboard?</span>
      <button onClick={doOptOut} style={{ background: "rgba(255,77,106,0.15)", border: "1px solid var(--danger)", borderRadius: "0", color: "var(--danger)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}>yes, remove</button>
      <button onClick={() => setState("idle")} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "0", color: "var(--text-muted)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}>cancel</button>
    </div>
  ) : (
    <button onClick={() => setState("confirming")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: 0, textDecoration: "underline" }}>
      opt out / remove data
    </button>
  );
}


// ── Diff Banner ───────────────────────────────────────────────────────────────
function DiffBanner({ diff, previousScore, currentScore }: { diff: ScanDiff; previousScore: number; currentScore: number }) {
  if (!diff || (diff.added.length === 0 && diff.removed.length === 0 && diff.scoreChange === 0)) return null;

  const improved = diff.scoreChange < 0;
  const color = improved ? "var(--cyan)" : "var(--warning)";
  const bg    = improved ? "rgba(34,68,255,0.06)" : "rgba(180,120,0,0.06)";
  const border= improved ? "rgba(34,68,255,0.2)" : "rgba(180,120,0,0.2)";

  return (
    <div style={{ padding: "1rem 1.25rem", background: bg, border: `1px solid ${border}`, borderRadius: "4px", marginBottom: "1.5rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color, letterSpacing: "0.15em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
        ▸ changes since last scan
      </div>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem" }}>
          <span style={{ color: "var(--text-muted)" }}>score: </span>
          <span style={{ color: "var(--text)", textDecoration: "line-through" }}>{previousScore}</span>
          <span style={{ color: "var(--text-muted)" }}> → </span>
          <span style={{ color, fontWeight: 700 }}>{currentScore} {improved ? "↓ better" : "↑ worse"}</span>
        </div>
        {diff.added.length > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--danger)" }}>+{diff.added.length} added: </span>
            <span style={{ color: "var(--text)" }}>{diff.added.map(t => t.name).join(", ")}</span>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--cyan)" }}>−{diff.removed.length} removed: </span>
            <span style={{ color: "var(--text)" }}>{diff.removed.map(t => t.name).join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard Panel ─────────────────────────────────────────────────────────
interface LeaderboardData { allTime: LeaderboardEntry[]; weekly: LeaderboardEntry[]; totalScans: number; weekKey: string; }

function LeaderboardPanel() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then((d: LeaderboardData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const entries = data ? data.allTime : [];

  return (
    <div style={{ padding: "1.25rem", marginTop: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>// privacy hall of fame</span>
        {data && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {data.totalScans} scanned
          </span>
        )}
      </div>

      {loading && <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} height={28} style={{ animationDelay: `${i*100}ms` }} />)}
      </div>}

      {!loading && entries.length === 0 && (
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
          No scans recorded yet.
        </p>
      )}

      {!loading && entries.map((entry, i) => (
        <div key={entry.username} className="stagger-item stagger-item--visible" style={{ animationDelay: `${i*30}ms`, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}
          onClick={() => router.push(`/result/${entry.username}`)}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)", width: "1.5rem", flexShrink: 0 }}>{i+1}.</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8125rem", color: "var(--cyan)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.username}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8125rem", fontWeight: 700, color: RISK_COLORS[(entry.level as RiskLevel)] ?? "var(--text-muted)", flexShrink: 0 }}>{privScore(entry.score)}/10 {privEmoji(privScore(entry.score))}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{entry.toolCount} tools</span>
        </div>
      ))}
    </div>
  );
}

// ── Tool Card ─────────────────────────────────────────────────────────────────
function ToolCard({ tool, index, isNew = false }: { tool: Rule; index: number; isNew?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dotColor  = CATEGORY_COLORS[tool.category] ?? "var(--text-muted)";
  const riskLevel: RiskLevel = tool.risk >= 5 ? "Critical" : tool.risk >= 4 ? "High" : tool.risk >= 3 ? "Medium" : "Low";
  const riskColor = RISK_COLORS[riskLevel];

  return (
    <div
      ref={ref}
      className={`stagger-item${visible ? " stagger-item--visible" : ""}`}
      style={{
        animationDelay: `${index*40}ms`, padding: "0.875rem 1.125rem", cursor: "pointer",
        background: "var(--bg-surface)",
        border: `1px solid ${isNew ? "rgba(255,77,106,0.4)" : "var(--border)"}`,
        borderLeft: isNew ? `3px solid var(--danger)` : `3px solid transparent`,
        borderRadius: "4px",
        transition: "border-color 0.15s ease",
      }} onClick={() => setExpanded(!expanded)}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,68,255,0.3)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isNew ? "rgba(229,51,84,0.4)" : "var(--border)"; }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          <span className="cat-dot" style={{ background: dotColor, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {tool.name}{isNew && <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "3px", padding: "0 0.3rem" }}>NEW</span>}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.tracks}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-surface2)", border: "1px solid var(--border)", borderRadius: "4px", padding: "0.125rem 0.5rem" }}>{tool.category}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 700, color: riskColor }}>{tool.risk}/5</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", display: "inline-block" }}>▾</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.875rem", lineHeight: 1.6 }}>{tool.detail}</p>
          {tool.alternatives.length > 0 && (
            <div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--cyan)", display: "block", marginBottom: "0.5rem" }}>// better alternatives</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {tool.alternatives.map(alt => (
                  <span key={alt} style={{ background: "rgba(34,68,255,0.07)", border: "1px solid rgba(34,68,255,0.2)", borderRadius: "4px", color: "var(--cyan)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}>{alt}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolSkeleton({ index }: { index: number }) {
  return (
    <div style={{ padding: "0.875rem 1.125rem", animationDelay: `${index*80}ms`, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Skeleton width={8} height={8} style={{ borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="65%" height={12} />
        </div>
        <Skeleton width={60} height={20} />
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

interface Props {
  username:     string;
  initialData:  AnalysisResult | null;
  isFreshScan:  boolean;
}

export default function ResultClient({ username, initialData, isFreshScan }: Props) {
  const router = useRouter();

  const [loadStep, setLoadStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState<Phase>(
    // If server handed us data and it's not a fresh scan, jump straight to full
    initialData && !isFreshScan ? "full" : "loading"
  );
  const [data, setData]         = useState<AnalysisResult | null>(initialData ?? null);
  const [error, setError]       = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const riskLevel = (data?.risk.level ?? "Low") as RiskLevel;
  const riskColor = RISK_COLORS[riskLevel];
  const categories = data ? ["All", ...Array.from(new Set(data.tools.map(t => t.category)))] : [];
  const filteredTools = data
    ? (activeCategory === "All" ? data.tools : data.tools.filter(t => t.category === activeCategory))
    : [];
  const isPerfectScore = data ? privScore(data.risk.score) === 10 && privScore(data.improved.score) === 10 : false;

  const newToolNames = new Set((data?.diff?.added ?? []).map(t => t.name));

  const doFetch = useCallback(() => {
    const stepInterval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 700);
    const progInterval = setInterval(() => setProgress(p => { if (p >= 85) { clearInterval(progInterval); return p; } return p + Math.random() * 8; }), 300);

    fetch(`/api/analyze?username=${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) throw new Error("GitHub user not found");
        if (!res.ok) return res.json().then((d: { error?: string }) => Promise.reject(d.error ?? "Error"));
        return res.json() as Promise<AnalysisResult>;
      })
      .then(result => {
        clearInterval(stepInterval);
        clearInterval(progInterval);
        setProgress(100);
        setTimeout(() => { setPhase("tension"); setData(result); }, 400);
        setTimeout(() => setPhase("score"),  1600);
        setTimeout(() => setPhase("full"),   3200);
      })
      .catch((err: unknown) => {
        clearInterval(stepInterval);
        clearInterval(progInterval);
        setError(typeof err === "string" ? err : "Failed to analyze.");
      });

    return () => { clearInterval(stepInterval); clearInterval(progInterval); };
  }, [username]);

  useEffect(() => {
    // Only run client-side fetch for fresh scans or if server returned no data
    if (phase === "loading") return doFetch();
  }, [phase, doFetch]);

  if (error) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: "480px", width: "100%", padding: "2rem", textAlign: "center", background: "var(--bg-surface)", border: "1px solid rgba(255,77,106,0.4)", borderRadius: "4px", boxShadow: "0 0 30px rgba(255,77,106,0.08)" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "2rem", marginBottom: "1rem" }}>⚠</div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--danger)", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push("/")}>← try again</button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem 4rem", position: "relative", zIndex: 1, overflow: "hidden" }}>
      <style>{`
        @keyframes skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes shimmer-bar{0%{background-position:0% 0%}100%{background-position:200% 0%}}
        @keyframes float-y{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @media (max-width: 640px) {
          .result-deco { display: none !important; }
          .stats-3-grid { gap: 0.5rem !important; }
          .stats-3-grid > div { padding: 0.75rem 0.375rem !important; }
          .stat-num { font-size: 1.2rem !important; }
          .stat-lbl { font-size: 0.6rem !important; }
          .score-compare { flex-direction: column !important; align-items: center !important; gap: 0.75rem !important; }
          .score-compare .arrow-sep { display: none !important; }
          .score-compare .gain-pill { border-left: none !important; border-top: 1px solid var(--border) !important; padding-left: 0 !important; padding-top: 0.5rem !important; }
          .result-inner { padding-left: 0 !important; padding-right: 0 !important; }
          .nav-username { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        }
      `}</style>

      {/* Progress bar */}

      {/* ── Large pixel cross — top right ── */}
      <div className="result-deco" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 0, animation: "float-y 4s ease-in-out infinite", pointerEvents: "none" }}>
        <PixelCross size={110} color="#2244ff" />
      </div>

      {/* ── Small pixel cross — mid left ── */}
      <div className="result-deco" style={{ position: "fixed", top: "35%", left: "40px", zIndex: 0, opacity: 0.7, animation: "float-y 5s ease-in-out infinite 1s", pointerEvents: "none" }}>
        <PixelCross size={44} color="#2244ff" />
      </div>

      {/* ── Pixel cluster — bottom left ── */}
      <div className="result-deco" style={{ position: "fixed", bottom: "60px", left: "60px", zIndex: 0, animation: "float-y 6s ease-in-out infinite 0.5s", pointerEvents: "none" }}>
        <PixelCluster color="#2244ff" />
      </div>

      {/* ── Small plus — bottom right ── */}
      <div className="result-deco" style={{ position: "fixed", bottom: "80px", right: "160px", zIndex: 0, opacity: 0.4, pointerEvents: "none" }}>
        <PixelPlus color="#2244ff" />
      </div>

      <div className="result-inner" style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem", paddingTop: "1.25rem" }}>
          <button className="result-back-btn" onClick={() => router.push("/")} style={{ background: "#2244ff", border: "none", borderRadius: "0", color: "#fff", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", fontWeight: 700, padding: "0.6rem 1.4rem", transition: "all 0.15s ease", whiteSpace: "nowrap" }}
            >
            back <span className="cta-arrow">{"<-"}</span>
          </button>
          <span className="nav-username" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            github.com/<span style={{ color: "var(--cyan)" }}>{username}</span>
          </span>
        </div>

        {/* LOADING */}
        {phase === "loading" && (
          <div className="fade-in scan-container" style={{
            textAlign: "center", padding: "5rem 2rem",
            borderRadius: "4px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}>
            {/* Pixel scanning indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 3 3" style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="0" width="1" height="1" fill="#2244ff" style={{ animation: "glow-pulse 1.5s ease-in-out infinite" }} />
                <rect x="0" y="1" width="1" height="1" fill="#2244ff" style={{ animation: "glow-pulse 1.5s ease-in-out infinite 0.2s" }} />
                <rect x="1" y="1" width="1" height="1" fill="#2244ff" style={{ animation: "glow-pulse 1.5s ease-in-out infinite 0.1s" }} />
                <rect x="2" y="1" width="1" height="1" fill="#2244ff" style={{ animation: "glow-pulse 1.5s ease-in-out infinite 0.3s" }} />
                <rect x="1" y="2" width="1" height="1" fill="#2244ff" style={{ animation: "glow-pulse 1.5s ease-in-out infinite 0.15s" }} />
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", color: "var(--cyan)", letterSpacing: "0.15em", fontWeight: 600 }}>
                SCANNING
              </span>
            </div>
            <div key={loadStep} className="fade-in" style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "1rem",
              color: "var(--text)",
              marginBottom: "3rem",
              minHeight: "1.5em",
            }}>
              {LOAD_STEPS[loadStep]}<span className="cursor" />
            </div>
            <div className="progress-track" style={{ maxWidth: "340px", margin: "0 auto" }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.875rem", letterSpacing: "0.05em" }}>
              {Math.round(progress)}% complete
            </div>
          </div>
        )}

        {/* TENSION */}
        {phase === "tension" && (
          <div className="fade-in" style={{
            textAlign: "center", padding: "5rem 2rem",
            borderRadius: "4px",
            background: "var(--bg-surface)",
            border: "1px solid rgba(34,68,255,0.2)",
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "1.125rem",
              color: "var(--cyan)",
              letterSpacing: "0.02em",
            }}>
              We found hidden signals in your stack...
            </p>
          </div>
        )}

        {/* SCORE + FULL */}
        {(phase === "score" || phase === "full") && data && (
          <>
            <div className="score-reveal" style={{
              padding: "2.5rem 2rem", textAlign: "center", marginBottom: "1.5rem",
              background: "var(--bg-surface)",
              borderRadius: "4px",
              border: `1px solid ${riskColor}55`,
              boxShadow: `0 0 40px ${riskColor}18, inset 0 0 40px ${riskColor}06`,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem",
                color: "var(--text-muted)", letterSpacing: "0.18em", marginBottom: "1.25rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}>
                <span style={{ display: "inline-block", width: "4px", height: "4px", background: riskColor, borderRadius: "1px" }} />
                TRACKING EXPOSURE SCORE
                <span style={{ display: "inline-block", width: "4px", height: "4px", background: riskColor, borderRadius: "1px" }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(4rem,12vw,7rem)", fontWeight: 700, lineHeight: 1, color: riskColor, marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>
                {privScore(data.risk.score)}<span style={{ fontSize: "0.35em", color: "var(--text-muted)" }}>/10</span>
                <span style={{ fontSize: "0.5em", marginLeft: "0.25em" }}>{privEmoji(privScore(data.risk.score))}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1rem", color: riskColor, fontWeight: 600, marginBottom: "0.5rem" }}>{data.risk.label}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.9375rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Better privacy than <strong style={{ color: "var(--text)" }}>{100 - data.risk.percentile}%</strong> of developers scanned
              </div>

              {phase === "full" && !isPerfectScore && (
                <div className="fade-in score-compare" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "1.25rem 1.5rem", background: "rgba(34,68,255,0.05)", border: "1px solid rgba(34,68,255,0.15)", borderRadius: "3px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {privScore(data.risk.score) === 10 && privScore(data.improved.score) === 10 ? (
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: "clamp(2rem, 6vw, 3.2rem)",
                      fontWeight: 700,
                      color: "var(--cyan)",
                      letterSpacing: "-0.02em",
                      textAlign: "center",
                    }}>
                      You are great 😎
                    </div>
                  ) : (
                    <>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>CURRENT</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.75rem", fontWeight: 700, color: riskColor }}>{privScore(data.risk.score)}/10 {privEmoji(privScore(data.risk.score))}</div>
                  </div>
                  <div className="arrow-sep" style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}>→</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>AFTER FIX</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.75rem", fontWeight: 700, color: "var(--cyan)" }}>{privScore(data.improved.score)}/10 {privEmoji(privScore(data.improved.score))}</div>
                  </div>
                  <div className="gain-pill" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "var(--cyan)", fontWeight: 600, paddingLeft: "0.5rem", borderLeft: "1px solid var(--border)" }}>
                    +{Math.round(((privScore(data.improved.score) - privScore(data.risk.score)) / Math.max(privScore(data.risk.score), 1)) * 100)}%
                    <br /><span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.8125rem" }}>privacy gain</span>
                  </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {phase === "full" && (
              <>
                {/* Diff banner */}
                {data.diff && data.previousScore !== undefined && (
                  <DiffBanner diff={data.diff} previousScore={data.previousScore} currentScore={data.risk.score} />
                )}

                {/* Stats */}
                <div className="fade-in stats-3-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {([
                    { label: "repos scanned",  value: data.repoCount,                               color: "var(--cyan)",    border: "rgba(34,68,255,0.2)" },
                    { label: "tools detected",  value: data.tools.length,                            color: riskColor,        border: "rgba(34,68,255,0.2)" },
                    { label: "high-risk tools", value: data.tools.filter(t => t.risk >= 4).length,  color: "var(--danger)",  border: "rgba(229,51,84,0.2)" },
                  ] as const).map(({ label, value, color, border }) => (
                    <div key={label} style={{
                      padding: "1.25rem 1rem", textAlign: "center",
                      background: "var(--bg-surface)",
                      border: `1px solid ${border}`,
                      borderRadius: "4px",
                    }}>
                      <div className="stat-num" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.75rem", fontWeight: 700, color, letterSpacing: "-0.03em" }}>{value}</div>
                      <div className="stat-lbl" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.3rem", letterSpacing: "0.08em" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {data.tools.length > 0 ? (
                  <div className="fade-in">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                      <h2 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.12em", margin: 0, textTransform: "uppercase" }}>
                        // detected tools ({data.tools.length})
                      </h2>
                      <ShareButton username={username} before={data.risk.score} after={data.improved.score} />
                    </div>

                    {/* Category filter */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                          background:   activeCategory === cat ? "rgba(34,68,255,0.08)" : "transparent",
                          border:       `1px solid ${activeCategory === cat ? "rgba(34,68,255,0.35)" : "var(--border)"}`,
                          borderRadius: "0",
                          color:        activeCategory === cat ? "var(--cyan)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                          padding: "0.2rem 0.625rem",
                          transition: "all 0.12s ease",
                        }}>
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {filteredTools.length > 0
                        ? filteredTools.map((tool, i) => <ToolCard key={tool.name} tool={tool} index={i} isNew={newToolNames.has(tool.name)} />)
                        : [...Array(3)].map((_, i) => <ToolSkeleton key={i} index={i} />)
                      }
                    </div>


                    <LeaderboardPanel />

                    {/* CTA */}
                    {!isPerfectScore && (
                    <div style={{ marginTop: "2.5rem", padding: "1.5rem", background: "rgba(34,68,255,0.04)", border: "1px solid rgba(34,68,255,0.14)", borderRadius: "4px", textAlign: "center" }}>
                      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9375rem", color: "var(--text)", marginBottom: "0.5rem", fontWeight: 600 }}>
                        Good news — you can fix this quickly 👇
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                        Replace {Math.min(3, data.tools.filter(t => t.risk >= 4).length)} high-risk tools → boost from{" "}
                        <strong style={{ color: riskColor }}>{privScore(data.risk.score)}</strong> to{" "}
                        <strong style={{ color: "var(--cyan)" }}>{privScore(data.improved.score)}</strong>
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <ShareButton username={username} before={data.risk.score} after={data.improved.score} />
                        <button className="btn-primary scan-another-btn" onClick={() => router.push("/")}>scan another <span className="cta-arrow">-&gt;</span></button>
                      </div>
                    </div>
                    )}

                  </div>
                ) : (
                  <div className="fade-in" style={{ padding: "3rem 2rem", textAlign: "center", background: "var(--bg-surface)", border: "1px solid rgba(34,68,255,0.15)", borderRadius: "4px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😎</div>
                    <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1rem", color: "var(--cyan)", fontWeight: 600 }}>Privacy-first developer detected</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>No tracking-heavy tools found in public repos.</p>
                    <LeaderboardPanel />
                  </div>
                )}

                {isPerfectScore && (
                  <>
                    <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <ShareButton username={username} before={data.risk.score} after={data.improved.score} />
                      <button className="btn-primary scan-another-btn" onClick={() => router.push("/")}>scan another <span className="cta-arrow">-&gt;</span></button>
                    </div>
                    <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                      <OptOutButton username={username} />
                    </div>
                  </>
                )}

                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", color: "var(--text-dim)", textAlign: "center", marginTop: "3rem", letterSpacing: "0.06em" }}>
                  // public data only · no private repos · no data stored<br />
                  scanned {data.repoCount} repos · {new Date(data.analyzedAt).toLocaleTimeString()}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}


