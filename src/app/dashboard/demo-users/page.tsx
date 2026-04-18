// app/dashboard/demo-users/page.tsx
import DemoUsersList from '@/components/demo-users/DemoUsersList';

export default function Page() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <DemoUsersList />
    </div>
  );
}
