---
name: progressive-loading-pattern
description: How to split page-blocking loading state from per-section background loading when one RTK Query endpoint is cheap and another is expensive, plus the collapsed-technical-detail idiom for non-technical pages
metadata:
  type: project
---

Verified in `src/components/settings/Summary/Summary.tsx` (2026-10-05), splitting an
expensive multi-page `getUserDirectorySnapshot` scan off the page's first paint.

- **Tiered loading split.** `isInitialLoading` / `hasBlockingError` must only read the
  cheap queries' `isLoading`/`error`/`data` — never OR in the expensive query. Compute a
  separate `xPending = isLoadingX && !dataX` and `xFailed = Boolean(errorX) && !dataX` for
  the expensive one; using `isLoading` (not `isFetching`) means a background refetch never
  re-blanks a section that already has data.
- Give every section whose data depends on the expensive query its own three-way branch:
  `xPending ? <PendingNote/> : xFailed ? <ErrorNote onRetry={refetchX} /> : <realContent/>`.
  A KPI tile that depends on it should show a skeleton bar in place of the number, never a
  literal `0` — a zero is indistinguishable from a real empty count.
- [[dashboard-ui-idioms]] covers the page-level loading/error/empty shells this pattern
  nests inside; reuse its two-ring spinner for the pending note instead of inventing a new
  spinner style.
- **Collapsed technical detail for non-technical pages.** When a page must stay readable by
  a non-technical user but an audit/QA trail needs exact request strings, endpoint names,
  or internal terms to survive, put that content verbatim inside a native
  `<details><summary>Technical details</summary>...</details>` at the bottom of the
  relevant card, styled as a small muted clickable line (`text-xs text-gray-400
  hover:text-gray-600`). No JS state needed, and it keeps jargon out of the default-visible
  body without deleting it.
- When adding `keepUnusedDataFor` to an expensive RTK Query endpoint, comment *why* at the
  call site (cost per request) — it's the kind of tuning value a future reader will want to
  second-guess without re-deriving the reasoning.
