"use client";
import React, { useState, useEffect } from 'react';
import { 
  useGetUsersQuery, 
  // useUpdateUserMutation, 
  // useDeleteUserMutation,
  useToggleUserStatusMutation,
  // UpdateUserRequest,
} from '@/features/user/userApi';
// import { User } from '@/types/auth';

interface User {
  id: string;
  sub_id: string | null;
  activation_code: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string | null;
  country: string | null;
  role: string;
  customer_used_token: number;
  password_set: boolean;
  is_active: boolean;
  created_by: string | null;
  creator_name: string | null;
  created_by_details: string | null;
  is_admin: boolean;
  is_superadmin: boolean;
  can_create_users: boolean;
  can_manage_agent_access: boolean;
  can_manage_api_access: boolean;
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}


const UserManagementInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // const [editFormData, setEditFormData] = useState<UpdateUserRequest>({});

  // API hooks
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

  console.log("usersData", usersData);

  // const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  // const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: isToggling }] = useToggleUserStatusMutation();

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      refetch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, refetch]);

  // const handleEditUser = (user: User) => {
  //   setSelectedUser(user);
  //   setEditFormData({
  //     first_name: user.first_name,
  //     last_name: user.last_name,
  //     mobile: user.mobile,
  //     is_active: user.is_active
  //   });
  //   setIsEditModalOpen(true);
  // };

  // const handleDeleteUser = (user: User) => {
  //   setSelectedUser(user);
  //   setIsDeleteModalOpen(true);
  // };

  // const handleUpdateSubmit = async () => {
  //   if (!selectedUser?.id) return;
  //   try {
  //     await updateUser({ id: selectedUser.id, data: editFormData }).unwrap();
  //     setIsEditModalOpen(false);
  //     setSelectedUser(null);
  //     refetch();
  //   } catch (error) {
  //     console.error('Failed to update user:', error);
  //   }
  // };

  // const handleDeleteConfirm = async () => {
  //   if (!selectedUser?.id) return;
  //   try {
  //     await deleteUser(selectedUser.id).unwrap();
  //     setIsDeleteModalOpen(false);
  //     setSelectedUser(null);
  //     refetch();
  //   } catch (error) {
  //     console.error('Failed to delete user:', error);
  //   }
  // };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus({ id: userId, is_active: !currentStatus }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  // Type-safe data extraction
const usersDataTyped = usersData as unknown as UsersResponse;


const users = usersDataTyped?.results || [];
const totalCount = usersDataTyped?.count || 0;
const totalPages = Math.ceil(totalCount / 10);


  return (
    <div className="w-full min-h-screen min-h-full ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-[#424754] mt-2">
                Manage and monitor all system users ({totalCount} total users)
              </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 lg:min-w-[500px]">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 bg-white"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 bg-white min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4318ff]"></div>
              <span className="ml-3 text-[#424754]">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load users</h3>
                <button 
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-[#4318ff] text-white rounded-lg hover:bg-[#3610d9] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'No users available'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#f4f7fe] to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">Created</th>
                      {/* <th className="px-6 py-4 text-right text-xs font-semibold text-[#424754] uppercase tracking-wider">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user: User, index: number) => (
                      <tr key={user.sub_id || index} className="hover:bg-[#f4f7fe]/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4318ff] to-[#7c75ff] flex items-center justify-center text-white font-semibold">
                                                                          {(
                            user.first_name?.[0] ||
                            ((user as unknown) as { name?: string }).name?.[0] ||
                            'U'
                          ).toUpperCase()}


                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                                        {
                                  ((user as unknown) as { full_name?: string; name?: string }).full_name ||
                                  (user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : ((user as unknown) as { name?: string }).name || 'Unknown User')
                                }

                              </div>
                              <div className="text-sm text-gray-500">ID: {user.sub_id?.slice(-8) || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.mobile || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.country || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            'role' in user && user.role === 'Admin' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'role' in user && user.role === 'Manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'role' in user && user.role === 'Editor'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {'role' in user ? user.role : 'User'}
                          </span>

                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(user.id!, user.is_active)}
                            disabled={isToggling}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            // Edit and Delete buttons commented out
                          </div>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, totalCount)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{totalCount}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {/* Page numbers */}
                        {(() => {
                          const pageNumbers = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                          
                          // Adjust start if we're near the end
                          if (endPage - startPage < maxVisiblePages - 1) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pageNumbers.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === i
                                    ? 'z-10 bg-[#4318ff] border-[#4318ff] text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          return pageNumbers;
                        })()}


                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementInterface;