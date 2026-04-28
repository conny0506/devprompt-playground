# DevPrompt Playground

> An interactive web tool that fans a single coding problem out across **three prompt strategies** (zero-shot, few-shot, chain-of-thought) and **two LLM providers** (OpenAI, Anthropic), then compares the results side-by-side — showing token cost, latency, and an LLM-judged quality score for each response.

![screenshot placeholder](docs/screenshot.png)

> **Built with AI coding tools.** ~80% of this project was scaffolded and iterated using Cursor / Claude Code. Prompt templates, the scoring rubric, and architectural decisions were authored and reviewed by hand. See [Prompt engineering notes](#prompt-engineering-notes) below.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS – dark UI |
| LLM providers | OpenAI SDK (`gpt-4o-mini`) · Anthropic SDK (`claude-haiku-4-5`) |
| Key management | BYOK via `localStorage` — zero server persistence |
| Deployment | Vercel (zero-config) |

---

## Features

- Pick any subset of **3 strategies × 2 providers** → up to **6 parallel API calls**
- Per-card stats: tokens (in/out), USD cost, latency in ms
- **LLM judge** scores every response 0–100 (correctness 40 · clarity 30 · completeness 30)
- View the **raw prompt template** in-app — single source of truth in [`lib/prompts.ts`](lib/prompts.ts)
- **Prompt caching** on Anthropic calls (system prompt tagged `cache_control: ephemeral`)
- No database, no analytics, no telemetry

---

## Quick start

```bash
git clone https://github.com/conny0506/devprompt-playground.git
cd devprompt-playground
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Settings**, paste your OpenAI and/or Anthropic API key, then type a coding problem and hit **Run comparison**.

### Deploy to Vercel

```bash
npx vercel
```

No environment variables required — keys are BYOK. If you prefer server-side defaults, copy `.env.example` to `.env.local` and fill in the keys (they will be used as fallbacks when the client sends no key).

---

## How it works

```
Browser                                  Server (Next.js API route)
  │                                           │
  │  POST /api/run                            │
  │  { problem, strategies, providers, keys } │
  │ ─────────────────────────────────────────►│
  │                                           │  Promise.allSettled([
  │                                           │    openai(zero-shot),
  │                                           │    openai(few-shot),
  │                                           │    openai(cot),
  │                                           │    anthropic(zero-shot),
  │                                           │    anthropic(few-shot),
  │                                           │    anthropic(cot),
  │                                           │  ])
  │  ◄─────────────────────────────────────── │  → RunResult[]
  │
  │  POST /api/judge
  │  { problem, results[], keys }
  │ ─────────────────────────────────────────►│
  │                                           │  single judge LLM call
  │                                           │  → JudgeScore[]
  │  ◄─────────────────────────────────────── │
  │
  │  scores animate onto cards
```

Keys travel in the request body. The server uses them once, then drops them. Nothing is logged or stored.

---

## Prompt engineering notes

All strategies share the same system prompt:

> *You are an expert software engineer. Produce concise, correct, idiomatic code. Prefer standard library solutions and clear naming.*

### Zero-shot

The baseline — bare problem, no scaffolding. Tests raw model capability.

```
Solve the following coding problem.
Return the solution code and a brief one-line explanation.

Problem:
{problem}
```

**When it works well:** short, well-defined problems where the model has strong priors (sorting, string manipulation, standard algorithms).

**When it falls short:** problems with tricky edge cases, multi-step reasoning, or an unusual format — the model has no anchor.

---

### Few-shot

Two worked examples are prepended. Anchors response **format** more than it improves correctness.

```
Here are two examples of how to solve coding problems:

Example 1:
Problem: Write a function that returns the factorial of n.
Solution:
```python
def factorial(n: int) -> int:
    ...
```
Explanation: Iterative product from 2 to n. O(n) time, O(1) space.

Example 2: ...

Now solve this problem in the same style:
Problem: {problem}
Solution:
```

**When it works well:** you want consistent formatting (typed signatures, fenced code, one-line explanation). Good when the caller will parse the output.

**When it falls short:** the examples can anchor the model to the wrong approach if the target problem requires a different pattern.

---

### Chain-of-thought

Five-step reasoning before the final code. The most expensive but often the most correct on non-trivial problems.

```
Solve the following coding problem. Think step-by-step:

1. Restate what the problem is asking in your own words.
2. Identify edge cases.
3. Sketch the approach in plain English.
4. Implement the solution.
5. Briefly verify the solution against the edge cases.

Problem:
{problem}
```

**When it works well:** algorithm design, recursion, dynamic programming, anything with subtle edge cases. The reasoning step catches mistakes before they land in code.

**When it falls short:** simple problems — the model produces a lot of scaffolding for something that needed two lines.

---

### Judge rubric

The judge LLM receives all responses in a single call and scores each:

| Dimension | Max | What it measures |
|---|---|---|
| Correctness | 40 | Logic is sound; code solves the stated problem |
| Clarity | 30 | Readable names, structure, explanation |
| Completeness | 30 | Edge cases handled; useful commentary |
| **Total** | **100** | — |

Judge model: `claude-haiku-4-5` (Anthropic key present) or `gpt-4o-mini` (fallback).

---

## Project structure

```
lib/
  types.ts          # shared interfaces
  prompts.ts        # prompt templates (single source of truth)
  pricing.ts        # $/1M token table, cost calculator
  providers/
    openai.ts       # OpenAI SDK wrapper
    anthropic.ts    # Anthropic SDK wrapper (with prompt caching)
app/
  page.tsx          # main playground UI
  api/
    run/route.ts    # parallel LLM orchestration
    judge/route.ts  # quality scoring
components/         # PromptInput, ResultCard, ResultsGrid, ...
hooks/              # useApiKeys, useToast
```

---

## Why BYOK?

Running a public LLM playground with a shared server key gets expensive and invites abuse. BYOK keeps hosting free, lets anyone fork and deploy instantly, and means **your keys never leave your browser session**.

---

## License

MIT — see [LICENSE](LICENSE).
