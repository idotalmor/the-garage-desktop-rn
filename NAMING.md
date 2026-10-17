# Naming note: "The Garage" + artifactory

As of 2026-10-16, the naming scheme is:

- **App**: brand name **The Garage**, code name `devflow`
  (package name, `~/.devflow/` data dir, `com.thegarage.app` appId).
  A garage holds tools and projects-in-progress — the app is the
  workshop, features are what lives inside it.
- **Artifactory feature**: brand name = code name **Artifactory**.
  The previous "Cabinet" brand was reverted; user-facing strings now
  say "Artifactory" directly.
- Nav icon for artifactory: `LibraryBig` (lucide).

## Where "The Garage" appears

- `package.json` — `productName`
- `electron-builder.yml` — `appId`, `productName`, `executableName`,
  `CFBundleName`, `CFBundleDisplayName`
- `src/main/index.ts` — `APP_NAME` (app menu)
- `src/main/main-window.ts` — window titles
- `src/main/popover.ts` — tray tooltip
- `src/renderer/index.html` — document title
- `DashboardHome.tsx` — hero heading, aria ids (`garage-title`),
  "Ask The Garage", "the Garage reads your Slack"
- `NewsletterPage.tsx` — "Let the Garage find the story"
- `src/main/integrations/mcp-server.ts` — `garage-mcp.mjs`,
  MCP server name `garage`, "Garage memory" tool descriptions
- `src/main/integrations/providers.ts` — "Garage shared memory"
  frontmatter description (written into IDE rule files)

## Untouched internals

- `name: "devflow"` in `package.json`, `~/.devflow/` storage,
  `devflow` MCP server key in provider configs
- Artifactory internals unchanged: `~/.devflow/artifactory.db`,
  `artifactory_files` table, IPC channels `artifactory:*`,
  URL params `view=artifactory` / `artifactoryWindow=1`,
  view id `'artifactory'`

## Reserved names

- `gizmo` — reserved for a future assistant/tools persona
  (a gizmo lives in the garage)
- `stash` — collides with `git stash`
- `drawer` — collides with UI drawer components if used in code

## To change the app brand again

Edit the strings listed above. Code-level identifiers (`devflow`,
`artifactory`) stay put — that's the point of keeping brand and code
names separate.
