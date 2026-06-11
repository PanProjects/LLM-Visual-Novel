import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { AgentTraceItem, ArcState, WorldBible } from "../types";

interface Props {
  worldBible: WorldBible;
  arc: ArcState;
  trace: AgentTraceItem[];
  onOpenGraph: () => void;
  onRestart: () => void;
}

const AGENT_GLYPH: Record<string, string> = {
  "World Builder": "✺",
  "Lore Keeper": "❖",
  Director: "✥",
  Narrator: "✒",
};

export default function TopBar({
  worldBible,
  arc,
  trace,
  onOpenGraph,
  onRestart,
}: Props) {
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:p-5">
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Title block. */}
        <div className="glass flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-2">
          <span className="font-display accent-text text-2xl leading-none">∞</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display truncate text-base font-bold tracking-wide text-parchment sm:text-lg">
                {worldBible.title}
              </h1>
              <span className="hidden shrink-0 text-xs uppercase tracking-[0.2em] text-white/40 sm:inline">
                {worldBible.genre}
              </span>
            </div>
            <ArcMeter arc={arc} />
          </div>
        </div>

        {/* Actions. */}
        <button
          onClick={() => setShowTrace((s) => !s)}
          title="Agent activity"
          className={`glass pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg transition hover:bg-white/10 ${
            showTrace ? "accent-text" : "text-white/70"
          }`}
        >
          ◈
        </button>
        <button
          onClick={onOpenGraph}
          title="Memory web"
          className="glass pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg text-white/70 transition hover:bg-white/10"
        >
          ⋇
        </button>
        <button
          onClick={onRestart}
          title="New story"
          className="glass pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg text-white/70 transition hover:bg-white/10"
        >
          ↻
        </button>
      </div>

      {/* Agent activity feed. */}
      <AnimatePresence>
        {showTrace && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pointer-events-auto self-start"
          >
            <div className="glass max-w-md rounded-xl p-3">
              <p className="mb-2 px-1 text-xs uppercase tracking-[0.2em] text-white/40">
                Agent activity — last turn
              </p>
              <ul className="flex flex-col gap-1.5">
                {trace.map((t, i) => (
                  <li key={i} className="flex gap-2.5 px-1">
                    <span className="accent-text mt-0.5 text-sm">
                      {AGENT_GLYPH[t.agent] ?? "•"}
                    </span>
                    <div>
                      <span className="font-display text-sm font-semibold text-parchment">
                        {t.agent}
                      </span>
                      <span className="text-sm text-white/70"> — {t.summary}</span>
                      {t.detail && (
                        <p className="font-prose text-sm italic text-white/45">
                          {t.detail}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArcMeter({ arc }: { arc: ArcState }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-white/10 sm:w-44">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--scene-secondary), var(--scene-accent))",
          }}
          animate={{ width: `${arc.progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
        {arc.beat}
      </span>
    </div>
  );
}
