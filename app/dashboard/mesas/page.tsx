// app/dashboard/mesas/page.tsx
export default function MesasPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Mesas
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Visualización de mesas para crear y gestionar comandas.
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
          Aquí diseñaremos el mapa de mesas y el flujo para crear comandas.
        </p>
      </div>
    </section>
  );
}
