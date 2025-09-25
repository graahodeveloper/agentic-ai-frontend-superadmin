// components/dashboard/AgentTypeFilter.tsx
import React from 'react';

interface AgentTypeFilterProps {
  selectedType: 'all' | 'internal' | 'external';
  onTypeChange: (type: 'all' | 'internal' | 'external') => void;
}

const AgentTypeFilter: React.FC<AgentTypeFilterProps> = ({ selectedType, onTypeChange }) => {
  return (
    <div className="flex space-x-2 mb-6">
      <button
        onClick={() => onTypeChange('all')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedType === 'all'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Agents
      </button>
      <button
        onClick={() => onTypeChange('internal')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedType === 'internal'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Internal Agents
      </button>
      <button
        onClick={() => onTypeChange('external')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedType === 'external'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        External Agents
      </button>
    </div>
  );
};

export default AgentTypeFilter;