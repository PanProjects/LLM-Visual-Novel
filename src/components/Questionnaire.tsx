import { motion } from "framer-motion";
import { useState } from "react";
import type { QuizAnswers } from "../types";

interface Props {
  onSubmit: (answers: QuizAnswers) => void;
  onBack: () => void;
}

const QUESTIONS: {
  key: keyof QuizAnswers;
  prompt: string;
  options: string[];
}[] = [
  {
    key: "vibe",
    prompt: "What should the air feel like?",
    options: ["light & hopeful", "dark & dangerous", "strange & dreamlike", "tense & mysterious"],
  },
  {
    key: "setting",
    prompt: "Where does it unfold?",
    options: ["a distant future", "a forgotten past", "a world beside our own", "somewhere impossible"],
  },
  {
    key: "drive",
    prompt: "What pulls your hero forward?",
    options: ["love", "the truth", "power", "survival", "freedom"],
  },
  {
    key: "companion",
    prompt: "Who walks beside you?",
    options: ["a loyal friend", "a dangerous rival", "a stranger you can't trust", "no one — you're alone"],
  },
];

export default function Questionnaire({ onSubmit, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [flavor, setFlavor] = useState("");

  const isFlavorStep = step === QUESTIONS.length;
  const q = QUESTIONS[step];

  const pick = (value: string) => {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    setStep((s) => s + 1);
  };

  const finish = () => onSubmit({ ...answers, flavor: flavor.trim() || undefined });

  const total = QUESTIONS.length + 1;

  return (
    <div className="relative grid h-full w-full place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-xl rounded-2xl p-7 sm:p-9"
      >
        {/* Progress dots. */}
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{
                background:
                  i <= step ? "var(--scene-accent)" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {!isFlavorStep ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
          >
            <h2 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
              {q.prompt}
            </h2>
            <div className="mt-6 grid gap-2.5">
              {q.options.map((o, i) => (
                <motion.button
                  key={o}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                  onClick={() => pick(o)}
                  className="font-prose rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-left text-lg text-parchment/90 transition hover:border-white/30 hover:bg-white/10"
                >
                  {o}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="flavor"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
              One last wish (optional)
            </h2>
            <p className="font-prose mt-1 text-lg italic text-white/55">
              A detail you'd love to see — a place, a creature, a feeling.
            </p>
            <textarea
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              rows={3}
              placeholder="e.g. a lighthouse that only appears in fog…"
              className="font-prose mt-4 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-lg text-parchment outline-none placeholder:text-white/30 focus:border-white/40"
            />
            <button
              onClick={finish}
              className="accent-text mt-5 w-full rounded-xl border border-current px-5 py-3 font-display text-lg font-bold tracking-wide transition hover:bg-white/5"
            >
              Begin the Tale ∞
            </button>
          </motion.div>
        )}

        <button
          onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))}
          className="mt-5 text-sm text-white/40 transition hover:text-white/70"
        >
          ← back
        </button>
      </motion.div>
    </div>
  );
}
