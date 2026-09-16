---
name: frontend-rbac-sibling-repo
description: Sibling frontend repo (graaho-ai-agent-frontend) that owns the org-admin RBAC module-access UI — separate checkout from this super-admin repo, plus its assignable-gate pattern and test/lint traps.
metadata:
  type: project
---

The org-admin-facing RBAC module-access UI (`ManageModuleAccessModal`, `ModuleAccessPicker`,
`CreateUserDrawer`) lives in a **separate repo**,
`/Users/golamkibriaanik/Desktop/graaho-ai/graaho-ai-agent-frontend`, branch `koronikai-dev` as
of 2026-09-08 — not this super-admin checkout. A task packet that says "Repo:
.../graaho-ai-agent-frontend" is asking you to `cd`/operate there directly; verify with
`git branch --show-current` and `git status --short` before starting, since the two repos'
git state is unrelated. See [[backend-rbac-repo]] for the analogous Django-side split.

**Module-assignability pattern (as of 2026-09-08):**
- `src/features/rbac/rbacApi.types.ts` — `UserModuleGrant.assignable: boolean` is the
  per-caller-per-target gate returned by `GET/PUT rbac/users/{id}/permissions/`. `granted`
  (resolved state for the target) and `assignable` (whether THIS caller may toggle it) are
  independent booleans; a module can be either without the other.
- `src/lib/rbac/moduleVisibility.ts` — `OFFERED_MODULE_KEYS`/`isOfferedModule(key)` is a
  DISPLAY narrowing only (which of ~15 backend modules the admin UI shows at all), not a
  permission gate. Its doc comment already states the two-endpoint contract accurately; read
  it before assuming a rewrite is needed.
- `ManageModuleAccessModal.tsx` is the only component that reads `assignable` — it combines
  both conditions into one local predicate (`isAssignableModule`) used everywhere it filters a
  `UserModuleGrant`, so visibility and the PUT save payload can never disagree.
- `CreateUserDrawer.tsx` / `ModuleAccessPicker.tsx` read `PermissionModule` from
  `GET rbac/modules/` instead — that type has no `assignable` field because the backend
  already omits non-assignable modules from that response entirely. Neither needs an
  `assignable` check; confirmed by reading, not assumed.
- No role-string check (`role === 'admin'`) and no check on a literal module key anywhere in
  this pattern — every gate is server-driven so a new restricted module is a backend config
  change, never a frontend edit.

**Test/tooling traps (verified 2026-09-08):**
- `npx tsc --noEmit` and `npm test` (`vitest run`) both work normally in this repo.
- When a required field is added to a shared response type
  (e.g. `UserModuleGrant.assignable`), check existing test fixtures that construct that type
  literal-style — they silently fail `tsc --noEmit` with `Property '...' is missing` even
  though nothing about the test's actual behavior changed. `src/__tests__/rbac/
  manage-module-access-modal.test.tsx` needed `assignable: true` added to every fixture object
  to restore `tsc` to a clean baseline; this is collateral from the type change, not new scope.
- `npm run lint` (`next lint`) is currently broken in this checkout independent of any RBAC
  work: it errors "Invalid project directory provided, no such directory: .../lint" (an
  arg-parsing issue). Direct `npx eslint <files>` also fails, with `TypeError: Converting
  circular structure to JSON` inside `@eslint/eslintrc`'s config validator while resolving the
  `react` plugin config. Both pre-date and are unrelated to RBAC changes — name them as
  unverifiable rather than retrying, unless the task is specifically about lint config.
- This repo has a pre-existing, unrelated `tsc --noEmit` failure set (26 errors as of
  2026-09-08) confined to `src/__tests__/normal-flow/{marketplace,payment-gate,payments,
  plans,subscriptions}.test.tsx` and `src/__tests__/wallets.test.ts` — capture a baseline
  `tsc` run before editing and diff against it rather than assuming a nonzero exit means your
  change broke something.
