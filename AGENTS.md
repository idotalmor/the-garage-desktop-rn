# Agent guide: The Garage (`devflow`)

Electron + React + TypeScript (electron-vite). `src/main` is the main process, `src/preload` the
bridge, `src/renderer` the React UI, `src/shared` the types and IPC channel names used by both sides.

## Read before changing code

- **Main-process features** (`src/main/**`): follow
  [docs/main-process-structure.md](docs/main-process-structure.md). That covers the `ipc → service
→ domain/db` layers, one file per SQLite table, and summary comments at the top of each file.
  Refactor code you touch to that structure without being asked.
- **Docs live next to the code they describe**, as a `README.md` in that folder. Each one is listed in
  [docs/README.md](docs/README.md). When you add or change code that has a README, update it in the
  same change. When you add a new doc, add it to the index.
- **SQLite databases**: each feature DB has `src/main/<feature>/db/tables/README.md` with each
  table's purpose, a JSON example row, a mermaid ER diagram (with a comment on every column saying what it stores), a mermaid flow of how rows are
  written, and a scenarios table of each situation and the rows it leaves in each table, checked by running the code (example: [src/main/local-repos/db/tables/README.md](src/main/local-repos/db/tables/README.md)).
  Create one for a new DB, and update it whenever tables, columns or write flows change.
  Every property of a `<Name>Row` type gets a comment saying what it means and where the value comes from.
- Naming (brand vs code names): [NAMING.md](NAMING.md)
- UI components: `.agents/skills/gravity-ui/SKILL.md`
- Feature plans live at the repo root as `*-plan.md` (e.g. `github-integration-plan.md`).

## Commands

```bash
npm install
npm run dev              # run the app
npm run lint
npm run typecheck        # node + web
npx prettier --write <files>
```

`@heroui-pro/*` needs `HEROUI_AUTH_TOKEN` at install time. Without it, `typecheck:web` and the
renderer build fail with "module not found". Main-process work can still be checked with
`npm run typecheck:node`.

## Data

Local, machine-specific data goes in SQLite under `~/.devflow/` (one `.db` per feature). Shared,
per-user data goes in Firestore (see `firestore-schema-plan.md`).
