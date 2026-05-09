# Backend Redesign: MongoDB + Keycloak

## Goal

Replace the current Supabase-centered backend with an application-owned backend that uses:

- Keycloak for authentication, identity, roles, and SSO.
- MongoDB for application data.
- TanStack Start server functions/routes as the backend execution layer.

The frontend should stop reading operational data from the persisted Zustand mock store and instead call server-side services.

## Current State

The app currently has three data/auth layers:

- Supabase Auth and Supabase Postgres for `profiles`, `user_roles`, and `agences`.
- A browser-local Zustand store for clients, vehicles, appointments, complaints, and notifications.
- TanStack Start running through `src/server.ts`, deployed as a Cloudflare Worker.

This means most business data is not really backend-backed yet.

## Target Architecture

```txt
Browser
  |
  | OIDC redirect / access token
  v
Keycloak

Browser
  |
  | authenticated app requests
  v
TanStack Start backend
  |
  | verifies Keycloak JWT / session
  v
Backend services
  |
  | repository interfaces
  v
MongoDB collections
```

## Backend Layers

### `src/backend/config.ts`

Owns environment parsing for:

- MongoDB URI and database name.
- Keycloak issuer, realm, client ID, and client secret.
- App base URL and auth callback/logout redirects.

### `src/backend/auth`

Owns Keycloak integration:

- OIDC login URL creation.
- Auth callback/token exchange.
- JWT/session validation.
- Mapping Keycloak realm/client roles to app roles.

Application roles remain:

- `client`
- `agent_fo`
- `agent_bo`

### `src/backend/db`

Owns MongoDB connection management and collection access.

Initial collections:

- `users`
- `agencies`
- `vehicles`
- `appointments`
- `complaints`
- `notifications`
- `audit_events`

### `src/backend/repositories`

Persistence boundary. UI and services should not import MongoDB directly.

### `src/backend/services`

Business logic boundary:

- Appointment creation and status changes.
- Vehicle ownership checks.
- Complaint lifecycle.
- Back-office reporting.
- Notification creation.

## Proposed MongoDB Model

### `users`

Stores application profile data keyed by Keycloak subject.

```ts
{
  _id: ObjectId,
  keycloakSubject: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  roles: AppRole[],
  agencyId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### `agencies`

```ts
{
  _id: ObjectId,
  name: string,
  city: string,
  address: string,
  phone: string,
  location?: { lat: number, lng: number },
  createdAt: Date,
  updatedAt: Date
}
```

### `vehicles`

```ts
{
  _id: ObjectId,
  ownerUserId: ObjectId,
  plateNumber: string,
  brand: string,
  model: string,
  year: number,
  isPrimary: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `appointments`

```ts
{
  _id: ObjectId,
  reference: string,
  clientUserId: ObjectId,
  agencyId: ObjectId,
  vehicleId: ObjectId,
  startsAt: Date,
  status: "EnAttente" | "Confirme" | "Annule" | "Termine",
  notes?: string,
  createdByUserId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### `complaints`

```ts
{
  _id: ObjectId,
  clientUserId: ObjectId,
  appointmentId?: ObjectId,
  description: string,
  status: "Ouverte" | "EnCours" | "Resolue" | "Escaladee",
  resolution?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Authorization Rules

- `client`: can read/update own profile, own vehicles, own appointments, own complaints.
- `agent_fo`: can manage appointments and complaints for assigned agency.
- `agent_bo`: can manage all agencies, users, schedules, reports, and complaints.

All authorization decisions should happen on the server. Client-side role checks are only for UI navigation.

## Migration Plan

1. Add backend contracts and config.
2. Add Keycloak login/session flow.
3. Add MongoDB connection and repositories.
4. Create server functions for the current mock-store operations.
5. Replace `useDataStore` reads screen-by-screen with query-backed hooks.
6. Remove Supabase auth/profile code.
7. Remove Supabase migrations after data migration is complete.

## Environment Variables

```env
APP_BASE_URL=http://localhost:8080

MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=renault_rdv

KEYCLOAK_ISSUER_URL=https://keycloak.example.com/realms/renault
KEYCLOAK_REALM=renault
KEYCLOAK_CLIENT_ID=renault-rdv-web
KEYCLOAK_CLIENT_SECRET=...
KEYCLOAK_REDIRECT_URI=http://localhost:8080/auth/callback
KEYCLOAK_POST_LOGOUT_REDIRECT_URI=http://localhost:8080/
```

## Keycloak Setup

Create a realm named `renault`, then create a confidential OIDC client:

- Client ID: `renault-rdv-web`
- Valid redirect URI: `http://localhost:8080/auth/callback`
- Valid post logout redirect URI: `http://localhost:8080/`
- Web origin: `http://localhost:8080`

Create roles:

- `client`
- `agent_fo`
- `agent_bo`

These roles should be included in access tokens, preferably under `realm_access.roles` or client roles.

