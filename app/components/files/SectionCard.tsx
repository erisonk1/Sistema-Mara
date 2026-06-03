// components/layout/SectionCard.tsx
// Uso: <SectionCard title="Resumo por Categoria">...</SectionCard>

type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
};

export function SectionCard({ title, children, className = "", noPadding = false }: SectionCardProps) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        </div>
      )}
      <div className={noPadding ? "" : "px-4 sm:px-6 py-4"}>{children}</div>
    </section>
  );
}
