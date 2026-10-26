import { parse } from "acorn";
import type { LintIssue, LintResult } from "./schemas";

/** Real syntax check (acorn) plus SAPUI5 best-practice smells. */
export function lintUi5(code: string): LintResult {
  const issues: LintIssue[] = [];
  if (!code.trim()) {
    return { ok: false, issues: [{ line: null, severity: "error", message: "Chưa có code." }] };
  }

  try {
    parse(code, { ecmaVersion: "latest", sourceType: "script", locations: true, allowReturnOutsideFunction: true });
  } catch (e) {
    const err = e as { message: string; loc?: { line: number } };
    issues.push({ line: err.loc?.line ?? null, severity: "error", message: `Lỗi cú pháp JavaScript: ${err.message.replace(/\s*\(\d+:\d+\)$/, "")}` });
    return { ok: false, issues };
  }

  const lines = code.split(/\r?\n/);
  const hasDefine = /sap\.ui\.define\s*\(/.test(code);
  if (!hasDefine && /Controller\.extend|Control\.extend|\.extend\(/.test(code)) {
    issues.push({ line: 1, severity: "warning", message: "Nên bọc module trong sap.ui.define([...], function(...) { ... }) thay vì dùng biến toàn cục." });
  }

  lines.forEach((line, i) => {
    const n = i + 1;
    if (/^\s*(\/\/|\*)/.test(line)) return;
    if (/\bvar\s+\w+/.test(line)) issues.push({ line: n, severity: "info", message: "Dùng const/let thay cho var." });
    if (/sap\.ui\.getCore\(\)/.test(line)) issues.push({ line: n, severity: "warning", message: "sap.ui.getCore() đã deprecated – dùng module tương ứng (Element, Component, Fragment, ...)." });
    if (/jQuery\.sap\./.test(line)) issues.push({ line: n, severity: "warning", message: "jQuery.sap.* đã deprecated – dùng module sap/base/* hoặc API chuẩn." });
    if (/\bsap\.(m|ui\.model|ui\.core)\.[A-Za-z.]+\s*\(/.test(line) && hasDefine && !/^\s*"sap\//.test(line)) {
      issues.push({ line: n, severity: "warning", message: "Truy cập namespace toàn cục sap.* – hãy import module qua sap.ui.define." });
    }
    if (/\$\.ajax|jQuery\.ajax/.test(line) && /async\s*:\s*false/.test(code)) {
      issues.push({ line: n, severity: "error", message: "Không dùng request đồng bộ (async: false)." });
    }
    if (/\.(getModel\([^)]*\)\.getData\(\)\.\w+\s*=)/.test(line)) {
      issues.push({ line: n, severity: "info", message: "Sửa trực tiếp data của model rồi quên refresh/setProperty → UI không cập nhật. Dùng setProperty()." });
    }
  });

  return { ok: !issues.some((i) => i.severity === "error"), issues };
}
