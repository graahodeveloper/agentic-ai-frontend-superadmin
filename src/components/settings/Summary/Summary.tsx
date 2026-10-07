'use client';
// src/components/settings/Summary/Summary.tsx
//
// Settings → Summary dashboard (SA-047). Every headline figure on this page
// traces to one of two sources:
//   - `getUserCohortCount` — a count-only hit against `GET users/?is_active=...`,
//     the SAME request and the SAME DRF `count` field that Manage User's status
//     filter reads. Total / Active / Inactive come from here and are exact.
//   - `getUserDirectorySnapshot` — a paged scan of `GET users/` (ordered by
//     `-customer_used_token`) used for analytics a count alone cannot answer:
//     token usage, role/account-type/country mix, signup recency, activation
//     status. This can be capped (see `DEFAULT_MAX_SNAPSHOT_PAGES`), so every
//     figure derived from it carries a visible "based on N of M" note whenever
//     `truncated` is true.
//
// Both `users/` requests run as the signed-in actor, so they carry that
// actor's tenancy scope (a superadmin sees everything; an org-scoped actor
// sees only their org). That is also why Summary and Manage User agree by
// construction — same endpoint, same actor, same scope, same count — not only
// for a superadmin.
//
// LOADING MODEL (two tiers, see SA-047 follow-up): the three cohort counts
// above are cheap and gate first paint (`isInitialLoading` / `hasBlockingError`
// below depend on them ONLY). The directory scan is expensive — see
// `DEFAULT_MAX_SNAPSHOT_PAGES` in `userApi.ts` for why — and never blocks
// render; every section derived from it shows its own small pending/error
// state via `snapshotPending` / `snapshotFailed` and fills in once the scan
// resolves.
//
// WORDING: this page is read by non-technical staff. Keep headline copy free
// of request strings, field names, and backend jargon ("invariant", "paged
// scan", "tenancy scope", "cohort"); the verifiable technical detail lives in
// the collapsed "Technical details" block in the Data Consistency panel, not
// in the main body.

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  useGetUserCohortCountQuery,
  useGetUserDirectorySnapshotQuery,
  type DirectoryUser,
} from '@/features/user/userApi';
import {
  computeTokenStats,
  computeRoleBreakdown,
  computeUserTypeBreakdown,
  computeCountryBreakdown,
  computeSignupRecency,
  computePasswordSetBreakdown,
  reconcileCohortCounts,
  toTokenCount,
  formatExactNumber,
  formatCompactNumber,
  formatPercent,
  type CountBreakdownEntry,
} from './summaryMetrics';

const PURPLE_GRADIENT = 'linear-gradient(135deg,#262782,#7071AB)';

// ─── Small shared helpers ─────────────────────────────────────────────────────

const formatDateTime = (value: string | undefined | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatClockTime = (value: string | undefined | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US');
};

const displayName = (user: DirectoryUser): string =>
  user.full_name ||
  `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
  user.email ||
  'Unknown user';

const getInitials = (user: DirectoryUser): string => {
  const name = displayName(user);
  if (name && name !== 'Unknown user') {
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return (user.email?.[0] || 'U').toUpperCase();
};

const safeDivide = (numerator: number, denominator: number): number =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

// ─── Stat card (KPI tile) ──────────────────────────────────────────────────────
// Visual grammar matches `StatCard` in DemoUsersList.tsx: gradient background,
// rounded-2xl, uppercase label, large bold value, icon chip, decorative circle.

function StatCard({
  label,
  value,
  sub,
  icon,
  gradient,
  busy = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  gradient: string;
  busy?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white h-full"
      style={{ background: gradient }}
      aria-busy={busy ? 'true' : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1 leading-none tabular-nums">{value}</p>
          {sub && <p className="text-xs opacity-75 mt-1.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" aria-hidden="true" />
    </div>
  );
}

// ─── Compact loading bar, used in place of a KPI value while it is pending ────
// Never render a placeholder "0" for a figure that hasn't loaded — this takes
// its place instead, so nothing on screen looks like a real (zero) count.

function InlineLoadingBar() {
  return (
    <span
      className="inline-block h-7 w-20 rounded-md bg-white/25 animate-pulse align-middle"
      aria-hidden="true"
    />
  );
}

// ─── Card shell (section container) ───────────────────────────────────────────

function Card({
  children,
  className = '',
  busy = false,
}: {
  children: React.ReactNode;
  className?: string;
  busy?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}
      aria-busy={busy ? 'true' : undefined}
    >
      {children}
    </div>
  );
}

// ─── Truncation note ───────────────────────────────────────────────────────────
// Required wherever a figure is derived from the (possibly capped) directory
// scan rather than from an authoritative count — never present a partial scan
// as a platform total.

function TruncationNote({ scannedCount, totalCount }: { scannedCount: number; totalCount: number }) {
  return (
    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      These figures cover the <span className="font-semibold tabular-nums">{formatExactNumber(scannedCount)}</span>{' '}
      users with the highest token usage, out of{' '}
      <span className="font-semibold tabular-nums">{formatExactNumber(totalCount)}</span> total. They don&apos;t
      include everyone yet.
    </p>
  );
}

// ─── Snapshot pending / error notes ────────────────────────────────────────────
// Shown in place of any section that is derived from the (slow) directory
// scan, while that scan is still running or if it failed. A failed scan never
// blanks the rest of the page — only the sections that depend on it.

function SnapshotPendingNote({ label = 'Working this out…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-gray-400" aria-busy="true">
      <span className="relative w-4 h-4 flex-shrink-0" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <span className="absolute inset-0 rounded-full border-2 border-[#262782] border-t-transparent animate-spin" />
      </span>
      {label}
    </div>
  );
}

function SnapshotErrorNote({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
      <span>Couldn&apos;t load the detailed breakdown.</span>
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs font-semibold rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-all flex-shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Horizontal breakdown bar ──────────────────────────────────────────────────

function BreakdownBar({ entry }: { entry: CountBreakdownEntry }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1 gap-3">
        <span className="font-medium text-gray-700 truncate">{entry.label}</span>
        <span className="text-gray-500 tabular-nums whitespace-nowrap">
          {formatExactNumber(entry.count)} · {formatPercent(entry.percent)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, entry.percent))}%`, background: PURPLE_GRADIENT }}
        />
      </div>
    </div>
  );
}

function BreakdownList({ entries, emptyLabel }: { entries: CountBreakdownEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <BreakdownBar key={entry.key} entry={entry} />
      ))}
    </div>
  );
}

// ─── Icons (decorative, aria-hidden) ───────────────────────────────────────────

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TokenIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-2h-1v-3c0-1.1-.9-2-2-2h-3V8c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v3H3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1zm-1 2H5v-1h14v1z" />
  </svg>
);

// ─── Main component ────────────────────────────────────────────────────────────

const Summary: React.FC = () => {
  const {
    data: totalCohort,
    isLoading: isLoadingTotal,
    isFetching: isFetchingTotal,
    error: totalError,
    refetch: refetchTotal,
  } = useGetUserCohortCountQuery({});

  const {
    data: activeCohort,
    isLoading: isLoadingActive,
    isFetching: isFetchingActive,
    error: activeError,
    refetch: refetchActive,
  } = useGetUserCohortCountQuery({ is_active: true });

  const {
    data: inactiveCohort,
    isLoading: isLoadingInactive,
    isFetching: isFetchingInactive,
    error: inactiveError,
    refetch: refetchInactive,
  } = useGetUserCohortCountQuery({ is_active: false });

  const {
    data: snapshot,
    isLoading: isLoadingSnapshot,
    isFetching: isFetchingSnapshot,
    error: snapshotError,
    refetch: refetchSnapshot,
  } = useGetUserDirectorySnapshotQuery({});

  const handleRefreshAll = useCallback(() => {
    refetchTotal();
    refetchActive();
    refetchInactive();
    refetchSnapshot();
  }, [refetchTotal, refetchActive, refetchInactive, refetchSnapshot]);

  const isFetchingAny = isFetchingTotal || isFetchingActive || isFetchingInactive || isFetchingSnapshot;

  // Tier 1 — instant. First paint depends on the three cheap cohort counts
  // ONLY. The directory scan (`snapshot`) never gates render; see the
  // "snapshotPending" / "snapshotFailed" handling further down for how its
  // sections behave on their own while it is in flight or has failed.
  const isInitialLoading =
    (!totalCohort && isLoadingTotal) ||
    (!activeCohort && isLoadingActive) ||
    (!inactiveCohort && isLoadingInactive);

  const hasBlockingError =
    (Boolean(totalError) && !totalCohort) ||
    (Boolean(activeError) && !activeCohort) ||
    (Boolean(inactiveError) && !inactiveCohort);

  // Tier 2 — background. True only on the snapshot's first load / first
  // failure, never during a background refetch of data already on screen —
  // so a Refresh click never blanks sections that have already filled in.
  const snapshotPending = isLoadingSnapshot && !snapshot;
  const snapshotFailed = Boolean(snapshotError) && !snapshot;

  const snapshotUsers = snapshot?.users;
  const users = useMemo(() => snapshotUsers ?? [], [snapshotUsers]);

  const tokenStats = useMemo(() => computeTokenStats(users), [users]);
  const roleBreakdown = useMemo(() => computeRoleBreakdown(users), [users]);
  const userTypeBreakdown = useMemo(() => computeUserTypeBreakdown(users), [users]);
  const countryBreakdown = useMemo(() => computeCountryBreakdown(users), [users]);
  const signupRecency = useMemo(() => computeSignupRecency(users), [users]);
  const passwordBreakdown = useMemo(() => computePasswordSetBreakdown(users), [users]);

  const totalUsers = totalCohort?.count ?? 0;
  const activeUsers = activeCohort?.count ?? 0;
  const inactiveUsers = inactiveCohort?.count ?? 0;
  const hasCohortData = Boolean(totalCohort) && Boolean(activeCohort) && Boolean(inactiveCohort);

  const reconciliation = useMemo(
    () => reconcileCohortCounts({ total: totalUsers, active: activeUsers, inactive: inactiveUsers }),
    [totalUsers, activeUsers, inactiveUsers]
  );

  const truncated = snapshot?.truncated ?? false;
  const scannedCount = snapshot?.scannedCount ?? 0;
  const snapshotTotalCount = snapshot?.totalCount ?? 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isInitialLoading && !hasBlockingError) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[#eeeefa]" aria-hidden="true" />
            <div className="absolute inset-0 rounded-full border-4 border-[#262782] border-t-transparent animate-spin" aria-hidden="true" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading summary…</p>
        </div>
      </div>
    );
  }

  // ── Blocking error ────────────────────────────────────────────────────────
  if (hasBlockingError) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-semibold">Failed to load summary data</p>
            <p className="text-gray-500 text-sm mt-1">One or more requests to the server failed. Please try again.</p>
          </div>
          <button
            onClick={handleRefreshAll}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
            style={{ background: PURPLE_GRADIENT }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (hasCohortData && totalUsers === 0) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-semibold">No users found</p>
            <p className="text-gray-500 text-sm mt-1">There are no users in the directory visible to this account yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-400">Settings / Summary</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Summary</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-2xl">
            These are the numbers for everyone in your user list — the same list the Manage User page shows.
            Scroll down to &ldquo;Do these numbers add up?&rdquo; to see exactly where each number comes from.
          </p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={isFetchingAny}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshIcon spinning={isFetchingAny} />
            Refresh
          </button>
          <p className="text-xs text-gray-400">Last updated {formatClockTime(snapshot?.fetchedAt)}</p>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Users"
          value={formatExactNumber(totalUsers)}
          sub="Everyone in your user list"
          gradient={PURPLE_GRADIENT}
          icon={<UsersIcon />}
        />
        <StatCard
          label="Active Users"
          value={formatExactNumber(activeUsers)}
          sub={`${formatPercent(safeDivide(activeUsers, totalUsers))} of total`}
          gradient="linear-gradient(135deg,#10b981,#059669)"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Inactive Users"
          value={formatExactNumber(inactiveUsers)}
          sub={`${formatPercent(safeDivide(inactiveUsers, totalUsers))} of total`}
          gradient="linear-gradient(135deg,#ef4444,#b91c1c)"
          icon={<CrossIcon />}
        />
        <StatCard
          label="Total Tokens Used"
          value={snapshotPending ? <InlineLoadingBar /> : formatExactNumber(tokenStats.total)}
          sub={
            snapshotPending
              ? 'Still counting…'
              : snapshotFailed
              ? 'Not available right now'
              : truncated
              ? `About ${formatCompactNumber(tokenStats.total)} · haven't counted everyone yet`
              : `About ${formatCompactNumber(tokenStats.total)}`
          }
          gradient="linear-gradient(135deg,#7071AB,#262782)"
          icon={<TokenIcon />}
          busy={snapshotPending}
        />
      </div>

      {/* ── Data consistency panel ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Do these numbers add up?</h2>
        <p className="text-sm text-gray-500 mb-4">
          These numbers come from the same user list that the Manage User page shows, for whoever is signed in.
          Active and Inactive should always add up to Total — here&apos;s that check.
        </p>

        <div className={`rounded-xl border p-4 ${reconciliation.invariantHolds ? 'border-emerald-200 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-mono text-gray-800 tabular-nums">
              {formatExactNumber(activeUsers)} (Active) + {formatExactNumber(inactiveUsers)} (Inactive) ={' '}
              {formatExactNumber(reconciliation.expectedTotal)}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                reconciliation.invariantHolds ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${reconciliation.invariantHolds ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
              {reconciliation.invariantHolds ? 'Numbers match' : "Numbers don't match"}
            </span>
          </div>
          {!reconciliation.invariantHolds && (
            <p className="text-xs text-amber-800 mt-2">
              Active plus Inactive comes to {formatExactNumber(reconciliation.expectedTotal)}, but Total Users
              shows {formatExactNumber(totalUsers)} — a difference of{' '}
              <span className="font-semibold">{Math.abs(reconciliation.delta)}</span>. Someone was probably added
              or removed while this page was loading. Press Refresh to check again.
            </p>
          )}
        </div>

        {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}

        <Link
          href="/dashboard/settings/manage-user"
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#262782] hover:underline"
        >
          Compare with the Manage User page
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Technical sourcing detail, preserved verbatim for QA/audit but
            tucked away — a non-technical reader never needs to open this. */}
        <details className="mt-5">
          <summary className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer select-none transition-colors">
            Technical details
          </summary>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li>
                <span className="font-semibold">Total Users</span> ← <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET users/?page=1</code> → <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">count</code>
              </li>
              <li>
                <span className="font-semibold">Active Users</span> ← <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET users/?is_active=true</code> → <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">count</code>
              </li>
              <li>
                <span className="font-semibold">Inactive Users</span> ← <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET users/?is_active=false</code> → <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">count</code>
              </li>
              <li>
                <span className="font-semibold">Total Tokens Used &amp; all breakdowns below</span> ← a paged scan
                of <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET users/</code> (ordered by token
                usage), summed/bucketed client-side.
              </li>
            </ul>

            <p className="text-sm text-gray-600">
              Manage User&apos;s Active filter issues this exact same request —{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET users/?is_active=true</code> — as the
              same signed-in actor, so it receives the same tenancy scope and the same{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">count</code>. The two pages agree by
              construction, not by coincidence, regardless of whether the actor is a superadmin or scoped to one
              organization.
            </p>
          </div>
        </details>
      </Card>

      {/* ── User Statistics Overview ───────────────────────────────────────── */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">User Statistics Overview</h2>
        <p className="text-gray-600 text-sm mb-5">
          {formatExactNumber(totalUsers)} people are in your user list, and {formatExactNumber(activeUsers)} of
          them ({formatPercent(safeDivide(activeUsers, totalUsers))}) are active right now. Below, we break that
          down further by role, account type, and country.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Active / Inactive split</h3>
            <BreakdownList
              entries={[
                { key: 'active', label: 'Active', count: activeUsers, percent: safeDivide(activeUsers, totalUsers) },
                { key: 'inactive', label: 'Inactive', count: inactiveUsers, percent: safeDivide(inactiveUsers, totalUsers) },
              ]}
              emptyLabel="No status data available."
            />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Role distribution</h3>
            {snapshotPending ? (
              <SnapshotPendingNote />
            ) : snapshotFailed ? (
              <SnapshotErrorNote onRetry={refetchSnapshot} />
            ) : (
              <>
                <BreakdownList entries={roleBreakdown} emptyLabel="No role data available." />
                {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}
              </>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Account type</h3>
            {snapshotPending ? (
              <SnapshotPendingNote />
            ) : snapshotFailed ? (
              <SnapshotErrorNote onRetry={refetchSnapshot} />
            ) : (
              <>
                <BreakdownList entries={userTypeBreakdown} emptyLabel="No account type data available." />
                {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}
              </>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Top countries</h3>
            {snapshotPending ? (
              <SnapshotPendingNote />
            ) : snapshotFailed ? (
              <SnapshotErrorNote onRetry={refetchSnapshot} />
            ) : (
              <>
                <BreakdownList entries={countryBreakdown} emptyLabel="No country data available." />
                {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Token usage ─────────────────────────────────────────────────────── */}
      <Card className="mb-6" busy={snapshotPending}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Token Usage</h2>
        <p className="text-sm text-gray-500 mb-5">
          How token usage is spread across your users, based on a detailed look through the user list, biggest
          users first.
        </p>

        {snapshotPending ? (
          <SnapshotPendingNote label="Working out token usage…" />
        ) : snapshotFailed ? (
          <SnapshotErrorNote onRetry={refetchSnapshot} />
        ) : (
          <>
            {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{formatExactNumber(tokenStats.total)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mean</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{formatExactNumber(tokenStats.mean)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Median</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{formatExactNumber(tokenStats.median)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Max</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{formatExactNumber(tokenStats.max)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Zero usage</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{formatExactNumber(tokenStats.zeroUsageCount)}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-3">Top consumers</h3>
            {tokenStats.topConsumers.length === 0 ? (
              <p className="text-sm text-gray-400">No usage data available.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#f8faff,#f4f7fe)' }}>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tokenStats.topConsumers.map((user, index) => (
                      <tr key={user.id || index} className="hover:bg-[#f8faff] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                              style={{ background: PURPLE_GRADIENT }}
                              aria-hidden="true"
                            >
                              {getInitials(user)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{displayName(user)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 truncate max-w-[200px]">{user.email || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.role || 'Unspecified'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true" />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900 tabular-nums">
                          {formatExactNumber(toTokenCount(user.customer_used_token))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Growth & Activation ─────────────────────────────────────────────── */}
      <Card busy={snapshotPending}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Growth &amp; Activation</h2>
        <p className="text-sm text-gray-500 mb-5">
          New signups and account-activation status, from the same detailed look through the user list.
        </p>

        {snapshotPending ? (
          <SnapshotPendingNote label="Working out signups and activation…" />
        ) : snapshotFailed ? (
          <SnapshotErrorNote onRetry={refetchSnapshot} />
        ) : (
          <>
            {truncated && <TruncationNote scannedCount={scannedCount} totalCount={snapshotTotalCount} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">New signups</h3>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{formatExactNumber(signupRecency.last7Days)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{formatExactNumber(signupRecency.last30Days)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{formatExactNumber(signupRecency.last90Days)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last 90 days</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-800 mb-3">Newest signups</h3>
                {signupRecency.newestUsers.length === 0 ? (
                  <p className="text-sm text-gray-400">No signup data available.</p>
                ) : (
                  <ul className="space-y-2">
                    {signupRecency.newestUsers.map((user, index) => (
                      <li key={user.id || index} className="flex items-center justify-between text-sm gap-3">
                        <span className="text-gray-700 truncate">{displayName(user)}</span>
                        <span className="text-gray-400 text-xs whitespace-nowrap tabular-nums">{formatDateTime(user.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Password / activation status</h3>
                <BreakdownList
                  entries={[
                    {
                      key: 'password_set',
                      label: 'Password set',
                      count: passwordBreakdown.passwordSet,
                      percent: safeDivide(passwordBreakdown.passwordSet, scannedCount),
                    },
                    {
                      key: 'pending_activation',
                      label: 'Pending activation',
                      count: passwordBreakdown.pendingActivation,
                      percent: safeDivide(passwordBreakdown.pendingActivation, scannedCount),
                    },
                  ]}
                  emptyLabel="No activation data available."
                />
                {passwordBreakdown.unknown > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {formatExactNumber(passwordBreakdown.unknown)} of the people we looked at don&apos;t have this
                    information, so they&apos;re left out above.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Summary;
