// components/ui/Pagination.tsx
// Uso: <Pagination current={page} total={totalPages} onChange={setPage} />

type PaginationProps = {
  current: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  return (
    <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors font-medium"
      >
        ‹
      </button>

      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === n
              ? "bg-rose-500 text-white shadow-sm"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors font-medium"
      >
        ›
      </button>
    </div>
  );
}
