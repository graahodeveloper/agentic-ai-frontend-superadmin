# 2026-09-08 — "Module Access" sidebar page (per-organization Handover grant)

Verified against `cleanup/super-dev-20260825` @ `ea6d867` (this repo, working tree) and the
backend at `koronik-develop` @ `be7ae4e` + uncommitted API-layer changes.

Ticket: "Restrict the Handover module to Super Admin" (1 day, 7 September 2026), plus the
requirement stated with it: a separate super-admin sidebar menu named "Module Access", where
granting a module to an organization cascades to that organization's created admins and users.

## Why

The pre-existing per-user flow (`ManageModuleAccessModal` / `ModuleAccessPicker`, in the org
app) grants to one user at a time and has no organization concept to cascade from. Handover in
particular must not be assignable by an org admin at all — only a Super Admin may switch it on,
and when they do, everyone in that organization gets it.

## What changed — all additive, no existing file rewritten

- **`src/features/rbac/rbacApi.ts`** (new) — RTK Query slice against three backend endpoints:
  - `getGrantableOrganizations` → `GET rbac/organizations/`
  - `getOrganizationModules` → `GET rbac/organizations/<id>/modules/`
  - `setOrganizationModules` → `PUT rbac/organizations/<id>/modules/`
- **`src/features/rbac/rbacApi.types.ts`** (new) — response/request types.
- **`src/components/module-access/ModuleAccessManager.tsx`** (new) — organization list on the
  left, module checkboxes on the right, save with error/success states.
- **`src/app/dashboard/module-access/page.tsx`** (new) — route shell.
- **`src/app/dashboard/layout.tsx`** (+9) — `NAV_ROUTES.moduleAccess` and the sidebar `<Link>`.
- **`src/store.ts`** (+4) — `rbacApi` reducer and middleware, following this file's existing
  pattern.

## Corrected the same day

The page first shipped rendering **14 modules and no Handover** — the exact inverse of the
requirement. Two things were wrong and both are fixed:

1. The backend fed this page `ASSIGNABLE_PERMISSION_MODULES` (the modules an org admin assigns
   to a *user*, which deliberately excludes Handover). It now feeds
   `ORG_GRANTABLE_PERMISSION_MODULES` (`apps/rbac/views/rbac_views.py:593`), which today is
   Handover alone.
2. The org grant was **cap** semantics. Combined with a page that manages only Handover, saving
   would have intersected every member of that organization down to Handover, stripping every
   other module. The backend layer is now additive. The full reasoning is in the backend's
   `docs/decisions/DECISIONS.md` entry of this date.

Frontend consequences of the inversion:
- Removed `is_configured` from both types in `rbacApi.types.ts` — the field no longer exists in
  either response.
- Removed the **Managed / Unmanaged** badge from the organization list. An organization with no
  grant is the normal state and carries no penalty, so labelling it "Unmanaged" in amber was
  false alarm. It now shows an "N granted" badge only when there is something to report.
- Replaced the two-branch managed/unmanaged callout with a single accurate one: checking a
  module switches it on for every user in the organization including anyone added later, and
  **nothing else about their access changes** — it only adds, never restricts.

## How — decisions worth knowing

**The UI hardcodes no module list and no role.** The checkboxes render whatever
`GET .../modules/` returns. Handover appears because the server sends it, and the other 14
modules are absent because the server does not. Restricting or adding a module at the
organization level stays a backend config change with no edit here.

**Local selection re-seeds on `selectedOrgId`.** The `useEffect` in `ModuleAccessManager.tsx`
depends on `[modulesData, selectedOrgId]`, so switching organizations discards unsaved checkbox
state rather than carrying one org's edits onto another.

**Server errors are surfaced, not swallowed.** The helper at the top of
`ModuleAccessManager.tsx` reads `detail` then `error` from the API error body, which is the
shape the backend's 400/403 responses use.

## Affected behavior

Adds one sidebar entry and one route to the super-admin dashboard. No existing page, API slice
or store entry changed behavior. Every endpoint this page calls is `IsSuperAdmin` server-side.

## Intended outcome

A Super Admin can switch Handover on for an organization from one page, and every admin and
user in that organization inherits it. Signal it worked: the page lists **Handover and nothing
else**, and a plain user in a granted organization can reach the handover console in the org
app.

## Verification

```
npx tsc --noEmit
  -> exit 0, no output
```

**Unverified, explicitly:** this repo has no test suite (no vitest/jest config), so
`ModuleAccessManager`'s state handling has no automated coverage — the org-switch re-seed is
verified by reading the dependency array, not by a test. The page has also **not** been rendered
against a running backend since the inversion; the previous screenshot predates it. The
server-side behavior it depends on is covered by the backend suite (154 passing), but the
rendered result of these frontend edits is not yet observed.

## Critical notes

- This repo had no `docs/changelogs/` or `docs/decisions/` directory before this entry; both
  were created here.
- The contract is pinned to the routes in the backend's `apps/rbac/urls.py`. If those paths
  move, this breaks at runtime with a 404 and nothing here catches it at build time.
