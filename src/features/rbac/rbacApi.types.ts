// src/features/rbac/rbacApi.types.ts
// Types for the Module Access (org-level RBAC) API.
// See CLAUDE.md "RTK Query Pattern" — request/response types live above the slice.

// ─── Organizations list (for the org picker) ──────────────────────────────────

export interface GrantableOrganization {
  id: string;
  name: string;
  member_count: number;
  /**
   * Modules granted to this organization. Empty is the normal state and
   * carries no penalty — the org grant is additive, so an organization with
   * no grant resolves exactly as it would if this feature did not exist.
   *
   * A grant is a POOL, not a blanket switch: the organization's admins hold
   * it immediately, and they decide which of their own members receive it.
   * Revoking it here withdraws it from everyone, including members an admin
   * had granted it to individually.
   */
  granted_module_keys: string[];
}

export interface GetGrantableOrganizationsResponse {
  organizations: GrantableOrganization[];
}

// ─── Single organization's modules ────────────────────────────────────────────

export interface OrganizationModule {
  key: string;
  label: string;
  granted: boolean;
}

export interface OrganizationModulesResponse {
  organization: {
    id: string;
    name: string;
  };
  member_count: number;
  /**
   * The modules a Super Admin may grant at the ORGANIZATION level — today
   * just Handover. This is deliberately NOT the full module catalogue: the
   * per-user modules an Org Admin assigns are a separate concern handled in
   * the org app, and are never offered here.
   *
   * The two are linked in one direction only. Granting a module here is what
   * makes it assignable per-user by that organization's admins; it does not
   * assign it to anyone but those admins. Nothing in the org app can grant a
   * module the organization was not given here.
   */
  modules: OrganizationModule[];
}

export interface SetOrganizationModulesRequest {
  orgId: string;
  modules: string[];
}

// ─── Backend error convention ─────────────────────────────────────────────────
// 400 for an unknown module key, 403 for a module that is real but not
// grantable at the organization level.

export interface RbacApiErrorBody {
  error: string;
  detail: string;
}
