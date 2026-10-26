import { LEVEL_LABEL, type LevelName, type TrackName } from "@/lib/schemas";

const levelStyle: Record<LevelName, string> = {
  BEGINNER: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/40",
  EASY: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  HARD: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/40",
  EXPERT: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/40",
};

export function LevelBadge({ level }: { level: LevelName }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${levelStyle[level]}`}>
      {LEVEL_LABEL[level]}
    </span>
  );
}

export function TrackBadge({ track }: { track: TrackName }) {
  const cls =
    track === "ABAP"
      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/40"
      : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/40";
  return (
    <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${cls}`}>
      {track === "UI5" ? "UI5 · JS" : "ABAP"}
    </span>
  );
}

export function ScoreRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--accent-2)" : value >= 60 ? "var(--warn)" : "var(--danger)";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} style={{ stroke: "var(--ring-track)" }} strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
          style={{ stroke: color, transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="text-lg font-semibold" style={{ color }}>
          {value}
        </div>
        {label && <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">{label}</div>}
      </div>
    </div>
  );
}
