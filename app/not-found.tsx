import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", position: "relative", zIndex: 1, textAlign: "center",
    }}>
      {/* Pixel cross decoration */}
      <div style={{ position: "fixed", top: "30px", right: "60px", opacity: 0.4, pointerEvents: "none" }}>
        <svg width="70" height="70" viewBox="0 0 5 5" style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="0" width="1" height="1" fill="#3a7fff" />
          <rect x="2" y="1" width="1" height="1" fill="#3a7fff" />
          <rect x="0" y="2" width="1" height="1" fill="#3a7fff" />
          <rect x="1" y="2" width="1" height="1" fill="#3a7fff" />
          <rect x="2" y="2" width="1" height="1" fill="#ffffff" />
          <rect x="3" y="2" width="1" height="1" fill="#3a7fff" />
          <rect x="4" y="2" width="1" height="1" fill="#3a7fff" />
          <rect x="2" y="3" width="1" height="1" fill="#3a7fff" />
          <rect x="2" y="4" width="1" height="1" fill="#3a7fff" />
        </svg>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "6rem", fontWeight: 700,
        color: "var(--border)", lineHeight: 1, marginBottom: "1.5rem",
        letterSpacing: "-0.04em",
      }}>
        404
      </div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
        // page not found
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "2rem", fontFamily: "'Space Grotesk', sans-serif" }}>
        That username or route doesn&apos;t exist.
      </p>
      <Link href="/" style={{
        background: "var(--cyan-dim)", border: "none", color: "#000",
        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem",
        fontWeight: 700, padding: "0.625rem 1.5rem", borderRadius: "3px",
        textDecoration: "none", transition: "all 0.15s ease",
      }}>
        ← scan a username
      </Link>
    </main>
  );
}
