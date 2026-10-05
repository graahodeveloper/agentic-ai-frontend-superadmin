"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  useGetGrantableOrganizationsQuery,
  useGetOrganizationModulesQuery,
  useSetOrganizationModulesMutation,
} from '@/features/rbac/rbacApi';
import type { GrantableOrganization, RbacApiErrorBody } from '@/features/rbac/rbacApi.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RbacMutationError {
  data?: Partial<RbacApiErrorBody>;
  status?: number | string;
}

const extractErrorMessage = (err: unknown, fallback: string): string => {
  const apiErr = err as RbacMutationError;
  return apiErr?.data?.detail || apiErr?.data?.error || fallback;
};

const setsAreEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const key of a) {
    if (!b.has(key)) return false;
  }
  return true;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ModuleAccessManager = () => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');

  const {
    data: orgsData,
    isLoading: isLoadingOrgs,
    error: orgsError,
    refetch: refetchOrgs,
  } = useGetGrantableOrganizationsQuery();

  const organizations = useMemo(() => orgsData?.organizations ?? [], [orgsData]);

  // Client-side filter: `GET rbac/organizations/` takes no query params and
  // returns every organization in one unpaginated response, so the whole list
  // is already in memory and a round trip per keystroke would buy nothing.
  // If that endpoint ever gains a `search` param, move this to the server.
  const orgQuery = orgSearch.trim().toLowerCase();
  const filteredOrganizations = useMemo(
    () => (orgQuery ? organizations.filter((org) => org.name.toLowerCase().includes(orgQuery)) : organizations),
    [organizations, orgQuery]
  );

  const {
    data: modulesData,
    isLoading: isLoadingModules,
    isFetching: isFetchingModules,
    error: modulesError,
    refetch: refetchModules,
  } = useGetOrganizationModulesQuery(selectedOrgId ?? '', { skip: !selectedOrgId });

  const [setOrganizationModules, { isLoading: isSaving }] = useSetOrganizationModulesMutation();

  // Re-seed local checkbox state whenever the fetched data changes or the
  // selected org changes, so local edits from a previous org never leak in.
  useEffect(() => {
    if (modulesData) {
      setSelectedKeys(new Set(modulesData.modules.filter((m) => m.granted).map((m) => m.key)));
    } else {
      setSelectedKeys(new Set());
    }
    setSaveError(null);
    setSaveSuccess(false);
  }, [modulesData, selectedOrgId]);

  const grantedKeys = useMemo(
    () => new Set((modulesData?.modules ?? []).filter((m) => m.granted).map((m) => m.key)),
    [modulesData]
  );

  const isDirty = Boolean(modulesData) && !setsAreEqual(selectedKeys, grantedKeys);

  const handleSelectOrg = (orgId: string) => {
    if (orgId === selectedOrgId) return;
    setSelectedOrgId(orgId);
  };

  const toggleModule = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSelectAll = () => {
    if (!modulesData) return;
    setSelectedKeys(new Set(modulesData.modules.map((m) => m.key)));
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleClearAll = () => {
    setSelectedKeys(new Set());
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedOrgId) return;
    setSaveError(null);
    try {
      await setOrganizationModules({ orgId: selectedOrgId, modules: Array.from(selectedKeys) }).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setSaveError(extractErrorMessage(err, 'Failed to save module access. Please try again.'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* ── Organization picker ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Organizations</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {orgQuery
              ? `${filteredOrganizations.length} of ${organizations.length} ${
                  organizations.length === 1 ? 'organization' : 'organizations'
                }`
              : 'Select an organization to manage its module access'}
          </p>

          {/* Shown only once the list has loaded with something in it, so an
              empty backend does not present a box with nothing to search. */}
          {organizations.length > 0 && (
            <div className="relative mt-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search organizations…"
                aria-label="Search organizations"
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#262782]/30 focus:border-[#262782] bg-white transition-all"
              />
              {orgSearch && (
                <button
                  type="button"
                  onClick={() => setOrgSearch('')}
                  aria-label="Clear organization search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {isLoadingOrgs ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-[#eeeefa]" />
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-purple)] border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-xs font-medium">Loading organizations…</p>
          </div>
        ) : orgsError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 text-sm font-semibold">Failed to load organizations</p>
              <p className="text-gray-500 text-xs mt-1">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={() => refetchOrgs()}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#262782,#7071AB)' }}
            >
              Try Again
            </button>
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 text-sm font-semibold">No organizations found</p>
              <p className="text-gray-500 text-xs mt-1">There are no organizations to configure yet.</p>
            </div>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 text-sm font-semibold">No matching organizations</p>
              <p className="text-gray-500 text-xs mt-1 break-words">
                Nothing matches &ldquo;{orgSearch.trim()}&rdquo;.
              </p>
            </div>
            <button
              onClick={() => setOrgSearch('')}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="max-h-[560px] overflow-y-auto divide-y divide-gray-50">
            {filteredOrganizations.map((org: GrantableOrganization) => {
              const isActive = org.id === selectedOrgId;
              return (
                <li key={org.id}>
                  <button
                    onClick={() => handleSelectOrg(org.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isActive ? 'bg-[var(--color-primary-purple)]/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-[var(--color-primary-purple)]' : 'text-gray-900'
                        }`}
                      >
                        {org.name}
                      </p>
                      {org.granted_module_keys.length > 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {org.granted_module_keys.length} granted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Module checklist for selected org ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!selectedOrgId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">No organization selected</p>
              <p className="text-gray-500 text-sm mt-1">Choose an organization on the left to manage its module access.</p>
            </div>
          </div>
        ) : isLoadingModules ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[#eeeefa]" />
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-purple)] border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Loading modules…</p>
          </div>
        ) : modulesError || !modulesData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">Failed to load modules</p>
              <p className="text-gray-500 text-sm mt-1">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={() => refetchModules()}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#262782,#7071AB)' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Org summary header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{modulesData.organization.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {modulesData.member_count} {modulesData.member_count === 1 ? 'member' : 'members'} in this organization
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Select all
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Delegable-pool callout — the single most confusable thing on this page, so
                it gets a visible callout rather than a tooltip. A grant here is ADDITIVE and
                it is a POOL, not a blanket switch: it makes the module available to this
                organization, its admins hold it straight away, and they decide which of
                their members actually get it. Leaving everything unchecked takes nothing
                away from anyone. Keep this wording in step with the resolver's layering in
                the backend's `PermissionResolver.get_user_permissions`. */}
            <div className="mb-5 p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 flex gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-indigo-900 space-y-1.5">
                <p>
                  Checking a module makes it available to this organization. Its{' '}
                  <span className="font-semibold">admins get it right away</span>; other members do
                  not — an admin chooses who, one user at a time, from their own user management
                  page.
                </p>
                <p>
                  Unchecking one withdraws it from{' '}
                  <span className="font-semibold">everyone in this organization</span> on their next
                  request, including anyone an admin had granted it to. Nothing else about their
                  access changes: this only adds the modules below, it never restricts what their
                  role already allows.
                </p>
              </div>
            </div>

            {/* Save feedback */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Module access saved.
              </div>
            )}

            {/* Module checkboxes */}
            {modulesData.modules.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No modules are available to grant.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {modulesData.modules.map((mod) => {
                  const checked = selectedKeys.has(mod.key);
                  return (
                    <label
                      key={mod.key}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-[var(--color-primary-purple)]/40 bg-[var(--color-primary-purple)]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModule(mod.key)}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary-purple)] focus:ring-[var(--color-primary-purple)]/40"
                      />
                      <span className="text-sm font-medium text-gray-800">{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Save bar */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {isFetchingModules
                  ? 'Refreshing…'
                  : isDirty
                  ? 'You have unsaved changes.'
                  : 'No changes to save.'}
              </p>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#262782,#7071AB)' }}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Module Access'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleAccessManager;
