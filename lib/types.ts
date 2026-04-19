import { Rule } from "./rules";
import { RiskResult } from "./risk";
import { ScanDiff } from "./diff";

export interface AnalysisResult {
  username:    string;
  tools:       Rule[];
  risk:        RiskResult;
  improved:    RiskResult;
  repoCount:   number;
  analyzedAt:  string;
  diff?:       ScanDiff;          // present if a previous scan exists
  previousScore?: number;         // for quick display without full diff object
}
