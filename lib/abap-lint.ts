import type { LintIssue, LintResult } from "./schemas";

/**
 * Lightweight static checker for ABAP. It is NOT a real compiler (there is no SAP system
 * behind this app) – it catches structural mistakes quickly and flags performance smells.
 * The AI review does the deeper "compile in your head" pass.
 */

type Stmt = { text: string; line: number };

/** Strip comments and blank out string literals while keeping line structure. */
function sanitize(code: string, issues: LintIssue[]): string[] {
  const out: string[] = [];
  const lines = code.split(/\r?\n/);
  let inTemplate = false; // multi-line |...| strings are legal
  lines.forEach((raw, idx) => {
    if (!inTemplate && raw.startsWith("*")) {
      out.push("");
      return;
    }
    let res = "";
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (inTemplate) {
        if (ch === "\\") {
          i += 2;
          res += "  ";
          continue;
        }
        if (ch === "|") inTemplate = false;
        res += " ";
        i++;
        continue;
      }
      if (ch === '"') break; // comment to end of line
      if (ch === "'" || ch === "`") {
        const quote = ch;
        let j = i + 1;
        let closed = false;
        while (j < raw.length) {
          if (raw[j] === quote) {
            if (raw[j + 1] === quote) {
              j += 2;
              continue;
            }
            closed = true;
            break;
          }
          j++;
        }
        if (!closed) {
          issues.push({ line: idx + 1, severity: "error", message: `Chuỗi ${quote}...${quote} chưa được đóng.` });
          res += quote + " ".repeat(raw.length - i - 1);
          i = raw.length;
          break;
        }
        res += quote + " ".repeat(j - i - 1) + quote;
        i = j + 1;
        continue;
      }
      if (ch === "|") {
        inTemplate = true;
        res += " ";
        i++;
        continue;
      }
      res += ch;
      i++;
    }
    out.push(res);
  });
  if (inTemplate) {
    issues.push({ line: lines.length, severity: "error", message: "String template |...| chưa được đóng." });
  }
  return out;
}

function splitStatements(lines: string[]): { stmts: Stmt[]; trailing: Stmt | null } {
  const stmts: Stmt[] = [];
  let buf = "";
  let startLine = 0;
  lines.forEach((line, idx) => {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (!buf.trim() && ch.trim()) startLine = idx + 1;
      // A '.' ends a statement unless it sits inside a number/qualified name like 1.5 or a=>b.c
      if (ch === ".") {
        const next = line[i + 1];
        const prev = line[i - 1];
        const isDecimal = /\d/.test(prev ?? "") && /\d/.test(next ?? "");
        if (!isDecimal && (next === undefined || /\s/.test(next) || next === '"')) {
          stmts.push({ text: buf.trim(), line: startLine });
          buf = "";
          continue;
        }
      }
      buf += ch;
    }
    buf += "\n";
  });
  const trailing = buf.trim() ? { text: buf.trim(), line: startLine } : null;
  return { stmts, trailing };
}

const firstWord = (s: string) => (s.match(/^[A-Za-z_\-/]+/)?.[0] ?? "").toUpperCase();

const BLOCKS: Record<string, string> = {
  IF: "ENDIF",
  LOOP: "ENDLOOP",
  DO: "ENDDO",
  WHILE: "ENDWHILE",
  CASE: "ENDCASE",
  TRY: "ENDTRY",
  METHOD: "ENDMETHOD",
  FORM: "ENDFORM",
  FUNCTION: "ENDFUNCTION",
  MODULE: "ENDMODULE",
  INTERFACE: "ENDINTERFACE",
  CLASS: "ENDCLASS",
  AT: "ENDAT",
  EXEC: "ENDEXEC",
};

const LOOPS = new Set(["LOOP", "DO", "WHILE"]);

export function lintAbap(code: string): LintResult {
  const issues: LintIssue[] = [];
  if (!code.trim()) {
    return { ok: false, issues: [{ line: null, severity: "error", message: "Chưa có code." }] };
  }

  const lines = sanitize(code, issues);
  const { stmts, trailing } = splitStatements(lines);
  if (trailing) {
    issues.push({
      line: trailing.line,
      severity: "error",
      message: `Câu lệnh "${trailing.text.slice(0, 40)}${trailing.text.length > 40 ? "…" : ""}" thiếu dấu chấm (.) kết thúc.`,
    });
  }

  const stack: { kind: string; line: number }[] = [];
  let loopDepth = 0;
  let sawSortSinceAppend = false;

  for (const stmt of stmts) {
    // Chained statement prefix "DATA: a TYPE i, b TYPE i" – keyword is still the first word.
    const word = firstWord(stmt.text);
    const upper = stmt.text.toUpperCase();
    if (!word) continue;

    // --- block structure ---
    if (word === "CLASS" && /\b(DEFERRED|LOAD)\b/.test(upper)) continue;
    if (word === "AT" && !/^AT\s+(FIRST|LAST|NEW|END\s+OF)\b/.test(upper)) continue; // AT SELECTION-SCREEN etc.
    if (word === "FUNCTION" && /^FUNCTION-POOL/.test(upper)) continue;
    if (word === "INTERFACE" && /\b(DEFERRED|LOAD)\b/.test(upper)) continue;
    if (word === "MODULE" && !/^MODULE\s+\S+\s+(OUTPUT|INPUT)\b/.test(upper)) continue;

    if (BLOCKS[word]) {
      stack.push({ kind: word, line: stmt.line });
      if (LOOPS.has(word)) {
        if (word === "LOOP" && loopDepth >= 1) {
          issues.push({
            line: stmt.line,
            severity: "warning",
            message: "LOOP lồng trong LOOP → độ phức tạp O(n·m). Cân nhắc hashed/sorted table + READ TABLE ... WITH TABLE KEY.",
          });
        }
        loopDepth++;
      }
    } else if (word.startsWith("END") && Object.values(BLOCKS).includes(word)) {
      const top = stack[stack.length - 1];
      if (!top) {
        issues.push({ line: stmt.line, severity: "error", message: `${word} không có câu lệnh mở khối tương ứng.` });
      } else if (BLOCKS[top.kind] !== word) {
        issues.push({
          line: stmt.line,
          severity: "error",
          message: `Gặp ${word} nhưng khối đang mở là ${top.kind} (dòng ${top.line}) cần ${BLOCKS[top.kind]}.`,
        });
        stack.pop();
      } else {
        stack.pop();
        if (LOOPS.has(top.kind)) loopDepth--;
      }
    } else if (["ELSE", "ELSEIF"].includes(word)) {
      if (stack[stack.length - 1]?.kind !== "IF") {
        issues.push({ line: stmt.line, severity: "error", message: `${word} nằm ngoài khối IF.` });
      }
    } else if (word === "WHEN") {
      if (stack[stack.length - 1]?.kind !== "CASE") {
        issues.push({ line: stmt.line, severity: "error", message: "WHEN nằm ngoài khối CASE." });
      }
    } else if (["CATCH", "CLEANUP"].includes(word)) {
      if (stack[stack.length - 1]?.kind !== "TRY") {
        issues.push({ line: stmt.line, severity: "error", message: `${word} nằm ngoài khối TRY.` });
      }
    }

    // --- smells / performance ---
    if (/^SELECT\b/.test(upper)) {
      if (loopDepth > 0) {
        issues.push({
          line: stmt.line,
          severity: "warning",
          message: "SELECT bên trong vòng lặp → N+1 truy vấn DB. Hãy SELECT 1 lần ngoài vòng lặp rồi tra bằng hashed table.",
        });
      }
      if (/^SELECT\s+(SINGLE\s+)?\*/.test(upper)) {
        issues.push({ line: stmt.line, severity: "info", message: "SELECT * lấy thừa cột; chỉ chọn các cột cần dùng." });
      }
    }
    if (/^READ\s+TABLE\b/.test(upper) && loopDepth > 0 && !/BINARY\s+SEARCH|WITH\s+TABLE\s+KEY|INDEX\b/.test(upper)) {
      issues.push({
        line: stmt.line,
        severity: "warning",
        message: "READ TABLE trong LOOP không có BINARY SEARCH / TABLE KEY → tra cứu tuyến tính O(n) mỗi lần.",
      });
    }
    if (/^SORT\b/.test(upper)) sawSortSinceAppend = true;
    if (/^APPEND\b|^INSERT\b/.test(upper)) sawSortSinceAppend = false;
    if (/^DELETE\s+ADJACENT\s+DUPLICATES\b/.test(upper) && !sawSortSinceAppend) {
      issues.push({
        line: stmt.line,
        severity: "warning",
        message: "DELETE ADJACENT DUPLICATES chỉ đúng khi bảng đã SORT theo cùng key trước đó.",
      });
    }
    if (/^(MOVE|COMPUTE)\b/.test(upper) || /\bOCCURS\b|WITH\s+HEADER\s+LINE/.test(upper)) {
      issues.push({ line: stmt.line, severity: "info", message: "Cú pháp lỗi thời (MOVE/COMPUTE/OCCURS/HEADER LINE). Dùng ABAP 7.40+: =, VALUE #( ), inline DECLARATION." });
    }
  }

  for (const open of stack) {
    issues.push({ line: open.line, severity: "error", message: `${open.kind} chưa được đóng bằng ${BLOCKS[open.kind]}.` });
  }

  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { ok: !issues.some((i) => i.severity === "error"), issues };
}
