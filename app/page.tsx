"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Pixel cross SVG — exact match to the image ────────────────────────────── */
function PixelCross({ size = 80, color = "#3a7fff", className = "" }: {
  size?: number; color?: string; className?: string;
}) {
  const u = Math.round(size / 5); // unit pixel size
  return (
    <svg width={size} height={size} viewBox={`0 0 5 5`} className={className}
      style={{ imageRendering: "pixelated" }}
      xmlns="http://www.w3.org/2000/svg">
      {/* Cross shape: col 2, rows 0-4 + row 2, cols 0-4 */}
      <rect x="2" y="0" width="1" height="1" fill={color} />
      <rect x="2" y="1" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="0" y="2" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="1" y="2" width="1" height="1" fill={color} />
      <rect x="2" y="2" width="1" height="1" fill="#ffffff" /> {/* bright center */}
      <rect x="3" y="2" width="1" height="1" fill={color} />
      <rect x="4" y="2" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="2" y="3" width="1" height="1" fill={color} opacity="0.9" />
      <rect x="2" y="4" width="1" height="1" fill={color} />
    </svg>
  );
}

/* ── Small pixel cluster — bottom-left of image ────────────────────────────── */
function PixelCluster({ color = "#3a7fff" }: { color?: string }) {
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

/* ── Small + sign — bottom-right ───────────────────────────────────────────── */
function PixelPlus({ color = "#2a3f5f" }: { color?: string }) {
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

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`/api/analyze?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      router.push(`/result/${encodeURIComponent(username.trim())}?fresh=1`);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      position: "relative",
      zIndex: 1,
      overflow: "hidden",
    }}>

      {/* ── Top shimmer bar ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes shimmer-bar { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }
        @keyframes ping-ring   { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
        @keyframes float-y     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      `}</style>



      {/* ── Big pixel cross — top right (matches image exactly) ────────────── */}
      <div style={{
        position: "fixed", top: "24px", right: "60px",
        animation: "float-y 4s ease-in-out infinite",
        zIndex: 1,
      }}>
        <PixelCross size={110} color="#2244ff" />
      </div>

      {/* ── Small pixel cluster — mid left ─────────────────────────────────── */}
      <div style={{
        position: "fixed", left: "80px", top: "52%",
        animation: "float-y 5s ease-in-out infinite 1s",
        zIndex: 1, opacity: 0.7,
      }}>
        <PixelCross size={44} color="#2244ff" />
      </div>

      {/* ── Pixel cluster — bottom left ─────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: "100px", left: "120px",
        animation: "float-y 6s ease-in-out infinite 0.5s",
        zIndex: 1,
      }}>
        <PixelCluster color="#2244ff" />
      </div>

      {/* ── Small plus — bottom right ───────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: "80px", right: "160px",
        opacity: 0.4, zIndex: 1,
      }}>
        <PixelPlus color="#2244ff" />
      </div>



      {/* ── Hero content ────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: "680px",
        width: "100%",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
      }}>

        {/* Label pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--cyan)",
          background: "rgba(34, 68, 255, 0.06)",
          border: "1px solid rgba(34, 68, 255, 0.2)",
          borderRadius: "3px",
          padding: "0.3rem 1rem",
          marginBottom: "2rem",
          letterSpacing: "0.12em",
        }}>
          <span>▸</span>
          <span>STACK PRIVACY ANALYZER</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 700,
          lineHeight: 1.08,
          marginBottom: "1.25rem",
          letterSpacing: "-0.02em",
        }}>
          <span style={{ color: "var(--text)" }}>Your stack is</span>
          <br />
          <span style={{ color: "var(--cyan)" }}>
            watching you.
          </span>
        </h1>

        {/* Subhead */}
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: "var(--text-muted)",
          fontSize: "1.1rem",
          lineHeight: 1.65,
          marginBottom: "0.75rem",
          fontWeight: 400,
        }}>
          Scan your GitHub repos. Find out which tools are tracking your users, what data
          they collect, and how to fix it.
        </p>

        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.9rem",
          color: "var(--text-dim)",
          marginBottom: "2.75rem",
          letterSpacing: "0.02em",
        }}>
          // most developers don&apos;t realize what&apos;s in their stack
        </p>

        {/* Input row — pixel-art border with stepped corners */}
        <form onSubmit={handleSubmit}>
          {/* Wrapper carries the glow so drop-shadow follows the pixel shape */}
          <div style={{
            filter: error
              ? "drop-shadow(0 0 6px rgba(255,77,106,0.35))"
              : "drop-shadow(0 0 8px rgba(34,68,255,0.28))",
            transition: "filter 0.2s",
          }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg)",
            border: error ? "3px solid var(--danger)" : "3px solid rgba(34,68,255,0.85)",
            borderRadius: "0",
            padding: "4px 4px 4px 0",
            clipPath: "polygon(0 8px,8px 8px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 8px) calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 8px),0 calc(100% - 8px))",
            transition: "border-color 0.2s",
          }}>
            {/* Pixel icon on left */}
            <div style={{
              display: "flex", alignItems: "center",
              paddingLeft: "0.875rem",
              paddingRight: "0.5rem",
              flexShrink: 0,
            }}>
              <PixelCluster color="#2244ff" />
            </div>

            {/* Prefix */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              flexShrink: 0,
              paddingRight: "0.25rem",
            }}>
              github.com/
            </span>

            {/* Input */}
            <input
              className="gh-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />

            {/* Analyze button */}
            <button
              type="submit"
              disabled={loading}
              className="analyze-btn"
              style={{
                background: "#2244ff",
                border: "none",
                borderRadius: "0",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.875rem",
                fontWeight: 700,
                padding: "0.6rem 1.4rem",
                flexShrink: 0,
                opacity: 1,
                boxShadow: "inset 0 0 0 1px rgba(34,68,255,0.22)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Scanning..." : <>Analyze <span className="analyze-arrow">-&gt;</span></>}
            </button>
          </div>
          </div>

          {error && (
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
              color: "var(--danger)",
              marginTop: "0.625rem",
              textAlign: "left",
            }}>
              ! {error}
            </p>
          )}
        </form>

        {/* Stats row */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "0",
          marginTop: "3.5rem",
          paddingTop: "2.5rem",
          borderTop: "1px solid var(--border)",
        }}>
          {[
            { value: "100+",  label: "tools tracked" },
            { value: "5 sec", label: "scan time" },
            { value: "free",  label: "no sign-up" },
          ].map(({ value, label }, i) => (
            <div key={label} style={{
              textAlign: "center",
              flex: 1,
              padding: "0 1.5rem",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 700,
                color: "var(--cyan)",
                letterSpacing: "-0.03em",
              }}>
                {value}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "0.2rem",
                fontWeight: 400,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.82rem",
          color: "var(--text-dim)",
          marginTop: "2.5rem",
          letterSpacing: "0.02em",
        }}>
          // uses public GitHub data only // no private repos accessed // no data stored
        </p>
      </div>
    </main>
  );
}

