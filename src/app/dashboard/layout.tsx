'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/types/auth';
import SuperAdminCreateAgentTemplateDrawer from '@/components/SuperAdminAgentManagement/SuperAdminCreateAgentTemplateDrawer';
import { AgentTemplate } from '@/features/agentTemplateApi/agentTemplateApi';

// ─── All routes use /dashboard (no /super-admin prefix) ──────────────────────
const BASE = '/dashboard';

const NAV_ROUTES = {
  agentTemplates: `${BASE}/agent-templates`,
  workspaces: `${BASE}/workspaces`,
  subscription: {
    plans: `${BASE}/subscription/plans`,
    components: `${BASE}/subscription/components`,
    agentPricing: `${BASE}/subscription/agent-pricing`,
    linkComponents: `${BASE}/subscription/link-components`,
    linkAgents: `${BASE}/subscription/link-agents`,
    planSummary: `${BASE}/subscription/plan-summary`,
    agentComponentPricing: `${BASE}/subscription/agent-component-pricing`,
  },
  cmsSettings: {
    loginPage: `${BASE}/cms-settings/login-page`,
  },
  settings: {
    manageUser: `${BASE}/settings/manage-user`,
    summary: `${BASE}/settings/summary`,
  },
} as const;

// ─── Context so child pages can open the Create Template drawer ───────────────
export const DashboardContext = React.createContext<{
  openCreateTemplateDrawer: () => void;
  setEditTemplate: (t: AgentTemplate | null) => void;
}>({
  openCreateTemplateDrawer: () => {},
  setEditTemplate: () => {},
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [userData, setUserData] = useState<User | null>(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [cmsSettingsOpen, setCmsSettingsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCreateTemplateDrawerOpen, setIsCreateTemplateDrawerOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<AgentTemplate | null>(null);

  const subscriptionRef = useRef<HTMLDivElement>(null);
  const cmsSettingsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('superAdminUser');
      const loggedIn = localStorage.getItem('isSuperAdminLoggedIn') === 'true';
      if (!raw || !loggedIn) { router.replace('/auth'); return; }

      const adminData = JSON.parse(raw);
      if (!adminData?.email || !adminData?.id) { router.replace('/auth'); return; }

      setUserData({
        id: adminData.id,
        sub_id: null,
        email: adminData.email,
        first_name: adminData.first_name ?? adminData.full_name?.split(' ')[0] ?? 'Admin',
        last_name: adminData.last_name ?? adminData.full_name?.split(' ')[1] ?? 'User',
        name: adminData.full_name ?? `${adminData.first_name ?? 'Admin'} ${adminData.last_name ?? 'User'}`,
        full_name: adminData.full_name ?? `${adminData.first_name ?? 'Admin'} ${adminData.last_name ?? 'User'}`,
        is_active: adminData.is_active ?? true,
        role: adminData.role ?? 'super_admin',
      });
    } catch {
      router.replace('/auth');
    }
  }, [router]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (subscriptionRef.current && !subscriptionRef.current.contains(e.target as Node)) {
        setSubscriptionOpen(false);
      }
      if (cmsSettingsRef.current && !cmsSettingsRef.current.contains(e.target as Node)) {
        setCmsSettingsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auto-expand the correct submenu based on current URL ──────────────────
  useEffect(() => {
    if (pathname.startsWith(`${BASE}/subscription`)) setSubscriptionOpen(true);
    if (pathname.startsWith(`${BASE}/cms-settings`)) setCmsSettingsOpen(true);
    if (pathname.startsWith(`${BASE}/settings`)) setSettingsOpen(true);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('superAdminUser');
    localStorage.removeItem('isSuperAdminLoggedIn');
    router.replace('/auth');
  };

  // ── Styling helpers ───────────────────────────────────────────────────────
  const isActive = (href: string) => pathname === href;
  const isGroupActive = (prefix: string) => pathname.startsWith(prefix);

  const linkCls = (href: string) =>
    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer transition-colors ${
      isActive(href)
        ? 'bg-white text-[var(--color-primary-purple)] font-black shadow-md'
        : 'text-gray-700 hover:bg-white/60'
    }`;

  const groupBtnCls = (prefix: string) =>
    `w-full flex items-center justify-between px-4 py-3 rounded-lg text-left cursor-pointer transition-all duration-300 ${
      isGroupActive(prefix)
        ? 'bg-white text-[var(--color-primary-purple)] font-black shadow-md'
        : 'text-gray-700 hover:bg-white/60'
    }`;

  const dropdownCls = (open: boolean) =>
    `absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 z-50 ${
      open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
    }`;

  const subLinkCls = (href: string) =>
    `w-full px-4 py-3 text-left transition-colors duration-200 flex items-center space-x-3 group ${
      isActive(href) ? 'bg-indigo-50' : 'hover:bg-gray-50'
    }`;

  // Don't render until auth check completes
  if (!userData) return null;

  return (
    <DashboardContext.Provider
      value={{
        openCreateTemplateDrawer: () => setIsCreateTemplateDrawerOpen(true),
        setEditTemplate,
      }}
    >
      <div className="min-h-screen bg-gray-50 flex">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-75 bg-[linear-gradient(90deg,_#fff_-11.17%,_#c9c7ea_100%)] pl-3 pr-3 pt-6 pb-8 flex-shrink-0 flex flex-col">

          {/* Logo */}
          <div className="flex flex-col items-center justify-center space-y-3 mb-6">
            <Image src="/graaho_logo.png" alt="Graaho Logo" width={180} height={60} className="object-cover" priority />
          </div>

          {/* User chip */}
          <div className="flex items-center space-x-3 mb-8 p-3 bg-white/50 rounded-lg">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              <Image src="/man_place_holder.png" alt="Avatar" width={40} height={40} className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {userData.first_name} {userData.last_name}
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
                  Super Admin
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">{userData.email}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">

            {/* Agent Templates */}
            <Link href={NAV_ROUTES.agentTemplates} className={linkCls(NAV_ROUTES.agentTemplates)}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H12.3C12.1 6.6 12 7.3 12 8V10H9C8.4 10 8 10.4 8 11V20H16V11C16 10.4 15.6 10 15 10H14V8C14 7.3 13.9 6.6 13.7 6H15C16.1 6 17 6.9 17 8V10M9.5 12C10.3 12 11 12.7 11 13.5C11 14.3 10.3 15 9.5 15C8.7 15 8 14.3 8 13.5C8 12.7 8.7 12 9.5 12M14.5 12C15.3 12 16 12.7 16 13.5C16 14.3 15.3 15 14.5 15C13.7 15 13 14.3 13 13.5C13 12.7 13.7 12 14.5 12M10 17H14C14 18.1 13.1 19 12 19C10.9 19 10 18.1 10 17Z"/>
              </svg>
              <span className="font-medium">Agent Templates</span>
            </Link>

            {/* Workspaces */}
            <Link href={NAV_ROUTES.workspaces} className={linkCls(NAV_ROUTES.workspaces)}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              <span className="font-medium">Workspaces</span>
            </Link>

            {/* Subscription Model */}
            <div className="relative" ref={subscriptionRef}>
              <button
                onClick={() => setSubscriptionOpen((o) => !o)}
                className={groupBtnCls(`${BASE}/subscription`)}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4M20 18H4V12H20V18M20 8H4V6H20V8M14 14V16H18V14H14Z"/>
                  </svg>
                  <span className="font-medium">Subscription Model</span>
                </div>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${subscriptionOpen ? 'rotate-180' : ''}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className={dropdownCls(subscriptionOpen)}>
                {(
                  [
                    { href: NAV_ROUTES.subscription.plans,                label: 'Plans' },
                    { href: NAV_ROUTES.subscription.components,           label: 'Components' },
                    { href: NAV_ROUTES.subscription.agentPricing,         label: 'Agent Pricing' },
                    { href: NAV_ROUTES.subscription.linkComponents,       label: 'Link Components' },
                    { href: NAV_ROUTES.subscription.linkAgents,           label: 'Link Agents' },
                    { href: NAV_ROUTES.subscription.agentComponentPricing,label: 'Agent Component Pricing' },
                    { href: NAV_ROUTES.subscription.planSummary,          label: 'Plan Summary' },
                  ] as const
                ).map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSubscriptionOpen(false)}
                    className={subLinkCls(href)}
                  >
                    <span className={`font-medium ${isActive(href) ? 'text-indigo-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* CMS Settings */}
            <div className="relative" ref={cmsSettingsRef}>
              <button
                onClick={() => setCmsSettingsOpen((o) => !o)}
                className={groupBtnCls(`${BASE}/cms-settings`)}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                  </svg>
                  <span className="font-medium">CMS Settings</span>
                </div>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${cmsSettingsOpen ? 'rotate-180' : ''}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className={dropdownCls(cmsSettingsOpen)}>
                {(
                  [
                    { href: NAV_ROUTES.cmsSettings.loginPage, label: 'Login Page' },
                  ] as const
                ).map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setCmsSettingsOpen(false)}
                    className={subLinkCls(href)}
                  >
                    <span className={`font-medium ${isActive(href) ? 'text-indigo-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={groupBtnCls(`${BASE}/settings`)}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.33.07-.67.07-1s-.03-.67-.07-1l2.13-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.33-.07.67-.07 1s.03.67.07 1l-2.13 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
                  </svg>
                  <span className="font-medium">Settings</span>
                </div>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${settingsOpen ? 'rotate-180' : ''}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className={dropdownCls(settingsOpen)}>
                {(
                  [
                    { href: NAV_ROUTES.settings.manageUser, label: 'Manage User' },
                    { href: NAV_ROUTES.settings.summary,    label: 'Summary' },
                  ] as const
                ).map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSettingsOpen(false)}
                    className={subLinkCls(href)}
                  >
                    <span className={`font-medium ${isActive(href) ? 'text-indigo-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer transition-colors hover:bg-white/60 text-gray-700"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main content (children = current page) ────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-screen pb-16">
          {children}
        </main>

        {/* ── Global Create Template Drawer ─────────────────────────────────── */}
        <SuperAdminCreateAgentTemplateDrawer
          isOpen={isCreateTemplateDrawerOpen}
          onClose={() => {
            setIsCreateTemplateDrawerOpen(false);
            setEditTemplate(null);
          }}
          onAgentCreated={() => {
            setIsCreateTemplateDrawerOpen(false);
            setEditTemplate(null);
          }}
          currentUser={userData}
          isEditMode={!!editTemplate}
          editTemplate={editTemplate}
        />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="fixed bottom-0 left-75 right-0 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200/60 backdrop-blur-sm z-40">
          <div className="px-8 py-4 flex items-center justify-end">
            <p className="text-xs font-medium text-slate-700">© 2025 Graaho Technologies</p>
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
        </footer>
      </div>
    </DashboardContext.Provider>
  );
}