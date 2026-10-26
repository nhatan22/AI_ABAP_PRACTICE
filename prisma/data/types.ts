export type SeedExercise = {
  slug: string;
  track: "ABAP" | "UI5";
  level: "BEGINNER" | "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  title: string;
  topic: string;
  tags: string[];
  description: string;
  milestones: { id: string; title: string; detail: string }[];
  starterCode: string;
  hints: string[];
  solution: string;
  targetBigO: string;
};
