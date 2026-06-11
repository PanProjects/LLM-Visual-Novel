import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Scene } from "../types";
import { useTypewriter } from "../hooks/useTypewriter";
import ChoiceList from "./ChoiceList";

interface Props {
  scene: Scene;
  busy: boolean;
  onChoose: (label: string) => void;
  onReachEnd: () => void; // fired when an ending scene finishes reading
}

// Plays a scene's script one entry at a time (click/space to advance), then
// reveals the choices — classic VN pacing with a cinematic dialogue panel.
export default function SceneView({ scene, busy, onChoose, onReachEnd }: Props) {
  const [idx, setIdx] = useState(0);
  const entry = scene.script[idx];
  const atLast = idx >= scene.script.length - 1;

  const text = useMemo(() => (entry ? entry.text : ""), [entry]);
  const { shown, done, skip } = useTypewriter(text);

  // Reset to the first line whenever a new scene arrives.
  useEffect(() => {
    setIdx(0);
  }, [scene]);

  const advance = () => {
    if (!done) {
      skip();
      return;
    }
    if (!atLast) {
      setIdx((i) => i + 1);
    } else if (scene.isEnding) {
      onReachEnd();
    }
  };

  // Space / Enter / click to advance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!showChoices) advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const showChoices = atLast && done && !scene.isEnding;
  const speaker = entry?.type === "line" ? entry.speaker : null;
  const emotion = entry?.type === "line" ? entry.emotion : null;

  return (
    <div className="pointer-events-none flex h-full w-full flex-col justify-end px-4 pb-6 sm:px-8 sm:pb-10 md:px-16">
      {/* Choices float above the dialogue box once the script is read. */}
      <AnimatePresence>
        {showChoices && (
          <ChoiceList
            key="choices"
            choices={scene.choices}
            busy={busy}
            onChoose={onChoose}
          />
        )}
      </AnimatePresence>

      {/* Dialogue / narration panel. */}
      <motion.div
        layout
        onClick={() => !showChoices && advance()}
        className={`glass pointer-events-auto relative mx-auto w-full max-w-4xl rounded-2xl px-6 py-5 sm:px-9 sm:py-7 ${
          showChoices ? "" : "cursor-pointer"
        }`}
      >
        {speaker && (
          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-display accent-text text-lg font-bold tracking-wide sm:text-xl">
              {speaker}
            </span>
            {emotion && (
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                {emotion}
              </span>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.p
            key={`${scene.location}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`font-prose text-shadow-cinema leading-relaxed text-parchment ${
              entry?.type === "narration"
                ? "text-xl italic text-parchment/90 sm:text-[1.6rem]"
                : "text-xl sm:text-[1.7rem]"
            } ${done ? "" : "caret"}`}
          >
            {shown}
          </motion.p>
        </AnimatePresence>

        {!showChoices && (
          <div className="mt-3 flex items-center justify-between text-xs text-white/35">
            <span>{scene.location}</span>
            <span className="animate-pulse">
              {done
                ? atLast
                  ? scene.isEnding
                    ? "▾ conclude"
                    : "▾ choose your path"
                  : "▾ continue"
                : "click to skip"}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
