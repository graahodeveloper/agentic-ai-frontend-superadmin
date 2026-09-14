# 2026-09-09 — `supports_human_handover` checkbox on the Website agent variant

Verified against `cleanup/super-dev-20260825` @ `c1751c6` (this repo, working tree). Backend
slice for `supports_human_handover` is being written in parallel against the fixed API
contract described below; not verified against a live backend here.

## Why

Super Admin needs a way to declare, at the agent-template level, that a given template's
conversations may be handed over to a real human agent. The flag only makes sense for the
`website` agent variant. Org admins then switch the behavior on per instance in the other
(org-facing) frontend — that per-instance UI is out of scope for this change.

## What changed

- **`src/components/SuperAdminAgentManagement/SuperAdminCreateAgentTemplateDrawer.tsx`**
  - `FormData.supports_human_handover: boolean`, defaulting to `false` in the initial state
    and in both edit-mode prefill branches (`templateData` and the `templateError` fallback
    that reads `editTemplate`), plus the "reset to blank" branch — all four state-setting
    sites in `useEffect` set it explicitly so create and edit cannot drift apart.
  - New checkbox "Include real human agent" (with the helper line "Allow a customer to ask
    to be transferred to a real person during the conversation"), rendered directly under
    the Agent Variant `<select>` in Step 1, and **only** when
    `formData.agent_variant === 'website'`. Markup matches the existing `is_active`/
    `is_public` checkbox blocks (same `bg-gray-50 p-4 rounded-lg border` wrapper, same
    `id`/`htmlFor` pairing).
  - `handleInputChange`'s existing variant-reset block (which already resets
    `agent_variant` when `agent_type` changes) now also forces
    `newData.supports_human_handover = false` whenever the resulting `agent_variant` is not
    `'website'` — covers both a direct variant change away from website and an `agent_type`
    flip that resets the variant. This mirrors the backend's own reset rule; no client-side
    400-style validation was added, only the hide/reset the packet asked for.
  - Included in the submit payload (`templateData` object used for both create and update)
    alongside `agent_variant`.

- **`src/features/agentTemplateApi/agentTemplateApi.ts`** — added `supports_human_handover`
  to the shapes that carry a template's *own* attributes:
  - `AgentTemplate` (the shape returned by `getAgentTemplateById` and by
    `AgentTemplatesResponse.results`, and the type of the drawer's `editTemplate` prop).
  - `CreateAgentTemplateRequest` (required, matching the existing `is_active`/`is_public`
    pattern for this interface) and `UpdateAgentTemplateRequest` (optional, matching that
    interface's existing `is_active?`/`is_public?` pattern).
  - `CreateAgentTemplateResponse.template` (used by both `createAgentTemplate` and
    `updateAgentTemplate`, which share this response type), plus the inline
    `apiResponse.template` type and the object literal built from it inside
    `createAgentTemplate`'s `transformResponse`, and the placeholder object
    `updateAgentTemplate`'s `transformResponse` builds from its partial PATCH response
    (`supports_human_handover: false`, alongside its other placeholder defaults such as
    `is_active: false`).

  **Deliberately not touched:** `TemplateAssignment.template_details` and
  `AgentInstance.template_details` (both are reduced summary projections that already omit
  several core template fields such as `agent_role` and `icon` — they're not the shape a
  template's own attributes are declared in), and everything under `AgentInstance` /
  `CreateActivationResponse` / `UpdateAgentInstanceConfigRequest`/`Response` (per-instance
  shapes — the per-instance toggle is explicitly the org-facing frontend's slice, not this
  one).

## Affected behavior

Only the Create/Edit Agent Template drawer and the agent-template API types. No other page,
route, or store entry changed. The checkbox is invisible and its value is forced to `false`
for every variant except `website`, so no existing template's save payload changes shape
unless the operator is actively editing a website-variant template.

## Intended outcome

A Super Admin creating or editing a `website`-variant agent template can flag
"Include real human agent"; the value round-trips through `supports_human_handover` on
create/update/read. Signal it worked: the checkbox appears only when Agent Variant is
Website, unchecking or switching variant away from Website clears it before submit, and the
field appears in the create/update request body and in the prefilled edit form.

## Verification

```
npx tsc --noEmit
  -> exit 0, no output

npx eslint src/components/SuperAdminAgentManagement/SuperAdminCreateAgentTemplateDrawer.tsx src/features/agentTemplateApi/agentTemplateApi.ts
  -> exit 0, no output
```

**Unverified, explicitly:** this repo has no automated test suite for this component (no
vitest/jest config), so the reset-on-variant-change behavior is verified by reading the
`handleInputChange` logic, not by a test. Not rendered against a running backend — the
backend's `supports_human_handover` slice (400 on `true` + non-`website` variant, forced
reset on variant change server-side) is being implemented in parallel and was not available
to test against here.

## Critical notes

- This is a wire-contract addition: `agent_variant` values and casing were left untouched
  per the packet's constraint; only the new field was added beside them.
- The backend is the source of truth for the `true` + non-`website` rejection; this change
  only hides/resets the checkbox client-side and does not duplicate that validation.
