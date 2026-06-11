import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { startStory, takeTurn } from "./api";
import AgentActivity from "./components/AgentActivity";
import EndingScreen from "./components/EndingScreen";
import GenerativeBackground from "./components/GenerativeBackground";
import MemoryGraph from "./components/MemoryGraph";
import Questionnaire from "./components/Questionnaire";
import SceneView from "./components/SceneView";
import StartScreen from "./components/StartScreen";
import TopBar from "./components/TopBar";
import type {
  AgentTraceItem,
  ArcState,
  Palette,
  QuizAnswers,
  Scene,
  StoryGraph,
  WorldBible,
} from "./types";

type Phase = "start" | "quiz" | "playing";

const DEFAULT_PALETTE: Palette = {
  primary: "#1a1326",
  secondary: "#3a2a55",
  accent: "#c9a86a",
};

// Push a scene palette into CSS custom properties so the whole UI re-themes.
function applyPalette(p: Palette) {
  const root = document.documentElement.style;
  root.setProperty("--scene-primary", p.primary);
  root.setProperty("--scene-secondary", p.secondary);
  root.setProperty("--scene-accent", p.accent);
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [loading, setLoading] = useState<null | "start" | "turn">(null);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [worldBible, setWorldBible] = useState<WorldBible | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [graph, setGraph] = useState<StoryGraph>({ nodes: [], edges: [] });
  const [arc, setArc] = useState<ArcState>({
    progress: 0,
    turn: 0,
    tension: 0,
    beat: "inciting",
  });
  const [trace, setTrace] = useState<AgentTraceItem[]>([]);

  const [showGraph, setShowGraph] = useState(false);
  const [showEnding, setShowEnding] = useState(false);

  const palette = scene?.palette ?? worldBible?.palette ?? DEFAULT_PALETTE;
  const ambient = scene?.ambient ?? worldBible?.ambient ?? "dust";

  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const begin = useCallback(
    async (mode: "random" | "quiz", answers?: QuizAnswers) => {
      setLoading("start");
      setError(null);
      try {
        const res = await startStory(mode, answers);
        setSessionId(res.sessionId);
        setWorldBible(res.worldBible);
        setScene(res.scene);
        setGraph(res.graph);
        setArc(res.arc);
        setTrace(res.trace);
        setShowEnding(false);
        setPhase("playing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("start");
      } finally {
        setLoading(null);
      }
    },
    []
  );

  const choose = useCallback(
    async (label: string) => {
      if (!sessionId || loading) return;
      setLoading("turn");
      setError(null);
      try {
        const res = await takeTurn(sessionId, label);
        setScene(res.scene);
        setGraph(res.graph);
        setArc(res.arc);
        setTrace(res.trace);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The story faltered.");
      } finally {
        setLoading(null);
      }
    },
    [sessionId, loading]
  );

  const restart = useCallback(() => {
    setPhase("start");
    setScene(null);
    setWorldBible(null);
    setSessionId(null);
    setGraph({ nodes: [], edges: [] });
    setArc({ progress: 0, turn: 0, tension: 0, beat: "inciting" });
    setTrace([]);
    setShowEnding(false);
    setShowGraph(false);
    setError(null);
    applyPalette(DEFAULT_PALETTE);
  }, []);

  return (
    <div className="grain relative h-full w-full overflow-hidden">
      {/* Living background. */}
      <div className="vignette absolute inset-0">
        <GenerativeBackground palette={palette} ambient={ambient} />
      </div>

      {/* Phase: landing / questionnaire. */}
      <AnimatePresence mode="wait">
        {phase === "start" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <StartScreen
              onRandom={() => begin("random")}
              onQuiz={() => setPhase("quiz")}
              error={error}
            />
          </motion.div>
        )}

        {phase === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Questionnaire
              onSubmit={(a) => begin("quiz", a)}
              onBack={() => setPhase("start")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase: playing. */}
      {phase === "playing" && worldBible && scene && (
        <>
          <TopBar
            worldBible={worldBible}
            arc={arc}
            trace={trace}
            onOpenGraph={() => setShowGraph(true)}
            onRestart={restart}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${arc.turn}-${scene.location}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pt-20"
            >
              <SceneView
                scene={scene}
                busy={loading === "turn"}
                onChoose={choose}
                onReachEnd={() => setShowEnding(true)}
              />
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="absolute inset-x-0 bottom-2 z-40 mx-auto w-fit rounded-lg border border-red-400/40 bg-red-950/60 px-4 py-2 text-sm text-red-200 backdrop-blur">
              {error}
            </div>
          )}
        </>
      )}

      {/* Overlays. */}
      <AnimatePresence>
        {loading && <AgentActivity key="activity" kind={loading} />}
      </AnimatePresence>

      <AnimatePresence>
        {showGraph && (
          <MemoryGraph
            key="graph"
            graph={graph}
            onClose={() => setShowGraph(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnding && scene?.ending && (
          <EndingScreen
            key="ending"
            ending={scene.ending}
            arc={arc}
            onRestart={restart}
            onViewGraph={() => {
              setShowEnding(false);
              setShowGraph(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
