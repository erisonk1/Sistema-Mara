// components/comanda/ComandaCard.tsx
// Card de visualização de uma comanda: cabeçalho com status/total, lista de itens,
// troca de status e ações de impressão/edição/exclusão.
// Uso:
// <ComandaCard
//   comanda={comanda}
//   itensSelecionados={itensSelecionados}
//   onToggleItem={toggleItemSelecionado}
//   onStatusChange={handleStatusChange}
//   onExcluir={excluirComanda}
// />

import { useRouter } from "next/navigation";
import { Comanda } from "@/app/components/files/comanda";
import { Badge } from "@/app/components/files/Badge";
import { StatusToggle } from "@/app/components/files/StatusToggle";
import { ItemList } from "@/app/components/files/ItemList";
import { printCozinha, printRecibo } from "@/app/components/files/printComanda";

type ComandaCardProps = {
  comanda: Comanda;
  itensSelecionados: Record<string, boolean>;
  onToggleItem: (comandaId: number, itemIndex: number, checked: boolean) => void;
  onStatusChange: (comandaId: number, novoStatus: Comanda["status"]) => void;
  onExcluir: (id: number) => void;
  reload: () => void;
};

function calcularTotal(comanda: Comanda): number {
  return comanda.itens.reduce(
    (acc, item) => acc + (item.porPeso ? item.peso ?? 0 : item.quantidade) * item.preco,
    0
  );
}

export function ComandaCard({
  comanda,
  itensSelecionados,
  onToggleItem,
  onStatusChange,
  onExcluir,
  reload,
}: ComandaCardProps) {
  const router = useRouter();
  const total = calcularTotal(comanda);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        comanda.status === "Concluído" ? "border-emerald-100 opacity-80" : "border-gray-200"
      }`}
    >
      <div
        className={`px-5 py-3 flex items-center justify-between gap-3 border-b ${
          comanda.status === "Pendente" ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge status={comanda.status} />
          <h2 className="font-bold text-gray-900 text-sm truncate">{comanda.nome}</h2>
          <span className="text-xs text-gray-400 font-mono shrink-0">#{comanda.id}</span>
        </div>
        <span className="text-base font-bold text-rose-600 shrink-0">R$ {total.toFixed(2)}</span>
      </div>

      <div className="px-5 py-4">
        {comanda.descricao && <p className="text-xs text-gray-500 mb-3 italic">{comanda.descricao}</p>}

        <div className="mb-4">
          <ItemList
            comandaId={comanda.id}
            itens={comanda.itens}
            itensSelecionados={itensSelecionados}
            onToggle={onToggleItem}
          />
        </div>

        <div className="flex justify-end mb-4">
          <span className="text-lg font-bold text-rose-600">Total: R$ {total.toFixed(2)}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <StatusToggle status={comanda.status} onChange={(s) =>{
              onStatusChange(comanda.id, s)
              reload()}
            } />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => printRecibo(comanda)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition-colors"
            >
              🧾 Recibo
            </button>
            <button
              onClick={() => printCozinha(comanda, itensSelecionados)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-semibold hover:bg-sky-600 transition-colors"
            >
              👨‍🍳 Cozinha
            </button>
            <button
              onClick={() => router.push(`/editarcomanda/${comanda.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 transition-colors"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => onExcluir(comanda.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
