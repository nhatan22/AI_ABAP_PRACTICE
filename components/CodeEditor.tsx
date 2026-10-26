"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type { LintIssue } from "@/lib/schemas";
import { useTheme } from "./ThemeToggle";

type Props = {
  value: string;
  onChange: (v: string) => void;
  language: "abap" | "javascript";
  markers: LintIssue[];
  onSubmit?: () => void;
  onFormat?: () => void;
  reveal?: { line: number; nonce: number } | null;
};

type MonacoNs = Parameters<OnMount>[1];
type EditorInstance = Parameters<OnMount>[0];

const beforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("dojo-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5c6784", fontStyle: "italic" },
      { token: "keyword", foreground: "8fa0ff" },
      { token: "string", foreground: "7ee0b5" },
      { token: "number", foreground: "f2b179" },
      { token: "type", foreground: "7cd4f5" },
    ],
    colors: {
      "editor.background": "#0d1017",
      "editor.lineHighlightBackground": "#151a25",
      "editorLineNumber.foreground": "#394058",
      "editorLineNumber.activeForeground": "#8d95a8",
      "editorCursor.foreground": "#7c8cff",
      "editor.selectionBackground": "#2b3566aa",
      "editorIndentGuide.background1": "#1b2030",
      "editorGutter.background": "#0d1017",
    },
  });
  monaco.editor.defineTheme("dojo-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7b849c", fontStyle: "italic" },
      { token: "keyword", foreground: "4338ca" },
      { token: "string", foreground: "0b7a58" },
      { token: "number", foreground: "b45309" },
      { token: "type", foreground: "0369a1" },
    ],
    colors: {
      "editor.background": "#f6f7fc",
      "editor.lineHighlightBackground": "#eceffa",
      "editorLineNumber.foreground": "#aab2c8",
      "editorLineNumber.activeForeground": "#5f687d",
      "editorCursor.foreground": "#4f5bd5",
      "editor.selectionBackground": "#c9d0f8aa",
      "editorIndentGuide.background1": "#e1e5f1",
      "editorGutter.background": "#f6f7fc",
    },
  });
};

export function CodeEditor({ value, onChange, language, markers, onSubmit, onFormat, reveal }: Props) {
  const theme = useTheme();
  const monacoRef = useRef<MonacoNs | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const submitRef = useRef(onSubmit);
  const formatRef = useRef(onFormat);
  submitRef.current = onSubmit;
  formatRef.current = onFormat;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => submitRef.current?.());
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => formatRef.current?.());
    applyMarkers();
  };

  function applyMarkers() {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const sev = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
    };
    monaco.editor.setModelMarkers(
      model,
      "dojo-lint",
      markers
        .filter((m) => m.line)
        .map((m) => {
          const line = Math.min(Math.max(1, m.line as number), model.getLineCount());
          return {
            severity: sev[m.severity],
            message: m.message,
            startLineNumber: line,
            endLineNumber: line,
            startColumn: model.getLineFirstNonWhitespaceColumn(line) || 1,
            endColumn: model.getLineMaxColumn(line),
          };
        }),
    );
  }

  useEffect(applyMarkers, [markers]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !reveal) return;
    editor.revealLineInCenter(reveal.line);
    editor.setPosition({ lineNumber: reveal.line, column: 1 });
    editor.focus();
  }, [reveal]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme={theme === "dark" ? "dojo-dark" : "dojo-light"}
      beforeMount={beforeMount}
      onMount={handleMount}
      onChange={(v) => onChange(v ?? "")}
      loading={<div className="skeleton m-4 h-[80%]" />}
      options={{
        fontSize: 14,
        fontFamily: "var(--font-geist-mono), Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        bracketPairColorization: { enabled: true },
        wordWrap: "off",
        overviewRulerBorder: false,
      }}
    />
  );
}
