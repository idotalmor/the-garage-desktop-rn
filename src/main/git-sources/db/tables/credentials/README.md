# Encrypted credentials

| File         | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `schema.ts`  | `git_source_credentials`, `GitSourceCredentialDbEntity`                |
| `queries.ts` | `readCredential(sourceId)`, `saveCredential(sourceId, encryptedToken)` |

Flow: `completeConnection → credentials.encryptToken → git-sources/queries.saveSource transaction → saveCredential`; `credentials.getToken → readCredential`. Account deletion cascades here. Queries are main-only and never used by snapshot builders. Test encryption is mocked; production uses OS safeStorage.
