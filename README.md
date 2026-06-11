<div align="center">

# ∞ Infinitale

### A visual novel with no script.

A team of AI agents dreams a world into being, remembers everything you do in a
living knowledge graph, and bends the story around your every choice — toward
one of infinite endings.

**Built for the Microsoft Agents League — Creative Apps track.**
Powered by `gpt-5.4` on **Azure AI Foundry**.

</div>

---

## What it is

Most interactive fiction is a fixed tree of pre-written branches. Infinitale has
**no authored content at all**. Every world, character, scene, choice, and ending
is generated live by a pipeline of cooperating LLM agents that share a persistent,
graph-structured memory. Two runs are never the same, and the player always has
the option to **write their own action** — so the branching is genuinely open, not
a menu of three.

| | |
|---|---|
| 🌍 **Infinite worlds** | Start blind ("Leap Into the Unknown") or shape the genre & mood through a 5-question prompt. |
| 🧠 **Graph memory** | A knowledge graph of characters, places, items, events, factions and themes is the story's long-term memory — visualize it live as **The Memory Web**. |
| ✍️ **Open agency** | Pick one of three generated choices *or* type any action you can imagine. |
| ♾️ **Alternative endings** | A Director agent tracks the dramatic arc; endings emerge from your choices, framed as one path among infinitely many. |
| 🎬 **Cinematic & procedural** | Mood-driven generative backgrounds (no stock art): aurora gradients + ambient particle fields (rain, embers, snow…) keyed to each scene. |

## The agentic engine

Infinitale is built around **four specialized agents** orchestrated over a shared
graph. Each has one sharp responsibility and a strict JSON contract.

```
 START                            EACH TURN
 ─────                            ─────────
 World Builder                    ┌─ Lore Keeper ─┐   (run in parallel)
   │  invents world + cast        │  graph deltas │
   │  seeds the graph             └─ Director ────┘   beat / pacing / endings
   ▼                                      │
 Narrator (grounded)             merge graph  →  build grounded context
   opening scene                          ▼
                                  Narrator (grounded)  →  next scene + choices
```

| Agent | Role |
|---|---|
| **🌍 World Builder** | Turns a seed (random or questionnaire) into a world bible + the initial knowledge graph. |
| **❖ Lore Keeper** | After every choice, extracts graph deltas — new entities, relationships, status changes, canonical facts. This *is* the memory. |
| **✥ Director** | Owns pacing. Tracks the arc (0–100) and decides the next beat (rising / twist / climax / ending) and *when* an ending is earned. |
| **✒ Narrator** | Writes the next playable scene — prose, dialogue, mood, palette, and three branching choices — **grounded** on the retrieved subgraph. |

The Lore Keeper and Director run **concurrently** each turn (the Director reasons
over the prior graph summary, so it doesn't block on the merge), keeping turns
responsive. The whole pipeline is made visible in the UI via a live **Agent
Activity** feed and indicator — the multi-agent wait becomes part of the show.

## Microsoft IQ integration — grounded retrieval on Azure AI Foundry

The challenge requires a Microsoft IQ intelligence layer. Infinitale runs entirely
on **Azure AI Foundry** (`gpt-5.4` deployment) and implements a **Foundry-IQ-style
grounded retrieval layer**:

- The knowledge graph (`server/graph.ts`) is the agents' source of truth.
- Before the Narrator writes, `buildGrounding()` retrieves a **relevant subgraph** —
  scoring nodes by importance and proximity to the entities named in the player's
  action — plus the most recent canonical facts, and injects them as grounded
  context.
- The Narrator is contractually bound to **stay consistent with this canon and not
  contradict it**, which is exactly the Foundry IQ value proposition: *cited,
  grounded answers that reduce hallucination.*

This keeps a fully-generated story coherent across dozens of turns. The same seam
is where you would plug in **Azure AI Search / the Foundry IQ retrieval API** to
ground stories in external corpora (a lore wiki, a franchise bible, a textbook).

## Quick start

**Prerequisites:** Node.js 18+ and an Azure AI Foundry / Azure OpenAI deployment.

```bash
# 1. Install
npm install

# 2. Configure credentials (server-side only — never shipped to the browser)
cp .env.example .env
#   then fill in AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT

# 3. Run the app + agent server together
npm run dev
```

Open **http://localhost:5173**.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server + agent API server (hot-reload) together. |
| `npm run server` | Just the agent/API server (`tsx watch`). |
| `npm run build` | Production build of the web client. |

## Architecture

```
server/                 Node + Express agent server (holds the Azure key)
  azure.ts              Azure AI Foundry client (JSON mode + repair retry)
  agents.ts             World Builder · Lore Keeper · Director · Narrator
  graph.ts              Knowledge-graph memory + grounded retrieval
  orchestrator.ts       Story Engine — wires the agents over a session
  index.ts              HTTP API:  POST /api/start · POST /api/turn

src/                    Vite + React + TypeScript client
  App.tsx               Phase/state machine + live palette theming
  components/
    GenerativeBackground.tsx   Procedural canvas: gradient + particles
    SceneView.tsx              Typewriter VN playback
    ChoiceList.tsx             3 choices + write-your-own action
    MemoryGraph.tsx            Hand-rolled force-directed graph view
    AgentActivity.tsx          Live "the agents are working" pipeline
    TopBar.tsx                 Arc meter + agent activity feed
    StartScreen / Questionnaire / EndingScreen
```

**Tech:** React 18, TypeScript, Vite 6, Tailwind v4, Framer Motion, Express. No
heavy graph or game libraries — the force-directed memory view and the generative
backgrounds are written from scratch.

## Security

The Azure subscription key lives **only** in `server/.env` (git-ignored) and is
used exclusively server-side. The browser talks to `/api/*`; the key is never
bundled into client code. Rotate the key before sharing this repo publicly, and
keep `.env` out of version control.

## A note on AI-assisted development

This project was built with AI pair-programming assistance — the agent prompts,
the graph-grounding layer, the procedural background, and the force-directed
graph view were all iterated on conversationally, scaffolding → core engine →
polish, validating the live Azure endpoint and the rendered UI at each step.
