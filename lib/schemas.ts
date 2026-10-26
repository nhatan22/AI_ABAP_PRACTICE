import { z } from "zod";

export const LEVELS = ["BEGINNER", "EASY", "MEDIUM", "HARD", "EXPERT"] as const;
export const TRACKS = ["ABAP", "UI5"] as const;
export type LevelName = (typeof LEVELS)[number];
export type TrackName = (typeof TRACKS)[number];

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().catch(""),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

const num = (min = 0, max = 100) => z.coerce.number().catch(0).transform((n) => Math.min(max, Math.max(min, Math.round(n))));
const strArr = z.array(z.string()).catch([]);

export const ReviewSchema = z.object({
  compile: z
    .object({
      ok: z.boolean().catch(false),
      issues: z
        .array(
          z.object({
            line: z.number().nullable().catch(null),
            severity: z.enum(["error", "warning", "info"]).catch("warning"),
            message: z.string().catch(""),
            fix: z.string().catch(""),
          }),
        )
        .catch([]),
    })
    .catch({ ok: false, issues: [] }),
  milestones: z
    .array(
      z.object({
        id: z.string().catch(""),
        met: z.boolean().catch(false),
        feedback: z.string().catch(""),
      }),
    )
    .catch([]),
  tests: z
    .array(
      z.object({
        name: z.string().catch(""),
        input: z.string().catch(""),
        expected: z.string().catch(""),
        actual: z.string().catch(""),
        pass: z.boolean().catch(false),
      }),
    )
    .catch([]),
  complexity: z
    .object({
      time: z.string().catch("?"),
      space: z.string().catch("?"),
      target: z.string().catch("?"),
      optimal: z.boolean().catch(false),
      analysis: z.string().catch(""),
    })
    .catch({ time: "?", space: "?", target: "?", optimal: false, analysis: "" }),
  optimization: z
    .object({
      score: num(),
      suggestions: strArr,
      betterApproach: z.string().catch(""),
    })
    .catch({ score: 0, suggestions: [], betterApproach: "" }),
  style: z
    .object({ score: num(), notes: strArr })
    .catch({ score: 0, notes: [] }),
  score: num(),
  summary: z.string().catch(""),
  nextStep: z.string().catch(""),
});
export type Review = z.infer<typeof ReviewSchema>;

export const GeneratedExerciseSchema = z.object({
  title: z.string().min(3),
  topic: z.string().min(2),
  tags: z.array(z.string()).catch([]),
  description: z.string().min(20),
  milestones: z.array(MilestoneSchema).min(2),
  starterCode: z.string().min(1),
  hints: z.array(z.string()).catch([]),
  solution: z.string().min(1),
  targetBigO: z.string().catch("O(n)"),
});
export type GeneratedExercise = z.infer<typeof GeneratedExerciseSchema>;

export type LintIssue = {
  line: number | null;
  severity: "error" | "warning" | "info";
  message: string;
};
export type LintResult = { ok: boolean; issues: LintIssue[] };

export const LEVEL_LABEL: Record<LevelName, string> = {
  BEGINNER: "Nhập môn",
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
  EXPERT: "Chuyên gia",
};
