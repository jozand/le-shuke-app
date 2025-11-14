// app/dashboard/layout.tsx
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import AppSidebar from '@/components/layout/AppSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        min-h-screen 
        flex flex-col 
        bg-[var(--bg-main)] 
        text-[var(--text-main)]
        transition-colors duration-300
      "
    >
      <AppHeader />

      <div className="flex flex-1">
        {/* Sidebar izquierdo */}
        <AppSidebar />

        {/* Contenido central */}
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
