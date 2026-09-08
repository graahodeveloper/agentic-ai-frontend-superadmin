---
name: rtk-query-conventions
description: How RTK Query feature slices (createApi) and store registration are structured in this repo
metadata:
  type: project
---

Verified against `src/features/performanceAnalytics/performanceAnalyticsApi.ts` and
`src/store.ts` on branch `cleanup/super-dev-20260825` (2026-09-07).

- Each feature is `src/features/<name>/<name>Api.ts` using
  `createApi({ reducerPath, baseQuery: baseQueryWithReauth, tagTypes, endpoints })`.
  `baseQueryWithReauth` lives in `src/lib/api/baseQueryWithAuth.ts` and handles token
  refresh, 401 retry, and 431 storage-clear-and-redirect — always reuse it, never a raw
  `fetchBaseQuery`.
- Request/response TypeScript interfaces are declared above the `createApi` call in the
  same file for smaller APIs (performanceAnalyticsApi does this). For a slice with several
  endpoints and reused shapes, a sibling `<name>Api.types.ts` also works (used for
  `src/features/rbac/rbacApi.ts` + `rbacApi.types.ts`) — both patterns exist, pick based on
  size.
- URLs passed to `query: () => ({ url: '...' })` are relative with **no leading slash**
  (e.g. `"rbac/organizations/"`), matching every existing feature.
- Every new API must be added in **both** places in `src/store.ts`: the `reducer` map
  (`[xApi.reducerPath]: xApi.reducer`) and `.concat(xApi.middleware)` in the middleware
  chain. Missing either breaks the store silently (no queries fire / no cache updates).
- Backend error convention across this codebase is inconsistent per-feature: some return
  DRF-style `{field: [messages]}` (see `ApiError` in
  `src/components/subscription-model/plan/CreateEditPlanDrawer.tsx`), others (RBAC/module
  access) return `{ error: string, detail: string }`. Always check the packet's documented
  contract rather than assuming DRF field-error shape; extract with a small
  `err.data?.detail || err.data?.error || fallback` helper against
  `unwrap()`'s thrown value, typed as `{ data?: Partial<YourErrorBody>; status?: number }`.
- Tag invalidation for a "list + single resource" pair: `providesTags` on the single-item
  query returns `[{ type, id }]`; the mutation's `invalidatesTags` returns both
  `[{ type, id }, type]` (bare string) so the list-level `providesTags: [type]` on the
  collection query also refetches. See `rbacApi.ts` (`OrganizationModules` tag) for a
  concrete example.
