# Prompt Engineering Techniques Reference

Load this file during Phases 2–3. Select techniques relevant to the prompt type and target. Do not apply all of them — pick what the prompt actually needs.

---

## Clarity

**Specificity over generality**
When to use: Any time an instruction could produce multiple valid interpretations.
Example: ❌ "Write a summary" → ✅ "Write a 3-sentence summary of the key argument, in plain English, for a non-technical reader."

**Explicit constraints**
When to use: When there are hard limits on length, format, scope, or behavior.
Example: "Respond in 100 words or fewer. Do not include bullet points."

**Avoid vague qualifiers**
When to use: Any instruction using words like "good", "appropriate", "relevant", "helpful", "reasonable".
Fix: Replace with measurable or observable criteria. "Relevant" → "directly mentioned in the provided text". "Good" → "grammatically correct and free of jargon".

---

## Structure

**Role framing**
When to use: When tone, persona, expertise level, or perspective matters.
Example: "You are a senior software engineer reviewing a pull request. Your job is to identify logic errors and suggest improvements. You are not responsible for style or formatting."

**XML/Markdown delimiters**
When to use: When the prompt contains multiple distinct sections (instructions, context, input, examples). Helps models parse structure reliably.
Example:
```
<instructions>
Summarize the following article in three bullet points.
</instructions>

<article>
{{article_text}}
</article>
```

**Output format specification**
When to use: When the output must be in a specific format (JSON, markdown, table, numbered list).
Example: "Respond only with a JSON object with keys: `title` (string), `summary` (string, max 50 words), `tags` (array of strings)."

---

## Reasoning

**Chain-of-thought (CoT)**
When to use: Complex reasoning tasks — math, logic, multi-step decisions, ambiguous situations.
Example: "Think through this step by step before giving your final answer."

**Scratchpad / reasoning block**
When to use: When you want to see reasoning but keep the final output clean.
Example: "First, reason through the problem inside <thinking> tags. Then provide your final answer outside those tags."

**Explicit reasoning request**
When to use: When you need the model to explain its choices, not just produce output.
Example: "For each suggestion, explain in one sentence why you're recommending it."

---

## Examples (Few-Shot)

**0-shot**
When to use: Simple, well-defined tasks where the instruction is unambiguous. Saves tokens.
Use when: Format is standard, task is common, output is hard to misinterpret.

**1-shot**
When to use: When you need to anchor the output format or style with a single example.
Pattern:
```
Input: [example input]
Output: [example output]

Now do the same for:
Input: [real input]
Output:
```

**Few-shot (2–5 examples)**
When to use: Format-sensitive tasks, nuanced classification, stylistic matching, tasks where 0-shot produces inconsistent output.
Rule: Examples must be representative of the range of inputs, not all from the easy case.

---

## Control

**Negative instructions**
When to use: When there's a specific failure mode you've seen or anticipate.
Example: "Do not mention competitor products. Do not apologize. Do not add a disclaimer unless the content is genuinely unsafe."
Caution: Too many negatives create confusion. Prefer positive framing where possible: "Focus only on X" instead of "Don't talk about anything other than X."

**Fallback behavior**
When to use: Any prompt that might receive invalid, ambiguous, or out-of-scope input.
Example: "If the user's request is outside the scope of [X], respond with: 'I can only help with [X]. Could you rephrase your question?'"

**Refusal handling**
When to use: System prompts where the model might refuse legitimate requests or comply with illegitimate ones.
Example: "If asked to do something you cannot do, explain briefly why and offer the closest thing you can do instead."

---

## System Prompt Specifics

**Tone locking**
When to use: When persona consistency matters across a conversation.
Example: "You are always formal, precise, and concise. You never use casual language, emojis, or filler phrases like 'Great question!' or 'Certainly!'."

**Persona consistency**
When to use: Role-based assistants where breaking character degrades UX.
Example: "You are Aria, a customer support agent for Acme Corp. You do not reveal that you are an AI unless directly asked. You do not discuss topics unrelated to Acme products."

**Tool use guidance**
When to use: Claude Code skills, agents, or API prompts with tool access.
Example: "Use the search tool before answering any factual question. Do not answer from memory if the question involves specific dates, names, or figures."

**Scope bounding**
When to use: System prompts where the assistant should only do a narrow set of things.
Example: "You only answer questions about [X]. For any other topic, redirect the user back to [X] without engaging with the off-topic request."

---

## Evaluation

**Happy path test**
The most common, straightforward input. Does the prompt produce the intended output?

**Edge case test**
Empty input, very long input, input in a different language, input that's technically valid but unusual.

**Adversarial test**
Input designed to make the model go off-script: jailbreak attempts, prompt injection in user-controlled fields, requests to ignore instructions.

**Boundary test**
Input that sits right at a constraint boundary. If the prompt says "respond in 100 words or fewer", test with a topic that naturally wants 200 words.

**Format stress test**
Does the output format hold up when the content is complex? If the prompt asks for JSON, does the model produce valid JSON even for edge case inputs?
