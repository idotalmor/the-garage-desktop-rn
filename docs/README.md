# Docs index

Docs live next to the code they describe. This page lists them all. Add a line here when you add
one.

## Guides

- [Main-process feature structure](main-process-structure.md): how to lay out a feature in
  `src/main/` (`ipc → use-cases → service → domain/db`, one folder per table, shared libraries)

## Feature docs

| Feature     | Doc                                                                                     | What it covers                                                |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Local repos | [src/main/local-repos/README.md](../src/main/local-repos/README.md)                     | Feature overview, folders, main call chains                   |
| ↳ scanner   | [src/main/local-repos/scanner/README.md](../src/main/local-repos/scanner/README.md)     | Finding repo folders and reading repos with git               |
| ↳ sync      | [src/main/local-repos/sync/README.md](../src/main/local-repos/sync/README.md)           | Job queue, live file watching, UI snapshot                    |
| ↳ watcher   | [src/main/local-repos/watcher/README.md](../src/main/local-repos/watcher/README.md)     | fs.watch handles and change rules                             |
| ↳ use cases | [src/main/local-repos/use-cases/README.md](../src/main/local-repos/use-cases/README.md) | Business rules per action/job                                 |
| ↳ db        | [src/main/local-repos/db/README.md](../src/main/local-repos/db/README.md)               | Drizzle files and queries                                     |
| ↳ db tables | [src/main/local-repos/db/tables/README.md](../src/main/local-repos/db/tables/README.md) | SQLite tables, example rows, ER diagram, scan → DB write flow |
| ↳ utils     | [src/main/local-repos/utils/README.md](../src/main/local-repos/utils/README.md)         | Source coverage rules                                         |
| Git library | [src/main/git/README.md](../src/main/git/README.md)                                     | Layout of the git CLI library and how to add a command        |
| SQLite lib  | [src/main/sqlite/README.md](../src/main/sqlite/README.md)                               | `openDatabase` (better-sqlite3 + Drizzle), generated tables   |

## Git sources

- [Main feature](../src/main/git-sources/README.md)
- [Use cases](../src/main/git-sources/use-cases/README.md)
- [Runtime sync](../src/main/git-sources/sync/README.md)
- [Credentials](../src/main/git-sources/credentials/README.md)
- [Safe clone/worktree placement](../src/main/git-sources/checkout/README.md)
- [Providers](../src/main/git-sources/providers/README.md)
- [GitHub adapter](../src/main/git-sources/providers/github/README.md)
- [Database](../src/main/git-sources/db/README.md)
- [Database tables and scenarios](../src/main/git-sources/db/tables/README.md)
- [Account table](../src/main/git-sources/db/tables/git-sources/README.md)
- [Credential table](../src/main/git-sources/db/tables/credentials/README.md)
- [Repo table](../src/main/git-sources/db/tables/repos/README.md)
- [Favorite table](../src/main/git-sources/db/tables/favorites/README.md)
- [Shared contracts](../src/shared/git-sources/README.md)
- [Desktop UI and mapper](../src/renderer/src/features/git-sources/README.md)

## Review guides

- [Git sources connection](reviews/pr-git-sources.md): file structure, signatures, actions, data flow, diagrams and verification gaps.

## Plans

Feature plans live at the repo root as `*-plan.md` (e.g. `github-integration-plan.md`).
