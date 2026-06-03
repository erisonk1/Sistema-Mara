// components/layout/PageHeader.tsx
// Uso: <PageHeader title="Faturamento" initial="F" actions={<button>...</button>} />

type PageHeaderProps = {
  title: string;
  initial?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, initial, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {initial && (
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initial}</span>
            </div>
          )}
          <span className="font-bold text-gray-900 text-base tracking-tight">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
