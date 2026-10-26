# Credential encryption

| File       | Purpose                                           |
| ---------- | ------------------------------------------------- |
| `index.ts` | `assertSecureStorage`, `encryptToken`, `getToken` |

Flow: `connect → assertSecureStorage`; `completeConnection → encryptToken → account/credential transaction`; `listRepos/refresh → getToken → credentials/queries.readCredential → safeStorage.decryptString`.

Secrets never cross IPC. safeStorage must be available; Linux plaintext fallback is rejected. SQLite stores ciphertext only. Keychain/decryption failures ask the user to reconnect rather than exposing low-level credential data.
