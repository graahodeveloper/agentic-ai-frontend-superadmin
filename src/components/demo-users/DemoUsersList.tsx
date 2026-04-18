"use client";
import React, { useState, useCallback } from 'react';
import {
  useGetDemoUsersQuery,
  useGetDemoUsersStatsQuery,
  useUpdateDemoUserMutation,
  useMarkAsEngagedMutation,
  useAddAdminNoteMutation,
  useDeleteDemoUserMutation,
  DemoUser,
} from '@/features/demoUsers/demoUsersApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (user: DemoUser) => {
  const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (user.email?.[0] || 'U').toUpperCase();
};

const getAvatarGradient = (index: number) => {
  const gradients = [
    'linear-gradient(135deg,#262782,#7071AB)',
    'linear-gradient(135deg,#FF845D,#e86d48)',
    'linear-gradient(135deg,#7071AB,#262782)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
  ];
  return gradients[index % gradients.length];
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'new':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'engaged':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'converted':
      return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' };
    case 'inactive':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' };
  }
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  user,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  user: DemoUser;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-600 w-full" />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Guest User</h3>
              <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-gray-900">
              {user.full_name || user.email}
            </span>
            ? All their demo sessions and data will be removed.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Deleting…
                </>
              ) : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

function NoteModal({
  user,
  isAdding,
  onConfirm,
  onCancel,
}: {
  user: DemoUser;
  isAdding: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        <div className="h-1 bg-gradient-to-r from-[#262782] to-[#7071AB] w-full" />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Note</h3>
              <p className="text-sm text-gray-500 mt-0.5">For {user.full_name || user.email}</p>
            </div>
          </div>

          {user.admin_notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
              <p className="font-semibold text-gray-500 mb-1">Previous Notes:</p>
              {user.admin_notes}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note here..."
            className="w-full h-24 p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#262782]/30 focus:border-[#262782] resize-none"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(note)}
              disabled={isAdding || !note.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#262782,#7071AB)' }}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Adding…
                </>
              ) : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  gradient,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  sub?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white flex-1 min-w-[140px]"
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1 leading-none">{value}</p>
          {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DemoUsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'engaged' | 'converted' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalUser, setDeleteModalUser] = useState<DemoUser | null>(null);
  const [noteModalUser, setNoteModalUser] = useState<DemoUser | null>(null);

  // Debounce search input
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  // API hooks
  const { data, isLoading, error, refetch, isFetching } = useGetDemoUsersQuery({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    ordering: '-created_at',
  });

  const { data: stats } = useGetDemoUsersStatsQuery();

  const [updateUser, { isLoading: isUpdating }] = useUpdateDemoUserMutation();
  const [markAsEngaged, { isLoading: isMarking }] = useMarkAsEngagedMutation();
  const [addAdminNote, { isLoading: isAddingNote }] = useAddAdminNoteMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteDemoUserMutation();

  const users = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const handleMarkEngaged = useCallback(async (userId: string) => {
    try {
      await markAsEngaged(userId).unwrap();
    } catch (err) {
      console.error('Failed to mark user as engaged:', err);
    }
  }, [markAsEngaged]);

  const handleStatusChange = useCallback(async (userId: string, newStatus: 'new' | 'engaged' | 'converted' | 'inactive') => {
    try {
      await updateUser({ id: userId, status: newStatus }).unwrap();
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  }, [updateUser]);

  const handleAddNote = useCallback(async (note: string) => {
    if (!noteModalUser) return;
    try {
      await addAdminNote({ id: noteModalUser.id, note }).unwrap();
      setNoteModalUser(null);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, [addAdminNote, noteModalUser]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModalUser) return;
    try {
      await deleteUser(deleteModalUser.id).unwrap();
      setDeleteModalUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  }, [deleteUser, deleteModalUser]);

  // ── Pagination helper ─────────────────────────────────────────────────────
  const getPaginationNumbers = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('…');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg,#262782,#7071AB)' }}
            >
              Demo &amp; Guest Users
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage demo registrations and trial accounts · {stats?.total || totalCount} total
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats?.total ?? totalCount}
            gradient="linear-gradient(135deg,#262782,#7071AB)"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="New"
            value={stats?.by_status?.new ?? 0}
            gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          />
          <StatCard
            label="Engaged"
            value={stats?.by_status?.engaged ?? 0}
            gradient="linear-gradient(135deg,#10b981,#059669)"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Converted"
            value={stats?.by_status?.converted ?? 0}
            gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)"
            sub={`${stats?.conversion_rate ?? 0}% rate`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <StatCard
            label="Last 7 Days"
            value={stats?.recent_7_days ?? 0}
            gradient="linear-gradient(135deg,#FF845D,#e86d48)"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, email, or company…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#262782]/30 focus:border-[#262782] bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#262782]/30 focus:border-[#262782] bg-white transition-all min-w-[140px] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="engaged">Engaged</option>
            <option value="converted">Converted</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[#eeeefa]" />
              <div className="absolute inset-0 rounded-full border-4 border-[#262782] border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Loading users…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">Failed to load users</p>
              <p className="text-gray-500 text-sm mt-1">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#262782,#7071AB)' }}
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">No users found</p>
              <p className="text-gray-500 text-sm mt-1">
                {debouncedSearch || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No demo or guest users exist yet'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#f8faff,#f4f7fe)' }}>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user: DemoUser, index: number) => {
                    const statusColors = getStatusColor(user.status);
                    return (
                      <tr
                        key={user.id || index}
                        className="hover:bg-[#f8faff] transition-colors group"
                      >
                        {/* User */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                              style={{ background: getAvatarGradient(index) }}
                            >
                              {getInitials(user)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
                                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                              </p>
                              {user.job_title && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">
                                  {user.job_title}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-800 truncate max-w-[180px]">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{user.phone || '—'}</p>
                        </td>

                        {/* Company */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700 truncate max-w-[120px]">{user.company_name || '—'}</p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <select
                            value={user.status || 'new'}
                            onChange={(e) => handleStatusChange(user.id, e.target.value as 'new' | 'engaged' | 'converted' | 'inactive')}
                            disabled={isUpdating}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                          >
                            <option value="new">New</option>
                            <option value="engaged">Engaged</option>
                            <option value="converted">Converted</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>

                        {/* Sessions */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">{user.demo_sessions_count ?? 0}</span>
                            <span className="text-xs text-gray-400">visits</span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600">{formatDate(user.last_activity_at || user.demo_accessed_at)}</p>
                        </td>

                        {/* Registered */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600">{formatDateTime(user.created_at)}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Mark as engaged (only for new users) */}
                            {user.status === 'new' && (
                              <button
                                onClick={() => handleMarkEngaged(user.id)}
                                disabled={isMarking}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Mark as Engaged"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}

                            {/* Add note */}
                            <button
                              onClick={() => setNoteModalUser(user)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Add Note"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteModalUser(user)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                <p className="text-xs text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">{(currentPage - 1) * 10 + 1}</span>
                  –
                  <span className="font-semibold text-gray-700">{Math.min(currentPage * 10, totalCount)}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-700">{totalCount}</span>
                  {' '}users
                </p>

                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-white hover:border-[#262782] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {getPaginationNumbers().map((pg, i) =>
                    pg === '…' ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg as number)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium border transition-all ${
                          currentPage === pg
                            ? 'text-white border-[#262782]'
                            : 'border-gray-200 text-gray-600 hover:bg-white hover:border-[#262782]'
                        }`}
                        style={currentPage === pg ? { background: 'linear-gradient(135deg,#262782,#7071AB)' } : {}}
                      >
                        {pg}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-white hover:border-[#262782] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      {deleteModalUser && (
        <DeleteModal
          user={deleteModalUser}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalUser(null)}
        />
      )}

      {/* ── Note Modal ────────────────────────────────────────────────────────── */}
      {noteModalUser && (
        <NoteModal
          user={noteModalUser}
          isAdding={isAddingNote}
          onConfirm={handleAddNote}
          onCancel={() => setNoteModalUser(null)}
        />
      )}
    </div>
  );
};

export default DemoUsersList;
