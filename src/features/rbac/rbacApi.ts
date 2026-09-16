// src/features/rbac/rbacApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQueryWithAuth";
import type {
  GetGrantableOrganizationsResponse,
  OrganizationModulesResponse,
  SetOrganizationModulesRequest,
} from "./rbacApi.types";

export const rbacApi = createApi({
  reducerPath: "rbacApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["OrganizationModules"],
  endpoints: (builder) => ({
    // Organizations a Super Admin can grant module access to.
    getGrantableOrganizations: builder.query<GetGrantableOrganizationsResponse, void>({
      query: () => ({
        url: "rbac/organizations/",
      }),
      providesTags: ["OrganizationModules"],
    }),

    // Module grant state for a single organization.
    getOrganizationModules: builder.query<OrganizationModulesResponse, string>({
      query: (orgId) => ({
        url: `rbac/organizations/${orgId}/modules/`,
      }),
      providesTags: (result, error, orgId) => [{ type: "OrganizationModules", id: orgId }],
    }),

    // Set the org-level module grant. This writes the organization's POOL,
    // not a per-user grant: the backend resolver gives a pooled module to the
    // org's admins by default, and to its users only where an org admin has
    // granted it individually. Unchecking withdraws it from everyone.
    setOrganizationModules: builder.mutation<OrganizationModulesResponse, SetOrganizationModulesRequest>({
      query: ({ orgId, modules }) => ({
        url: `rbac/organizations/${orgId}/modules/`,
        method: "PUT",
        body: { modules },
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "OrganizationModules", id: orgId },
        "OrganizationModules",
      ],
    }),
  }),
});

export const {
  useGetGrantableOrganizationsQuery,
  useGetOrganizationModulesQuery,
  useSetOrganizationModulesMutation,
} = rbacApi;
