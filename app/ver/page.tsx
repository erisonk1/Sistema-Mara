"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://sistema-mara-backend-1.onrender.com";

type Comanda = {
  id: number;
  nome: string;
  descricao: string;
  status: "Pendente" | "Concluído";
  itens: {
    nome: string;
    quantidade: number;
    preco: number;
    categoria_nome?: string;
    porPeso?: boolean;
    peso?: number;
  }[];
};

function StatusBadge({ status }: { status: Comanda["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      status === "Pendente"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Pendente" ? "bg-amber-400" : "bg-emerald-500"}`} />
      {status}
    </span>
  );
}

export default function Ver() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const router = useRouter();
  const prevIds = useRef<string>("");

  const fetchComandasHoje = async () => {
    const res = await fetch(`${API}/comandas/hoje`);
    if (!res.ok) throw new Error("Erro ao carregar comandas");
    return res.json();
  };

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["comandasHoje"],
    queryFn: fetchComandasHoje,
    refetchInterval: 10000,
  });

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    new Audio("/notification.mp3").play().catch(console.error);
  };

  useEffect(() => {
    const newIds = (data as Comanda[]).map((c) => c.id).join(",");
    if (newIds === prevIds.current) return; // nada mudou, não faz nada

    const prevList = comandas;
    const novas = (data as Comanda[]).filter(
      (c) => !prevList.some((old) => old.id === c.id)
    );

    if (novas.length > 0) {
      const el = document.createElement("div");
      el.innerText = `🔔 Nova comanda: ${novas[0].nome}`;
      el.className =
        "fixed top-4 right-4 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-sm font-semibold animate-bounce";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
      playNotificationSound();
    }

    prevIds.current = newIds;
    setComandas(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleItemChange = (
    comandaId: number,
    itemIndex: number,
    field: "nome" | "quantidade" | "preco" | "peso",
    value: string | number
  ) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId) return c;
        const itens = c.itens.map((item, idx) => {
          if (idx !== itemIndex) return item;
          if (field === "nome") return { ...item, nome: value as string };
          if (field === "quantidade") return { ...item, quantidade: Number(value) };
          if (field === "preco") return { ...item, preco: Number(value) };
          if (field === "peso") return { ...item, peso: Number(value) };
          return item;
        });
        return { ...c, itens };
      })
    );
  };

  const toggleItemSelecionado = (comandaId: number, itemIndex: number, checked: boolean) => {
    setItensSelecionados((prev) => ({ ...prev, [`${comandaId}-${itemIndex}`]: checked }));
  };

  const addItem = (comandaId: number, porPeso = false) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId) return c;
        const novoItem = porPeso
          ? { nome: "Novo Item (peso)", quantidade: 0, peso: 0, preco: 0, porPeso: true }
          : { nome: "Novo Item", quantidade: 1, preco: 0, porPeso: false };
        return { ...c, itens: [...c.itens, novoItem] };
      })
    );
  };

  const removeItem = (comandaId: number, itemIndex: number) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId) return c;
        return { ...c, itens: c.itens.filter((_, i) => i !== itemIndex) };
      })
    );
  };

  const handleStatusChange = async (comandaId: number, novoStatus: Comanda["status"]) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;
    try {
      await fetch(`${API}/comandas/${comandaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...comanda, status: novoStatus }),
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const salvarComanda = async (comanda: Comanda) => {
    setSaving(comanda.id);
    try {
      const response = await fetch(`${API}/comandas/${comanda.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comanda),
      });
      const result = await response.json();
      alert(result.message || "Comanda atualizada!");
      setEditando(null);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const excluirComanda = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta comanda?")) return;
    try {
      await fetch(`${API}/comandas/${id}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintCozinha = (comanda: Comanda) => {
    const itens = comanda.itens.filter((_, idx) => itensSelecionados[`${comanda.id}-${idx}`] ?? true);
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Comanda Cozinha</title>
      <style>body{font-family:monospace;font-size:14px;width:58mm}h1{text-align:center;font-size:16px;margin-bottom:10px}.line{border-top:1px dashed #000;margin:5px 0}.item{margin-bottom:5px}.footer{text-align:center;margin-top:15px;font-size:12px}</style>
      </head><body>
      <h1>COMANDA COZINHA</h1>
      <div><strong>${comanda.nome}</strong></div><div>${comanda.descricao}</div>
      <div class="line"></div>
      ${itens.map((i) => `<div class="item">${i.quantidade}x ${i.nome} <strong>(${i.categoria_nome ?? ""})</strong></div>`).join("")}
      <div class="line"></div><div class="footer">Preparar conforme pedido!</div>
      </body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  const handlePrintRecibo = (comanda: Comanda) => {
    const total = comanda.itens.reduce(
      (acc, i) => acc + (i.porPeso ? (i.peso ?? 0) : i.quantidade) * i.preco, 0
    );
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo</title>
      <style>body{font-family:monospace;font-size:14px;width:280px}h1{text-align:center;font-size:16px;margin-bottom:10px}.line{border-top:1px dashed #000;margin:5px 0}.item{display:flex;justify-content:space-between}.total{font-weight:bold;text-align:right;margin-top:10px}.footer{text-align:center;margin-top:15px;font-size:12px}</style>
      </head><body>
      <h1>RECIBO</h1>
      <div><strong>${comanda.nome}</strong></div><div>${comanda.descricao}</div>
      <div class="line"></div>
      ${comanda.itens.map((i) => `<div class="item"><span>${i.quantidade}x ${i.nome}</span><span>R$${((i.porPeso ? (i.peso ?? 0) : i.quantidade) * i.preco).toFixed(2)}</span></div>`).join("")}
      <div class="line"></div><div class="total">TOTAL: R$${total.toFixed(2)}</div>
      <div class="footer">Obrigado pela preferência!</div>
      </body></html>`);
    win.document.close(); win.focus(); win.print();
  };

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
              onClick={() => {
                const a = new Audio("/notification.mp3");
                a.play().then(() => setSoundEnabled(true)).catch(() => setSoundEnabled(true));
              }}
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
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
          </div>
        )}

        {!isLoading && comandas.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-500 font-medium">Nenhuma comanda hoje</p>
            <p className="text-gray-400 text-sm mt-1">As comandas criadas hoje aparecerão aqui</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-4">
          {comandas.map((comanda) => {
            const total = comanda.itens.reduce(
              (acc, i) => acc + (i.porPeso ? (i.peso ?? 0) : i.quantidade) * i.preco, 0
            );
            const isEdit = editando === comanda.id;

            return (
              <div key={comanda.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                comanda.status === "Concluído" ? "border-emerald-100 opacity-80" : "border-gray-200"
              }`}>
                <div className={`px-5 py-3 flex items-center justify-between gap-3 border-b ${
                  comanda.status === "Pendente" ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusBadge status={comanda.status} />
                    <h2 className="font-bold text-gray-900 text-sm truncate">{comanda.nome}</h2>
                    <span className="text-xs text-gray-400 font-mono shrink-0">#{comanda.id}</span>
                  </div>
                  <span className="text-base font-bold text-rose-600 shrink-0">R$ {total.toFixed(2)}</span>
                </div>

                <div className="px-5 py-4">
                  {comanda.descricao && (
                    <p className="text-xs text-gray-500 mb-3 italic">{comanda.descricao}</p>
                  )}

                  {isEdit ? (
                    <div className="space-y-3">
                      {comanda.itens.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center pb-2 border-b border-gray-50">
                          <input type="text" value={item.nome}
                            onChange={(e) => handleItemChange(comanda.id, idx, "nome", e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                          />
                          {item.porPeso ? (
                            <input type="number" step="0.01" value={item.peso ?? 0}
                              onChange={(e) => handleItemChange(comanda.id, idx, "peso", e.target.value)}
                              placeholder="kg"
                              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-24 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                            />
                          ) : (
                            <input type="number" value={item.quantidade}
                              onChange={(e) => handleItemChange(comanda.id, idx, "quantidade", e.target.value)}
                              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-20 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                            />
                          )}
                          <input type="number" value={item.preco} step="0.01"
                            onChange={(e) => handleItemChange(comanda.id, idx, "preco", e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 w-24 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                          />
                          <button onClick={() => removeItem(comanda.id, idx)}
                            className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors">
                            Remover
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => addItem(comanda.id, false)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors">
                          + Unidade
                        </button>
                        <button onClick={() => addItem(comanda.id, true)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors">
                          + Peso
                        </button>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => salvarComanda(comanda)} disabled={saving === comanda.id}
                          className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50">
                          {saving === comanda.id ? "Salvando…" : "Salvar"}
                        </button>
                        <button onClick={() => setEditando(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-1.5 mb-4">
                        {comanda.itens.map((item, idx) => {
                          const key = `${comanda.id}-${idx}`;
                          const subtotal = (item.porPeso ? (item.peso ?? 0) : item.quantidade) * item.preco;
                          const selecionado = itensSelecionados[key] ?? true;
                          return (
                            <li key={idx} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-colors ${
                              selecionado ? "bg-gray-50" : "bg-white opacity-50"
                            }`}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input type="checkbox" checked={selecionado}
                                  onChange={(e) => toggleItemSelecionado(comanda.id, idx, e.target.checked)}
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

                      <div className="flex justify-end mb-4">
                        <span className="text-lg font-bold text-rose-600">Total: R$ {total.toFixed(2)}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500">Status:</span>
                          <div className="flex rounded-xl overflow-hidden border border-gray-200">
                            {(["Pendente", "Concluído"] as const).map((s) => (
                              <button key={s} onClick={() => handleStatusChange(comanda.id, s)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  comanda.status === s
                                    ? s === "Pendente" ? "bg-amber-400 text-white" : "bg-emerald-500 text-white"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                                }`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handlePrintRecibo(comanda)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition-colors">
                            🧾 Recibo
                          </button>
                          <button onClick={() => handlePrintCozinha(comanda)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-semibold hover:bg-sky-600 transition-colors">
                            👨‍🍳 Cozinha
                          </button>
                          <button onClick={() => router.push(`/editarcomanda/${comanda.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 transition-colors">
                            ✏️ Editar
                          </button>
                          <button onClick={() => excluirComanda(comanda.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
                            🗑️ Excluir
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}