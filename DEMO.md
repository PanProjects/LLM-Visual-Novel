<div align="center">

# 🎬 Infinitale — Demo & Judging Guide

*A 3-minute walkthrough that hits every evaluation criterion.*

</div>

---

## ⏱️ 30-second pitch (say this first)

> "Infinitale is a visual novel with **no script**. Four AI agents on **Azure AI
> Foundry** invent the world, remember everything in a **knowledge graph**, and write
> the story live around your choices. Because the graph grounds every scene —
> Foundry-IQ style — the story stays coherent across dozens of turns instead of
> drifting into hallucination. And you're never stuck with three options: you can
> **type any action you want**. Infinite worlds, infinite endings."

---

## 🚀 Setup (before judging)

```bash
npm install
cp .env.example .env      # add your Azure AI Foundry endpoint + key + deployment
npm run dev               # web → http://localhost:5173 , agents → :8787
```

Open **http://localhost:5173** in a full-screen browser. Confirm the agent server
is healthy: `http://localhost:8787/api/health` → `{ "ok": true, "model": "gpt-5.4" }`.

> 💡 Have the **Agent Activity** panel ready to open — it's the clearest proof of the
> multi-agent design while a turn is generating.

---

## 🧭 The 3-minute flow

| # | Do this | Say / point out | Criterion |
|---|---|---|---|
| 1 | On the landing screen, click **"Shape Your Tale"** and answer the 5 quick questions (or click **"Leap Into the Unknown"** for a surprise). | "The **World Builder** agent turns these answers into a complete world bible **and** seeds the knowledge graph." | Creativity · Agentic |
| 2 | While it loads, point at the **Agent Activity** spinner cycling through agents. | "These aren't loading frames — that's the real pipeline: World Builder → Lore Keeper → Narrator." | Agentic · UX |
| 3 | Read the opening scene. Advance with **click / Space**. | "Every scene is generated — prose, characters, mood, and the animated background palette all come from the **Narrator**." | Creativity · UX |
| 4 | Make a choice. | "Watch the story react to *exactly* what I picked." | Interactivity |
| 5 | Open the **◈ Agent Activity** feed (top bar). | "Here's what each agent just did: the **Lore Keeper** wove my choice into memory, the **Director** chose the next beat, the **Narrator** wrote the scene." | **Agentic (key)** |
| 6 | Open the **⋇ Memory Web** (top bar). Hover and drag nodes. | "This is the live **knowledge graph** the agents reason over — characters, places, events, and how they're linked. It grows every turn. This is the **Microsoft IQ / Foundry-IQ grounding layer** in action." | **Microsoft IQ (key)** |
| 7 | Close it, then use **"…or write your own action"** and type something unexpected (e.g. *"set the ledger on fire and walk out"*). | "I'm not limited to three options — open agency is what makes the branching truly infinite, and the agents still keep it consistent." | **Creativity / Innovation (key)** |
| 8 | Keep playing toward an **ending** (watch the arc meter in the top bar fill). | "The **Director** decides when an ending is earned — and frames it as one of infinitely many." | Creativity · Design |

---

## 🎯 Map to the evaluation criteria

| Requirement | Where it shows |
|---|---|
| **Microsoft IQ integration** | The **Memory Web** + `server/graph.ts → buildGrounding()`: a Foundry-IQ-style grounded retrieval layer that feeds the agents a relevant subgraph + canonical facts to reduce hallucination. Runs on **Azure AI Foundry** (`gpt-5.4`). |
| **Creative application** | A visual novel with zero authored content, open free-text agency, alternative endings, and fully **procedural** mood-driven visuals (no stock art). |
| **GitHub Copilot usage** | See the *GitHub Copilot in the build* section of the README + commit history. |
| **Thoughtful UX** | Cinematic typewriter pacing, live re-theming per scene, transparent agent activity, an interactive graph view. |

---

## 🗣️ Likely questions & answers

- **"Is this just one big prompt?"** — No. Four agents with distinct roles and strict
  JSON contracts; the Lore Keeper and Director run in parallel, then the Narrator
  generates grounded on the merged graph. See the README schematics.
- **"How do you stop it hallucinating / going incoherent?"** — Two mechanisms: (1)
  graph-grounded retrieval injects established canon into every generation; (2) a
  strict clarity contract on the Narrator (concrete prose, resolvable pronouns,
  introduce characters by name + relationship, no references outside canon).
- **"What's the Microsoft piece?"** — Everything runs on **Azure AI Foundry**; the
  grounding layer is the Foundry-IQ pattern, and it's the exact seam where you'd
  attach Azure AI Search to ground stories on an external corpus.
- **"Does it scale to real content?"** — Yes: swap the in-memory graph for the same
  retrieval call against Azure AI Search / Foundry IQ over a lore wiki or franchise
  bible; nothing else changes.

---

## 🧯 Troubleshooting

| Symptom | Fix |
|---|---|
| Blank scene / 500 on start | Check `.env` — endpoint, key, and **deployment name** must match your Foundry resource. Hit `/api/health`. |
| `EADDRINUSE :8787` | A previous server is still running; stop it (or change `PORT` in `.env`). |
| Story feels slow | Each turn is up to 3 model calls; the Lore Keeper + Director already run in parallel. This is expected for live generation — the Agent Activity feed covers the wait. |

<div align="center">

*Tip: keep one browser tab on the **Memory Web** and one on the **Agent Activity**
feed — together they tell the whole "agentic + grounded" story at a glance.*

</div>
