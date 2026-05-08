# Renault RDV — Build Plan

A premium appointment management platform for Renault dealerships in Tunisia, built on TanStack Start + Lovable Cloud, with three distinct role experiences (Client, Agent Front-Office, Back-Office Admin).

## 1. Foundation

- Enable **Lovable Cloud** (Supabase) — provisions DB, Auth, Storage.
- Install dependencies: `recharts`, `zustand`, `react-hook-form`, `zod`, `date-fns`, `class-variance-authority` (others already present).
- Add Google Fonts (`Syne`, `DM Sans`, `JetBrains Mono`) via `<link>` in `__root.tsx`.

## 2. Design System (`src/styles.css`)

Replace the default token palette with the Renault system:
- All colors from the brief mapped to oklch CSS variables (yellow #FFCC00, near-black, warm whites, status colors).
- Dark mode default; light mode equally polished, not just inverted.
- Custom `--font-display` (Syne), `--font-body` (DM Sans), `--font-mono` (JetBrains Mono).
- Global keyframes: `fade-up`, `pulse-slow`, `shimmer`, `count-up`, `slide-in-right`, `scale-in`.
- Reusable utility classes for sidebar active border, hover lift, status-pill base.

## 3. Database (Cloud migrations)

Tables (all with RLS):
- `profiles` (id ↔ auth.users, nom, prenom, telephone, role, agence_id)
- `user_roles` (user_id, role enum: `client`, `agent_fo`, `agent_bo`) — separate, with `has_role()` SECURITY DEFINER function
- `agences` (id, nom, ville, adresse, latitude, longitude, telephone)
- `vehicules` (id, client_id, immatriculation, marque, modele, annee, is_principal)
- `creneaux` (id, agence_id, date, heure_debut, heure_fin, statut)
- `rendez_vous` (id, reference, client_id, agence_id, vehicule_id, creneau_id, statut enum, notes, created_by, agent_id, timestamps)
- `reclamations` (id, client_id, rdv_id, description, statut enum, resolution, created_at, updated_at)
- `notifications` (id, user_id, type, message, read, created_at)

Enums: `statut_rdv` (EnAttente/Confirme/Annule/Termine), `statut_reclamation` (Ouverte/EnCours/Resolue/Escaladee), `app_role`.

RLS: clients see only their own data; AFO sees data scoped to their agency; ABO sees everything. All checks via `has_role()`.

Seed data: 6 agencies (Tunis, Sfax, Sousse, Monastir, Bizerte, Gabès), generated slot batches, demo accounts for each role.

## 4. Auth

- Email/password + Google sign-in via Lovable Cloud.
- `/login` page exactly as specified (split layout, animated yellow grid, role selector, Keycloak-styled SSO button, OTP section).
- OTP via Supabase phone OTP (Tunisia numbers, +216).
- `_authenticated` layout route with `beforeLoad` redirect.
- Sub-layouts `_authenticated/_client`, `_authenticated/_afo`, `_authenticated/_abo` enforce role via `user_roles`.
- Role-switcher dropdown in top bar (DEV badge) — toggles a local override stored in `uiStore` for previewing.

## 5. Routing (TanStack file-based)

```
src/routes/
  __root.tsx              shell + QueryClient + theme + fonts
  index.tsx               redirect by role
  login.tsx
  unauthorized.tsx
  _authenticated.tsx      auth gate + Shell (Sidebar + TopBar + Outlet)
  _authenticated/_client/dashboard.tsx
  _authenticated/_client/rdv.nouveau.tsx
  _authenticated/_client/rdv.$id.tsx
  _authenticated/_client/historique.tsx
  _authenticated/_client/reclamations.tsx
  _authenticated/_client/faq.tsx
  _authenticated/_client/profil.tsx
  _authenticated/_afo/dashboard.tsx
  _authenticated/_afo/rdv.nouveau.tsx
  _authenticated/_afo/clients.tsx
  _authenticated/_afo/reclamations.tsx
  _authenticated/_abo/dashboard.tsx
  _authenticated/_abo/rdv.tsx
  _authenticated/_abo/agences.tsx
  _authenticated/_abo/plannings.tsx
  _authenticated/_abo/reclamations.tsx
  _authenticated/_abo/statistiques.tsx
```

URL paths preserved: `/client/...`, `/agent-fo/...`, `/back-office/...` via route path overrides.

## 6. Shell Components (`src/components/layout/`)

- `Logo.tsx` — yellow R square + Syne wordmark + drop-shadow.
- `Sidebar.tsx` — 260px, collapsible to 68px, role-based nav, active yellow left-bar, footer user block, tooltip on collapsed.
- `TopBar.tsx` — breadcrumb, global search button, notifications bell + dropdown panel, theme toggle, role switcher (dev), avatar.
- `CommandPalette.tsx` — ⌘K modal, frosted glass, grouped results, keyboard nav.
- `Shell.tsx` — combines all + page transition wrapper (`fade-up` 200ms).
- `MobileTabBar.tsx` — 5-icon bottom bar < 768px.

## 7. Shared / RDV Components (`src/components/rdv/`, `src/components/shared/`)

- `StatusBadge.tsx` (variants via cva)
- `VehiclePlate.tsx` (Tunisian plate rendering)
- `RDVCard.tsx`
- `Stepper.tsx` (5-step wizard, sticky header, progress)
- `AgencyCard.tsx`, `TimeSlotPicker.tsx`, `CalendarPicker.tsx`
- `OTPInput.tsx` (6 boxes, auto-advance, countdown)
- `EmptyState.tsx`, `Skeleton` variants
- `Toast` via existing sonner, themed
- Chart wrappers (`AreaCard`, `BarCard`, `DonutCard`, `Heatmap`) using Recharts with yellow palette.

## 8. Pages

Built per spec — every page in the brief implemented in full with:
- Skeleton loaders matching layout
- Empty states
- French copy throughout, `date-fns/locale/fr` for formatting
- React Hook Form + Zod for validation, French error messages
- TanStack Query for all data fetching via `createServerFn`
- Server functions in `src/lib/*.functions.ts` (rdv, reclamations, agences, clients, stats)

## 9. State Management

- `stores/uiStore.ts` (Zustand) — sidebar collapsed, theme, dev role override, command palette open.
- `stores/rdvStepperStore.ts` — current step, agence, client, vehicule, creneau, notes; persists to sessionStorage.
- `context/AuthContext.tsx` — wraps Cloud session, exposes `{ user, role, profile, signOut }`.

## 10. Mobile & Responsive

- Sidebar → bottom tab bar < 768px; hamburger opens Sheet.
- Stat grids collapse 4→2→1.
- Tables → card stacks on mobile.
- Stepper labels hidden, only active label shown.
- Command palette full-screen.

## 11. Quality Pass

- Strict TypeScript, all types in `src/types/index.ts` matching brief.
- Every interactive element: hover/focus/active states.
- Keyboard nav (Tab, Enter, Esc, arrows in palette + OTP).
- Contrast checked for both modes.
- No hardcoded colors outside CSS variables.
- 404 + Unauthorized pages styled per brief.

## 12. Technical Notes (devs only)

- Routing diverges from the original react-router-dom request — we're using TanStack Router (project default). All URLs preserved; you keep SSR + type-safe links.
- AuthContext wraps Supabase auth state but does NOT import server-only modules (avoids the `client.server` import-graph trap).
- Service-role admin operations isolated to `*.server.ts` + `*.functions.ts` thin files.
- `defaultPreloadStaleTime: 0` already set — Query controls freshness.
- OCR plate scanner is simulated (UI + fake delay). Real OCR can be wired later via Lovable AI if desired.
- "Keycloak SSO" button uses Cloud's email/Google flow under the hood; brief's wording preserved on the UI.
- Notifications are read from a `notifications` table; live updates via Supabase realtime subscription on `_authenticated` shell.

## Out of Scope (flag for follow-up)

- Real SMS OTP carrier setup beyond Supabase defaults (works in Tunisia with default config; production carrier may need configuration).
- PDF generation for confirmation downloads — placeholder button; can wire `pdf-lib` in a follow-up.
- Real OCR — simulated.

After implementation I'll verify the build, seed the demo data, and confirm all three role flows render.
