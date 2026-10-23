# Backlog

## Auth / Firestore

- [ ] **GitHub sign-in + account linking**
  - Verify Firebase console: Authentication → Settings → "Link accounts that use
    the same email address" is enabled.
  - Add GitHub OAuth loopback flow in the Electron main process (mirrors the
    existing `signInWithGoogle`); GitHub returns only an access token →
    `GithubAuthProvider.credential(accessToken)`.
  - In the renderer, catch `auth/account-exists-with-different-credential` on
    sign-in → sign in with the original provider → `linkWithCredential` with the
    pending credential. Alternatively add an explicit "Connect GitHub" action in
    settings for already-signed-in users.
  - No schema change needed — the `firebase.providers` snapshot in
    `users/{uid}` picks up the second provider automatically.
- [ ] Firestore security rules — paste the block from `firestore-schema-plan.md`
      into the Firebase console.
- [ ] Tighten `repositories` write rules (currently any signed-in user; ideally
      admins of a linked team).
- [ ] Wire loaded `preferences` into the UI (theme, `PREFERRED_IDE`,
      `ACTIVE_TEAM`).
- [ ] Teams/repos entry points — `createTeam`/`createRepository` helpers exist
      but have no UI callers yet.
- [ ] Rename the `repositories` Firestore collection (name TBD).
- [ ] Global app data collection in Firestore — app-level config/state shared
      across users.
- [ ] Mixpanel integration (analytics).
- [ ] Update support — surface app updates to the user, possibly via a modal
      (dev-app-update.yml exists for electron-builder).
