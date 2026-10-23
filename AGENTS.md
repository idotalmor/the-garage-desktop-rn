# Agent guide: The Garage (`devflow`)

Electron + React + TypeScript (electron-vite). `src/main` is the main process, `src/preload` the
bridge, `src/renderer` the React UI, `src/shared` the types and IPC channel names used by both sides.

## Read before changing code

- **Main-process features** (`src/main/**`): follow
  [docs/main-process-structure.md](docs/main-process-structure.md). That covers the `ipc → service
→ domain/db` layers, one file per SQLite table, and summary comments at the top of each file.
  Refactor code you touch to that structure without being asked.
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
