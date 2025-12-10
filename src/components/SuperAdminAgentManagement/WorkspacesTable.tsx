import React, { useState, useMemo } from 'react';
import { Workspace, useGetWorkspacesQuery } from '@/features/agentTemplateApi/agentTemplateApi';

interface WorkspacesTableProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const WorkspacesTable: React.FC<WorkspacesTableProps> = ({
  isLoading: externalLoading,
  onRefresh,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    data: workspacesData, 
    isLoading, 
    refetch 
  } = useGetWorkspacesQuery({ page: currentPage });

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    const tableContainer = document.querySelector('.workspace-table-scroll-container');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  };

  const getWorkspaceIcon = () => (
    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex-shrink-0">
      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
      </svg>
    </div>
  );

  // Calculate pagination details
  const totalPages = workspacesData ? Math.ceil(workspacesData.count / 10) : 0;
  const startItem = workspacesData ? (currentPage - 1) * 10 + 1 : 0;
  const endItem = workspacesData ? Math.min(currentPage * 10, workspacesData.count) : 0;
  const totalCount = workspacesData?.count || 0;

  // Render Mobile Card View
  const renderMobileCard = (workspace: Workspace) => (
    <div key={workspace.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0 mt-1">
          {getWorkspaceIcon()}
        </div>
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
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Members</p>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
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

      {/* Creator Info */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Created By</p>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-600">
              {workspace.created_by_details.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {workspace.created_by_details.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {workspace.created_by_details.email}
            </p>
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

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Workspaces Found</h3>
          <p className="text-gray-600">There are no workspaces available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="lg:hidden space-y-4">
        {workspacesData.results.map(workspace => renderMobileCard(workspace))}
        
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-gray-600 text-center font-medium">
                Page {currentPage} of {totalPages} • {startItem}-{endItem} of {totalCount}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === 1
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
                  disabled={currentPage === totalPages}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === totalPages
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

      {/* Desktop View (Table) - UPDATED: Proper scroll containment like AgentTemplatesTable */}
      <div className="hidden lg:block w-full mb-32">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Table Header with Refresh */}
          {/* <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Workspaces</h2>
                <p className="text-xs text-gray-500 mt-1">Total: {totalCount} workspaces</p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors duration-200 shadow-sm border border-gray-200 hover:border-indigo-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div> */}

          {/* Table Container with Proper Scroll - UPDATED: Same as AgentTemplatesTable */}
          <div 
            className="flex-1 overflow-auto workspace-table-scroll-container"
            style={{ 
              maxHeight: 'calc(100vh - 350px)',
              minHeight: '500px',
            }}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {workspacesData.results.map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                    <td className="px-6 py-4 min-w-[280px]">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getWorkspaceIcon()}
                        </div>
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
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
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
                      <div className="text-sm text-gray-900 font-medium">
                        {formatDate(workspace.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatDate(workspace.updated_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
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
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95 shadow-sm'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
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
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === totalPages
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