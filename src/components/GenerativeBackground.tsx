import { useEffect, useRef } from "react";
import type { Ambient, Palette } from "../types";

// A self-contained generative atmosphere: a slow aurora-like gradient wash that
// drifts behind the scene, plus an ambient particle field (embers, rain, snow…)
// keyed to the scene. No images — it's all procedural, so every mood is unique.

interface Props {
  palette: Palette;
  ambient: Ambient;
}

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  seed: number;
};

const COUNT: Record<Ambient, number> = {
  embers: 70,
  rain: 160,
  snow: 110,
  dust: 90,
  stars: 130,
  void: 50,
  fireflies: 55,
  petals: 60,
};

export default function GenerativeBackground({ palette, ambient }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(palette);
  const ambientRef = useRef(ambient);
  paletteRef.current = palette;
  ambientRef.current = ambient;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = 0;
    let h = 0;
    let particles: P[] = [];
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const makeParticle = (initial = false): P => {
      const a = ambientRef.current;
      const maxLife = 200 + Math.random() * 400;
      let x = Math.random() * w;
      let y = Math.random() * h;
      let vx = 0;
      let vy = 0;
      const size = 1 + Math.random() * 2.5;
      if (a === "embers") {
        y = initial ? Math.random() * h : h + 10;
        vx = (Math.random() - 0.5) * 0.3;
        vy = -0.3 - Math.random() * 0.7;
      } else if (a === "rain") {
        y = initial ? Math.random() * h : -10;
        vx = -0.6;
        vy = 6 + Math.random() * 4;
      } else if (a === "snow" || a === "petals" || a === "dust") {
        y = initial ? Math.random() * h : -10;
        vx = (Math.random() - 0.5) * 0.6;
        vy = 0.4 + Math.random() * 0.9;
      } else if (a === "fireflies") {
        vx = (Math.random() - 0.5) * 0.4;
        vy = (Math.random() - 0.5) * 0.4;
      } else {
        // stars / void — gentle drift
        vx = (Math.random() - 0.5) * 0.1;
        vy = (Math.random() - 0.5) * 0.1;
      }
      return {
        x,
        y,
        vx,
        vy,
        size,
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
        seed: Math.random() * 1000,
      };
    };

    const seed = () => {
      particles = Array.from({ length: COUNT[ambientRef.current] }, () =>
        makeParticle(true)
      );
    };

    const draw = () => {
      t += 1;
      const pal = paletteRef.current;
      const a = ambientRef.current;

      // Aurora gradient wash.
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(
        0,
        0,
        w * (0.5 + 0.5 * Math.sin(t * 0.001)),
        h
      );
      g.addColorStop(0, pal.primary);
      g.addColorStop(0.55, mix(pal.primary, pal.secondary, 0.6));
      g.addColorStop(1, pal.secondary);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Soft drifting light blobs in the accent color.
      for (let i = 0; i < 3; i++) {
        const bx = w * (0.3 + 0.4 * Math.sin(t * 0.0009 + i * 2));
        const by = h * (0.3 + 0.4 * Math.cos(t * 0.0011 + i * 1.5));
        const r = Math.min(w, h) * (0.35 + 0.1 * Math.sin(t * 0.002 + i));
        const rg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        rg.addColorStop(0, hexA(pal.accent, 0.1));
        rg.addColorStop(1, hexA(pal.accent, 0));
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      }

      // Particles.
      ctx.save();
      for (const p of particles) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;

        if (a === "fireflies") {
          p.x += Math.sin(t * 0.02 + p.seed) * 0.4;
          p.y += Math.cos(t * 0.018 + p.seed) * 0.4;
        }
        if (a === "snow" || a === "petals" || a === "dust") {
          p.x += Math.sin(t * 0.01 + p.seed) * 0.5;
        }

        const offscreen =
          p.y < -20 || p.y > h + 20 || p.x < -20 || p.x > w + 20;
        if (offscreen || p.life > p.maxLife) {
          Object.assign(p, makeParticle(false));
          continue;
        }

        const fade =
          a === "embers" || a === "fireflies"
            ? 0.5 + 0.5 * Math.sin(p.life * 0.05 + p.seed)
            : 1 - p.life / p.maxLife;

        ctx.globalAlpha = clamp(fade * 0.8, 0, 0.9);
        ctx.fillStyle = particleColor(a, pal);

        if (a === "rain") {
          ctx.strokeStyle = hexA(pal.accent, 0.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.stroke();
        } else {
          if (a === "fireflies" || a === "embers" || a === "stars") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = pal.accent;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    resize();
    seed();
    draw();
    window.addEventListener("resize", resize);

    // Reseed particle field when the ambient type changes.
    const reseedTimer = window.setInterval(() => {
      if (particles.length !== COUNT[ambientRef.current]) seed();
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.clearInterval(reseedTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ transition: "filter 1.2s ease" }}
    />
  );
}

function particleColor(a: Ambient, pal: Palette): string {
  switch (a) {
    case "rain":
      return hexA(pal.accent, 0.5);
    case "snow":
      return "rgba(255,255,255,0.85)";
    case "petals":
      return hexA(pal.accent, 0.8);
    case "stars":
      return "rgba(255,255,255,0.9)";
    case "void":
      return hexA(pal.secondary, 0.7);
    default:
      return pal.accent;
  }
}

// ── color helpers ────────────────────────────────────────────────────────────
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexA(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
