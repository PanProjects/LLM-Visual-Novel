import type { QuizAnswers, StartResult, TurnResult } from "./types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function startStory(
  mode: "random" | "quiz",
  answers?: QuizAnswers
): Promise<StartResult> {
  return post<StartResult>("/api/start", { mode, answers });
}

export function takeTurn(sessionId: string, choice: string): Promise<TurnResult> {
  return post<TurnResult>("/api/turn", { sessionId, choice });
}
