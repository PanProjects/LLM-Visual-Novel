// ─────────────────────────────────────────────────────────────────────────────
// Infinitale API server. Thin HTTP layer over the story engine. Holds the Azure
// key server-side; the browser only ever talks to /api/*.
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import cors from "cors";
import express from "express";
import { azureInfo } from "./azure.ts";
import { startStory, takeTurn } from "./orchestrator.ts";
import type { QuizAnswers } from "./types.ts";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: azureInfo.DEPLOYMENT, configured: azureInfo.configured });
});

app.post("/api/start", async (req, res) => {
  try {
    const mode = req.body?.mode === "quiz" ? "quiz" : "random";
    const answers = req.body?.answers as QuizAnswers | undefined;
    const result = await startStory(mode, answers);
    res.json(result);
  } catch (err) {
    handle(err, res, "start");
  }
});

app.post("/api/turn", async (req, res) => {
  try {
    const { sessionId, choice } = req.body ?? {};
    if (!sessionId || typeof choice !== "string" || !choice.trim()) {
      return res.status(400).json({ error: "sessionId and choice are required." });
    }
    const result = await takeTurn(sessionId, choice.trim());
    res.json(result);
  } catch (err) {
    handle(err, res, "turn");
  }
});

function handle(err: unknown, res: express.Response, where: string) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${where}]`, message);
  const status = message.includes("Unknown session") ? 404 : 500;
  res.status(status).json({ error: message });
}

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => {
  console.log(`\n  ∞  Infinitale agents online at http://localhost:${PORT}`);
  console.log(`     Model: ${azureInfo.DEPLOYMENT}  |  Configured: ${azureInfo.configured}\n`);
});
