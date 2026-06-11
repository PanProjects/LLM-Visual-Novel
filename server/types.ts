// ─────────────────────────────────────────────────────────────────────────────
// Shared domain types for Infinitale's agentic story engine.
// (Mirrored in src/types.ts for the client — these are erased at runtime.)
// ─────────────────────────────────────────────────────────────────────────────

export type Palette = {
  primary: string; // hex
  secondary: string; // hex
  accent: string; // hex
};

export type Ambient =
  | "embers"
  | "rain"
  | "snow"
  | "dust"
  | "stars"
  | "void"
  | "fireflies"
  | "petals";

export type NodeType =
  | "character"
  | "location"
  | "item"
  | "event"
  | "faction"
  | "theme";

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  state?: string; // current status, evolves over time
  importance: number; // 1-5
}

export interface GraphEdge {
  source: string; // node id
  target: string; // node id
  relation: string; // e.g. "allied_with", "located_in", "seeks", "betrayed"
}

export interface StoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface WorldBible {
  title: string;
  genre: string;
  tone: string;
  logline: string;
  setting: { name: string; description: string; era: string };
  protagonist: {
    name: string;
    role: string;
    description: string;
    motivation: string;
  };
  supportingCharacters: {
    name: string;
    role: string;
    description: string;
    relationToProtagonist: string;
  }[];
  centralConflict: string;
  themes: string[];
  palette: Palette;
  ambient: Ambient;
}

export type ScriptEntry =
  | { type: "narration"; text: string }
  | { type: "line"; speaker: string; text: string; emotion?: string };

export interface Ending {
  title: string;
  type: string; // e.g. "Triumph", "Sacrifice", "Ambiguous", "Tragedy"
  reflection: string;
}

export interface Scene {
  location: string;
  mood: string;
  palette: Palette;
  ambient: Ambient;
  script: ScriptEntry[];
  choices: { id: string; label: string }[];
  isEnding: boolean;
  ending: Ending | null;
}

export type Beat =
  | "inciting"
  | "rising"
  | "complication"
  | "twist"
  | "climax"
  | "falling"
  | "ending";

export interface Direction {
  beat: Beat;
  arcDelta: number; // how much to advance the arc (0-100)
  tensionDirection: "rise" | "hold" | "release";
  shouldEnd: boolean;
  endingSeed: string;
  directorNote: string; // private guidance to the Narrator
}

export interface ArcState {
  progress: number; // 0-100
  turn: number;
  tension: number; // 0-100
  beat: Beat;
}

// A lightweight trace of what each agent did this turn — surfaced in the UI
// to make the multi-agent pipeline visible.
export interface AgentTraceItem {
  agent: "World Builder" | "Lore Keeper" | "Director" | "Narrator";
  summary: string;
  detail?: string;
}

export interface TurnResult {
  scene: Scene;
  graph: StoryGraph;
  arc: ArcState;
  trace: AgentTraceItem[];
  newFacts: string[];
}

export interface StartResult extends TurnResult {
  sessionId: string;
  worldBible: WorldBible;
}

export interface Session {
  id: string;
  worldBible: WorldBible;
  graph: StoryGraph;
  facts: string[];
  history: { choice: string; scene: Scene }[];
  arc: ArcState;
  currentScene: Scene;
}

export interface QuizAnswers {
  vibe?: string; // "light & hopeful" | "dark & dangerous" | ...
  setting?: string; // "distant future" | "forgotten past" | ...
  drive?: string; // "love" | "power" | "truth" | "survival" | "freedom"
  companion?: string; // "a loyal friend" | "a rival" | "a stranger" | "alone"
  flavor?: string; // free-text optional seed
}
