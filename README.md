# DevPrompt Playground

> An interactive playground that fans a single coding problem out across **three prompt strategies** (zero-shot, few-shot, chain-of-thought) and **two providers** (OpenAI, Anthropic), then compares the results side-by-side with token cost, latency, and an LLM-judged quality score.

The goal is to give an honest, hands-on look at how prompt structure and model choice affect output — not just hand-wavy "few-shot is better." You see the prompts, you see the tokens, you see the cost.

> **Note on AI tooling.** Roughly 80% of this project was scaffolded and iterated with AI coding assistants (Cursor / Claude Code). Prompt templates, scoring rubric, and architectural choices were written and reviewed by hand. See [Prompt engineering notes](#prompt-engineering-notes).

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a dark UI
- **OpenAI SDK** (`gpt-4o-mini`) and **Anthropic SDK** (`claude-haiku-4-5`)
- **BYOK** — keys are entered in the browser, stored in `localStorage`, and forwarded with each request. The server never persists or logs them.
- Vercel-ready (zero config)

## Features

- Pick any subset of strategies × providers → up to **6 parallel calls**
- Per-card stats: total tokens, USD cost (computed from the published price tables), latency (ms)
- LLM-judged score (0–100) with rubric: correctness 0–40, clarity 0–30, completeness 0–30
- View the **raw prompt template** in-app — single source of truth lives in [`lib/prompts.ts`](lib/prompts.ts)
- No backend database. No analytics. No telemetry.

## Quick start

```bash
git clone https://github.com/<your-username>/devprompt-playground.git
cd devprompt-playground
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Add API keys**, paste your OpenAI and/or Anthropic key, and run a comparison.

You can deploy to Vercel with one click — no environment variables required, since keys are BYOK.

## Prompt engineering notes

All three strategies share the same system prompt:

> You are an expert software engineer. Produce concise, correct, idiomatic code. Prefer standard library solutions and clear naming.

### Zero-shot

The baseline. The model sees only the bare problem and an instruction to solve it. This isolates raw capability.

```
Solve the following coding problem. Return the solution code and a brief one-line explanation.

Problem:
{problem}
```

### Few-shot

Two worked examples are shown before the actual problem. This anchors the response **format** (typed signature, fenced code block, brief explanation) and tends to reduce stylistic variance more than it improves correctness.

```
Here are two examples of how to solve coding problems:

Example 1: factorial(n) → iterative product …
Example 2: is_palindrome(s) → normalize then reverse-compare …

Now solve this problem in the same style:
Problem: {problem}
Solution:
```

### Chain-of-thought

Asks for explicit reasoning before code. Helps most on multi-step problems (algorithm design, edge-case enumeration). Costs more tokens.

```
Solve the following coding problem. Think step-by-step:
  1. Restate what the problem is asking in your own words.
  2. Identify edge cases.
  3. Sketch the approach in plain English.
  4. Implement the solution.
  5. Briefly verify against the edge cases.

Problem:
{problem}
```

> The exact strings live in [`lib/prompts.ts`](lib/prompts.ts) and the pricing tables in [`lib/pricing.ts`](lib/pricing.ts) — both are intentionally short and easy to audit.

## Why BYOK?

Hosting a public LLM playground with a server-side key gets expensive fast and invites abuse. BYOK keeps the project free to host, free to fork, and means **your keys never leave your browser**.

The full key flow:
1. You paste a key into the Settings modal → saved to `localStorage`.
2. Each `/api/run` request body includes the key.
3. The server uses the key to call the provider, then drops it. Nothing is logged, nothing is stored.

## Roadmap

- Streaming responses (currently waits for the full completion)
- Custom prompt strategies (user-authored templates)
- Side-by-side diff view between any two responses
- Export comparison as Markdown

## License

MIT — see [LICENSE](LICENSE).
