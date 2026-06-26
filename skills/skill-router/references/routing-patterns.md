# Routing Patterns

Use this reference when several skills look relevant or the user asks how skills can help their work.

## First Principles

- Route by the user's desired output, not just the topic.
- Prefer a specific domain skill when the task names an artifact: paper, book, card, presentation, spreadsheet, PDF, image, codebase.
- Chain skills only when each step changes the artifact or reasoning mode.
- Keep the user-facing route explanation to one or two lines.

## Common Chains

| User intent | Suggested route | Notes |
| --- | --- | --- |
| Understand a paper | `ljg-paper` | Use `ljg-paper-flow` if the user also wants a visual card. |
| Trace a paper's lineage | `ljg-paper-river` | Best for "where did this idea come from" and citation-chain questions. |
| Analyze a book | `ljg-book` | Add `ljg-library` only when a visual book card is requested. |
| Read a long article | `ljg-read` | Use `ljg-qa` when the output should be a question-answer chain. |
| Explain hard content simply | `ljg-plain` | Use after another skill when the result is still too dense. |
| Think through a claim | `ljg-think` | Add `ljg-writes` when the final output is an essay/article. |
| Map a domain's hidden forces | `ljg-rank` | Useful for strategy, market, product, and career questions. |
| Create social visuals | `ljg-card` | Choose card mold based on requested output style. |
| Build a talk from an outline | `ljg-present` | Best when the user already has an outline or markdown. |
| Evaluate a startup/project | `ljg-invest` | Verify current facts separately when the analysis depends on recent data. |
| Learn English vocabulary | `ljg-word` | Use `ljg-word-flow` when the user wants a word card too. |
| Plan cultural travel | `ljg-travel` | Museums, ancient architecture, archaeological context. |
| Inspect installed skills | `ljg-skill-map` or `skill-router` | Router is better for task-based recommendations. |

## Non-LJG Skill Examples

- Documents or Word files: use `documents`.
- PDFs where layout or rendering matters: use `pdf`.
- Spreadsheets, CSV, Excel, or Google Sheets-ready workbooks: use `spreadsheets`.
- PowerPoint or slide deck creation/editing: use `presentations`.
- Browser automation or UI verification: use `playwright`.
- Web/mobile interface design: use `ui-ux-pro-max`, plus framework-specific skills when present.
- GSAP animation work: choose the relevant `gsap-*` skill.

## Example Route Notes

```text
Route: ljg-paper-flow.
Why: your input is a paper and you asked for both understanding and a visual card.
```

```text
Route: ljg-think -> ljg-writes.
Why: first sharpen the core idea, then turn it into a finished article.
```

```text
Route: documents.
Why: the task is about editing a .docx artifact, so the document skill has the right workflow and validation steps.
```
