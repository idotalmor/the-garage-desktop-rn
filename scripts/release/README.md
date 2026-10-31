# Release scripts (`scripts/release`)

Used by [.github/workflows/release.yml](../../.github/workflows/release.yml), which runs on every
push to `main` on a macOS runner. The app side is [src/main/app-updates](../../src/main/app-updates/README.md).

## What a push to `main` does

1. Version `1.0.<run number>`, `npm ci`, `npm run build` (typecheck + electron-vite) with the
   bundle public key built in.
2. `fingerprint.mjs` hashes everything a JS bundle can't replace and compares it with `base.json` of
   the latest release:
   - **changed** (or no release yet, or the "force base" manual run): `electron-builder --mac` →
     new release `v1.0.<n>` with the `.dmg` and `base.json`. Installed apps show **New version**.
   - **same**: `pack-bundle.mjs` → `bundle-1.0.<n>.tar.gz` + `bundle-manifest.json` uploaded to the
     latest release (the manifest is replaced). Installed apps on that version show **Update**.

| File                  | What it does                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fingerprint.mjs`     | sha256 of: Electron + electron-builder versions, `out/main`, `out/preload`, every lockfile package they load (with their dependencies), `resources/`, `build/`, `electron-builder.yml`, the public key. `--details` prints the inputs |
| `public-key.mjs`      | Public half of `BUNDLE_SIGNING_KEY`, as base64 SPKI (→ `MAIN_VITE_BUNDLE_PUBLIC_KEY`)                                                                                                                                                 |
| `pack-bundle.mjs`     | Tars `out/renderer`, writes the ed25519-signed manifest                                                                                                                                                                               |
| `write-base-info.mjs` | Writes `base.json` (version, build, fingerprint, commit) for a base release                                                                                                                                                           |

Rule of thumb: changes in `src/renderer` (and renderer-only packages) ship as bundles; changes in
`src/main`, `src/preload`, `src/shared` code that main uses, native/main packages, Electron, icons or
`electron-builder.yml` make a new `.dmg`.

## One-time setup (GitHub → Settings → Secrets and variables → Actions)

| Secret               | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `BUNDLE_SIGNING_KEY` | `openssl genpkey -algorithm ed25519` output (PEM). Keep a copy: a new key needs a new .dmg |
| `HEROUI_AUTH_TOKEN`  | Same token as for local `npm install` (`@heroui-pro/*`)                                    |
| `APP_ENV_FILE`       | Contents of your local `.env` (`MAIN_VITE_*`, `RENDERER_VITE_*`); written to `.env` in CI  |

Workflow permissions need **Read and write** (it creates releases with `GITHUB_TOKEN`).

## Without an Apple Developer ID (for now)

- The app is **ad-hoc signed** (`identity: '-'`, no hardened runtime, `notarize: false`), Apple
  Silicon only (`arm64`).
- A downloaded `.dmg` is quarantined by Gatekeeper ("damaged" / "unidentified developer"). After
  dragging the app to Applications, run once: `xattr -cr "/Applications/The Garage.app"`.
- New bases are installed by hand (**New version** opens the release page). JS bundles install
  themselves, because they never change the signed app.

Later, with a Developer ID: add the certificate + notarization secrets, set `identity` back to
default, `hardenedRuntime: true`, `notarize: true`, publish `latest-mac.yml` + `.zip`
(`electron-builder --publish always`) and use `electron-updater` for the **New version** path.
