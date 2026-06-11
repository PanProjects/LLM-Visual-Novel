// Client mirror of server/types.ts (types are erased at runtime).

export type Palette = { primary: string; secondary: string; accent: string };

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
  state?: string;
  importance: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
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
  type: string;
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

export interface ArcState {
  progress: number;
  turn: number;
  tension: number;
  beat: Beat;
}

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

export interface QuizAnswers {
  vibe?: string;
  setting?: string;
  drive?: string;
  companion?: string;
  flavor?: string;
}
