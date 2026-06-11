import { motion } from "framer-motion";
import type { ArcState, Ending } from "../types";

interface Props {
  ending: Ending;
  arc: ArcState;
  onRestart: () => void;
  onViewGraph: () => void;
}

// Shown after an ending scene is read. Frames this as one discovered path among
// infinitely many — inviting another run.
export default function EndingScreen({
  ending,
  arc,
  onRestart,
  onViewGraph,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="absolute inset-0 z-30 grid place-items-center bg-black/55 px-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.9 }}
        className="flex max-w-2xl flex-col items-center text-center"
      >
        <span className="text-sm uppercase tracking-[0.4em] text-white/40">
          an ending
        </span>
        <span className="accent-text mt-2 text-xs uppercase tracking-[0.3em]">
          {ending.type}
        </span>
        <h1 className="font-display text-shadow-cinema mt-3 text-4xl font-black tracking-wide text-parchment sm:text-6xl">
          {ending.title}
        </h1>
        <p className="font-prose mt-6 text-xl italic leading-relaxed text-white/75 sm:text-2xl">
          {ending.reflection}
        </p>

        <div className="mt-8 flex items-center gap-2 text-sm text-white/45">
          <span>reached in {arc.turn} choices</span>
          <span>•</span>
          <span className="accent-text">∞ other endings remain undiscovered</span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="accent-text rounded-xl border border-current px-7 py-3 font-display font-bold tracking-wide transition hover:bg-white/5"
          >
            Begin a New Tale ∞
          </motion.button>
          <button
            onClick={onViewGraph}
            className="rounded-xl border border-white/20 px-7 py-3 font-display tracking-wide text-white/70 transition hover:bg-white/10"
          >
            ⋇ Revisit the Memory Web
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
