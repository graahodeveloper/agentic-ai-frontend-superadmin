// components/dashboard/TemplateAssignmentsList.tsx
import React, { useState } from 'react';
import { TemplateAssignment, TemplateAssignmentsResponse } from '@/features/agentTemplateApi/agentTemplateApi';
import TemplateAssignmentCard from './TemplateAssignmentCard';
import AgentTypeFilter from './AgentTypeFilter';

interface TemplateAssignmentsListProps {
  assignmentsResponse: TemplateAssignmentsResponse | undefined;
  isLoading: boolean;
  userRole: string;
}

const TemplateAssignmentsList: React.FC<TemplateAssignmentsListProps> = ({
  assignmentsResponse,
  isLoading,
  userRole,
}) => {
  const [agentType, setAgentType] = useState<'all' | 'internal' | 'external'>(
    userRole === 'user' ? 'internal' : 'all'
  );

  if (isLoading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading template assignments...</p>
        </div>
      </div>
    );
  }

  if (!assignmentsResponse?.results?.length) {
    return (
      <div className="p-8 h-full">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.11 19.11c-.59.59-1.54.59-2.12 0L12 14.12 7.01 19.11c-.59-.59-1.54.59-2.12 0s-.59-1.54 0-2.12L9.88 12 4.89 7.01c-.59-.59-.59-1.54 0-2.12s1.54-.59 2.12 0L12 9.88l4.99-4.99c.59-.59 1.54-.59 2.12 0s.59 1.54 0 2.12L14.12 12l4.99 4.99c.59.59.59 1.54 0 2.12z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Template Assignments</h3>
          <p className="text-gray-600 mb-4">No agent templates assigned to you yet.</p>
          <p className="text-sm text-gray-500">Contact your administrator to get access to templates.</p>
        </div>
      </div>
    );
  }

  const filteredAssignments = assignmentsResponse.results.filter((assignment) => {
    if (userRole === 'user') {
      return assignment.template_details.agent_type === 'internal';
    }
    return agentType === 'all' || assignment.template_details.agent_type === agentType;
  });

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Agent Templates</h1>
          <p className="text-sm text-gray-500 mt-2">Manage your assigned agent templates</p>
          <p className="text-xs text-gray-400 mt-1">
            Total templates: {assignmentsResponse.count}
          </p>
        </div>
      </div>

      {userRole !== 'user' && (
        <AgentTypeFilter selectedType={agentType} onTypeChange={setAgentType} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.map((assignment) => (
          <TemplateAssignmentCard
            key={assignment.id}
            assignment={assignment}
          />
        ))}
      </div>
    </div>
  );
};

export default TemplateAssignmentsList;