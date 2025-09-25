import React, { useState } from 'react';
import { useGetUsersQuery } from '@/features/user/userApi';

const Summary: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch 
  } = useGetUsersQuery({
    page: currentPage,
    limit: 10,
    email: searchTerm || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  });

  // Calculate statistics
  const activeUsers = usersData?.results?.filter(user => user.is_active).length || 0;
    const totalTokens =
    usersData?.results?.reduce(
        (sum, user) => sum + Number(user.customer_used_token ?? 0),
        0
    ) || 0;
  const totalUsers = usersData?.count || 0;

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Error</h2>
          <p className="text-gray-600">Failed to load summary data. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-lg font-medium text-gray-400 mb-2">Settings</h1>
      <h2 className="text-4xl font-bold text-gray-900 mb-6">Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[var(--color-primary-purple)]/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary-purple)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
              <p className="text-3xl font-bold text-[var(--color-primary-purple)]">{activeUsers}</p>
              <p className="text-sm text-gray-600">Out of {totalUsers} total users</p>
            </div>
          </div>
        </div>

        {/* Total Tokens Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[var(--color-primary-purple)]/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary-purple)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-2h-1v-3c0-1.1-.9-2-2-2h-3V8c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v3H3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1zm-1 2H5v-1h14v1z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Tokens Used</h3>
              <p className="text-3xl font-bold text-[var(--color-primary-purple)]">{totalTokens}</p>
              <p className="text-sm text-gray-600">Across all users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics Overview</h3>
        <p className="text-gray-600">
          This summary provides an overview of user activity on the Graaho AI Agent platform.
          The data reflects the current state of all registered users, including their activity status
          and token usage. Use the &quot;Manage User&quot; section to view detailed user information.
        </p>

      </div>
    </div>
  );
};

export default Summary;