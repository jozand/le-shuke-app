// app/dashboard/historial/page.tsx
export default function HistorialPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Historial de comandas
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Consulta de comandas atendidas. Los usuarios verán solo su historial;
          los administradores podrán ver todo.
        </p>
      </div>

      <div
        className="
          rounded-[var(--radius-lg)] border
          border-[var(--border-color)] bg-[var(--bg-card)]
          shadow-[var(--shadow-card)] p-4
        "
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Aquí irá la tabla filtrable de comandas, con filtros por fecha, mesa y usuario.
        </p>
      </div>
    </section>
  );
}
