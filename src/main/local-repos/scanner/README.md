# Scanner (`scanner/`)

Reads repos from disk with git. Pure "disk → `ScannedRepo`": no DB, no state. Other folders import
only `scanner/index.ts`.

| File                   | What it does                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.ts`             | Entry point: `scanSource(path, maxDepth, onProgress)` and `rereadRepo(repo)`; re-exports the skip lists                                                                                                                                                                                                                  |
| `find-repo-folders.ts` | `findRepoFolders`: breadth-first walk of a source (≤ `maxDepth`, skips `node_modules`, build and hidden folders, symlinks, submodules). A folder with a `.git` folder, a `.git` file or a bare repo is a `RepoFolder`; the walk stops there                                                                              |
| `read-repo.ts`         | `readRepo`: asks git about one repo: its checkouts (`git worktree list`, which also finds linked worktrees **outside** the source), remotes, default branch, and status + last commit per checkout (`readWorktree`). `rereadRepo` does the same for a stored repo after a change, or returns null if its git dir is gone |
| `concurrency.ts`       | `mapLimit`: at most 6 git processes (16 folder reads) at once                                                                                                                                                                                                                                                            |

## Call chain

```
scanSource(path, maxDepth)                         index.ts
├─ findRepoFolders(path, maxDepth)                 find-repo-folders.ts
│   └─ toRepoFolder(dir) → isBareRepository        src/main/git
├─ resolveCommonDir(folder) per folder             src/main/git   (group folders by repo)
└─ readRepo(commonDir, folder) per repo            read-repo.ts
    ├─ listWorktrees · readRemotes · isBareRepository · resolveDefaultBranch · lastCommit   src/main/git
    └─ readWorktree(entry) per checkout → readStatus · lastCommit                           src/main/git

rereadRepo(repo)                                   read-repo.ts → readRepo(...)
```

Called by `use-cases/scan-sources.use-case.ts` (`scanSource`) and `use-cases/refresh-repos.use-case.ts` (`rereadRepo`).
