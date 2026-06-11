import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphNode, NodeType, StoryGraph } from "../types";

// A self-contained force-directed view of the story's knowledge graph — the
// memory the agents actually reason over. Rendered as animated SVG; the physics
// is a tiny hand-rolled spring/repulsion sim so there are no heavy deps.

interface Props {
  graph: StoryGraph;
  onClose: () => void;
}

interface Sim extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const TYPE_COLOR: Record<NodeType, string> = {
  character: "#ffd479",
  location: "#7ad1ff",
  item: "#c6a0ff",
  event: "#ff8f9c",
  faction: "#9affb0",
  theme: "#ffb3f0",
};

const W = 1000;
const H = 700;

export default function MemoryGraph({ graph, onClose }: Props) {
  const [nodes, setNodes] = useState<Sim[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build initial layout in a loose ring (seeded by index, no randomness needed
  // for determinism across renders).
  useEffect(() => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      return graph.nodes.map((n, i) => {
        const existing = byId.get(n.id);
        if (existing) return { ...existing, ...n };
        const ang = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
        const r = 160 + (i % 3) * 60;
        return {
          ...n,
          x: W / 2 + Math.cos(ang) * r,
          y: H / 2 + Math.sin(ang) * r,
          vx: 0,
          vy: 0,
        };
      });
    });
  }, [graph.nodes]);

  // Physics loop.
  useEffect(() => {
    let raf = 0;
    const step = () => {
      setNodes((cur) => {
        if (cur.length === 0) return cur;
        const next = cur.map((n) => ({ ...n }));
        // Repulsion.
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let d2 = dx * dx + dy * dy || 1;
            const force = 9000 / d2;
            const d = Math.sqrt(d2);
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
        // Springs along edges.
        for (const e of graph.edges) {
          const a = next.find((n) => n.id === e.source);
          const b = next.find((n) => n.id === e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 150;
          const f = (d - target) * 0.01;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
        // Centering + integrate.
        for (const n of next) {
          if (n.id === dragId.current) {
            n.vx = 0;
            n.vy = 0;
            continue;
          }
          n.vx += (W / 2 - n.x) * 0.002;
          n.vy += (H / 2 - n.y) * 0.002;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(40, Math.min(W - 40, n.x));
          n.y = Math.max(40, Math.min(H - 40, n.y));
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [graph.edges]);

  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const onMove = (e: React.MouseEvent) => {
    if (!dragId.current) return;
    const { x, y } = toSvg(e.clientX, e.clientY);
    setNodes((cur) =>
      cur.map((n) => (n.id === dragId.current ? { ...n, x, y, vx: 0, vy: 0 } : n))
    );
  };

  const counts = useMemo(() => {
    const c: Partial<Record<NodeType, number>> = {};
    for (const n of graph.nodes) c[n.type] = (c[n.type] ?? 0) + 1;
    return c;
  }, [graph.nodes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 grid place-items-center bg-black/70 p-3 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display accent-text text-xl font-bold tracking-wide">
              The Memory Web
            </h2>
            <p className="font-prose text-sm italic text-white/55">
              {graph.nodes.length} memories linked by {graph.edges.length}{" "}
              threads — what the agents remember and reason over.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            Close ✕
          </button>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-full w-full"
            onMouseMove={onMove}
            onMouseUp={() => (dragId.current = null)}
            onMouseLeave={() => (dragId.current = null)}
          >
            {/* Edges. */}
            {graph.edges.map((e, i) => {
              const a = nodeById.get(e.source);
              const b = nodeById.get(e.target);
              if (!a || !b) return null;
              const active = hover === e.source || hover === e.target;
              return (
                <g key={i}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={active ? "var(--scene-accent)" : "rgba(255,255,255,0.14)"}
                    strokeWidth={active ? 1.6 : 0.8}
                  />
                  {active && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      fill="var(--scene-accent)"
                      fontSize="11"
                      textAnchor="middle"
                      className="font-ui"
                    >
                      {e.relation}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes. */}
            {nodes.map((n) => {
              const r = 8 + n.importance * 3;
              const color = TYPE_COLOR[n.type] ?? "#fff";
              const active = hover === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                  onMouseDown={() => (dragId.current = n.id)}
                  style={{ cursor: "grab" }}
                >
                  <circle
                    r={r + (active ? 4 : 0)}
                    fill={color}
                    fillOpacity={active ? 0.95 : 0.8}
                    stroke={color}
                    strokeOpacity={0.4}
                    strokeWidth={active ? 8 : 0}
                    style={{ filter: `drop-shadow(0 0 ${active ? 10 : 4}px ${color})` }}
                  />
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fill={active ? "#fff" : "rgba(255,255,255,0.75)"}
                    fontSize={active ? 14 : 12}
                    className="font-ui pointer-events-none select-none"
                    style={{ fontWeight: active ? 700 : 500 }}
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover detail card. */}
          <AnimatePresence>
            {hover && nodeById.get(hover) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_COLOR[nodeById.get(hover)!.type] }}
                  />
                  <span className="font-display font-bold text-parchment">
                    {nodeById.get(hover)!.name}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-white/40">
                    {nodeById.get(hover)!.type}
                  </span>
                </div>
                <p className="font-prose mt-1 text-base text-white/75">
                  {nodeById.get(hover)!.description}
                </p>
                {nodeById.get(hover)!.state && (
                  <p className="mt-1 text-sm italic accent-text">
                    now: {nodeById.get(hover)!.state}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend. */}
        <footer className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/10 px-6 py-3 text-xs">
          {(Object.keys(TYPE_COLOR) as NodeType[]).map((t) =>
            counts[t] ? (
              <span key={t} className="flex items-center gap-1.5 text-white/60">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: TYPE_COLOR[t] }}
                />
                {t} ({counts[t]})
              </span>
            ) : null
          )}
          <span className="ml-auto text-white/35">drag nodes • hover for detail</span>
        </footer>
      </motion.div>
    </motion.div>
  );
}
