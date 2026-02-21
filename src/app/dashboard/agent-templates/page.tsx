'use client';
// app/dashboard/agent-templates/page.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  useGetAgentTemplatesByAdminIdQuery,
  AgentTemplate,
} from '@/features/agentTemplateApi/agentTemplateApi';
import AgentTemplatesTable from '@/components/SuperAdminAgentManagement/AgentTemplatesTable';
import { DashboardContext } from '../layout';

export default function AgentTemplatesPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const { openCreateTemplateDrawer, setEditTemplate } = useContext(DashboardContext);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('superAdminUser');
      if (raw) {
        const data = JSON.parse(raw);
        setAdminId(data?.id ?? null);
      }
    } catch {
      // auth guard in layout handles the redirect
    }
  }, []);

  const {
    data: agentTemplatesData,
    isLoading,
    refetch,
  } = useGetAgentTemplatesByAdminIdQuery(adminId!, { skip: !adminId });

  const handleEditTemplate = (template: AgentTemplate) => {
    setEditTemplate(template);
    openCreateTemplateDrawer();
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agent Templates</h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage and create agent templates for the platform
          </p>
          {agentTemplatesData && (
            <p className="text-xs text-gray-400 mt-1">
              Total templates: {agentTemplatesData.count} • {agentTemplatesData.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setEditTemplate(null);
            openCreateTemplateDrawer();
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
          templates={agentTemplatesData?.results ?? []}
          isLoading={isLoading}
          onRefresh={refetch}
          onEditTemplate={handleEditTemplate}
        />
      </div>
    </div>
  );
}