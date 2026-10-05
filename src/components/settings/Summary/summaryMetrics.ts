// src/components/settings/Summary/summaryMetrics.ts
//
// Pure, framework-free derivation functions for the Settings → Summary page
// (SA-047). No JSX, no hooks, no React imports — these are plain data
// transforms over `DirectoryUser[]` so they can be tested and reasoned about
// independently of rendering. Every function here is a derivation from data
// the caller already has; none of them invent a number.

import type { DirectoryUser } from '@/features/user/userApi';

// ─── Shared types ────────────────────────────────────────────────────────────

export interface TokenStats {
  total: number;
  mean: number;
  median: number;
  max: number;
  zeroUsageCount: number;
  topConsumers: DirectoryUser[];
}

export interface CountBreakdownEntry {
  key: string;
  label: string;
  count: number;
  percent: number;
}

export interface SignupRecency {
  last7Days: number;
  last30Days: number;
  last90Days: number;
  newestUsers: DirectoryUser[];
}

export interface PasswordSetBreakdown {
  passwordSet: number;
  pendingActivation: number;
  unknown: number;
}

export interface CohortCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface ReconciliationResult {
  invariantHolds: boolean;
  expectedTotal: number;
  delta: number;
}

// ─── Small helpers ───────────────────────────────────────────────────────────

/**
 * Coerces `customer_used_token` into a finite number. The shared `User` type
 * declares this field a `string`, the backend model stores it as an int, and
 * the snapshot endpoint passes rows through untouched — so this is the single
 * place that normalises it. Anything that doesn't parse becomes 0, never NaN.
 */
export const toTokenCount = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const humaniseKey = (key: string): string =>
  key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

/**
 * `super_admin` is the backend's alternate spelling of `superadmin` (see
 * backend model role choices). Both must land in the same bucket, or the
 * role breakdown would split one cohort into two for no real reason.
 */
export const humaniseRole = (role: string | undefined | null): string => {
  if (!role || !role.trim()) return 'Unspecified';
  const normalised = role.trim().toLowerCase();
  if (normalised === 'super_admin' || normalised === 'superadmin') return 'Super Admin';
  return humaniseKey(normalised) || 'Unspecified';
};

export const humaniseUserType = (userType: string | undefined | null): string => {
  if (!userType || !userType.trim()) return 'Unspecified';
  return humaniseKey(userType.trim().toLowerCase()) || 'Unspecified';
};

const safePercent = (count: number, denominator: number): number => {
  if (!denominator || !Number.isFinite(denominator) || denominator <= 0) return 0;
  const pct = (count / denominator) * 100;
  return Number.isFinite(pct) ? pct : 0;
};

const parseDate = (value: string | undefined | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ─── Token usage ─────────────────────────────────────────────────────────────

export const computeTokenStats = (users: DirectoryUser[]): TokenStats => {
  const tokenValues = users.map((u) => toTokenCount(u.customer_used_token));
  const count = tokenValues.length;
  const total = tokenValues.reduce((sum, v) => sum + v, 0);
  const mean = count > 0 ? total / count : 0;

  const sortedValues = [...tokenValues].sort((a, b) => a - b);
  let median = 0;
  if (count > 0) {
    const mid = Math.floor(count / 2);
    median = count % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid];
  }

  const max = count > 0 ? sortedValues[sortedValues.length - 1] : 0;
  const zeroUsageCount = tokenValues.filter((v) => v === 0).length;

  // Defensive sort: the snapshot is fetched ordered by `-customer_used_token`,
  // but this function must not assume the caller always honours that.
  const topConsumers = [...users]
    .sort((a, b) => toTokenCount(b.customer_used_token) - toTokenCount(a.customer_used_token))
    .slice(0, 10);

  return { total, mean, median, max, zeroUsageCount, topConsumers };
};

// ─── Generic categorical breakdown ───────────────────────────────────────────

/**
 * Buckets `users` by a humanised key, sorts descending by count, and — when
 * `topN` is given — folds everything past the top N into a single "Other"
 * bucket so a long-tail dimension like `country` stays readable.
 */
export const countBy = (
  users: DirectoryUser[],
  getRaw: (user: DirectoryUser) => string | undefined | null,
  humanise: (raw: string | undefined | null) => string,
  topN?: number
): CountBreakdownEntry[] => {
  const buckets = new Map<string, { label: string; count: number }>();

  for (const user of users) {
    const label = humanise(getRaw(user));
    const key = label.toLowerCase();
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { label, count: 1 });
    }
  }

  const total = users.length;
  const sorted = Array.from(buckets.entries())
    .map(([key, { label, count }]) => ({ key, label, count, percent: safePercent(count, total) }))
    .sort((a, b) => b.count - a.count);

  if (!topN || sorted.length <= topN) {
    return sorted;
  }

  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);
  const otherCount = tail.reduce((sum, entry) => sum + entry.count, 0);

  return [
    ...head,
    { key: 'other', label: 'Other', count: otherCount, percent: safePercent(otherCount, total) },
  ];
};

export const computeRoleBreakdown = (users: DirectoryUser[]): CountBreakdownEntry[] =>
  countBy(users, (u) => u.role, humaniseRole);

export const computeUserTypeBreakdown = (users: DirectoryUser[]): CountBreakdownEntry[] =>
  countBy(users, (u) => u.user_type, humaniseUserType);

export const computeCountryBreakdown = (users: DirectoryUser[]): CountBreakdownEntry[] =>
  countBy(
    users,
    (u) => u.country,
    (raw) => (raw && raw.trim() ? raw.trim() : 'Unspecified'),
    8
  );

// ─── Signup recency ──────────────────────────────────────────────────────────

export const computeSignupRecency = (users: DirectoryUser[], now: Date = new Date()): SignupRecency => {
  const nowMs = now.getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const withDates = users.reduce<{ user: DirectoryUser; date: Date }[]>((acc, user) => {
    const date = parseDate(user.created_at);
    if (date) acc.push({ user, date });
    return acc;
  }, []);

  const countWithin = (days: number) =>
    withDates.filter(
      (entry) => entry.date.getTime() <= nowMs && nowMs - entry.date.getTime() <= days * DAY_MS
    ).length;

  const newestUsers = [...withDates]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
    .map((entry) => entry.user);

  return {
    last7Days: countWithin(7),
    last30Days: countWithin(30),
    last90Days: countWithin(90),
    newestUsers,
  };
};

// ─── Activation status ───────────────────────────────────────────────────────

export const computePasswordSetBreakdown = (users: DirectoryUser[]): PasswordSetBreakdown => {
  let passwordSet = 0;
  let pendingActivation = 0;
  let unknown = 0;

  for (const user of users) {
    if (user.password_set === true) passwordSet += 1;
    else if (user.password_set === false) pendingActivation += 1;
    else unknown += 1;
  }

  return { passwordSet, pendingActivation, unknown };
};

// ─── Reconciliation ──────────────────────────────────────────────────────────

/**
 * Checks the invariant the ticket requires on screen: active + inactive must
 * equal total. All three inputs are independent authoritative `users/` counts
 * (same endpoint, same tenancy scope as Manage User), so a non-zero delta is
 * real signal — a user was created or deleted between the two requests — not
 * a computation bug in this function.
 */
export const reconcileCohortCounts = ({ total, active, inactive }: CohortCounts): ReconciliationResult => {
  const expectedTotal = active + inactive;
  return {
    invariantHolds: total === expectedTotal,
    expectedTotal,
    delta: total - expectedTotal,
  };
};

// ─── Formatting ───────────────────────────────────────────────────────────────

const exactNumberFormatter = new Intl.NumberFormat('en-US');
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Full, unabbreviated figure with thousands separators. This is the format
 * the headline token count must use — super admins need the exact number,
 * not "1.2M". Use `formatCompactNumber` only for secondary/supporting text.
 */
export const formatExactNumber = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return exactNumberFormatter.format(Math.round(value));
};

/** Abbreviated form (e.g. "1.2M") for secondary text only — never the headline figure. */
export const formatCompactNumber = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return compactNumberFormatter.format(value);
};

export const formatPercent = (value: number, fractionDigits = 1): string => {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(fractionDigits)}%`;
};
