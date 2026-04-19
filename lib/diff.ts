/**
 * Diff two scan results to show what changed between scans.
 * Powers the "you added X since last week" retention hook.
 */

import { Rule } from "./rules";

export interface ScanDiff {
  added:    Rule[];   // tools in current but not previous
  removed:  Rule[];   // tools in previous but not current
  unchanged: Rule[];
  scoreChange: number;  // positive = worse, negative = better
}

export function diffScans(
  current:  Rule[],
  previous: Rule[],
  currentScore:  number,
  previousScore: number,
): ScanDiff {
  const prevNames = new Set(previous.map((t) => t.name));
  const currNames = new Set(current.map((t) => t.name));

  return {
    added:    current.filter((t) => !prevNames.has(t.name)),
    removed:  previous.filter((t) => !currNames.has(t.name)),
    unchanged: current.filter((t) => prevNames.has(t.name)),
    scoreChange: currentScore - previousScore,
  };
}

export function hasMeaningfulDiff(diff: ScanDiff): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.scoreChange !== 0;
}
