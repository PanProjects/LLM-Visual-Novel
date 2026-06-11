import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Stage {
  agent: string;
  glyph: string;
  doing: string;
}

const TURN_STAGES: Stage[] = [
  { agent: "Lore Keeper", glyph: "❖", doing: "weaving your choice into the story's memory" },
  { agent: "Director", glyph: "✥", doing: "deciding how the story should turn" },
  { agent: "Narrator", glyph: "✒", doing: "writing what happens next" },
];

const START_STAGES: Stage[] = [
  { agent: "World Builder", glyph: "✺", doing: "dreaming a world into being" },
  { agent: "Lore Keeper", glyph: "❖", doing: "seeding the web of memory" },
  { agent: "Narrator", glyph: "✒", doing: "opening the first page" },
];

// Full-screen veil shown while the agent pipeline runs. It cycles through the
// agents so the wait reads as "a team of agents is working", not a spinner.
export default function AgentActivity({ kind }: { kind: "start" | "turn" }) {
  const stages = kind === "start" ? START_STAGES : TURN_STAGES;
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setI((v) => (v + 1) % stages.length),
      1900
    );
    return () => window.clearInterval(id);
  }, [stages.length]);

  const stage = stages[i];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 grid place-items-center bg-black/45 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative grid h-28 w-28 place-items-center">
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: "var(--scene-accent)" }}
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity },
            }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border border-white/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={stage.glyph}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              className="accent-text text-4xl"
            >
              {stage.glyph}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stage.agent}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="font-display text-xl font-bold tracking-wide text-parchment">
              {stage.agent}
            </span>
            <span className="font-prose text-lg italic text-white/60">
              {stage.doing}…
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2">
          {stages.map((_, k) => (
            <span
              key={k}
              className="h-1.5 w-1.5 rounded-full transition-all"
              style={{
                background:
                  k === i ? "var(--scene-accent)" : "rgba(255,255,255,0.2)",
                width: k === i ? "1.5rem" : "0.375rem",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
