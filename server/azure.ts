// ─────────────────────────────────────────────────────────────────────────────
// Azure AI Foundry (Azure OpenAI) client.
// All model traffic flows through here, server-side, so the subscription key
// is never exposed to the browser.
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/?$/, "/");
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5.4";
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";
const KEY = process.env.AZURE_OPENAI_KEY ?? "";

if (!ENDPOINT || !KEY) {
  console.warn(
    "[azure] Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_KEY — copy .env.example to .env."
  );
}

const CHAT_URL = `${ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompleteOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  json?: boolean;
}

async function rawComplete(opts: CompleteOptions): Promise<string> {
  const body: Record<string, unknown> = {
    messages: opts.messages,
    max_completion_tokens: opts.maxTokens ?? 1600,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Azure OpenAI ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Azure OpenAI returned empty content");
  return content;
}

/** Plain text completion. */
export async function complete(
  messages: ChatMessage[],
  maxTokens?: number
): Promise<string> {
  return rawComplete({ messages, maxTokens });
}

/**
 * JSON completion with a single repair retry. The model is asked for a JSON
 * object; if parsing fails we re-prompt once with the broken output.
 */
export async function completeJSON<T = unknown>(
  messages: ChatMessage[],
  maxTokens?: number
): Promise<T> {
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const msgs =
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: "user" as const,
              content:
                "Your previous reply was not valid JSON or was cut off. Reply again with ONLY a single, complete, valid JSON object — no prose, no code fences. Keep all text fields concise so the whole object fits.",
            },
          ];
    // Give the repair attempt extra room in case the first was truncated.
    const tokens = attempt === 0 ? maxTokens : Math.round((maxTokens ?? 1600) * 1.5);
    last = await rawComplete({ messages: msgs, maxTokens: tokens, json: true });
    const parsed = tryParse<T>(last);
    if (parsed !== undefined) return parsed;
  }
  throw new Error(`Failed to parse JSON from model. Last output:\n${last.slice(0, 800)}`);
}

function tryParse<T>(text: string): T | undefined {
  // Strip accidental code fences just in case.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to salvage the largest {...} span.
    const first = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (first !== -1 && lastBrace > first) {
      try {
        return JSON.parse(cleaned.slice(first, lastBrace + 1)) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export const azureInfo = { DEPLOYMENT, API_VERSION, configured: !!(ENDPOINT && KEY) };
