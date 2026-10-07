# 2026-10-05 — SA-047: Settings → Summary correctness rebuild

Verified against `super-dev` @ `04208f5` (this repo, working tree). Backend facts below were read
from `graaho-ai-agent-backend` (`apps/users/views/user_views.py`, `config/settings/base.py`); no
backend file was modified and no backend was running during this session.

Ticket: **SA-047 "Settings – Summary Dashboard and Data Consistency"** (QA – Super Admin, Pending).
QA comment: *"Very little information about Summary statistics and overview information are
displayed to reach a proper conclusion."* Its steps require Active Users and Total Tokens Used to
display correctly, the User Statistics Overview to render correctly, **the Active Users value to be
consistent with Manage User**, and the information to be readable and aligned.

## Why — three defects, one of them the ticket's root cause

1. **`Summary.tsx:23` counted the wrong population.** `activeUsers` filtered
   `usersData.results` — the rows of the *current page* — and `:81` displayed that against
   `usersData.count`, the global total ("N out of M total users"). A page-level number presented
   against a directory-level one. It could never equal Manage User's active count. **This is the
   ticket.**
2. **`Summary.tsx:24-28` summed one page of tokens** and `:97` labelled it "Across all users".
3. **The client's page size was fiction.** `UsersViewSet` declares no `pagination_class`, so it
   inherits `PageNumberPagination` / `PAGE_SIZE: 20` from `config/settings/base.py:253` with **no**
   `page_size_query_param`. The `limit: 10` both pages sent was silently ignored — the server
   always returns 20. So defect 1 was "active among the first *20*", and `ManageUser.tsx` was
   computing `totalPages` and "Showing X to Y" against an invented 10.

## What changed

- **`src/features/user/userApi.ts`** (additive; no existing endpoint altered)
  - `USERS_PAGE_SIZE = 20` and `DEFAULT_MAX_SNAPSHOT_PAGES = 50`, with the backend facts recorded
    at the constant.
  - `DirectoryUser` — a local row type for the `UsersSerializer` fields used here, deliberately
    separate from the shared `User` in `@/types/auth` so other screens are not reshaped.
  - `getUserCohortCount` — count-only query; `transformResponse` discards `results`.
  - `getUserDirectorySnapshot` — a `queryFn` that walks pages via `baseQueryWithReauth`, batching
    4 concurrent requests, returning `{ users, totalCount, scannedCount, truncated, fetchedAt }`.
  - Both carry `providesTags: ['User']`, so the existing `toggleUserStatus` / `deleteUser` /
    `updateUser` mutations already refresh Summary through their `invalidatesTags: ['User']`.
- **`src/components/settings/Summary/summaryMetrics.ts`** (new) — pure derivations, no React:
  token stats (total/mean/median/max/zero-usage/top-10), `countBy` breakdowns for role, account
  type and country (top 8 + "Other"), signup recency (7/30/90 days + 5 newest), password-set
  split, cohort reconciliation, and formatters. `super_admin` and `superadmin` fold into one
  bucket; `customer_used_token` is coerced once, in `toTokenCount`, and never yields `NaN`.
- **`src/components/settings/Summary/Summary.tsx`** (rewritten) — header with Refresh and
  last-updated; KPI row; **Data Consistency panel**; User Statistics Overview; Token Usage with a
  top-consumers table; Growth & Activation. Loading, blocking-error and empty states.
- **`src/components/settings/manage-user/ManageUser.tsx`** — pagination arithmetic now uses
  `USERS_PAGE_SIZE` instead of the literal `10`, in `totalPages` and in the "Showing X to Y" range.

## How — the decisions

**Headline counts come from the server, not from a filter.** Total / Active / Inactive are DRF
`count` on `GET users/`, `?is_active=true`, `?is_active=false`. Manage User's Active filter issues
the identical request as the identical actor, so it receives the same tenancy scope
(`get_queryset()` scopes `list` by organization unless the actor holds `Permissions.ALL`) and the
same number. The consistency the ticket asks for is therefore structural, not coincidental — and
the page says so on screen, naming the request behind each figure.

**Analytics that need real rows get a bounded scan, and the page admits its limits.** Tokens,
role/type/country mix and recency require the rows themselves, and the server will not return more
than 20 at a time. The snapshot walks up to 50 pages (1000 users). Whenever
`scannedCount < totalCount`, every figure derived from it carries a visible amber note naming
"first N of M". The cohort counts stay exact regardless, and the Active/Inactive split bar is drawn
from those exact counts rather than the scan — so it never needs the note and can never contradict
the invariant above it.

**Two correctness fixes applied in review, after the implementation came back.** Both are mine, not
the implementer's, and both were found by reading the diff rather than by any test:
- The scan originally paged on `ordering=-customer_used_token` alone. `customer_used_token`
  defaults to 0, so most rows tie, and LIMIT/OFFSET paging over a non-unique ORDER BY lets the
  database return a different order per page — skipping and duplicating users. Now
  `-customer_used_token,-created_at`. The tiebreaker must be `created_at`: DRF's `OrderingFilter`
  silently drops terms outside `ordering_fields`, and `id` is not in that list, so ordering by `id`
  would look right and do nothing.
- Accumulation now dedupes by `id`, so a concurrent insert between page requests cannot
  double-count a user and inflate the token total or `scannedCount`.

**Fail closed.** If any page of the scan errors, the whole snapshot returns the error; a partial
scan is never returned as a complete one.

## Follow-up in the same session — plain language + load time

The first cut was correct but shipped two problems the user reported on sight: it read like
developer output, and it was slow. Both are fixed; no number, derivation or data source changed.

**Load time — the real cause is a backend N+1, not this page.** `UsersSerializer` has three
`SerializerMethodField`s that each run a fresh query *per user row*, defeating the viewset's
`prefetch_related`: `get_agent_access` (`UserAgentAccess.objects.filter(user=obj)` with joins),
`get_agent_access_count` (the same filter again, counted) and `get_workspaces`
(`Workspace.objects.filter(members__user=obj)`). `get_created_by_details` is fine — it uses the
`select_related('created_by')`. So **one `GET users/` page of 20 rows costs ~60+ queries**, and
that cost is paid by Manage User too. Notably this is the same mistake the backend's own
module-access code warns against ("`.all()` (not a re-filtered queryset) is required to hit the
`prefetch_related` cache").

Since the backend cannot be changed from this repo, the only levers are *fewer requests* and
*never making the user wait on one*:
- **First paint no longer waits on the scan.** `isInitialLoading` and `hasBlockingError` now
  depend on the three cohort-count queries alone. The KPI row, the reconciliation panel and the
  active/inactive split render as soon as those resolve.
- **The scan became a background tier.** Sections derived from it show their own pending state and
  fill in later; a scan failure shows an inline retry in those sections instead of blanking the
  page. Gating uses `isLoadingSnapshot && !snapshot`, so pressing Refresh never re-blanks data
  already on screen.
- `DEFAULT_MAX_SNAPSHOT_PAGES` 50 → **25** (500 users), scan concurrency 4 → **6**, and
  `keepUnusedDataFor: 300` so returning within five minutes reuses the scan instead of repeating it.
- The Total Tokens tile shows a loading bar, never a placeholder `0` that could be mistaken for a
  real figure.

**Plain language.** Every visible string was rewritten for a reader who does not know what an
endpoint or an invariant is: "Data Consistency" → "Do these numbers add up?", "Invariant holds" →
"Numbers match", "Cross-check against Manage User" → "Compare with the Manage User page", and the
truncation note now reads "These figures cover the N users with the highest token usage, out of M
total. They don't include everyone yet." The per-figure request list and the
same-endpoint/same-actor/same-scope explanation were **not deleted** — they moved into a collapsed
native `<details>` labelled "Technical details" at the foot of that panel, so QA keeps the audit
trail and a non-technical admin never sees it.

## Affected modules and behaviors

`userApi` gains two endpoints; no existing endpoint's params, shape or behaviour changed.
`src/types/auth.ts` and `store.ts` untouched. No auth, migration, webhook, async-task or analytics
path is involved. The extra load is 3 count requests plus `ceil(visibleUsers / 20)` page requests
(capped at 50) per Summary view, against a `users` throttle of 100000/hour.

## Intended outcome

Summary's Active Users equals Manage User's active count for the same signed-in account, and the
page carries enough reconciliation and composition detail for a super admin to draw a conclusion
without opening another screen. **Signal it worked:** SA-047 step 4 passes — the two numbers match
— and the Data Consistency panel shows "Invariant holds". **Signal it did not:** the numbers still
differ, or the invariant badge reads "Mismatch detected" on a quiet system where no user is being
created or deleted.

## Verification

- `npx tsc --noEmit` → exit 0, no output.
- `npx next lint` over all five changed files → `✔ No ESLint warnings or errors`.
- `npx next build` → `✓ Compiled successfully in 6.0s`; `/dashboard/settings/summary` 8.48 kB /
  139 kB First Load JS (8.05 kB before the plain-language/progressive-loading follow-up). Remaining build warnings are all in pre-existing untouched files
  (`<img>` usage, `PlanComponentInclusionManagement.tsx` hook deps).
- Full `git diff` read by the orchestrator, including the implementer's output.
- **Unverified:** no backend was running, so no figure on this page has been observed at runtime.
  The reconciliation invariant, the truncation note, the empty state and the error state were
  reviewed as code only. The claim that Active Users matches Manage User rests on both pages
  issuing the same request and reading the same `count` — sound by construction, but **not yet
  observed against live data**. That observation is the remaining QA step.

## Critical notes

- No security surface changed: no permission check, request shape or payload was altered, and the
  tenancy scope is the server's, unchanged and uncircumvented.
- Rollback is reverting the four source files; the two new files can simply be deleted.
- The 1000-user scan cap is a deliberate ceiling, not an estimate. Past it the page stays correct
  but labels the derived figures as partial. If the directory outgrows it, the right fix is a
  backend aggregate endpoint (one query, exact totals), **not** raising the cap — 50 sequential
  batches of requests is already the practical limit of this approach.
- **The highest-value fix for this page is not in this repo.** The N+1 in `UsersSerializer`
  described above makes every `users/` request slow, for Manage User as much as for Summary.
  Resolving it — have `get_agent_access_count` and `get_agent_access` read the prefetched
  `agent_access_grants` relation rather than building new querysets, and add a prefetch for
  `get_workspaces` — would cut roughly 60 queries per request to a handful, and would let the scan
  cap be raised again. Until then this page is fast to *use* but its detailed figures still take as
  long as the backend takes to produce them.
- Checked and found **not** to be a bug: `?email=` on `users/` looks dead because `email` is absent
  from `filterset_fields`, but `get_queryset()` honours it via `email__icontains`
  (`user_views.py:435`). Manage User's search works. Recorded so it is not "fixed" later.
