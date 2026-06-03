"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/app/components/files/PageHeader";
import { SectionCard } from "@/app/components/files/SectionCard";

type Item = {
  id?: number;
  name: string;
  price: number;
  available: boolean;
  categoria_nome: string;
  porPeso?: boolean;
};

type Categoria = {
  id?: number;
  category: string;
  items: Item[];
};

export default function Editar() {
  const [menu, setMenu] = useState<Categoria[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState<Record<number, string>>({});
  const [newItemPrice, setNewItemPrice] = useState<Record<number, number>>({});
  const [newItemAvailable, setNewItemAvailable] = useState<Record<number, boolean>>({});
  const [newItemPorPeso, setNewItemPorPeso] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<number, boolean>>({});

  const reloadMenu = async () => {
    const res = await fetch("http://localhost:4000/cardapio");
    const data = await res.json();
    setMenu(data);
  };

  useEffect(() => {
    reloadMenu();
  }, []);

  const toggleCat = (id: number) =>
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleItemChange = (
    catIndex: number,
    itemIndex: number,
    field: "name" | "price" | "available" | "porPeso",
    value: string | number | boolean
  ) => {
    setMenu((prev) => {
      const next = structuredClone(prev);
      const item = next[catIndex].items[itemIndex];
      if (field === "name") item.name = value as string;
      else if (field === "price") item.price = Number(value);
      else if (field === "available") item.available = value as boolean;
      else if (field === "porPeso") item.porPeso = value as boolean;
      return next;
    });
  };

  const addItem = async (categoriaId: number) => {
    const nome = newItemName[categoriaId] ?? "";
    const preco = newItemPrice[categoriaId] ?? 0;
    const available = newItemAvailable[categoriaId] ?? true;
    const porPeso = newItemPorPeso[categoriaId] ?? false;

    if (!nome || preco <= 0) {
      alert("Informe nome e preço válidos.");
      return;
    }

    try {
      await fetch("http://localhost:4000/itens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria_id: categoriaId, nome, preco, available, porPeso }),
      });

      setNewItemName((p) => ({ ...p, [categoriaId]: "" }));
      setNewItemPrice((p) => ({ ...p, [categoriaId]: 0 }));
      setNewItemAvailable((p) => ({ ...p, [categoriaId]: true }));
      setNewItemPorPeso((p) => ({ ...p, [categoriaId]: false }));
      await reloadMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await fetch("http://localhost:4000/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newCategoryName }),
      });
      setNewCategoryName("");
      await reloadMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm("Excluir esta categoria e todos os seus itens?")) return;
    try {
      await fetch(`http://localhost:4000/categorias/${id}`, { method: "DELETE" });
      setMenu((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (catIndex: number, itemIndex: number) => {
    const item = menu[catIndex].items[itemIndex];
    try {
      const res = await fetch(`http://localhost:4000/itens/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMenu((prev) =>
        prev.map((cat, i) =>
          i === catIndex ? { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) } : cat
        )
      );
    } catch {
      alert("Erro ao remover item.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const categoria of menu) {
        await fetch(`http://localhost:4000/categorias/${categoria.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoria),
        });
        for (const item of categoria.items) {
          await fetch(`http://localhost:4000/itens/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoria_id: categoria.id,
              categoria_nome: categoria.category,
              name: item.name,
              price: item.price,
              available: item.available,
              porPeso: item.porPeso ?? false,
            }),
          });
        }
      }
      alert("Cardápio atualizado com sucesso!");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Editar Cardápio" initial="C" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Categorias ── */}
          {menu.map((cat, catIndex) => {
            const isOpen = expandedCats[cat.id!] !== false; // aberto por padrão
            const itemCount = cat.items.length;
            const availableCount = cat.items.filter((i) => i.available).length;

            return (
              <div key={cat.id ?? catIndex} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Header da categoria */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCat(cat.id!)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 text-sm">{cat.category}</span>
                    <span className="text-xs text-gray-400 font-medium">
                      {availableCount}/{itemCount} disponíveis
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id!); }}
                      className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                    >
                      Excluir
                    </button>
                    <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">

                    {/* Itens existentes */}
                    {cat.items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhum item nesta categoria.</p>
                    ) : (
                      <div className="space-y-2">
                        {cat.items.map((item, itemIndex) => (
                          <div key={item.id ?? itemIndex}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto_auto_auto] gap-3 items-end pb-3 border-b border-gray-50 last:border-0"
                          >
                            {/* Nome */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-500">Nome</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, "name", e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                              />
                            </div>

                            {/* Preço */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-500">
                                Preço {item.porPeso ? "(R$/kg)" : "(R$)"}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, "price", e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                              />
                            </div>

                            {/* Disponível */}
                            <label className="flex items-center gap-1.5 cursor-pointer pb-1">
                              <input
                                type="checkbox"
                                checked={item.available}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, "available", e.target.checked)}
                                className="h-4 w-4 accent-rose-500"
                              />
                              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Disponível</span>
                            </label>

                            {/* Por peso */}
                            <label className="flex items-center gap-1.5 cursor-pointer pb-1">
                              <input
                                type="checkbox"
                                checked={item.porPeso ?? false}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, "porPeso", e.target.checked)}
                                className="h-4 w-4 accent-sky-500"
                              />
                              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Por peso</span>
                            </label>

                            {/* Remover */}
                            <button
                              type="button"
                              onClick={() => removeItem(catIndex, itemIndex)}
                              className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar novo item */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">+ Novo item</p>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto_auto_auto] gap-3 items-end">

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500">Nome</label>
                          <input
                            type="text"
                            placeholder="Nome do item"
                            value={newItemName[cat.id!] ?? ""}
                            onChange={(e) => setNewItemName((p) => ({ ...p, [cat.id!]: e.target.value }))}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500">Preço</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newItemPrice[cat.id!] ?? ""}
                            onChange={(e) => setNewItemPrice((p) => ({ ...p, [cat.id!]: Number(e.target.value) }))}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer pb-1">
                          <input
                            type="checkbox"
                            checked={newItemAvailable[cat.id!] ?? true}
                            onChange={(e) => setNewItemAvailable((p) => ({ ...p, [cat.id!]: e.target.checked }))}
                            className="h-4 w-4 accent-emerald-500"
                          />
                          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Disponível</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer pb-1">
                          <input
                            type="checkbox"
                            checked={newItemPorPeso[cat.id!] ?? false}
                            onChange={(e) => setNewItemPorPeso((p) => ({ ...p, [cat.id!]: e.target.checked }))}
                            className="h-4 w-4 accent-sky-500"
                          />
                          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Por peso</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => addItem(cat.id!)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {/* ── Nova categoria ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nova Categoria</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={!newCategoryName.trim()}
                className="px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                + Categoria
              </button>
            </div>
          </div>

          {/* ── Salvar ── */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 active:scale-[.98] transition-all disabled:opacity-50 text-sm shadow-sm"
          >
            {saving ? "Salvando…" : "Salvar Alterações"}
          </button>

        </form>
      </main>
    </div>
  );
}