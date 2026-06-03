// components/ui/Badge.tsx
// Uso: <Badge status="Pendente" /> ou <Badge status="Concluído" />

type BadgeProps = {
  status: "Pendente" | "Concluído";
};

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        status === "Pendente"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "Pendente" ? "bg-amber-400" : "bg-emerald-500"
        }`}
      />
      {status}
    </span>
  );
}
