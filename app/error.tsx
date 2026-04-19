"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Runtime error:", error); }, [error]);

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", position: "relative", zIndex: 1, textAlign: "center",
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(255,77,106,0.4)",
        borderRadius: "6px", padding: "2.5rem 2rem",
        maxWidth: "480px", width: "100%",
        boxShadow: "0 0 30px rgba(255,77,106,0.08)",
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", marginBottom: "1rem" }}>⚠</div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9375rem", color: "var(--danger)", marginBottom: "0.5rem", fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1.5rem" }}>
          {error.message ?? "Unexpected runtime error"}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
            try again
          </button>
          <Link href="/" style={{ background: "var(--cyan-dim)", border: "none", borderRadius: "3px", color: "#000", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8125rem", fontWeight: 700, padding: "0.5rem 1rem", textDecoration: "none" }}>
            ← home
          </Link>
        </div>
      </div>
    </main>
  );
}
