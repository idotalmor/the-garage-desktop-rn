# Use cases (`app-updates/use-cases`)

| File                              | What it decides                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `choose-bundle.use-case.ts`       | Bundle to run: newest for the installed version, not `bad`, newer than the built-in UI, on disk      |
| `find-new-base.use-case.ts`       | Job: latest `base.json` newer than the installed app → `NewBase`                                     |
| `download-new-bundle.use-case.ts` | Job: signed manifest for the installed version → download if newer and never seen → row `downloaded` |
| `confirm-bundle.use-case.ts`      | First `Ready` from a bundle → `confirmed`, prune older bundles                                       |
| `reject-bundle.use-case.ts`       | Failed first load → `bad`, delete folder, switch windows back                                        |
| `apply-ready-bundle.use-case.ts`  | **Update** pressed → run the chosen bundle now                                                       |
| `open-base-download.use-case.ts`  | **New version** pressed → open the release page                                                      |
| `prune-bundles.use-case.ts`       | Delete bundles of other app versions and those older than the newest `confirmed` one                 |

The two jobs and `chooseBundle` / `pruneBundles` don't import `sync/` (it runs them). The others
call `sync`'s `setRunning` / `getSnapshot`.
