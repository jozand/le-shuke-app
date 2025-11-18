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
        w-full
        overflow-x-hidden
        touch-pan-y
      "
    >
      <AppHeader />

      <div
        className="
          flex flex-1
          w-full
          overflow-x-hidden
        "
      >
        <AppSidebar />

        <main
          className="
            flex-1 
            min-w-0     /* 👈 CRÍTICO para iPad horizontal */
            w-full
            overflow-x-hidden
          "
        >
          <div
            className="
              w-full
              max-w-full
              px-3 sm:px-4
              py-6
              overflow-x-hidden
            "
          >
            {children}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
