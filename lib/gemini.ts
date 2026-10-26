const API = "https://generativelanguage.googleapis.com/v1beta/models";

// Free-tier friendly fallback chain: if a model is rate limited / unavailable, try the next one.
const MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
    ].filter(Boolean) as string[],
  ),
);

export type ChatTurn = { role: "user" | "model"; text: string };

type Opts = {
  system: string;
  turns: ChatTurn[];
  json?: boolean;
  temperature?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function gemini({ system, turns, json, temperature = 0.4 }: Opts): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Thiếu GEMINI_API_KEY trong file .env");

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  let lastError = "Gemini không phản hồi";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${API}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const parts: { text?: string; thought?: boolean }[] =
          data?.candidates?.[0]?.content?.parts ?? [];
        const text = parts
          .filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("");
        if (text.trim()) return text;
        lastError = `${model}: phản hồi rỗng`;
        break;
      }

      const err = await res.text();
      lastError = `${model} (${res.status}): ${err.slice(0, 300)}`;
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await sleep(1500);
        continue;
      }
      break;
    }
  }
  throw new Error(lastError);
}

/** Parse JSON that the model may have wrapped in a markdown fence. */
export function parseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
