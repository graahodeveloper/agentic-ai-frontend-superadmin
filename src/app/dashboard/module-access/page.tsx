// app/dashboard/module-access/page.tsx
import ModuleAccessManager from '@/components/module-access/ModuleAccessManager';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--color-primary-purple)]/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary-purple)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module Access</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Grant organizations access to platform modules
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-[1100px]">
        <ModuleAccessManager />
      </div>
    </div>
  );
}
