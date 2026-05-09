# Backend Module

This folder is the new backend boundary for the MongoDB + Keycloak redesign.

Current status:

- Contracts and domain model are in place.
- Keycloak URL/token-exchange helpers are in place.
- MongoDB repositories back agencies, users, vehicles, appointments, complaints, notifications, and staff client lists.
- Auth state uses the Keycloak-backed `/api/auth/me` session path.
- Client, front-office, and back-office screens prefer Mongo-backed `/api/*` data and fall back to the demo Zustand store when backend auth/env is unavailable.
- Back-office can administer users, user roles, FO agency assignment, and agencies.
- Front-office complaints are scoped to the assigned FO agency on read and update.
- **Cloudflare env propagation** is handled via `env-store.ts` — the Worker `fetch()` stashes bindings so `getBackendConfig()` works in both local dev and CF Workers.
- **Zod-based payload validation** is used for all API mutations in `app-routes.server.ts`, replacing manual `assertString`/`assertNumber` helpers.

Next implementation step:

1. Seed or sync real client/agent user records from Keycloak.
2. Replace the remaining demo-only fallback assumptions where production data is required.
3. Add server-side tests around role/agency authorization rules.
