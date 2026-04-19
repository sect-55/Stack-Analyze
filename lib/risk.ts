import { Rule } from "./rules";

export interface RiskResult {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  percentile: number; // derived from real scan data via leaderboard store
  label: string;
}

export function calculateRisk(tools: Rule[]): RiskResult {
  if (!tools.length) {
    return { score: 1, level: "Low", percentile: 5, label: "Privacy-First Developer" };
  }

  const highRiskTools  = tools.filter((t) => t.risk >= 4);
  const medRiskTools   = tools.filter((t) => t.risk === 3);
  const lowRiskTools   = tools.filter((t) => t.risk <= 2);

  const weighted =
    highRiskTools.length  * 2.0 +
    medRiskTools.length   * 1.2 +
    lowRiskTools.length   * 0.3;

  const raw = (weighted / Math.max(tools.length, 1)) * 2 + highRiskTools.length * 0.4;
  const score = Math.max(1, Math.min(10, Math.round(raw)));

  const level: RiskResult["level"] =
    score <= 3 ? "Low" :
    score <= 5 ? "Medium" :
    score <= 7 ? "High" :
    "Critical";

  const labels: Record<RiskResult["level"], string> = {
    Low:      "Privacy-Conscious Developer",
    Medium:   "Average Exposure",
    High:     "Data-Heavy Developer",
    Critical: "Highly Exposed Stack",
  };

  return { score, level, percentile: 0, label: labels[level] };
}

export function simulateFix(tools: Rule[]): RiskResult {
  const improved = tools.map((t) => ({ ...t, risk: Math.max(1, t.risk - 2) }));
  return calculateRisk(improved);
}

// Derive real percentile from an array of historical scores
export function derivePercentile(score: number, historicalScores: number[]): number {
  if (!historicalScores.length) return 50;
  const below = historicalScores.filter((s) => s < score).length;
  return Math.round((below / historicalScores.length) * 100);
}
