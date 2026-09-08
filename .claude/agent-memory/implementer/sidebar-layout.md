---
name: sidebar-layout
description: How to add a top-level nav entry to src/app/dashboard/layout.tsx without disturbing the rest of the file
metadata:
  type: project
---

Verified against `src/app/dashboard/layout.tsx` on branch `cleanup/super-dev-20260825`
(2026-09-07).

- All routes are declared once in a `NAV_ROUTES` const near the top of the file. Grouped
  sections (Performance Analytics, Subscription Model, CMS Settings, Settings) are nested
  objects; standalone top-level items (Agent Templates, Workspaces, Demo Users) are flat
  string keys built from `${BASE}/...`.
- A top-level nav item is exactly this shape — no wrapper div needed, just a `<Link>`
  directly inside `<nav>`:
  ```tsx
  <Link href={NAV_ROUTES.x} className={linkCls(NAV_ROUTES.x)}>
    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="..."/>
    </svg>
    <span className="font-medium">Label</span>
  </Link>
  ```
  `linkCls(href)` (defined once, ~line 118) handles the active/inactive styling — don't
  redefine it per item.
  A collapsible group (used for Performance Analytics/Subscription/CMS/Settings) is a much
  bigger pattern (button + `useState` open flag + `submenuContainerCls`) — only reach for
  it if the packet actually asks for a group with sub-items.
- When a packet says "add the nav entry and nothing else," the two-part edit is: (1) one
  new line in `NAV_ROUTES`, (2) one new `<Link>` block placed by name relative to an
  existing item (e.g. "after Demo Users, before Performance Analytics" — find the existing
  `{/* Demo Users */}` and `{/* Performance Analytics */}` comments as anchors). Do not
  touch `useEffect`/`useState` blocks tracking group-open state unless the new item is
  itself a group.
