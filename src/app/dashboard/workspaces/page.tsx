// app/dashboard/workspaces/page.tsx
import WorkspacesTable from '@/components/SuperAdminAgentManagement/WorkspacesTable';

export default function Page() {
  return (
    <div className="h-full">
      <WorkspacesTable />
    </div>
  );
}