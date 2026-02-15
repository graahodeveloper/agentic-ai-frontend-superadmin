// app/super-admin/dashboard/page.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetAgentTemplatesByAdminIdQuery,
  AgentTemplate,
} from '@/features/agentTemplateApi/agentTemplateApi';
import Image from 'next/image';
import AgentTemplatesTable from '@/components/SuperAdminAgentManagement/AgentTemplatesTable';
import WorkspacesTable from '@/components/SuperAdminAgentManagement/WorkspacesTable';
import SuperAdminCreateAgentTemplateDrawer from '@/components/SuperAdminAgentManagement/SuperAdminCreateAgentTemplateDrawer';
import { User } from '@/types/auth';
import UserManagementInterface from '@/components/settings/manage-user/ManageUser';
import Summary from '@/components/settings/Summary/Summary';
import PlansManagement from '@/components/subscription-model/plan/PlansManagement';
import PlanComponentsManagement from '@/components/subscription-model/plan/PlanComponentsManagement';
import AgentPricingManagement from '@/components/subscription-model/plan/AgentPricingManagement';
import PlanComponentInclusionManagement from '@/components/subscription-model/plan/PlanComponentInclusionManagement';
import PlanAgentInclusionManagement from '@/components/subscription-model/plan/PlanAgentInclusionManagement';
import PlanSummary from '@/components/subscription-model/plan/PlanSummary';
import AgentComponentPricingManagement from '@/components/subscription-model/plan/AgentComponentPricingManagement';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Agent Templates');
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subscriptionDropdownOpen, setSubscriptionDropdownOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(true);
  const [isCreateTemplateDrawerOpen, setIsCreateTemplateDrawerOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<AgentTemplate | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subscriptionDropdownRef = useRef<HTMLDivElement>(null);
  const showingErrorMessage = 'Something went wrong,\nplease try again later.';
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const adminUser = localStorage.getItem('superAdminUser');
        const isAdminLoggedIn = localStorage.getItem('isSuperAdminLoggedIn') === 'true';
        if (adminUser && isAdminLoggedIn) {
          let adminData;
          try {
            adminData = JSON.parse(adminUser);
            if (!adminData || !adminData.email || !adminData.id) {
              throw new Error('Invalid admin user data in localStorage');
            }
          } catch (parseError) {
            router.replace('/auth');
            return;
          }
          setIsAdminUser(true);
          setActiveTab('Agent Templates');
          setAdminId(adminData.id);
          setUserData({
            id: adminData.id,
            sub_id: null,
            email: adminData.email,
            first_name: adminData.first_name || adminData.full_name?.split(' ')[0] || 'Admin',
            last_name: adminData.last_name || adminData.full_name?.split(' ')[1] || 'User',
            name: adminData.full_name || `${adminData.first_name || 'Admin'} ${adminData.last_name || 'User'}`,
            full_name: adminData.full_name || `${adminData.first_name || 'Admin'} ${adminData.last_name || 'User'}`,
            is_active: adminData.is_active ?? true,
            role: adminData.role || 'super_admin',
          });
        } else {
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        router.replace('/auth');
      }
    };
    initializeAuth();
  }, [router]);

  const {
    data: agentTemplatesData,
    isLoading: isAgentTemplatesLoading,
    refetch: refetchAgentTemplates,
  } = useGetAgentTemplatesByAdminIdQuery(adminId!, {
    skip: !adminId || !isAdminUser,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (subscriptionDropdownRef.current && !subscriptionDropdownRef.current.contains(event.target as Node)) {
        setSubscriptionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab === 'Agent Templates') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  const handleAgentCreated = () => {
    refetchAgentTemplates();
    setEditTemplate(null);
    setCurrentPage(1);
  };

  const handleEditTemplate = (template: AgentTemplate) => {
    setEditTemplate(template);
    setIsCreateTemplateDrawerOpen(true);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('superAdminUser');
      localStorage.removeItem('isSuperAdminLoggedIn');
      router.replace('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('superAdminUser');
      localStorage.removeItem('isSuperAdminLoggedIn');
      router.replace('/auth');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const navigationItems = [
    {
      name: 'Agent Templates',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H12.3C12.1 6.6 12 7.3 12 8V10H9C8.4 10 8 10.4 8 11V20H16V11C16 10.4 15.6 10 15 10H14V8C14 7.3 13.9 6.6 13.7 6H15C16.1 6 17 6.9 17 8V10M9.5 12C10.3 12 11 12.7 11 13.5C11 14.3 10.3 15 9.5 15C8.7 15 8 14.3 8 13.5C8 12.7 8.7 12 9.5 12M14.5 12C15.3 12 16 12.7 16 13.5C16 14.3 15.3 15 14.5 15C13.7 15 13 14.3 13 13.5C13 12.7 13.7 12 14.5 12M10 17H14C14 18.1 13.1 19 12 19C10.9 19 10 18.1 10 17Z"/>
        </svg>
      ),
      hasSubmenu: false,
    },
    {
      name: 'Workspaces',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      ),
      hasSubmenu: false,
    },
    {
      name: 'Subscription Model',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4M20 18H4V12H20V18M20 8H4V6H20V8M14 14V16H18V14H14Z"/>
        </svg>
      ),
      hasSubmenu: true,
    },
  ];

  const renderContent = () => {
    if (userData?.role === 'super_admin' && isAdminUser) {
      switch (activeTab) {
        case 'Agent Templates':
          return (
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agent Templates</h1>
                  <p className="text-sm text-gray-500 mt-2">Manage and create agent templates for the platform</p>
                  {agentTemplatesData && (
                    <p className="text-xs text-gray-400 mt-1">
                      Total templates: {agentTemplatesData.count} • {agentTemplatesData.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditTemplate(null);
                    setIsCreateTemplateDrawerOpen(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Template</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 mb-32">
                <AgentTemplatesTable
                  templates={agentTemplatesData?.results || []}
                  isLoading={isAgentTemplatesLoading}
                  onRefresh={refetchAgentTemplates}
                  onEditTemplate={handleEditTemplate}
                />
              </div>
            </div>
          );
        case 'Workspaces':
          return (
            <div className="p-8 h-full flex flex-col">
              <div className="mb-8 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
                <p className="text-sm text-gray-500 mt-2">View and manage all workspaces on the platform</p>
              </div>
              <div className="flex-1 min-h-0 mb-62">
                <WorkspacesTable />
              </div>
            </div>
          );
        case 'Subscription Model - Plans':
          return (
            <div className="h-full">
              <PlansManagement />
            </div>
          );
        case 'Subscription Model - Components':
          return (
            <div className="h-full">
              <PlanComponentsManagement />
            </div>
          );
        case 'Subscription Model - Agent Pricing':
          return (
            <div className="h-full">
              <AgentPricingManagement />
            </div>
          );
        case 'Subscription Model - Link Components':
          return (
            <div className="h-full">
              <PlanComponentInclusionManagement />
            </div>
          );
        case 'Subscription Model - Link Agents':
          return (
            <div className="h-full">
              <PlanAgentInclusionManagement />
            </div>
          );
        case 'Subscription Model - Plan Summary':
          return (
            <div className="h-full">
              <PlanSummary />
            </div>
          );
        case 'Subscription Model - Agent Component Pricing':
          return (
            <div className="h-full">
              <AgentComponentPricingManagement />
            </div>
          );
        case 'Settings - Manage User':
          return (
            <div className="h-full">
              <UserManagementInterface />
            </div>
          );
        case 'Settings - Summary':
          return (
            <div className="h-full">
              <Summary />
            </div>
          );
        default:
          return (
            <div className="p-8 h-full">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My AI Agents</h1>
              <p className="text-sm text-gray-500 mt-2">No agents available for this role.</p>
            </div>
          );
      }
    }
    return (
      <div className="p-8 h-full">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My AI Agents</h1>
        <p className="text-sm text-gray-500 mt-2">No agents available for this role.</p>
      </div>
    );
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Information!</h2>
          <p className="text-gray-600">{showingErrorMessage}</p>
          <button
            onClick={() => router.replace('/auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-75 bg-[linear-gradient(90deg,_#fff_-11.17%,_#c9c7ea_100%)] pl-3 pr-3 pt-6 pb-8 flex-shrink-0">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Image
              src="/graaho_logo.png"
              alt="Graaho Logo"
              width={180}
              height={60}
              className="object-cover"
              priority={false}
            />
          </div>
          <div className="flex items-center space-x-3 mb-8 p-3 bg-white/50 rounded-lg">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              <Image
                src="/man_place_holder.png"
                alt="Avatar"
                width={40}
                height={40}
                className="object-cover"
                priority={false}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {userData.first_name && userData.last_name
                  ? `${userData.first_name} ${userData.last_name}`
                  : userData.name || 'User'}
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                  Super Admin
                </span>
              </div>
              <div className="text-xs text-gray-600">{userData.email || 'user@graaho.ai'}</div>
            </div>
          </div>
          <nav className="space-y-2 mb-6">
            {navigationItems.map((item) => {
              if (item.hasSubmenu && item.name === 'Subscription Model') {
                return (
                  <div key="Subscription Model" className="relative" ref={subscriptionDropdownRef}>
                    <button
                      onClick={() => setSubscriptionDropdownOpen(!subscriptionDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left cursor-pointer transition-all duration-300 group ${
                        activeTab.startsWith('Subscription Model')
                          ? 'bg-white text-[var(--color-primary-purple)] font-black shadow-md'
                          : 'text-gray-700 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span className="font-medium">Subscription Model</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${subscriptionDropdownOpen ? 'rotate-180' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 z-50 ${
                        subscriptionDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Plans');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Plans</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Components');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Components</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Agent Pricing');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Agent Pricing</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Link Components');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Link Components</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Link Agents');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Link Agents</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Agent Component Pricing');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Agent Component Pricing</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('Subscription Model - Plan Summary');
                          setSubscriptionDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"/>
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Plan Summary</span>
                      </button>
                    </div>
                  </div>
                );
              }
              
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer transition-colors ${
                    activeTab === item.name
                      ? 'bg-white text-[var(--color-primary-purple)] font-black shadow-md'
                      : 'text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left cursor-pointer transition-all duration-300 group ${
                  activeTab.startsWith('Settings')
                    ? 'bg-white text-[var(--color-primary-purple)] font-black shadow-md'
                    : 'text-gray-700 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 8L17 7V9C17 10.1 17.9 11 19 11S21 10.1 21 9ZM20.5 13C20.5 13.8 19.8 14.5 19 14.5S17.5 13.8 17.5 13S18.2 11.5 19 11.5S20.5 12.2 20.5 13ZM14 13.5V15.5C14 16.3 13.3 17 12.5 17S11 16.3 11 15.5V13.5C11 12.7 11.7 12 12.5 12S14 12.7 14 13.5ZM7 7V9C7 10.1 6.1 11 5 11S3 10.1 3 9V7L5 8L7 7ZM6.5 13C6.5 12.2 5.8 11.5 5 11.5S3.5 12.2 3.5 13S4.2 14.5 5 14.5S6.5 13.8 6.5 13ZM12 6.5C10.6 7 9.2 8.1 8.2 9.4C7.2 10.7 6.5 12.2 6.2 13.8C5.9 15.4 6 17 6.5 18.5C7 20 8 21.3 9.2 22.2C10.4 23.1 11.7 23.6 13 23.8V22C11.8 21.8 10.7 21.3 9.8 20.5C8.9 19.7 8.2 18.6 7.8 17.4C7.4 16.2 7.3 14.9 7.5 13.7C7.7 12.5 8.2 11.4 9 10.5C9.8 9.6 10.8 8.9 12 8.5V6.5Z"/>
                  </svg>
                  <span className="font-medium">Settings</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div
                className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 z-50 ${
                  dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveTab('Settings - Manage User');
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                >
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">Manage User</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('Settings - Summary');
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                >
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">Summary</span>
                </button>
              </div>
            </div>
          </nav>
          <div className="border-t border-gray-200 pt-4 mb-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer transition-colors hover:bg-white/60"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderContent()}
          </div>
        </div>

        <SuperAdminCreateAgentTemplateDrawer
          isOpen={isCreateTemplateDrawerOpen}
          onClose={() => {
            setIsCreateTemplateDrawerOpen(false);
            setEditTemplate(null);
          }}
          onAgentCreated={handleAgentCreated}
          currentUser={userData}
          isEditMode={!!editTemplate}
          editTemplate={editTemplate}
        />

        <footer className="fixed bottom-0 left-75 right-0 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200/60 backdrop-blur-sm z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end space-y-1">
                  <p className="text-xs font-medium text-slate-700">© 2025 Graaho Technologies</p>
                </div>
              </div>
            </div>
            <div className="lg:hidden mt-4 pt-4 border-t border-slate-200/60">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 px-2.5 py-1 bg-green-50/80 border border-green-200/50 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Operational</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">v2.1.0</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>© 2025 Graaho Technologies</span>
                  <span>All rights reserved</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent"></div>
          </div>
        </footer>
      </div>
    );
  }
  return null;
};

export default Dashboard;