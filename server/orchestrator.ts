// ─────────────────────────────────────────────────────────────────────────────
// Story Engine — coordinates the four agents over a session's graph memory.
//
//   start():  World Builder → seed graph → Narrator (opening, grounded)
//   turn():   [ Lore Keeper ∥ Director ] → merge graph → Narrator (grounded)
//
// Lore Keeper and Director run in parallel (the Director reasons over the prior
// graph summary, so it does not need the merged result), cutting turn latency.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import {
  director,
  loreKeeper,
  narrator,
  openingScene,
  worldBuilder,
} from "./agents.ts";
import { buildGrounding, mergeDelta, summarizeGraph } from "./graph.ts";
import type {
  AgentTraceItem,
  ArcState,
  Beat,
  QuizAnswers,
  Scene,
  Session,
  StartResult,
  TurnResult,
} from "./types.ts";

const sessions = new Map<string, Session>();

function sceneSummary(scene: Scene): string {
  const lines = scene.script.map((s) =>
    s.type === "narration" ? s.text : `${s.speaker}: "${s.text}"`
  );
  return `@${scene.location} (${scene.mood})\n${lines.join("\n")}`;
}

function recentHistory(session: Session, n = 3): string {
  return session.history
    .slice(-n)
    .map(
      (h, i) =>
        `> Player: ${h.choice}\n${sceneSummary(h.scene)}`
    )
    .join("\n\n");
}

export async function startStory(
  mode: "random" | "quiz",
  answers?: QuizAnswers
): Promise<StartResult> {
  const trace: AgentTraceItem[] = [];

  const { worldBible, graph } = await worldBuilder({ mode, answers });
  trace.push({
    agent: "World Builder",
    summary: `Forged "${worldBible.title}" — ${worldBible.genre}`,
    detail: worldBible.logline,
  });
  trace.push({
    agent: "Lore Keeper",
    summary: `Seeded memory: ${graph.nodes.length} entities, ${graph.edges.length} links`,
    detail: summarizeGraph(graph),
  });

  const grounding = buildGrounding(graph, [], worldBible.centralConflict);
  const scene = await openingScene(worldBible, grounding);
  trace.push({
    agent: "Narrator",
    summary: `Opened on "${scene.location}"`,
    detail: scene.mood,
  });

  const arc: ArcState = { progress: 6, tension: 20, turn: 0, beat: "inciting" };

  const facts = [
    `${worldBible.protagonist.name} is the protagonist: ${worldBible.protagonist.motivation}.`,
    `Central conflict: ${worldBible.centralConflict}.`,
  ];

  const session: Session = {
    id: randomUUID(),
    worldBible,
    graph,
    facts,
    history: [{ choice: "(begin)", scene }],
    arc,
    currentScene: scene,
  };
  sessions.set(session.id, session);

  return {
    sessionId: session.id,
    worldBible,
    scene,
    graph,
    arc,
    trace,
    newFacts: facts,
  };
}

export async function takeTurn(
  sessionId: string,
  choice: string
): Promise<TurnResult> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Unknown session — start a new story.");

  const trace: AgentTraceItem[] = [];
  const lastSummary = sceneSummary(session.currentScene);
  const graphSummaryBefore = summarizeGraph(session.graph);

  // Stage 1: Lore Keeper and Director run concurrently.
  const [delta, direction] = await Promise.all([
    loreKeeper(session.graph, lastSummary, choice),
    director(
      session.worldBible,
      session.arc,
      graphSummaryBefore,
      recentHistory(session),
      choice
    ),
  ]);

  mergeDelta(session.graph, delta);
  const addedNodes = delta.addNodes?.length ?? 0;
  const addedEdges = delta.addEdges?.length ?? 0;
  const newFacts = (delta.newFacts ?? []).filter(Boolean);
  session.facts.push(...newFacts);

  trace.push({
    agent: "Lore Keeper",
    summary:
      addedNodes || addedEdges
        ? `Wove in ${addedNodes} entit${addedNodes === 1 ? "y" : "ies"}, ${addedEdges} link${addedEdges === 1 ? "" : "s"}`
        : "Updated the story's memory",
    detail: newFacts.join(" • ") || undefined,
  });
  trace.push({
    agent: "Director",
    summary: `Beat: ${direction.beat}${direction.shouldEnd ? " → ending" : ""}`,
    detail: direction.directorNote,
  });

  // Advance the arc.
  const arc = session.arc;
  arc.turn += 1;
  arc.progress = Math.min(100, arc.progress + clampDelta(direction.arcDelta));
  arc.tension = nudgeTension(arc.tension, direction.tensionDirection);
  arc.beat = direction.beat as Beat;

  // Stage 2: Narrator writes the grounded scene.
  const grounding = buildGrounding(session.graph, session.facts, choice);
  const scene = await narrator(
    session.worldBible,
    grounding,
    direction,
    choice,
    arc
  );

  trace.push({
    agent: "Narrator",
    summary: scene.isEnding
      ? `Wrote the ending: "${scene.ending?.title ?? "Finale"}"`
      : `Wrote "${scene.location}"`,
    detail: scene.isEnding ? scene.ending?.type : scene.mood,
  });

  session.currentScene = scene;
  session.history.push({ choice, scene });

  return { scene, graph: session.graph, arc, trace, newFacts };
}

function clampDelta(d: number): number {
  if (!Number.isFinite(d)) return 6;
  return Math.max(2, Math.min(20, d));
}

function nudgeTension(t: number, dir: "rise" | "hold" | "release"): number {
  const step = dir === "rise" ? 12 : dir === "release" ? -16 : 0;
  return Math.max(0, Math.min(100, t + step));
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}
