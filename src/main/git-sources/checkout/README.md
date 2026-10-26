# Checkout placement

| File       | Purpose                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `index.ts` | Safe folder names, suggested sibling parents, canonical destination validation and exclusive folder reservation |

`url.ts` exports `parseCloneUrl(input)` for pasted GitHub HTTPS/scp-style SSH/SSH URLs. It validates repo roots, rejects credentials and unrelated protocols/hosts/branch/file URLs, preserves HTTPS vs SSH authentication, and computes the same normalized slug used by the local scanner. Pasted repos do not require provider catalog membership or a connected account. HTTPS uses the matching cached account's token, or the sole connected account when the repo is not cached. With no account (or multiple unmatched accounts), Git's configured credentials are used; no account is guessed in a multi-account setup. Existing local clones are matched by primary slug, not upstream. A requested branch already checked out is reused (no duplicate clone); another branch creates a sibling worktree. Public GitHub URLs can be cloned without connecting. Other Git providers remain out of scope.

Flow: `prepare-checkout.use-case.ts → checkoutFolderName / suggestedCheckoutParent`; `create-checkout.use-case.ts → reserveCheckoutFolder → validateCheckoutParent → realpath + known checkout/git-dir checks + git.resolveCommonDir → mkdir`.

The native picker chooses a **parent**; the checkout becomes `<parent>/<repo>` for a new clone or `<parent>/<repo>-<branch>` for a linked worktree. Branch slashes are replaced in the folder name, not in the Git branch. Existing main checkouts are preferred when suggesting a parent; missing paths are skipped, bare repos use their shared directory's parent, and nested layouts climb until outside every checkout. The final user-selected parent is validated again; a suggestion never authorizes writing.

Resolve symlinks, reject known checkout/git-directory descendants, and ask Git to detect even unscanned enclosing repos. Existing directories (including empty ones and symlinks) are never reused/overwritten. `mkdir` reserves the new folder exclusively. Failures keep partial work rather than deleting user files; a retry at the same destination must first be resolved by the user. No force-checkout, branch reset or automatic prune occurs.

Tested by `node scripts/check-git-sources.mjs`: real local clones/worktrees and scanner/SQLite integration in a temporary home, including parent selection, symlinks, nesting, collisions, bare repos and unchanged original working trees. GitHub network authentication and native dialogs require manual verification.
