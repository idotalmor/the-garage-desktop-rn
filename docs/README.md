# Docs index

Docs live next to the code they describe. This page lists them all. Add a line here when you add
one.

## Guides

- [Main-process feature structure](main-process-structure.md): how to lay out a feature in
  `src/main/` (`ipc → use-cases → service → domain/db`, one folder per table, shared libraries)

## Feature docs

| Feature     | Doc                                                                                     | What it covers                                                |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Local repos | [src/main/local-repos/db/tables/README.md](../src/main/local-repos/db/tables/README.md) | SQLite tables, example rows, ER diagram, scan → DB write flow |
| Git library | [src/main/git/README.md](../src/main/git/README.md)                                     | Layout of the git CLI library and how to add a command        |
| SQLite lib  | [src/main/sqlite/README.md](../src/main/sqlite/README.md)                               | `openDatabase`, `Json<T>` columns                             |

## Plans

Feature plans live at the repo root as `*-plan.md` (e.g. `github-integration-plan.md`).
