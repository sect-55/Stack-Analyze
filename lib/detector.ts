import { RULES, Rule } from "./rules";

/**
 * Match strategy (fixes false positives):
 *
 * For a dep like "stripe-python" and rule match "stripe":
 *   EXACT:   "stripe"          === "stripe"           ✓
 *   SCOPED:  "@stripe/stripe-js" → strip @scope      → "stripe-js" — no match to "stripe" ✓
 *   PREFIX:  "stripe-python"   startsWith "stripe-"   ✓  (hyphen boundary)
 *   NO:      "constrained"     includes "stripe"       ✗  (blocked — no boundary)
 *
 * We also handle scoped packages: "@firebase/app" → match against "firebase"
 */
export function detectTools(repos: { name: string; deps: string[] }[]): Rule[] {
  const found = new Map<string, Rule>();

  for (const repo of repos) {
    for (const rawDep of repo.deps) {
      const dep = rawDep.toLowerCase().trim();
      if (!dep) continue;

      // Strip leading @ scope for matching: "@firebase/app" → "firebase/app"
      const unscoped = dep.startsWith("@") ? dep.slice(1) : dep;
      // e.g. "firebase/app" → root = "firebase"
      const root = unscoped.split("/")[0];

      for (const rule of RULES) {
        const m = rule.match.toLowerCase();

        // Don't re-add already-found rules
        if (found.has(rule.name)) continue;

        const matched =
          dep       === m ||          // exact full match
          root      === m ||          // scoped package root match
          dep.startsWith(m + "-") ||  // hyphen-prefixed: stripe-python, sentry-sdk
          dep.startsWith(m + "/") ||  // slash-prefixed: firebase/admin
          unscoped.startsWith(m + "-") ||
          unscoped.startsWith(m + "/");

        if (matched) found.set(rule.name, rule);
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => b.risk - a.risk);
}
