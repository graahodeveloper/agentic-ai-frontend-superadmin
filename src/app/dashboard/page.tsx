// app/dashboard/page.tsx
// Visiting /dashboard redirects immediately to the default section.
import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard/agent-templates');
}