# Runtime state

| File               | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `authorization.ts` | One active AbortController, secret device authorization, shared poll and full completion promises |
| `snapshot.ts`      | Select public DB facts, expose only public authorization fields, emit changed snapshots           |
| `index.ts`         | Public API used by IPC and use cases                                                              |

Flow: `connect → startAuthorization → adapter.begin → notify`; renderer asks `completeConnection → pollAuthorization`, sharing completion across windows; cancel/new flow/quit abort requests and polling. `notify → EventEmitter → ipc.ts → all windows`. No window or IPC imports live here. Pending state is not persisted; closing/restarting the app requires a new code. Snapshots never select the credential table.
