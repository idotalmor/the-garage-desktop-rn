# Releases (`app-updates/releases`)

Reads what CI publishes on GitHub Releases (see [scripts/release](../../../../scripts/release/README.md)).
No DB, no state; use cases call `index.ts`.

| File         | What it is                                                                                |
| ------------ | ----------------------------------------------------------------------------------------- |
| `index.ts`   | `fetchLatestBase`, `fetchBundleManifest`, `downloadBundle`, `releasePageUrl`              |
| `types.ts`   | `BaseInfo` (`base.json`), `BundleManifest` (signed payload of `bundle-manifest.json`)     |
| `urls.ts`    | `<releases>/latest/download/<asset>`, `<releases>/download/v<base>/<asset>`, release page |
| `http.ts`    | `fetchJson` (404 → null), `fetchBytes`, through `net.fetch` with a 60 s timeout           |
| `verify.ts`  | `readManifest`: ed25519 signature + shape check; `sha256`                                 |
| `extract.ts` | `extractTarball`: system `tar` into the bundle folder, requires `index.html`              |

`downloadBundle`: `fetchBytes(tarball)` → size + sha256 must match the signed manifest →
`<bundles>/<build>.tar.gz` → `extractTarball` into `<bundles>/<build>/` → tarball deleted.
