# 2026-09-08 — Finish the Handover restriction: blanket cascade → delegable pool

Session two of this ticket. Session one was killed mid-flight by a rate limit with two workers
in progress, leaving the three repos in an inconsistent, partly-broken state. This session
audited that state, finished the work, and verified it.

Repos touched, each verified against the commit named plus this session's working-tree changes:
this one (`graaho-ai-agent-frontend-super-admin`, `cleanup/super-dev-20260825` @ `ea6d867`),
`graaho-ai-agent-backend` (`koronik-develop` @ `be7ae4e`), and
`graaho-ai-agent-frontend` (`koronikai-dev` @ `ff9331e`).
Each carries its own changelog for its own changes:
`backend: docs/changelogs/2026-09-08-delegable-pool.md`,
`org frontend: docs/changelogs/2026-09-08-assignable-gate.md`.

## Why

The ticket restricts Handover to Super Admin. The requirement stated alongside it is that a
Super Admin may switch Handover on for an organization, and that organization's own admin then
decides which of its created members actually get it. Session one shipped the backend as a
**blanket cascade** — an org grant added Handover to every member unconditionally — which cannot
express the second half: an org admin had no way to withhold it from one person.

## What was found (the audit)

- **Backend was still on the rejected blanket design.** `PermissionResolver.get_user_permissions`
  ended in an unconditional `permissions |= pool`, ignoring role and ignoring per-user override
  rows. `GET rbac/modules/` was not actor-aware, the per-user payload had no `assignable` field,
  and migration `0004` did not exist.
- **Org frontend was half-landed and actively broken.** `handover` had been added to
  `OFFERED_MODULE_KEYS` and `assignable: boolean` made required on `UserModuleGrant`, but no
  component read `assignable` and the backend never sent it. An org admin was shown a Handover
  checkbox whose tick/untick the resolver ignored — a silent no-op.
- **One real pre-existing bug, unrelated to the redesign but in scope**: `/dashboard/handover`
  bypassed `RouteGuard` entirely via an early `return <>{children}</>` in the org app's dashboard
  layout. Any authenticated user reached the full handover console by typing the URL. Fixed in
  session one; kept and tested here.

## What changed in THIS repo

- `docs/decisions/DECISIONS.md` — appended a superseding entry. Two earlier same-day entries
  asserted the blanket design in prose (`"cascades to the admins and users that organization
  creates"`, `"a checked module reaches every user in the organization"`); both are false as of
  the pool design and would have misled the next session. Appended rather than edited in place,
  per the append-only rule — the rejected alternative is the part worth keeping.
- No code change. `ModuleAccessManager.tsx`'s callout copy was already rewritten for pool
  semantics in session one and is accurate; this page writes only the org-level pool via
  `PUT rbac/organizations/<id>/modules/`, an endpoint the redesign does not touch.

## Intended outcome

A Super Admin grants Handover to an organization → that organization's **admins** hold it, its
**users** hold nothing until an admin grants it to them individually. Revoking the org grant
removes it from everyone on their next request. An organization with no grant resolves exactly
as it did before the feature existed. Signal that it worked: `DelegablePoolRoleGatingTests` and
`AssignableModuleKeysTests` in the backend, and the `assignable: false` cases in the org app's
`manage-module-access-modal.test.tsx`.

## Verification

Run by the orchestrator, not taken on a worker's word:

```
backend:      venv/bin/python -m pytest apps/rbac/tests/ -q
              -> 168 passed, 5 warnings in 4.22s
backend:      venv/bin/python manage.py makemigrations --check --dry-run --settings=config.settings
              -> No changes detected
org frontend: npx vitest run src/__tests__/rbac/
              -> 17 files, 133 tests, all passed
org frontend: npx tsc --noEmit
              -> exits 1; every error is in pre-existing normal-flow/* and wallets.test.ts,
                 none in rbac or module-access, and none of those files appear in the diff
```

Not verified: `npm run lint` in the org frontend — `next lint` and raw `eslint` both fail in that
checkout for reasons predating this work (`Invalid project directory provided`, and a circular-
structure `TypeError` in `@eslint/eslintrc` resolving the `react` plugin config).

## Critical notes

- **Migration `0004` deletes data and its reverse is a no-op.** It removes `UserPermission` rows
  with `is_allowed=False` for superadmin-only codes. Those rows are snapshot residue from the
  per-user PUT (which writes a row per catalogue code), never a decision — but under the new
  admin semantics an explicit `False` *means* "deliberately denied", so leaving them would deny
  Handover to every previously-configured org admin, and the endpoint's self-edit guard means
  they could not fix it themselves. `is_allowed=True` rows are untouched.
- **Nothing is committed.** All three repos have the work in their working trees only.
- Unrelated local edits sit in the org frontend's `.env` (auth domain / API base URL dev↔prod
  toggle). Not part of this ticket; keep them out of the commit.
- **The ticket's `/handover/*` 403 requirement is NOT satisfied by anything in these three
  repos, and appears not to be satisfied at all.** Checked at the end of this session:
  - The Django backend has no handover app, no handover route and no handover view. `handover`
    appears there only as an RBAC permission key (`apps/rbac/**`). There is nothing in that repo
    for a "super-admin check on every `/handover/*` endpoint" to attach to.
  - The real endpoints are on a separate ML/AI service: `src/features/handover/handoverApi.ts`
    in the org frontend targets `${BASE_URL_AI}/api/handover/*`.
  - That client uses a plain `fetchBaseQuery` whose `prepareHeaders` sets **only**
    `Content-Type` — no `Authorization` header, and not the app's `baseQueryWithReauth`. The
    service therefore receives no JWT and cannot be making a per-caller permission decision.
  What this session built (sidebar, route guard, module picker, resolver) is UI- and
  RBAC-API-side gating, which is bypassable by calling the ML service directly. Requires work in
  the ML service repo, which is not checked out here. Not tested against a running instance —
  this is read from the client code, so confirm against that service before closing the ticket.
