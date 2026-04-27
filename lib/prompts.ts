import type { PromptStrategy } from "./types";

export interface PromptTemplate {
  id: PromptStrategy;
  label: string;
  description: string;
  build: (problem: string) => { system: string; user: string };
}

const SYSTEM_BASE =
  "You are an expert software engineer. Produce concise, correct, idiomatic code. Prefer standard library solutions and clear naming.";

export const PROMPT_TEMPLATES: Record<PromptStrategy, PromptTemplate> = {
  "zero-shot": {
    id: "zero-shot",
    label: "Zero-shot",
    description:
      "Direct instruction with no examples. Tests the raw capability of the model on the bare problem statement.",
    build: (problem) => ({
      system: SYSTEM_BASE,
      user: `Solve the following coding problem. Return the solution code and a brief one-line explanation.\n\nProblem:\n${problem}`,
    }),
  },

  "few-shot": {
    id: "few-shot",
    label: "Few-shot",
    description:
      "Two worked examples are shown before the actual problem. Anchors the response style and format.",
    build: (problem) => ({
      system: SYSTEM_BASE,
      user: `Here are two examples of how to solve coding problems:

Example 1:
Problem: Write a function that returns the factorial of n.
Solution:
\`\`\`python
def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
\`\`\`
Explanation: Iterative product from 2 to n. O(n) time, O(1) space.

Example 2:
Problem: Write a function that checks if a string is a palindrome.
Solution:
\`\`\`python
def is_palindrome(s: str) -> bool:
    cleaned = "".join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]
\`\`\`
Explanation: Normalize then compare with reverse. Handles punctuation and case.

Now solve this problem in the same style:
Problem: ${problem}
Solution:`,
    }),
  },

  "chain-of-thought": {
    id: "chain-of-thought",
    label: "Chain-of-thought",
    description:
      "Asks the model to reason step-by-step before producing the final code. Often improves correctness on multi-step problems.",
    build: (problem) => ({
      system: SYSTEM_BASE,
      user: `Solve the following coding problem. Think step-by-step:

1. Restate what the problem is asking in your own words.
2. Identify edge cases.
3. Sketch the approach in plain English.
4. Implement the solution.
5. Briefly verify the solution against the edge cases.

Problem:
${problem}`,
    }),
  },
};

export const ALL_STRATEGIES: PromptStrategy[] = [
  "zero-shot",
  "few-shot",
  "chain-of-thought",
];
