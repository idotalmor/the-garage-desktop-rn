# Agent guide: The Garage (`devflow`)

Electron + React + TypeScript (electron-vite). `src/main` is the main process, `src/preload` the
bridge, `src/renderer` the React UI, `src/shared` the types and IPC channel names used by both sides.

## Read before changing code

- **Main-process features** (`src/main/**`): follow
  [docs/main-process-structure.md](docs/main-process-structure.md). That covers the `ipc → use-cases →
sync → domain/db` layers, Drizzle tables in one folder per table (`schema`/`queries`), shared
  libraries (`src/main/git`, `src/main/sqlite`), and summary comments at the top of each file.
  Refactor code you touch to that structure without being asked. **Adding a feature?** Follow
  the "Creating a new feature (checklist)" section there step by step.
- **Docs live next to the code they describe**, as a `README.md` in that folder. Each one is listed in
  [docs/README.md](docs/README.md). When you add or change code that has a README, update it in the
  same change. When you add a new doc, add it to the index.
- **SQLite databases**: each feature DB has `src/main/<feature>/db/tables/README.md` with each
  table's purpose, a JSON example row, a mermaid ER diagram (with a comment on every column saying what it stores), a mermaid flow of how rows are
  written, and a scenarios table of each situation and the rows it leaves in each table, checked by running the code (example: [src/main/local-repos/db/tables/README.md](src/main/local-repos/db/tables/README.md)).
  Create one for a new DB, and update it whenever tables, columns or write flows change.
  No migrations, schema versions or backwards-compatibility code while the app has no users: change
  the tables directly; after a schema change the user presses **Reset local data**.
  Every column in a Drizzle table (`tables/<table>/schema.ts`) gets a comment saying what it means and where the value comes from.
  After changing a table, run `npm run db:generate` (regenerates `create-tables.generated.ts`), then Reset local data.
- **Types**: types the renderer receives (snapshots, domain types, IPC channel names) go in
  `src/shared/<feature>/`; main-only types stay next to their code. The renderer never imports from
  `src/main`. Shared types use the same camelCase field names as the Drizzle columns, so DB rows
  are returned as-is (no mapper functions). Every field and column gets a `/** */` comment.
- **What to store**: keep every fact read from git or the filesystem, even if no UI uses it yet
  (e.g. `remoteUrl`, `remotes`, `isLocked`). Don't store or send values we invent or can compute
  (e.g. which sources cover a repo): compute them where a use case needs them.
- **Naming**: one word per concept everywhere (main, shared, renderer, SQL, channels): `repo` not
  `repository` (`LocalRepo`, `listRepos`, `saveRepo`), `source` for a scanned folder. DB row types are
  `<Name>DbEntity`; use-case files are `<action>.use-case.ts`. Brand vs code names: [NAMING.md](NAMING.md)
- **Dependencies**: prefer a well-known library over hand-written plumbing (e.g. Drizzle instead of
  row mappers and SQL strings). Pin a release that is at least a few weeks old (`--save-exact`), and
  check that `npm install` only adds lockfile entries.
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
