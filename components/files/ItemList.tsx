// components/comanda/ItemList.tsx
// Lista de itens de uma comanda no modo visualização, com checkboxes para seleção de impressão.
// Uso:
// <ItemList
//   comandaId={comanda.id}
//   itens={comanda.itens}
//   itensSelecionados={itensSelecionados}
//   onToggle={toggleItemSelecionado}
// />

import { ItemComanda } from "@/app/components/files/comanda";

type ItemListProps = {
  comandaId: number;
  itens: ItemComanda[];
  itensSelecionados: Record<string, boolean>;
  onToggle: (comandaId: number, itemIndex: number, checked: boolean) => void;
};

export function ItemList({ comandaId, itens, itensSelecionados, onToggle }: ItemListProps) {
  return (
    <ul className="space-y-1.5">
      {itens.map((item, idx) => {
        const key = `${comandaId}-${idx}`;
        const selecionado = itensSelecionados[key] ?? true;
        const subtotal = (item.porPeso ? (item.peso ?? 0) : item.quantidade) * item.preco;

        return (
          <li
            key={idx}
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-colors ${
              selecionado ? "bg-gray-50" : "bg-white opacity-50"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={selecionado}
                onChange={(e) => onToggle(comandaId, idx, e.target.checked)}
                className="h-4 w-4 accent-rose-500 shrink-0"
              />
              <span className="text-sm text-gray-800 truncate">
                <span className="font-semibold text-rose-500 mr-1">
                  {item.porPeso ? `${item.peso ?? 0}kg` : `${item.quantidade}x`}
                </span>
                {item.nome}
                {item.categoria_nome && (
                  <span className="ml-1.5 text-xs text-gray-400">({item.categoria_nome})</span>
                )}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-700 shrink-0">
              R$ {subtotal.toFixed(2)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
