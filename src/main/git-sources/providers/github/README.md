# GitHub adapter

| File             | Purpose                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `index.ts`       | Adapter object and `/user` account identity mapping                                                    |
| `request.ts`     | Only HTTP transport; fixed GitHub origins, 30s timeout, abort signal, no redirects, sanitized errors   |
| `device-flow.ts` | Begin device flow; poll at provider interval; pending, slow-down, declined, expiry and cancel behavior |
| `repos.ts`       | REST repo facts → `GitSourceRepo`; accessible repo pagination and individual refresh                   |

Flow: `providers/index.ts → github/index.ts → device-flow.ts or repos.ts → request.ts → GitHub`. Device code/access token are main-only. Only user code, verification URL and expiry cross IPC. Verification URL must exactly match GitHub's device page before the main process opens it. Catalog covers owner/collaborator/org affiliations and never changes stars.

Errors keep cached data. HTTP 401 requests reconnect; 403/429 report access/rate-limit issues without tight retries. Repo refreshes use cached full names; an inaccessible/deleted repo can fail the refresh, leaving the complete previous cache intact. Browsing again updates renamed repo metadata by stable external id.
