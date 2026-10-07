# 2026-10-05 — Organization search on the Module Access page

Verified against `super-dev` @ `04208f5` (this repo, working tree).

## Why

`/dashboard/module-access` renders every organization as a flat scrolling list in the
left-hand picker. `GET rbac/organizations/` is unpaginated and returns all of them, so as
the number of organizations grows, finding one means scrolling. The request was to make the
list searchable.

## What changed

- **`src/components/module-access/ModuleAccessManager.tsx`** — the only file touched.
  - New `orgSearch` state, plus a derived `orgQuery` (trimmed, lowercased) and a
    `filteredOrganizations` memo that case-insensitively substring-matches `org.name`.
  - A search input in the picker's header, matching the existing pattern in
    `src/components/demo-users/DemoUsersList.tsx` (magnifier icon left, clear "×" right,
    `focus:ring-[#262782]/30`). Rendered only when `organizations.length > 0`, so an empty
    backend does not show a box with nothing to search. Carries `aria-label`s on both the
    input and the clear button.
  - The header subtitle becomes a result count (`"3 of 12 organizations"`) while a query is
    active, and reverts to the original instruction text when it is empty.
  - A third empty state between "no organizations found" and the list: "No matching
    organizations", echoing the query and offering **Clear search**. The pre-existing
    "No organizations found" state is untouched and still means the backend returned none.
  - The `<ul>` now maps `filteredOrganizations` instead of `organizations`.

## How — and the one decision

**Filtering is client-side.** `OrganizationListView` (backend
`apps/rbac/views/rbac_views.py:516`) accepts no query parameters and returns every
organization in a single unpaginated response ordered by name. The full list is therefore
already in memory, so a server round trip per keystroke would add latency and a debounce for
no gain. A comment at the filter records this and names the condition that would reverse it
(the endpoint gaining a `search` param). No backend change, no RTK Query change, no new
request.

**Selection survives filtering.** `selectedOrgId` is deliberately not cleared when a query
hides the selected row — the right-hand module checklist is driven by `selectedOrgId` alone,
so an in-progress edit is not discarded by typing in the search box. Clearing the query
brings the highlighted row back.

## Affected modules and behaviors

Presentation only, in one component. No change to `rbacApi`, the grant semantics, the
delegable-pool callout, the save path, or any endpoint. Auth, migrations, async tasks,
webhooks and analytics are untouched. No behavior change at all when the search box is empty.

## Intended outcome

A super admin can locate an organization by typing part of its name instead of scrolling.
Signal it worked: typing narrows the list and the subtitle shows the match count; signal it
did not: the list is unchanged while typing, or the right-hand panel resets when the query
hides the selected organization.

## Verification

- `npx tsc --noEmit` → exit 0, no output (clean).
- `npx next lint --file src/components/module-access/ModuleAccessManager.tsx` →
  `✔ No ESLint warnings or errors`.
- `git diff` read in full: +74 / −2, one file.
- **Unverified:** not exercised against a running backend in this session — no dev server or
  live org list was loaded, so the rendered states (match, no-match, count line) were
  reviewed as code, not observed in the browser.

## Critical notes

No security implications: no permission check, request, or payload was altered, and the
superadmin-only `IsSuperAdmin` gate on the endpoints is unchanged. Rollback is reverting the
single file. No breaking change. Follow-up, only if the organization count becomes large
enough that shipping every row to the client is itself the problem: add a `search` param to
`OrganizationListView` and move the filter server-side behind a debounce, at which point the
comment at the filter site is the pointer to what to change.
