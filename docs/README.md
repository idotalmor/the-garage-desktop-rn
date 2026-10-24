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

## Plans

Feature plans live at the repo root as `*-plan.md` (e.g. `github-integration-plan.md`).
