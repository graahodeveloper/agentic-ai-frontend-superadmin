---
name: dashboard-ui-idioms
description: Page shell, card, and loading/empty/error state patterns used across dashboard pages/components
metadata:
  type: project
---

Verified against `src/app/dashboard/workspaces/page.tsx`,
`src/components/SuperAdminAgentManagement/WorkspacesTable.tsx`, and
`src/components/demo-users/DemoUsersList.tsx` (2026-09-07).

- Page shell (`app/dashboard/<feature>/page.tsx`): thin server component, no `"use client"`,
  imports one client component and renders it inside a header + content wrapper:
  `<div className="min-h-screen bg-gray-50">` with a white header bar
  (`bg-white border-b border-gray-200 px-6 py-6`) containing an icon chip + `h1`/`p`, then
  `<div className="p-6">` for the actual feature component. `demo-users/page.tsx` is the
  even-thinner variant (`p-6 lg:p-8 max-w-[1400px]` with no header bar) — use that only for
  very simple pages.
- Purple accent token is `var(--color-primary-purple)` = `#4318ff`, defined in
  `src/app/globals.css`. Used as `text-[var(--color-primary-purple)]`,
  `bg-[var(--color-primary-purple)]/10`, etc. A second, unrelated indigo/purple gradient
  (`linear-gradient(135deg,#262782,#7071AB)`) is used for primary buttons/spinners in
  demo-users and workspaces — both accents coexist in the app; match whichever the nearest
  anchor file uses rather than inventing a third.
- Loading state: a two-layer spinner (`absolute inset-0 rounded-full border-4
  border-[#eeeefa]` behind `border-4 border-[color] border-t-transparent animate-spin`)
  centered in a `py-16`/`py-24` flex column, with a `text-gray-500 text-sm` caption below.
- Error state: red icon chip (`bg-red-50` circle + `text-red-500` outline svg), bold
  "Failed to load X" + gray subtext, then a gradient "Try Again" button that calls
  `refetch()`.
- Empty state: same layout as error but gray icon chip and a "No X found" message,
  contextual subtext (e.g. different message when a search/filter is active vs. truly
  empty).
- Dirty-state / mutation feedback pattern: local boolean state for success
  (`setTimeout(() => setSuccess(false), 4000)`), a red inline banner for errors extracted
  from the caught `unwrap()` rejection, disable the primary action button while the
  mutation's `isLoading` is true and show an inline spinner + "-ing…" label inside it.
