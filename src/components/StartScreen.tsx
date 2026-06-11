import { motion } from "framer-motion";

interface Props {
  onRandom: () => void;
  onQuiz: () => void;
  error?: string | null;
}

// The landing screen. Two doors in: dive into a random world, or shape one
// through a short questionnaire.
export default function StartScreen({ onRandom, onQuiz, error }: Props) {
  return (
    <div className="relative grid h-full w-full place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="flex max-w-2xl flex-col items-center text-center"
      >
        <motion.div
          className="font-display accent-text mb-2 text-7xl sm:text-8xl"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          ∞
        </motion.div>
        <h1 className="font-display text-shadow-cinema text-5xl font-black tracking-[0.12em] text-parchment sm:text-7xl">
          INFINITALE
        </h1>
        <p className="font-prose mt-4 max-w-lg text-xl italic leading-relaxed text-white/70 sm:text-2xl">
          A visual novel with no script. A team of AI agents dreams a world,
          remembers everything you do, and bends the story around your every
          choice — toward one of infinite endings.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRandom}
            className="glass group rounded-2xl px-8 py-5 text-left transition"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scene-accent) 40%, transparent)",
            }}
          >
            <div className="font-display accent-text text-lg font-bold">
              ✺ Leap Into the Unknown
            </div>
            <div className="font-prose text-base text-white/60">
              A wholly original world, invented on the spot.
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onQuiz}
            className="glass group rounded-2xl px-8 py-5 text-left transition"
          >
            <div className="font-display text-lg font-bold text-parchment">
              ✎ Shape Your Tale
            </div>
            <div className="font-prose text-base text-white/60">
              Answer five questions to seed the genre & mood.
            </div>
          </motion.button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-white/25">
          powered by agents on Azure AI Foundry
        </p>
      </motion.div>
    </div>
  );
}
