---
name: backend-rbac-repo
description: Sibling Django backend repo (graaho-ai-agent-backend) RBAC app layout, test/migration commands, and environment traps hit while implementing org-level module caps and superadmin-only permission lockdown.
metadata:
  type: project
---

The Django backend for this product is a **separate repo**,
`/Users/golamkibriaanik/Desktop/graaho-ai/graaho-ai-agent-backend`, branch `koronik-develop` as
of 2026-09-07 — not part of this frontend checkout. Tasks that say "Repo: ...-backend" in the
packet are asking you to `cd`/operate there directly; there is no relationship enforced between
the two repos' git state.

**Test commands (verified working, 2026-09-07):**
- `venv/bin/python -m pytest apps/rbac/tests/ -q` — pytest picks up `config.settings.testing`
  automatically from `pytest.ini`. Do NOT pass `--settings`; it already resolves correctly.
- `pytest.ini` sets `testpaths = apps/agents/tests` — pytest collects NOTHING unless you name
  explicit paths, e.g. `apps/rbac/tests/ apps/users/tests/ ...`.
- `venv/bin/python manage.py test rbac` (Django's own runner, not pytest) currently fails in
  this environment with `OperationalError: no such index: idx_activation_agent_status` — this is
  a pre-existing sqlite test-DB setup issue unrelated to RBAC changes; pytest's own DB setup does
  not hit it. Prefer pytest for verification in this repo.
- `venv/bin/python manage.py makemigrations <app> --check --dry-run --settings=config.settings`
  needs the explicit `--settings=config.settings` flag when run outside pytest.

**Settings duplication trap:** this repo has two settings trees — `config/settings/` (what
`manage.py`/pytest use by default) and the legacy `graaho_ai_agent/settings.py` (what deployed
containers actually boot from, per `docs/decisions/DECISIONS.md` 2026-09-07 entry). Anything
added to `INSTALLED_APPS`/`MIDDLEWARE`/feature settings in one MUST be mirrored in the other in
the same commit, or the deployed process crashes on `django.setup()`. Check both files before
concluding a new Django app is required — `apps.rbac` and `apps.organizations` were already
present in both as of this date, so slices confined to those apps need no settings changes.

**RBAC app structure** (`apps/rbac/`): `constants.py` is the single source of truth for
permission codes/roles/module groupings, mirrored by hand in the frontend at
`src/lib/rbac/permissions.ts` — a backend-only change to codes/roles/defaults needs a matching
frontend PR, not just a note. `constants.py` runs import-time `assert`s tying `PERMISSION_MODULES`
to `PERMISSION_CATALOGUE`; any new derived constant that depends on `PERMISSION_MODULES` must be
defined AFTER that derivation in file order (I reordered the "PERMISSION MODULES" block above
"ROLES" to let `ROLE_PERMISSIONS[ROLE_ADMIN]` reference a modules-derived constant directly,
rather than mutating the dict post-hoc — see [[rbac-derive-not-hand-list]]).

`rbac.services.PermissionResolver` deliberately does NOT cache per-user resolution (only the
per-role LocMemCache is cached, TTL 300s) — every layer added on top of role/user overrides
(e.g. an org-level cap) must follow the same "query fresh every time" rule already documented
there, not introduce a second staleness surface.

**Re-verified 2026-09-08:** `venv/bin/python manage.py test apps.rbac --settings=config.settings.testing`
still fails at test-DB setup with `OperationalError: no such index: idx_activation_agent_status`
on a clean tree (unrelated app's migration, not `apps.rbac`) — `venv/bin/python -m pytest
apps/rbac/tests/ -q` is the only verification path that actually works here; prefer it and name
the manage.py failure as a known pre-existing environment issue rather than retrying it.

**Shared, non-worktree-isolated checkout trap:** this repo checkout was being edited by another
concurrent worker (`apps/rbac/tests/test_organization_module_access_api.py` plus
`admin.py`/`serializers/`/`urls.py`/`views/rbac_views.py`) while I worked in it — `git status`
picked up their in-progress, uncommitted changes as if they were mine. Before reporting a
mutation-check "file restored exactly," check `git status`/`git diff <exact file>` (not the
whole repo) so an unrelated concurrent worker's edits in the same directory don't get
attributed to you or hide your own diff. Reconfirmed 2026-09-08: `logs/api-requests.log.*`
files were deleted mid-session by something outside any tool call I made (a log
rotation/cleanup process apparently runs against this checkout independently) — don't stage or
revert unexplained changes outside your read-write set, just note them in the report.

**Read-only anchor test files can encode the exact behavior a packet tells you to remove
(2026-09-08):** a packet asked me to replace `PermissionResolver.get_user_permissions`'s
blanket org-module-grant cascade with a role/override-gated pool, and make `GET rbac/modules/`
actor-aware, while marking `test_organization_module_access_api.py` and
`test_user_permission_api.py` read-only (pattern reference only). Both files contained a
pre-existing assertion directly encoding the OLD behavior the packet's own Intent said to
eliminate (a plain `user` auto-resolving a handover grant with no per-user row; `GET
rbac/modules/` asserting a static 15-module list). Implementing the locked design correctly
necessarily broke both — confirmed unavoidable via a mutation check, not a defect in the new
code. Don't weaken a locked design to keep an out-of-scope legacy assertion green, and don't
silently edit a file marked read-only either — implement correctly, run the full suite, and
report the exact `file:line` + one-line fix for each so the orchestrator can apply/delegate it.
