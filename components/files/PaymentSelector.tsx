// components/ui/PaymentSelector.tsx
// Uso: <PaymentSelector value={formaPagamento} onChange={setFormaPagamento} />

export type FormaPagamento = "Pix" | "Crédito" | "Débito" | "Dinheiro" | "Cortesia";

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  "Pix",
  "Crédito",
  "Débito",
  "Dinheiro",
  "Cortesia",
];

export const PAGAMENTO_ICONS: Record<FormaPagamento, string> = {
  Pix: "🔑",
  Crédito: "💳",
  Débito: "💳",
  Dinheiro: "💵",
  Cortesia: "🎁",
};

type PaymentSelectorProps = {
  value: FormaPagamento;
  onChange: (forma: FormaPagamento) => void;
};

export function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FORMAS_PAGAMENTO.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
            value === f
              ? "bg-rose-500 text-white border-rose-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500"
          }`}
        >
          <span>{PAGAMENTO_ICONS[f]}</span>
          {f}
        </button>
      ))}
    </div>
  );
}
