// Sanity check: every reference solution / starter must pass our own static checker without errors.
import { abapA } from "../prisma/data/abap-a";
import { abapB } from "../prisma/data/abap-b";
import { ui5 } from "../prisma/data/ui5";
import { lintFor } from "../lib/lint";
import { formatAbap } from "../lib/abap-format";

let bad = 0;
for (const ex of [...abapA, ...abapB, ...ui5]) {
  for (const [kind, code] of [["starter", ex.starterCode], ["solution", ex.solution]] as const) {
    // Solutions of some ABAP exercises are method/class fragments; wrap loosely only for the checker.
    const r = lintFor(ex.track, code);
    const errors = r.issues.filter((i) => i.severity === "error");
    if (errors.length) {
      bad++;
      console.log(`✗ ${ex.slug} [${kind}]`);
      errors.forEach((e) => console.log(`    L${e.line}: ${e.message}`));
    }
    if (ex.track === "ABAP") {
      const once = formatAbap(code);
      if (formatAbap(once) !== once) {
        console.log(`~ ${ex.slug} [${kind}] formatter not idempotent`);
      }
    }
  }
}
console.log(bad ? `${bad} problems` : "all good");
