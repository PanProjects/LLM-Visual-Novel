// ─────────────────────────────────────────────────────────────────────────────
// Knowledge-graph memory + grounded retrieval.
//
// The graph IS the story's long-term memory. After every turn the Lore Keeper
// agent emits deltas that we merge here. Before the Narrator writes, we retrieve
// a relevant, compact subgraph + canonical facts and inject them as grounded
// context — a Foundry-IQ-style grounding layer that keeps the story consistent
// and reduces hallucination.
// ─────────────────────────────────────────────────────────────────────────────

import type { GraphEdge, GraphNode, StoryGraph } from "./types.ts";

export interface GraphDelta {
  addNodes?: GraphNode[];
  addEdges?: GraphEdge[];
  updateNodes?: { id: string; state?: string; description?: string; importance?: number }[];
  newFacts?: string[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "node";

export function mergeDelta(graph: StoryGraph, delta: GraphDelta): void {
  for (const n of delta.addNodes ?? []) {
    const id = n.id?.trim() ? slug(n.id) : slug(n.name ?? "node");
    const existing = graph.nodes.find((x) => x.id === id);
    if (existing) {
      existing.description = n.description || existing.description;
      existing.state = n.state ?? existing.state;
      existing.importance = Math.max(existing.importance, n.importance ?? 1);
      continue;
    }
    graph.nodes.push({
      id,
      type: n.type ?? "event",
      name: n.name ?? id,
      description: n.description ?? "",
      state: n.state,
      importance: clamp(n.importance ?? 2, 1, 5),
    });
  }

  for (const u of delta.updateNodes ?? []) {
    const node = graph.nodes.find((x) => x.id === slug(u.id) || x.id === u.id);
    if (!node) continue;
    if (u.state) node.state = u.state;
    if (u.description) node.description = u.description;
    if (u.importance) node.importance = clamp(u.importance, 1, 5);
  }

  for (const e of delta.addEdges ?? []) {
    const source = resolveId(graph, e.source);
    const target = resolveId(graph, e.target);
    if (!source || !target || source === target) continue;
    const dup = graph.edges.find(
      (x) => x.source === source && x.target === target && x.relation === e.relation
    );
    if (!dup) graph.edges.push({ source, target, relation: e.relation || "linked_to" });
  }
}

function resolveId(graph: StoryGraph, ref: string): string | null {
  if (!ref) return null;
  const s = slug(ref);
  if (graph.nodes.some((n) => n.id === s)) return s;
  // Try match by name.
  const byName = graph.nodes.find(
    (n) => n.name.toLowerCase() === ref.toLowerCase().trim()
  );
  return byName ? byName.id : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Build a compact, grounded context block for the Narrator.
 * Prioritises high-importance nodes and anything connected to entities named in
 * the player's latest action, plus the most recent canonical facts.
 */
export function buildGrounding(
  graph: StoryGraph,
  facts: string[],
  recentAction: string
): string {
  const actionLower = recentAction.toLowerCase();

  const scored = graph.nodes.map((n) => {
    let score = n.importance;
    if (actionLower.includes(n.name.toLowerCase())) score += 4;
    // Boost nodes adjacent to mentioned entities.
    const adjacent = graph.edges.some((e) => {
      const other =
        e.source === n.id ? e.target : e.target === n.id ? e.source : null;
      if (!other) return false;
      const otherNode = graph.nodes.find((x) => x.id === other);
      return otherNode && actionLower.includes(otherNode.name.toLowerCase());
    });
    if (adjacent) score += 2;
    return { n, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((x) => x.n);
  const topIds = new Set(top.map((n) => n.id));

  const nodeLines = top.map(
    (n) =>
      `- [${n.type}] ${n.name}${n.state ? ` (now: ${n.state})` : ""}: ${n.description}`
  );

  const edgeLines = graph.edges
    .filter((e) => topIds.has(e.source) && topIds.has(e.target))
    .slice(0, 24)
    .map((e) => {
      const a = graph.nodes.find((n) => n.id === e.source)?.name ?? e.source;
      const b = graph.nodes.find((n) => n.id === e.target)?.name ?? e.target;
      return `- ${a} —[${e.relation}]→ ${b}`;
    });

  const recentFacts = facts.slice(-12);

  return [
    "ESTABLISHED ENTITIES (canon — stay consistent with these):",
    nodeLines.join("\n") || "(none yet)",
    "",
    "ESTABLISHED RELATIONSHIPS:",
    edgeLines.join("\n") || "(none yet)",
    "",
    "CANONICAL FACTS SO FAR (do not contradict):",
    recentFacts.map((f) => `- ${f}`).join("\n") || "(none yet)",
  ].join("\n");
}

export function summarizeGraph(graph: StoryGraph): string {
  const byType: Record<string, string[]> = {};
  for (const n of graph.nodes) {
    (byType[n.type] ??= []).push(n.name + (n.state ? ` [${n.state}]` : ""));
  }
  return Object.entries(byType)
    .map(([t, names]) => `${t}: ${names.join(", ")}`)
    .join(" | ");
}
