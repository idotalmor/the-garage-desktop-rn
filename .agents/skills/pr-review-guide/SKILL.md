---
name: pr-review-guide
description: Generates a review guide markdown file for a pull request in this repo, the way the owner reviews code - file structure, file names and purposes, function signatures, why each util and use case exists, the call flow from each entry point, and mermaid diagrams. Use when asked to explain a PR, write a review guide, or prepare a PR for review.
---

# PR review guide

Write `docs/reviews/pr-<number>.md` (or the path the user gives) that lets the owner review the PR
without reading the diff first. Base it on `git diff --merge-base origin/<base>` and the files
themselves; never describe code you haven't read. Keep it factual and short per item.

## Sections, in this order

1. **Summary**: 3-5 lines: what the PR adds or changes and why.
2. **File structure**: a tree of every added/changed/moved/deleted file (mark `+`, `~`, `→`, `-`),
   grouped by folder, with a one-line purpose per file. Flag names that don't match their purpose
   or the repo naming rules (`AGENTS.md`: one word per concept, `<action>.use-case.ts`,
   `<Name>DbEntity`, folder `index.ts` as public API).
3. **Signatures**: for each exported function/type, its full TypeScript signature and one line on
   what it does, grouped by file. Note who calls it (file + function).
4. **Use cases**: table of `use-cases/*.use-case.ts`: file, called by, the business rule it owns,
   which queries/domain functions it calls, transactions used.
5. **Utils and helpers**: each file in a `utils/` folder (or helper inside a domain folder): what it
   does, who uses it, and **why it exists** / why it lives there (feature vs library vs app-wide).
   Call out anything that looks misplaced or unused.
6. **Call flow from entry points**: for each entry point (IPC handler, startup `start…()`, watcher
   event, renderer hook action), the chain of calls with file names:
   `ipc.ts handler → use-cases/x.use-case.ts fn → db/tables/y/queries.ts fn → …`.
7. **Mermaid diagrams**: at least
   - a `flowchart` of the main flow(s) from entry point to DB/UI,
   - a `flowchart` or `graph` of module dependencies (folders, arrows point down),
   - an `erDiagram` if tables or columns changed (comment every column).
8. **Data**: tables/columns/shared types added or changed, and whether each stored field is a fact
   from the source system (keep) or an invented/derived value (should be computed instead).
9. **Checks and gaps**: what was verified (typecheck, lint, scripts, harness runs) and what wasn't
   (e.g. UI not run), plus open questions for the reviewer.

## Rules

- Use real file paths and real function names from the code.
- Prefer tables and trees over prose; one line per item.
- Mermaid must render: quote labels with special characters, no HTML except `<br/>`.
- Don't commit the review file unless the user asks; attach it or share its path.
