"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

import { CategoriaCardapio, FormaPagamento } from "@/app/components/files/comanda";
import { PageHeader } from "@/app/components/files/PageHeader";
import { PaymentSelector, FORMAS_PAGAMENTO } from "@/app/components/files/PaymentSelector";
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://sistema-mara-backend-1.onrender.com";
// ─── Helpers (shared entre criar e editar) ────────────────────────────────────
// Idealmente esses helpers ficam em utils/comanda.ts e são importados aqui e no Home.tsx

type EntradaPeso = { id: string; peso: number };

function makeKey(category: string, itemName: string) {
  return `${category}|||${itemName}`;
}
function parseKey(key: string): [string, string] {
  const [category, ...rest] = key.split("|||");
  return [category, rest.join("|||")];
}
function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type ItemResumo =
  | { categoria: string; nome: string; preco: number; porPeso: true; peso: number; subtotal: number }
  | { categoria: string; nome: string; preco: number; porPeso: false; quantidade: number; subtotal: number };

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EditarComanda() {
  const { id } = useParams();
  const router = useRouter();

  const [menu, setMenu] = useState<CategoriaCardapio[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [weights, setWeights] = useState<Record<string, EntradaPeso[]>>({});
  const [pesoInput, setPesoInput] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("Pix");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Buscar cardápio ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/cardapio`)
      .then((r) => r.json())
      .then((data) =>
        setMenu(
          data.map((cat: any) => ({
            ...cat,
            items: cat.items.map((i: any) => ({
              ...i,
              available: i.available ?? true,
              porPeso: i.porPeso ?? false,
            })),
          }))
        )
      )
      .catch(console.error);
  }, []);

  // ── Buscar comanda ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`${API}/comandas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setNome(data.nome);
        setDescricao(data.descricao);
        setFormaPagamento(data.formaPagamento ?? "Pix");

        const q: Record<string, number> = {};
        const w: Record<string, EntradaPeso[]> = {};

        data.itens.forEach((i: any) => {
          const key = makeKey(i.categoria_nome, i.nome);
          if (i.porPeso) {
            w[key] = [...(w[key] ?? []), { id: uuid(), peso: i.peso ?? 0 }];
          } else {
            q[key] = i.quantidade;
          }
        });

        setQuantities(q);
        setWeights(w);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // ── Handlers quantidade ──────────────────────────────────────────────────────
  const handleQuantityChange = (category: string, itemName: string, delta: number) => {
    const key = makeKey(category, itemName);
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
  };

  // ── Handlers peso ────────────────────────────────────────────────────────────
  const handleAddWeight = (category: string, itemName: string) => {
    const key = makeKey(category, itemName);
    const value = parseFloat(pesoInput[key] ?? "");
    if (isNaN(value) || value <= 0) return;
    setWeights((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { id: uuid(), peso: value }] }));
    setPesoInput((prev) => ({ ...prev, [key]: "" }));
  };

  const handleRemoveWeight = (category: string, itemName: string, entradaId: string) => {
    const key = makeKey(category, itemName);
    setWeights((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((e) => e.id !== entradaId) }));
  };

  const handleEditWeight = (category: string, itemName: string, entradaId: string, newPeso: number) => {
    const key = makeKey(category, itemName);
    setWeights((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((e) => (e.id === entradaId ? { ...e, peso: newPeso } : e)),
    }));
  };

  // ── Resumo ───────────────────────────────────────────────────────────────────
  const itensResumo: ItemResumo[] = [];

  for (const [key, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const [categoria, itemNome] = parseKey(key);
    const item = menu.find((c) => c.category === categoria)?.items.find((i) => i.name === itemNome);
    if (!item) continue;
    itensResumo.push({ categoria, nome: itemNome, preco: item.price, porPeso: false, quantidade: qty, subtotal: qty * item.price });
  }

  for (const [key, entradas] of Object.entries(weights)) {
    const [categoria, itemNome] = parseKey(key);
    const item = menu.find((c) => c.category === categoria)?.items.find((i) => i.name === itemNome);
    if (!item) continue;
    for (const entrada of entradas) {
      if (entrada.peso <= 0) continue;
      itensResumo.push({ categoria, nome: itemNome, preco: item.price, porPeso: true, peso: entrada.peso, subtotal: entrada.peso * item.price });
    }
  }

  const total = itensResumo.reduce((acc, i) => acc + i.subtotal, 0);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const comanda = {
      id,
      nome,
      descricao,
      status: "Pendente",
      formaPagamento,
      itens: itensResumo.map((item) =>
        item.porPeso
          ? { nome: item.nome, quantidade: 1, preco: item.preco, categoria_nome: item.categoria, porPeso: true, peso: item.peso }
          : { nome: item.nome, quantidade: item.quantidade, preco: item.preco, categoria_nome: item.categoria, porPeso: false }
      ),
    };

    try {
      const response = await fetch(`${API}/comandas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comanda),
      });
      const result = await response.json();
      alert(result.message || "Comanda atualizada com sucesso!");
      router.push("/ver");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar comanda");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMenu = selectedCategory === "" ? menu : menu.filter((cat) => cat.category === selectedCategory);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`${poppins.className} min-h-screen bg-gray-50`}>
      <PageHeader title="Editar Comanda" initial="E" />

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* ── LEFT: formulário + cardápio ── */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* Dados da comanda */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Dados da Comanda</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600" htmlFor="nome">Nome do cliente</label>
                      <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-gray-50"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600" htmlFor="descricao">Observação</label>
                      <input
                        id="descricao"
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        required
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Forma de pagamento</label>
                    <PaymentSelector value={formaPagamento} onChange={setFormaPagamento} />
                  </div>
                </section>

                {/* Filtro de categorias */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedCategory === ""
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
                      }`}
                    >
                      Todas
                    </button>
                    {menu.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCategory(cat.category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selectedCategory === cat.category
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
                        }`}
                      >
                        {cat.category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cardápio */}
                <div className="space-y-4">
                  {filteredMenu.map((cat, index) => (
                    <section key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 sm:px-6 py-3 bg-rose-50 border-b border-rose-100">
                        <h2 className="text-sm font-bold text-rose-600 uppercase tracking-wide">{cat.category}</h2>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {cat.items
                          .filter((item) => item.available)
                          .map((item, subIndex) => {
                            const key = makeKey(cat.category, item.name);
                            const qty = quantities[key] ?? 0;

                            return (
                              <div key={subIndex} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    R$ {item.price.toFixed(2)}{item.porPeso ? " / kg" : ""}
                                  </p>
                                </div>

                                {/* Controls */}
                                {item.porPeso ? (
                                  <div className="flex flex-col gap-2 items-end shrink-0">
                                    {(weights[key] ?? []).map((entrada) => (
                                      <div key={entrada.id} className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          step="0.001"
                                          min="0"
                                          value={entrada.peso}
                                          onChange={(e) =>
                                            handleEditWeight(cat.category, item.name, entrada.id, parseFloat(e.target.value) || 0)
                                          }
                                          className="w-20 text-center border border-gray-200 rounded-xl text-sm text-gray-800 px-2 py-1.5 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                                        />
                                        <span className="text-xs text-gray-500">kg</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveWeight(cat.category, item.name, entrada.id)}
                                          className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 text-xs flex items-center justify-center font-bold transition-colors"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="kg"
                                        value={pesoInput[key] ?? ""}
                                        onChange={(e) => setPesoInput((prev) => ({ ...prev, [key]: e.target.value }))}
                                        className="w-20 text-center border border-gray-200 rounded-xl text-sm text-gray-800 px-2 py-1.5 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddWeight(cat.category, item.name)}
                                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 text-xs font-semibold transition-colors"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(cat.category, item.name, -1)}
                                      disabled={qty === 0}
                                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors disabled:opacity-30"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={qty}
                                      onChange={(e) =>
                                        setQuantities((prev) => ({
                                          ...prev,
                                          [key]: Math.max(0, parseInt(e.target.value) || 0),
                                        }))
                                      }
                                      className={`w-9 text-center text-sm font-bold border-0 bg-transparent focus:outline-none ${
                                        qty > 0 ? "text-rose-600" : "text-gray-400"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(cat.category, item.name, +1)}
                                      className="w-8 h-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: Resumo sticky ── */}
              <aside className="w-full lg:w-80 lg:sticky lg:top-20 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Resumo da Comanda</h2>
                  </div>

                  {itensResumo.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-3xl mb-2">🛒</p>
                      <p className="text-sm text-gray-400 font-medium">Nenhum item selecionado</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {itensResumo.map((item, idx) => (
                        <li key={idx} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.porPeso ? `${item.peso} kg` : `${item.quantidade}x`} · {item.categoria}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-rose-600 shrink-0">
                            R$ {item.subtotal.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-rose-600">R$ {total.toFixed(2)}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={itensResumo.length === 0 || submitting}
                      className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 active:scale-[.98] transition-all disabled:opacity-40 text-sm shadow-sm"
                    >
                      {submitting ? "Salvando…" : "Salvar Alterações"}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/ver")}
                      className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </aside>

            </div>

            {/* Mobile bottom bar */}
            {itensResumo.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">{itensResumo.length} {itensResumo.length === 1 ? "item" : "itens"}</p>
                    <p className="text-lg font-bold text-rose-600">R$ {total.toFixed(2)}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 max-w-[200px] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 active:scale-[.97] transition-all disabled:opacity-50 text-sm shadow-sm"
                  >
                    {submitting ? "Salvando…" : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            )}

            {itensResumo.length > 0 && <div className="h-24 lg:hidden" />}
          </div>
        </form>
      )}
    </div>
  );
}