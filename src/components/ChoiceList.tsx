import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  choices: { id: string; label: string }[];
  busy: boolean;
  onChoose: (label: string) => void;
}

// The 3 generated choices PLUS a "write your own action" field — true open
// agency is what makes the branching feel infinite.
export default function ChoiceList({ choices, busy, onChoose }: Props) {
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const submitCustom = () => {
    const v = custom.trim();
    if (v && !busy) onChoose(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-auto mx-auto mb-4 flex w-full max-w-4xl flex-col gap-2.5"
    >
      {choices.map((c, i) => (
        <motion.button
          key={c.id}
          disabled={busy}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ scale: busy ? 1 : 1.012 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => !busy && onChoose(c.label)}
          className="glass group flex items-center gap-4 rounded-xl px-5 py-3.5 text-left transition disabled:opacity-50"
          style={{
            borderColor: "color-mix(in srgb, var(--scene-accent) 22%, transparent)",
          }}
        >
          <span className="font-display accent-text grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-sm opacity-70 transition group-hover:opacity-100">
            {String.fromCharCode(65 + i)}
          </span>
          <span className="font-prose text-lg leading-snug text-parchment/95 sm:text-xl">
            {c.label}
          </span>
        </motion.button>
      ))}

      {/* Write-your-own action. */}
      {showCustom ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex items-center gap-3 rounded-xl px-4 py-2.5"
        >
          <span className="accent-text font-display text-sm">✎</span>
          <input
            autoFocus
            value={custom}
            disabled={busy}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            placeholder="Do something else entirely…"
            className="font-prose flex-1 bg-transparent text-lg text-parchment outline-none placeholder:text-white/30"
          />
          <button
            onClick={submitCustom}
            disabled={busy || !custom.trim()}
            className="accent-text rounded-lg border border-current px-3 py-1 text-sm transition hover:bg-white/5 disabled:opacity-40"
          >
            Act ↵
          </button>
        </motion.div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          disabled={busy}
          className="font-ui mt-0.5 self-center text-sm text-white/45 underline-offset-4 transition hover:text-white/80 hover:underline"
        >
          …or write your own action
        </button>
      )}
    </motion.div>
  );
}
