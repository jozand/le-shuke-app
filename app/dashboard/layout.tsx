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
        overflow-x-hidden   /* 👈 MÁXIMA IMPORTANCIA */
      "
    >
      <AppHeader />

      <div
        className="
          flex flex-1
          w-full
          overflow-x-hidden    /* 👈 Mata cualquier scroll lateral */
        "
      >
        {/* Sidebar izquierdo */}
        <AppSidebar />

        {/* Contenido central */}
        <main
          className="
            flex-1 
            w-full         /* 👈 evita que crezca más del viewport */
            overflow-x-hidden
          "
        >
          <div
            className="
              w-full
              max-w-full     /* 👈 ELIMINA EL max-w-6xl que rompía todo */
              px-3 sm:px-4   /* 👈 padding seguro para mobile */
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
