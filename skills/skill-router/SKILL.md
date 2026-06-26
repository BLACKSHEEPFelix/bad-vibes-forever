---
name: skill-router
description: Route ambiguous or complex user tasks to the most relevant installed skills before execution. Use when the user asks to automatically choose skills, is unsure which skill to use, asks what skills can help a job/project, or presents a non-trivial reading, research, writing, analysis, decision, learning, presentation, visual, document, spreadsheet, PDF, coding, automation, or workflow task where an installed skill may improve the result. Scans installed skill metadata, recommends a minimal skill or skill chain, reads chosen SKILL.md files, and then executes the task.
---

# Skill Router

Use this skill as a lightweight dispatcher before doing substantive work. Its job is to choose the smallest useful set of installed skills, not to add ceremony.

## Routing Workflow

1. Classify the user's task in one sentence: goal, artifact type, and expected output.
2. If the task is trivial, answer directly and do not route.
3. Run the recommender when local filesystem access is available:

```bash
python scripts/route_skills.py --task "<user task>" --top 8
```

If Python is unavailable, inspect installed skill metadata manually from likely skill directories.

4. Choose a route:
   - Use no skill for simple factual, formatting, or one-command tasks.
   - Use one skill when the task has one dominant mode.
   - Use a chain of two or three skills only when the task naturally has phases, such as read -> think -> write, paper -> card, or research -> presentation.
5. Announce the route briefly before executing: "I will use X for ..., then Y for ...."
6. For every selected skill, read that skill's `SKILL.md` completely before applying it. Follow its referenced files only when its instructions say they are relevant.
7. Execute the user's original task. Do not stop at recommendations unless the user explicitly asks only for a skill choice.

## Selection Rules

- Prefer a named skill when the user explicitly requests it.
- Prefer the most specific skill over this router once a clear match exists.
- Prefer existing installed skills over inventing an ad hoc workflow.
- Keep chains short. A two-skill route usually beats a five-skill route.
- Explain tradeoffs when two skills overlap, then pick one.
- Avoid routing for sensitive or high-stakes tasks unless a skill clearly improves correctness; verify with primary sources when needed.
- If no installed skill fits, say so and proceed normally.

## Common Routes

Use `references/routing-patterns.md` when the recommender produces close matches or the user asks what they can do with their skills.

Typical examples:

- Research paper: `ljg-paper`; if a visual output is requested, `ljg-paper-flow`.
- Paper lineage or citation history: `ljg-paper-river`.
- Book analysis: `ljg-book`; if a visual collectible card is requested, `ljg-library`.
- Article or dense text: `ljg-read`, `ljg-qa`, or `ljg-plain` depending on whether the user wants guided reading, questions, or plain language.
- Deep thinking: `ljg-think` for vertical root-cause analysis; `ljg-rank` for finding the independent forces behind a domain.
- Content creation: `ljg-think` -> `ljg-writes`, or `khazix-writer` when the user wants that style.
- Visual cards: `ljg-card`; presentations: `ljg-present`.
- Installed skill overview: `ljg-skill-map` or this router's recommender script.

## Output Style

When routing is part of the task, keep the route note short:

```text
Route: ljg-think -> ljg-writes.
Why: first clarify the core claim, then turn it into a finished article.
```

Then continue directly into the work.
