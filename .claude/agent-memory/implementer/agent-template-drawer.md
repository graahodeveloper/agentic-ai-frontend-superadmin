---
name: agent-template-drawer
description: SuperAdminCreateAgentTemplateDrawer.tsx form-state trap and variant-conditional field pattern; agentTemplateApi.ts type surface for template attributes
metadata:
  type: project
---

Verified against `src/components/SuperAdminAgentManagement/SuperAdminCreateAgentTemplateDrawer.tsx`
and `src/features/agentTemplateApi/agentTemplateApi.ts` (2026-09-09, branch
`cleanup/super-dev-20260825` @ `c1751c6`), while adding `supports_human_handover`.

- **Adding a `FormData` field means touching four `setFormData(` call sites**, all inside
  one `useEffect` (~line 195-245): the initial `useState`, the `isEditMode && templateData`
  branch, the `isEditMode && editTemplate && templateError` fallback branch, and the final
  "reset to blank" `else` branch. Miss one and create/edit drift apart silently (no compile
  error — object literals for `useState<FormData>`/`setFormData` are structurally checked,
  so a field you forgot just doesn't get set and TS won't flag it if the surrounding literal
  still satisfies the type via other required fields already present... actually it *will*
  fail to compile if the field is non-optional, which is what caught this in practice — but
  don't rely on that, grep `setFormData(` and check every hit).
- **Variant-conditional fields belong in the `handleInputChange` reset block** (~line 375),
  which already resets `agent_variant` when `agent_type` flips internal/external. Add the
  new field's reset logic right after, keyed off `newData.agent_variant` (not the raw
  `field`/`value` args) so it also fires transitively when `agent_type` resets the variant.
- **`agentTemplateApi.ts` has no single canonical "template" type** — `AgentTemplate` (used
  by `getAgentTemplateById` + `AgentTemplatesResponse.results` + `editTemplate` prop) is the
  read shape; `CreateAgentTemplateRequest`/`UpdateAgentTemplateRequest` are the write shapes
  (create fields required, update fields optional — mirrors existing `is_active`/
  `is_public` pattern in each); `CreateAgentTemplateResponse.template` is shared by both
  create and update mutations, and its `transformResponse` hand-rolls an inline duplicate of
  that same object shape twice more (an inline `apiResponse.template` type for the create
  response, and a hardcoded placeholder object for the update response since the PATCH
  endpoint only returns `{id, agent_id}`) — a new required field must be added in all of
  these or `tsc` fails at the placeholder/mapping object literals, not at the interface.
- **Do not add template fields to `TemplateAssignment.template_details` or
  `AgentInstance.template_details`** — both are reduced summary projections (no
  `agent_role`, no `icon`, etc.), not the shape a template's own attributes live in.
  `AgentInstance` itself and everything under it (`CreateActivationResponse`,
  `UpdateAgentInstanceConfigRequest/Response`) is the per-*instance* config surface, which
  in this product is the org-facing frontend's concern, not super-admin's.
- Checkbox markup idiom in this drawer: `<div className="bg-gray-50 p-4 rounded-lg border
  border-gray-200"><div className="flex items-center"><input id="..." type="checkbox"
  checked={...} onChange={(e) => handleInputChange('field', e.target.checked)}
  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label
  htmlFor="..." className="ml-3"><span className="text-sm font-medium
  text-gray-700">Label</span><p className="text-sm text-gray-500">Helper text</p></label>
  </div></div>` — matches `is_active`/`is_public` in Step 2; reused for a Step-1
  variant-conditional checkbox without issue.
