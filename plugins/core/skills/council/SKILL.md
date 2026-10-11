---
name: council
description: Stress-test a business idea with a four-agent council (Believer, Skeptic, Investor argue in parallel, then a Judge rules). Triggers on: /council, "run the council", "council this idea", "should I build this", "stress-test my business idea".
---

# Council

Pressure-test a business idea by making independent agents argue before anyone gives a verdict.

## 1. Get the idea

The idea is the skill args or the user's message. If it is under ~2 sentences, ask once for: what it is, who it's for, how it makes money. Then proceed with whatever you have. Never ask twice.

## 2. Run three advocates in parallel

Spawn all three with the Agent tool **in one message** (general-purpose, no fork, so none sees the others). Each gets the idea verbatim plus its role brief below, and may use WebSearch for real competitors, prices, and market data. Each returns at most 400 words, citing any source it used.

**Believer:** Make the strongest honest case that this works. Who exactly buys it first, why they'd switch from what they use today, the unfair advantage, and the fastest path to the first 10 paying customers. No hype: every claim needs a reason.

**Skeptic:** Try to kill the idea. Why customers won't pay, existing competitors or free substitutes, hidden costs, distribution problems, and the weaknesses the founder probably hasn't thought about. Rank the 3 most fatal risks, and for each say what evidence would prove the risk wrong.

**Investor:** Judge only the money. Rough market size (show the math), pricing, unit economics (CAC vs LTV, margins), time and capital to break even, and how big this can realistically get: lifestyle business, solid SMB, or venture scale. End with: "I would / would not put money in, because…"

## 3. Judge

Once all three return, spawn one more agent (the Judge) with the idea and the three reports, labeled. Brief:

**Judge:** You read three adversarial reports. Weigh the arguments; don't average them. Name which skeptic risks the believer and investor failed to answer. Output exactly:

- **Verdict:** PURSUE / PURSUE WITH CHANGES / DON'T PURSUE
- **Confidence:** low / medium / high, and why
- **Deciding factor:** the one argument that settled it
- **Biggest unanswered risk**
- **Cheapest test:** one experiment, doable in 2 weeks for under $500, that would most change this verdict

## 4. Report

Show the user the Judge's output first, then a 2-3 line summary of each advocate. Offer the full reports on request. Don't add your own opinion on top of the Judge's.
