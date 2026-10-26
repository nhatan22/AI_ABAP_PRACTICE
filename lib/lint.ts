import { lintAbap } from "./abap-lint";
import { lintUi5 } from "./js-lint";
import type { LintResult, TrackName } from "./schemas";

export function lintFor(track: TrackName, code: string): LintResult {
  return track === "ABAP" ? lintAbap(code) : lintUi5(code);
}
