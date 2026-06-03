// components/comanda/ItemEditor.tsx
// Formulário de edição dos itens de uma comanda.
// Uso:
// <ItemEditor
//   comandaId={comanda.id}
//   itens={comanda.itens}
//   saving={saving === comanda.id}
//   onItemChange={handleItemChange}
//   onRemoveItem={removeItem}
//   onAddItem={addItem}
//   onSave={() => salvarComanda(comanda)}
//   onCancel={() => setEditando(null)}
// />

import { ItemComanda } from "@/types/comanda";

type ItemEditorProps = {
  comandaId: number;
  itens: ItemComanda[];
  saving?: boolean;
  onItemChange: (
    comandaId: number,
    itemIndex: number,
    field: "nome" | "quantidade" | "preco" | "peso",
    value: string | number
  ) => void;
  onRemoveItem: (comandaId: number, itemIndex: number) => void;
  onAddItem: (comandaId: number, porPeso: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ItemEditor({
  comandaId,
  itens,
  saving,
  onItemChange,
  onRemoveItem,
  onAddItem,
  onSave,
  onCancel,
}: ItemEditorProps) {
  return (
    <div className="space-y-3">
      {itens.map((item, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center pb-2 border-b border-gray-50"
        >
          <input
            type="text"
            value={item.nome}
            onChange={(e) => onItemChange(comandaId, idx, "nome", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />

          {item.porPeso ? (
            <input
              type="number"
              step="0.01"
              value={item.peso ?? 0}
              onChange={(e) => onItemChange(comandaId, idx, "peso", e.target.value)}
              placeholder="kg"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-24 focus:ring-2 focus:ring-rose-400 focus:outline-none"
            />
          ) : (
            <input
              type="number"
              value={item.quantidade}
              onChange={(e) => onItemChange(comandaId, idx, "quantidade", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-20 focus:ring-2 focus:ring-rose-400 focus:outline-none"
            />
          )}

          <input
            type="number"
            step="0.01"
            value={item.preco}
            onChange={(e) => onItemChange(comandaId, idx, "preco", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-24 focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => onRemoveItem(comandaId, idx)}
            className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            Remover
          </button>
        </div>
      ))}

      {/* Adicionar item */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAddItem(comandaId, false)}
          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
        >
          + Unidade
        </button>
        <button
          type="button"
          onClick={() => onAddItem(comandaId, true)}
          className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors"
        >
          + Peso
        </button>
      </div>

      {/* Salvar / Cancelar */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
