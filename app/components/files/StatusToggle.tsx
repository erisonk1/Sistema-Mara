// components/ui/StatusToggle.tsx
// Uso: <StatusToggle status={comanda.status} onChange={(s) => handleStatusChange(id, s)} />

type Status = "Pendente" | "Concluído";

type StatusToggleProps = {
  status: Status;
  onChange: (status: Status) => void;
};

export function StatusToggle({ status, onChange }: StatusToggleProps) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200">
      {(["Pendente", "Concluído"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            status === s
              ? s === "Pendente"
                ? "bg-amber-400 text-white"
                : "bg-emerald-500 text-white"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
