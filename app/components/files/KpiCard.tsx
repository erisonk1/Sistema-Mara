// components/ui/KpiCard.tsx
// Uso:
// <KpiCard label="Faturamento Total" value="R$ 1.200,00" icon="💰"
//   color="text-rose-600" bg="bg-rose-50" border="border-rose-100" />

type KpiCardProps = {
  label: string;
  value: string;
  icon?: string;
  color?: string;   // ex: "text-rose-600"
  bg?: string;      // ex: "bg-rose-50"
  border?: string;  // ex: "border-rose-100"
};

export function KpiCard({
  label,
  value,
  icon,
  color = "text-gray-800",
  bg = "bg-gray-50",
  border = "border-gray-200",
}: KpiCardProps) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-5 flex items-center gap-4 shadow-sm`}>
      {icon && <div className="text-3xl shrink-0">{icon}</div>}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${color} mt-0.5`}>{value}</p>
      </div>
    </div>
  );
}
