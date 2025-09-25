'use client';
import React, { useState } from 'react';
import { useGetAdminCreatedUsersQuery } from '@/features/user/userApi';
import { AgentAccess, User } from '@/types/auth';
import CreateUserDrawer from './CreateUserDrawer';
import AssignAgentsModal from './AssignAgentsModal';

interface AdminUserManagementProps {
  currentUser: User | null;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ currentUser }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAssignAgentsModalOpen, setIsAssignAgentsModalOpen] = useState(false);
  const [selectedUserForAgentAssignment, setSelectedUserForAgentAssignment] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch admin created users
  const { 
    data: adminUsersData, 
    error: adminUsersError, 
    isLoading: isLoadingAdminUsers,
    refetch: refetchAdminUsers
  } = useGetAdminCreatedUsersQuery({ 
    page, 
    limit, 
    adminSubId: currentUser?.sub_id || '' 
  }, {
    skip: !currentUser?.sub_id, // Don't run query if no admin sub_id
  });


  const handleAssignAgents = (user: User) => {
    setSelectedUserForAgentAssignment(user);
    setIsAssignAgentsModalOpen(true);
  };

  const closeAssignAgentsModal = () => {
    setIsAssignAgentsModalOpen(false);
    setSelectedUserForAgentAssignment(null);
  };

  // Handle successful agent access change
  const handleAccessGranted = () => {
    console.log('Agent access granted - refreshing user data...');
    refetchAdminUsers();
  };

  const renderUserList = () => {
    if (isLoadingAdminUsers) {
      return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users Created by Admin</h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-500">Loading users...</span>
          </div>
        </div>
      );
    }

    if (adminUsersError) {
      return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users Created by Admin</h2>
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">Error loading users</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later</p>
            <button 
              onClick={() => refetchAdminUsers()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }



    const users = adminUsersData?.results || [];
    const totalUsers = adminUsersData?.count || 0;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Users Created by Admin</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalUsers} user{totalUsers !== 1 ? 's' : ''} created
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Page {page}</span>
              </div>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users created yet</h3>
              <p className="text-gray-500 mb-4">Create your first user to get started</p>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First User
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Access</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900">{user.country || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {user.agent_access_count || 0} agents
                            </span>
                            {user.agent_access && user.agent_access.length > 0 && (
                              <div className="flex -space-x-1">
                                {user.agent_access.slice(0, 3).map((access: AgentAccess, index: number) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 border-2 border-white rounded-full text-xs font-medium text-gray-600"
                                    title={`${access.agent_details?.name} - ${access.access_type}`}
                                  >
                                    {access.access_type?.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {user.agent_access.length > 3 && (
                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 border-2 border-white rounded-full text-xs font-medium text-gray-500">
                                    +{user.agent_access.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleAssignAgents(user)}
                              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 border border-indigo-200"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Assign Agents
                            </button>
                            {/* <button className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors">
                              Edit
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalUsers > limit && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {page} of {Math.ceil(totalUsers / limit)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(totalUsers / limit)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 h-full bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Users</h1>
          <p className="text-sm text-gray-500 mt-2">
            Admin panel for user creation and management
            {adminUsersData?.admin_info && (
              <span className="ml-2 text-indigo-600">
                • Logged in as {adminUsersData.admin_info.full_name}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create User</span>
        </button>
      </div>

      {/* User List */}
      {renderUserList()}

      {/* Create User Drawer */}
      <CreateUserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUserCreated={(newUserData) => {
          // Refetch the admin created users list
          refetchAdminUsers();
          setIsDrawerOpen(false);
        }}
        isCreatingUser={false}
        currentUser={currentUser} // Pass currentUser prop
      />

      {/* Assign Agents Modal */}
      {selectedUserForAgentAssignment && (
        <AssignAgentsModal
          isOpen={isAssignAgentsModalOpen}
          onClose={closeAssignAgentsModal}
          selectedUser={selectedUserForAgentAssignment}
          currentUser={currentUser}
          onAccessGranted={handleAccessGranted} // Add the callback
        />
      )}
    </div>
  );
};

export default AdminUserManagement;