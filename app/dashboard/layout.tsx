// app/dashboard/layout.tsx
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-50">
      {/* Header */}
      <AppHeader />

      {/* Contenido central */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
