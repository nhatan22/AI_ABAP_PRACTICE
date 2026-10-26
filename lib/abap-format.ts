/**
 * Small ABAP pretty-printer: re-indents blocks (2 spaces), normalises whitespace.
 * It never changes keyword case or touches code inside strings/comments.
 */

const OPEN = new Set(["IF", "LOOP", "DO", "WHILE", "TRY", "METHOD", "FORM", "FUNCTION", "INTERFACE", "AT"]);
const CLOSE = new Set(["ENDIF", "ENDLOOP", "ENDDO", "ENDWHILE", "ENDTRY", "ENDMETHOD", "ENDFORM", "ENDFUNCTION", "ENDINTERFACE", "ENDAT"]);
const MID_ELSE = new Set(["ELSE", "ELSEIF", "CATCH", "CLEANUP"]);
const SECTION = /^(PUBLIC|PROTECTED|PRIVATE)\s+SECTION\b/i;

function stripped(line: string): string {
  // blank strings and drop trailing comment, only to analyse structure
  return line
    .replace(/'(?:[^']|'')*'|`(?:[^`]|``)*`|\|[^|]*\|/g, (m) => " ".repeat(m.length))
    .replace(/".*$/, "")
    .trim();
}

export function formatAbap(code: string): string {
  const out: string[] = [];
  let level = 0;
  const caseStack: number[] = []; // CASE levels
  let classLevel = -1;
  let beginOfDepth = 0;
  let continuation = false;
  let blank = 0;

  for (const raw of code.replace(/\t/g, "  ").split(/\r?\n/)) {
    const trimmedRight = raw.replace(/\s+$/, "");
    const line = trimmedRight.trim();

    if (!line) {
      blank++;
      if (blank <= 1 && out.length) out.push("");
      continue;
    }
    blank = 0;

    if (trimmedRight.startsWith("*")) {
      out.push(trimmedRight); // full-line comment stays in column 1
      continue;
    }

    const s = stripped(line);
    const word = (s.match(/^[A-Za-z_\-]+/)?.[0] ?? "").toUpperCase();
    const isEndOfBegin = /^(?:(?:TYPES|DATA|CONSTANTS|STATICS|CLASS-DATA)\s*:?\s*)?END\s+OF\b/i.test(s);
    const isBeginOf = /^(?:(?:TYPES|DATA|CONSTANTS|STATICS|CLASS-DATA)\s*:?\s*)?BEGIN\s+OF\b/i.test(s);

    let indent = level;
    if (!continuation) {
      if (CLOSE.has(word)) {
        level = Math.max(0, level - 1);
        indent = level;
        if (word === "ENDLOOP" || word === "ENDIF") {
          /* nothing extra */
        }
      } else if (word === "ENDCASE") {
        level = caseStack.pop() ?? Math.max(0, level - 2);
        indent = level;
      } else if (word === "ENDCLASS") {
        level = Math.max(0, classLevel);
        indent = level;
      } else if (MID_ELSE.has(word)) {
        indent = Math.max(0, level - 1);
      } else if (word === "WHEN") {
        indent = level - 1;
      } else if (SECTION.test(s)) {
        level = (classLevel >= 0 ? classLevel : level) + 1;
        indent = level;
        level += 1;
      } else if (isEndOfBegin) {
        level = Math.max(0, level - 1);
        indent = level;
        beginOfDepth = Math.max(0, beginOfDepth - 1);
      }
    } else {
      indent = level + 2;
    }

    out.push(" ".repeat(indent * 2) + line);

    if (!continuation) {
      if (word === "CASE") {
        caseStack.push(level);
        level += 2;
      } else if (word === "CLASS" && /\b(DEFINITION|IMPLEMENTATION)\b/i.test(s) && !/\b(DEFERRED|LOAD)\b/i.test(s)) {
        classLevel = level;
        level += 1;
      } else if (OPEN.has(word) && !(word === "AT" && !/^AT\s+(FIRST|LAST|NEW|END\s+OF)\b/i.test(s))) {
        level += 1;
      } else if (isBeginOf) {
        level += 1;
        beginOfDepth++;
      }
    }

    // Does the statement continue on the next line?
    continuation = s.length > 0 && !/[.]$/.test(s) && !/[,:]$/.test(s) ? true : false;
    if (/[,]$/.test(s) && beginOfDepth === 0) continuation = false;
  }

  return out.join("\n").replace(/\n+$/, "") + "\n";
}
