"use client";
import { useComandas } from "@/app/components/files/useComandas";
import { ComandaCard } from "@/app/components/files/ComandaCard";

export default function Ver() {
  const {
    comandas,
    isLoading,
    erro,
    setErro,
    itensSelecionados,
    toggleItemSelecionado,
    handleStatusChange,
    excluirComanda,
    soundEnabled,
    ativarSom,
    recarregar,
    statusCarregando,
    statusSucesso,
  } = useComandas();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Visualizar Comandas</span>
          </div>
          {!soundEnabled ? (
            <button
              onClick={ativarSom}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors font-semibold"
            >
              🔔 Ativar som
            </button>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold">🔔 Som ativo</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {erro && (
          <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <span>{erro}</span>
            <button onClick={() => setErro(null)} className="text-red-400 hover:text-red-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
          </div>
        )}

        {!isLoading && comandas.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-500 font-medium">Nenhuma comanda encontrada</p>
            <p className="text-gray-400 text-sm mt-1">As comandas de hoje e ontem aparecerão aqui</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-4">
          {comandas.map((comanda) => (
            <ComandaCard
              key={comanda.id}
              comanda={comanda}
              itensSelecionados={itensSelecionados}
              onToggleItem={toggleItemSelecionado}
              onStatusChange={handleStatusChange}
              onExcluir={excluirComanda}
              reload={recarregar}
              statusCarregando={statusCarregando === comanda.id}
              statusSucesso={statusSucesso === comanda.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}