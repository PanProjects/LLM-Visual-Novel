// ─────────────────────────────────────────────────────────────────────────────
// The four agents of Infinitale. Each has a single, sharp responsibility and a
// strict JSON contract. The orchestrator wires them together over the graph.
// ─────────────────────────────────────────────────────────────────────────────

import { completeJSON } from "./azure.ts";
import type { GraphDelta } from "./graph.ts";
import { summarizeGraph } from "./graph.ts";
import type {
  ArcState,
  Direction,
  QuizAnswers,
  Scene,
  StoryGraph,
  WorldBible,
} from "./types.ts";

const PALETTE_NOTE =
  "palette is three hex colors {primary, secondary, accent} evoking the mood. ambient is one of: embers, rain, snow, dust, stars, void, fireflies, petals.";

// ── World Builder ────────────────────────────────────────────────────────────
// Turns a seed (random or questionnaire) into a world bible + the initial graph.

export interface WorldBuildResult {
  worldBible: WorldBible;
  graph: StoryGraph;
}

export async function worldBuilder(
  seed: { mode: "random" | "quiz"; answers?: QuizAnswers }
): Promise<WorldBuildResult> {
  const seedText =
    seed.mode === "random"
      ? "RANDOM SEED: Invent something surprising and original. Avoid clichés — no chosen-one farmboys, no generic 'dark lord'. Pick an unexpected genre blend."
      : `PLAYER PREFERENCES:\n${formatAnswers(seed.answers ?? {})}`;

  const system = `You are the WORLD BUILDER agent for "Infinitale", an AI visual novel.
You invent a vivid, original story world and cast, then seed a knowledge graph.
Be imaginative, specific, and evocative. Names should feel intentional, not generic.
Return ONLY a JSON object with this exact shape:
{
  "worldBible": {
    "title": string,                      // evocative, 1-4 words
    "genre": string,
    "tone": string,                       // e.g. "haunting, intimate"
    "logline": string,                    // one sentence
    "setting": { "name": string, "description": string, "era": string },
    "protagonist": { "name": string, "role": string, "description": string, "motivation": string },
    "supportingCharacters": [ { "name": string, "role": string, "description": string, "relationToProtagonist": string } ],  // 2-3
    "centralConflict": string,
    "themes": [string],                   // 2-3
    "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
    "ambient": string
  },
  "graph": {
    "nodes": [ { "id": string, "type": "character"|"location"|"item"|"event"|"faction"|"theme", "name": string, "description": string, "state": string, "importance": 1-5 } ],
    "edges": [ { "source": <node id>, "target": <node id>, "relation": string } ]
  }
}
Rules: ${PALETTE_NOTE}
Keep every description to ONE vivid sentence (the logline may be one sentence too). Be evocative but compact — do not pad.
The graph must include the protagonist, each supporting character, the main location, and the central conflict (as an "event" or "theme" node), with edges linking them (e.g. relationToProtagonist as edges from each character to the protagonist). Node ids are lowercase-kebab.`;

  const result = await completeJSON<WorldBuildResult>(
    [
      { role: "system", content: system },
      { role: "user", content: seedText },
    ],
    4000
  );
  return result;
}

function formatAnswers(a: QuizAnswers): string {
  const lines: string[] = [];
  if (a.vibe) lines.push(`Mood/vibe: ${a.vibe}`);
  if (a.setting) lines.push(`Setting flavor: ${a.setting}`);
  if (a.drive) lines.push(`What drives the hero: ${a.drive}`);
  if (a.companion) lines.push(`Companionship: ${a.companion}`);
  if (a.flavor) lines.push(`Extra wish from the player: ${a.flavor}`);
  return lines.join("\n") || "No strong preferences — surprise the player.";
}

// ── Lore Keeper (memory agent) ───────────────────────────────────────────────
// Reads the player's action + last scene and emits graph deltas + new facts.

export async function loreKeeper(
  graph: StoryGraph,
  lastSceneSummary: string,
  playerAction: string
): Promise<GraphDelta> {
  const system = `You are the LORE KEEPER agent for an AI visual novel. You maintain a knowledge graph that is the story's canonical memory.
Given the last scene and the player's action, output the changes to the graph: new entities introduced, new relationships formed or changed, status updates on existing entities, and short canonical facts established.
Return ONLY a JSON object:
{
  "addNodes": [ { "id": string, "type": "character"|"location"|"item"|"event"|"faction"|"theme", "name": string, "description": string, "state": string, "importance": 1-5 } ],
  "addEdges": [ { "source": <node id or name>, "target": <node id or name>, "relation": string } ],
  "updateNodes": [ { "id": <existing node id or name>, "state": string, "description": string } ],
  "newFacts": [ string ]   // 1-3 terse, durable facts established this turn
}
Only record what genuinely changed. Reuse existing node ids/names where possible. Keep it tight. Node ids are lowercase-kebab. If nothing changed, return empty arrays.`;

  const user = `CURRENT GRAPH (summary): ${summarizeGraph(graph) || "(empty)"}

EXISTING NODE IDS: ${graph.nodes.map((n) => n.id).join(", ") || "(none)"}

LAST SCENE:
${lastSceneSummary}

PLAYER ACTION:
${playerAction}`;

  return completeJSON<GraphDelta>(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    1200
  );
}

// ── Director ─────────────────────────────────────────────────────────────────
// Owns pacing and the narrative arc; decides the next beat and when to end.

export async function director(
  worldBible: WorldBible,
  arc: ArcState,
  graphSummary: string,
  recentHistory: string,
  playerAction: string
): Promise<Direction> {
  const system = `You are the DIRECTOR agent for an AI visual novel. You own pacing, momentum, and the dramatic arc.
You decide the next story BEAT and whether the story should reach an ENDING. Stories should feel alive: escalate, surprise, and avoid repetition. Endings can be earned anywhere after the arc matures (progress > 70) OR when the player's action decisively resolves the central conflict — there are infinitely many possible endings, so let player agency shape which one arrives.
Return ONLY JSON:
{
  "beat": "inciting"|"rising"|"complication"|"twist"|"climax"|"falling"|"ending",
  "arcDelta": number,            // 4-18, how much this turn advances the arc
  "tensionDirection": "rise"|"hold"|"release",
  "shouldEnd": boolean,
  "endingSeed": string,          // if ending: what kind of ending this action earns; else ""
  "directorNote": string         // 1-2 sentences of concrete, fresh guidance for the Narrator: what should happen now. Introduce new pressure, a reveal, a consequence — never just restate the situation.
}`;

  const user = `STORY: "${worldBible.title}" — ${worldBible.genre}. Conflict: ${worldBible.centralConflict}
ARC: progress ${arc.progress}/100, tension ${arc.tension}/100, turn ${arc.turn}, last beat "${arc.beat}".
GRAPH: ${graphSummary || "(empty)"}
RECENT STORY:
${recentHistory || "(opening)"}
PLAYER ACTION: ${playerAction}`;

  return completeJSON<Direction>(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    700
  );
}

// ── Narrator ─────────────────────────────────────────────────────────────────
// Writes the next playable scene, grounded on the retrieved subgraph.

export async function narrator(
  worldBible: WorldBible,
  grounding: string,
  direction: Direction,
  playerAction: string,
  arc: ArcState
): Promise<Scene> {
  const system = `You are the NARRATOR agent for "Infinitale", a cinematic visual novel. You write the next playable scene in CLEAR, grounded second-person prose ("you").
Your #1 priority is that the reader instantly understands what is physically happening, who is present, and why it matters. Clarity beats cleverness. A reader should never have to re-read a sentence to figure out what it means.
You MUST stay consistent with the grounded canon provided (entities, relationships, facts). Do not contradict it; build on it.
Follow the Director's note for what happens this turn. Make every scene move the story forward with consequence — reflect the player's last action.
Return ONLY JSON:
{
  "location": string,
  "mood": string,                 // one or two words
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
  "ambient": "embers"|"rain"|"snow"|"dust"|"stars"|"void"|"fireflies"|"petals",
  "script": [                     // 2-5 entries, the beat the player reads
    { "type": "narration", "text": string } |
    { "type": "line", "speaker": string, "text": string, "emotion": string }
  ],
  "choices": [ { "id": "a"|"b"|"c", "label": string } ],   // exactly 3 distinct, meaningful choices that branch — unless this is an ending, then []
  "isEnding": boolean,
  "ending": { "title": string, "type": string, "reflection": string } | null
}
CLARITY RULES (most important — follow strictly):
- Write concrete, literal sentences. Say what actually happens. Avoid abstract, dreamlike, or riddle-like imagery UNLESS the genre is explicitly surreal/dreamlike.
- At most ONE simile or metaphor in the whole scene, and only if it makes things clearer. Never write a sentence whose literal meaning is unclear.
- Every pronoun must have one obvious referent. Do not write things like "every reflection around it smiles" — name the thing and state plainly what it does.
- When a character appears or speaks for the first time in this scene, identify them in plain words: their name AND their relation to you (e.g. "Rusk, the bounty hunter who has been tracking you"). Use the relations from the grounded canon.
- ANTI-HALLUCINATION: only mention people, places, objects, or events that are in the GROUNDED CANON above, OR that you introduce and explain in the same sentence. Never refer to something as if the reader should already know it when it has not been established.
- Keep sentences mostly short. Vivid is good; ornate and confusing is not.

Example of the WRONG style (too cryptic): "The hunter's hand opens toward the crowd, and every reflection around it smiles first."
Example of the RIGHT style (clear): "Rusk—the bounty hunter who has chased you across three cities—raises her pistol, then freezes. Her eyes dart to the cornered vendor by the window. She has to choose: shoot you, or save the civilians."

Other rules:
- Dialogue lines: natural, plain, character-specific. No one speaks in riddles unless that is their established trait.
- Choices: exactly 3 genuinely different paths (not rephrasings), each a concrete action the player understands at a glance and that implies a real consequence. No vague or poetic choice labels.
- ${PALETTE_NOTE}
- If the Director said shouldEnd, write a satisfying, clearly-resolved epilogue in script (3-5 entries), set isEnding true, choices [], and fill ending.`;

  const endingDirective = direction.shouldEnd
    ? `\nTHIS IS AN ENDING. Kind of ending to deliver: ${direction.endingSeed}`
    : "";

  const user = `WORLD: "${worldBible.title}" — ${worldBible.genre}, tone ${worldBible.tone}. Protagonist: ${worldBible.protagonist.name} (${worldBible.protagonist.motivation}).

GROUNDED CANON:
${grounding}

DIRECTOR'S NOTE (beat: ${direction.beat}, tension ${direction.tensionDirection}): ${direction.directorNote}${endingDirective}

PLAYER JUST CHOSE: ${playerAction}

Write the next scene now. Arc progress: ${arc.progress}/100.`;

  return completeJSON<Scene>(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    2600
  );
}

// Opening scene uses the Narrator with a synthetic "begin" direction.
export async function openingScene(
  worldBible: WorldBible,
  grounding: string
): Promise<Scene> {
  const direction: Direction = {
    beat: "inciting",
    arcDelta: 6,
    tensionDirection: "rise",
    shouldEnd: false,
    endingSeed: "",
    directorNote:
      "Open the story in motion: drop the player into a charged moment that establishes the world, the protagonist's voice, and the central tension — then force a choice. Do not info-dump.",
  };
  return narrator(
    worldBible,
    grounding,
    direction,
    "(The story begins.)",
    { progress: 6, tension: 20, turn: 0, beat: "inciting" }
  );
}
