// components/dashboard/TemplateAssignmentCard.tsx
import React, { useState } from 'react';
import { TemplateAssignment } from '@/features/agentTemplateApi/agentTemplateApi';
import AgentInstanceDrawer from './AgentInstanceDrawer';

interface TemplateAssignmentCardProps {
  assignment: TemplateAssignment;
}

const TemplateAssignmentCard: React.FC<TemplateAssignmentCardProps> = ({ assignment }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleCreateInstance = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {assignment.template_details.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {assignment.template_details.description}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type:</span>
            <span className="text-gray-900 capitalize">
              {assignment.template_details.agent_type}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Variant:</span>
            <span className="text-gray-900 capitalize">
              {assignment.template_details.agent_variant}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Assigned by:</span>
            <span className="text-gray-900 text-right">
              {assignment.assigned_by_name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span
              className={`text-gray-900 ${
                assignment.is_active ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {assignment.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <button
          onClick={handleCreateInstance}
          className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          aria-label={`Create instance for ${assignment.template_details.name}`}
        >
          Create Instance
        </button>
      </div>

      <AgentInstanceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        assignment={assignment}
      />
    </>
  );
};

export default TemplateAssignmentCard;