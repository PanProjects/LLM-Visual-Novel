import { useEffect, useRef, useState } from "react";

// Reveals `text` character by character. Returns the visible slice, whether it's
// still typing, and a `skip()` to reveal the rest instantly.
export function useTypewriter(text: string, speed = 18) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const frame = useRef<number>(0);

  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    let acc = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      const step = speed; // ms per char
      while (acc >= step && i < text.length) {
        i += 1;
        acc -= step;
      }
      setShown(text.slice(0, i));
      if (i < text.length) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, speed]);

  const skip = () => {
    cancelAnimationFrame(frame.current);
    setShown(text);
    setDone(true);
  };

  return { shown, done, skip };
}
