"use client";

import React, { useState } from 'react';
import {
  Workspace,
  useGetWorkspacesQuery,
  useDeleteWorkspaceMutation,
} from '@/features/agentTemplateApi/agentTemplateApi';

// ─── Page size must match backend REST_FRAMEWORK PAGE_SIZE setting (20) ───────
// Bug fix: was hardcoded to 10, which made totalPages = ceil(26/10) = 3,
// causing page 3 to 404. Correct is ceil(26/20) = 2 pages.
const PAGE_SIZE = 20;

interface WorkspacesTableProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface DeleteModalState {
  isOpen: boolean;
  workspace: Workspace | null;
  /** If backend returns 400 "has members", we show force-delete option */
  showForceOption: boolean;
  errorMessage: string;
}

const WorkspacesTable: React.FC<WorkspacesTableProps> = ({
  isLoading: externalLoading,
  onRefresh,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    workspace: null,
    showForceOption: false,
    errorMessage: '',
  });
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    data: workspacesData,
    isLoading,
    refetch,
  } = useGetWorkspacesQuery({ page: currentPage });

  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();

  // ─── Pagination ────────────────────────────────────────────────────────────
  // Derive total pages from actual count + backend PAGE_SIZE.
  // Use next/previous as the source of truth for button enable/disable so we
  // never send a request for a page that the backend says doesn't exist.
  const totalCount = workspacesData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);
  const hasNext = Boolean(workspacesData?.next);
  const hasPrevious = Boolean(workspacesData?.previous);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const tableContainer = document.querySelector('.workspace-table-scroll-container');
    if (tableContainer) tableContainer.scrollTop = 0;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openDeleteModal = (workspace: Workspace) => {
    setDeleteModal({ isOpen: true, workspace, showForceOption: false, errorMessage: '' });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, workspace: null, showForceOption: false, errorMessage: '' });
  };

  const handleDelete = async (force = false) => {
    if (!deleteModal.workspace) return;

    try {
      await deleteWorkspace({ id: deleteModal.workspace.id, force }).unwrap();
      setSuccessMessage(`Workspace "${deleteModal.workspace.name}" deleted successfully.`);
      closeDeleteModal();
      // If we deleted the only item on this page, go back one page
      const remainingOnPage = (workspacesData?.results.length ?? 1) - 1;
      if (remainingOnPage === 0 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        refetch();
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: unknown) {
      // Backend returns 400 when workspace has members and force is not set
      const errorData = err as { data?: { error?: string; members_count?: number; hint?: string } };
      const msg = errorData?.data?.error ?? 'Failed to delete workspace.';
      const hasMembers = msg.toLowerCase().includes('member');
      setDeleteModal((prev) => ({
        ...prev,
        showForceOption: hasMembers,
        errorMessage: errorData?.data?.hint ?? msg,
      }));
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncateText = (text: string, maxLength: number) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + '...';

  const getWorkspaceIcon = () => (
    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex-shrink-0">
      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    </div>
  );

  // ─── Delete confirmation modal ─────────────────────────────────────────────
  const renderDeleteModal = () => {
    if (!deleteModal.isOpen || !deleteModal.workspace) return null;
    const { workspace, showForceOption, errorMessage } = deleteModal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeDeleteModal}
        />
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Workspace</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-800">&ldquo;{workspace.name}&rdquo;</span>?
            This action cannot be undone.
          </p>

          {/* Workspace details chip */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Domain:</span>
              <span className="truncate max-w-[200px]">{workspace.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Members:</span>
              <span className={workspace.members_count > 0 ? 'text-amber-600 font-semibold' : ''}>
                {workspace.members_count}
              </span>
            </div>
          </div>

          {/* Error / hint from backend */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {showForceOption ? (
              <>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={isDeleting}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Force Delete (remove all members)'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Mobile card ───────────────────────────────────────────────────────────
  const renderMobileCard = (workspace: Workspace) => (
    <div key={workspace.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0 mt-1">{getWorkspaceIcon()}</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{workspace.name}</h3>
          <a
            href={workspace.domain}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all"
          >
            {workspace.domain}
          </a>
        </div>
        {/* Delete button */}
        <button
          onClick={() => openDeleteModal(workspace)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete workspace"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Members</p>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">{workspace.members_count}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Workspace ID</p>
          <span className="text-xs text-gray-600 font-mono truncate block">
            {truncateText(workspace.id, 12)}
          </span>
        </div>
      </div>

      {/* Creator */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Created By</p>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-600">
              {workspace.created_by_details.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{workspace.created_by_details.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{workspace.created_by_details.email}</p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Created:</span>
          <span className="font-medium text-gray-700">{formatDate(workspace.created_at)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Updated:</span>
          <span className="font-medium text-gray-700">{formatDate(workspace.updated_at)}</span>
        </div>
      </div>
    </div>
  );

  // ─── Loading / empty states ────────────────────────────────────────────────
  if (isLoading || externalLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (!workspacesData || workspacesData.results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Workspaces Found</h3>
          <p className="text-gray-600">There are no workspaces available at the moment.</p>
        </div>
      </div>
    );
  }

  // ─── Pagination helpers ────────────────────────────────────────────────────
  const renderPageNumbers = () => {
    const maxVisible = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }

    return pages.map((pageNumber) => (
      <button
        key={pageNumber}
        onClick={() => handlePageChange(pageNumber)}
        className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
          currentPage === pageNumber
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
            : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95'
        }`}
      >
        {pageNumber}
      </button>
    ));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Delete modal */}
      {renderDeleteModal()}

      {/* Success toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center space-x-2 animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Mobile ── */}
      <div className="lg:hidden space-y-4">
        {workspacesData.results.map((workspace) => renderMobileCard(workspace))}

        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-gray-600 text-center font-medium">
                Page {currentPage} of {totalPages} • {startItem}–{endItem} of {totalCount}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    !hasPrevious
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-300 active:scale-95'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm border border-indigo-200">
                  {currentPage}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    !hasNext
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-300 active:scale-95'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block w-full mb-32">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-auto workspace-table-scroll-container"
            style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[280px]">
                    Workspace Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[250px]">
                    Domain
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Members
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                    Created By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                    Updated At
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {workspacesData.results.map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                    <td className="px-6 py-4 min-w-[280px]">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getWorkspaceIcon()}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                            {workspace.name}
                          </p>
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-gray-600 border border-gray-200">
                            {truncateText(workspace.id, 16)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <a
                        href={workspace.domain}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium break-all flex items-center space-x-1 group/link"
                      >
                        <span>{workspace.domain}</span>
                        <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap min-w-[120px]">
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-sm font-bold text-indigo-700">{workspace.members_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">
                            {workspace.created_by_details.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate" title={workspace.created_by_details.full_name}>
                            {workspace.created_by_details.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={workspace.created_by_details.email}>
                            {workspace.created_by_details.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                      <div className="text-sm text-gray-900 font-medium">{formatDate(workspace.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                      <div className="text-sm text-gray-900 font-medium">{formatDate(workspace.updated_at)}</div>
                    </td>
                    {/* Delete action */}
                    <td className="px-6 py-4 text-center whitespace-nowrap min-w-[80px]">
                      <button
                        onClick={() => openDeleteModal(workspace)}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Delete workspace"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 font-medium">
                  Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
                  <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalCount}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevious}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      !hasPrevious
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95 shadow-sm'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center space-x-1">{renderPageNumbers()}</div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      !hasNext
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95 shadow-sm'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WorkspacesTable;