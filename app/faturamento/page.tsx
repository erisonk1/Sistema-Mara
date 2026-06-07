"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://sistema-mara-backend-1.onrender.com";
type Item = {
  nome: string;
  quantidade: number;
  preco: number;
  categoria_nome: string;
  porPeso?: boolean;
  peso?: number;
};

type Comanda = {
  id: number;
  nome: string;
  descricao: string;
  status: string;
  itens: Item[];
  criadoEm: string;
};

type DiaFaturamento = { data: string; valor: number };
type ItemRanking = { nome: string; categoria: string; quantidade: number; valorTotal: number };

/* ---------- tiny helpers ---------- */
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pendente: "bg-amber-100 text-amber-700 border border-amber-300",
    Concluído: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (n: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors font-medium"
      >
        ‹
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === n ? "bg-rose-500 text-white shadow-sm" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors font-medium"
      >
        ›
      </button>
    </div>
  );
}

/* ---------- main component ---------- */
export default function Faturamento() {
  const [dados, setDados] = useState<DiaFaturamento[]>([]);
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [dataFiltro, setDataFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mostrarTudo, setMostrarTudo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");

  // pagination states
  const [pageComandas, setPageComandas] = useState(1);
  const [pageRanking, setPageRanking] = useState(1);
  const [pageClientes, setPageClientes] = useState(1);
  const PER = 5;

  const router = useRouter();
  const senhaCorreta = "ln102030";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha === senhaCorreta) setAutenticado(true);
    else alert("Senha incorreta!");
  };

  useEffect(() => {
    fetch(`${API}/faturamento/dias`)
      .then((r) => r.json())
      .then((data) =>
        setDados(Object.entries(data).map(([data, valor]) => ({ data, valor: valor as number })))
      );
    fetch(`${API}/faturamento/mais-vendidos`)
      .then((r) => r.json())
      .then(setRanking);
  }, []);

  useEffect(() => {
    const url = dataFiltro
      ? `${API}/comandas/periodo/${dataFiltro}`
      : `${API}/comandas`;
    fetch(url)
      .then((r) => r.json())
      .then(setComandas)
      .catch(console.error);
  }, [dataFiltro]);

  /* derived */
  const faturamentoTotal = comandas.reduce(
    (acc, c) => acc + c.itens.reduce((s, i) => s + (i.porPeso ? (i.peso ?? 0) * i.preco : i.quantidade * i.preco), 0),
    0
  );
  const ticketMedio = comandas.length > 0 ? faturamentoTotal / comandas.length : 0;
  const totalItensVendidos = comandas.reduce(
    (acc, c) => acc + c.itens.reduce((s, i) => s + (i.porPeso ? 1 : i.quantidade), 0),
    0
  );

  const categoriasResumo: Record<string, { quantidade: number; valor: number }> = {};
  comandas.forEach((c) =>
    c.itens.forEach((i) => {
      if (!categoriasResumo[i.categoria_nome]) categoriasResumo[i.categoria_nome] = { quantidade: 0, valor: 0 };
      categoriasResumo[i.categoria_nome].quantidade += i.porPeso ? 1 : i.quantidade;
      categoriasResumo[i.categoria_nome].valor += i.porPeso ? (i.peso ?? 0) * i.preco : i.quantidade * i.preco;
    })
  );

  const pendentes = comandas.filter((c) => c.status === "Pendente").length;
  const concluidas = comandas.filter((c) => c.status === "Concluído").length;
  const percentualConcluidas = comandas.length > 0 ? (concluidas / comandas.length) * 100 : 0;

  const clientesResumo: Record<string, { valor: number; quantidade: number }> = {};
  comandas.forEach((c) => {
    if (!clientesResumo[c.nome]) clientesResumo[c.nome] = { valor: 0, quantidade: 0 };
    clientesResumo[c.nome].valor += c.itens.reduce(
      (s, i) => s + (i.porPeso ? (i.peso ?? 0) * i.preco : i.quantidade * i.preco),
      0
    );
    clientesResumo[c.nome].quantidade += c.itens.reduce((s, i) => s + (i.porPeso ? 1 : i.quantidade), 0);
  });
  const clientesArray = Object.entries(clientesResumo);

  /* paginated slices */
  const slice = <T,>(arr: T[], page: number) => arr.slice((page - 1) * PER, page * PER);
  const pages = (arr: unknown[]) => Math.ceil(arr.length / PER);

  const excluirComanda = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta comanda?")) return;
    await fetch(`${API}/comandas/${id}`, { method: "DELETE" });
    setComandas((prev) => prev.filter((c) => c.id !== id));
  };

  /* ---- login overlay ---- */
  if (!autenticado) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50 p-4">
        <form
          onSubmit={handleLogin}
          className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm"
        >
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-2xl">
              🔒
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1 text-center text-white tracking-tight">Acesso Restrito</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Insira a senha para continuar</p>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-700 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-gray-800 text-white placeholder-gray-500 text-sm"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-3 rounded-xl hover:bg-rose-600 active:scale-[.98] transition-all font-semibold text-sm"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  /* ---- main dashboard ---- */
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* top nav bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Faturamento</span>
          </div>
          <button
            onClick={() => setAutenticado(false)}
            className="text-xs text-gray-400 hover:text-rose-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* ---- FILTRO ---- */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filtrar por período</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={mostrarTudo}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={mostrarTudo}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
            <button
              onClick={() => {
                if (dataInicio && dataFim && !mostrarTudo) setDataFiltro(`${dataInicio}/${dataFim}`);
                else setDataFiltro("");
              }}
              className="px-5 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 active:scale-[.97] transition-all text-sm font-semibold shadow-sm"
            >
              Filtrar
            </button>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <input
                type="checkbox"
                checked={mostrarTudo}
                onChange={(e) => {
                  setMostrarTudo(e.target.checked);
                  if (e.target.checked) setDataFiltro("");
                }}
                className="accent-rose-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Mostrar tudo</span>
            </label>
          </div>
        </section>

        {/* ---- KPI CARDS ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Faturamento Total", value: `R$ ${faturamentoTotal.toFixed(2)}`, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: "💰" },
            { label: "Ticket Médio", value: `R$ ${ticketMedio.toFixed(2)}`, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: "🎯" },
            { label: "Itens Vendidos", value: totalItensVendidos.toString(), color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", icon: "📦" },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-5 flex items-center gap-4 shadow-sm`}>
              <div className="text-3xl">{c.icon}</div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color} mt-0.5`}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ---- GRÁFICO ---- */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Evolução do Faturamento</h2>
          <div className="w-full h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dados} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                 formatter={(v) => [`R$ ${Number(v ?? 0).toFixed(2)}`, "Valor"]}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Area type="monotone" dataKey="valor" stroke="#f43f5e" strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ---- DESKTOP: 2-col layout for ranking + categoria ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Itens mais vendidos */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Itens mais vendidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-3 font-semibold">Item</th>
                    <th className="pb-2 pr-3 font-semibold">Categ.</th>
                    <th className="pb-2 pr-3 font-semibold text-right">Qtd</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {slice(ranking, pageRanking).map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">{item.nome}</td>
                      <td className="py-2.5 pr-3 text-gray-500">{item.categoria}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-700">{item.quantidade}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600">R${Number(item.valorTotal ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination current={pageRanking} total={pages(ranking)} onChange={setPageRanking} />
          </section>

          {/* Resumo por categoria */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo por Categoria</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-3 font-semibold">Categoria</th>
                    <th className="pb-2 pr-3 font-semibold text-right">Qtd</th>
                    <th className="pb-2 font-semibold text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoriasResumo).map(([cat, r], idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">{cat}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-700">{r.quantidade}</td>
                      <td className="py-2.5 text-right font-semibold text-rose-600">R${r.valor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ---- STATUS + CLIENTES ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status cards */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status das Comandas</h2>
            {[
              { label: "Pendentes", value: pendentes, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { label: "Concluídas", value: concluidas, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "% Concluídas", value: `${percentualConcluidas.toFixed(1)}%`, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4 flex justify-between items-center`}>
                <span className="text-sm font-medium text-gray-700">{c.label}</span>
                <span className={`text-xl font-bold ${c.color}`}>{c.value}</span>
              </div>
            ))}
          </div>

          {/* Ranking de clientes */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ranking de Clientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-3 font-semibold">Cliente</th>
                    <th className="pb-2 pr-3 font-semibold text-right">Itens</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {slice(clientesArray, pageClientes).map(([cliente, r], idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">{cliente}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-700">{r.quantidade}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600">R${r.valor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination current={pageClientes} total={pages(clientesArray)} onChange={setPageClientes} />
          </section>
        </div>

        {/* ---- COMANDAS ---- */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Comandas</h2>
            {/* inline date filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Buscar data:</label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={dataFiltro}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length > 2 && v.length <= 4) v = v.slice(0, 2) + "/" + v.slice(2);
                  else if (v.length > 4) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4, 8);
                  setDataFiltro(v);
                }}
                maxLength={10}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none w-36"
              />
            </div>
          </div>

          {/* Mobile: card layout */}
          <div className="block lg:hidden space-y-3">
            {slice(comandas, pageComandas).map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-400 font-mono">#{c.id}</span>
                    <p className="font-semibold text-gray-800 text-sm">{c.nome}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
                {c.descricao && <p className="text-xs text-gray-500 mb-2">{c.descricao}</p>}
                <div className="text-xs text-gray-600 space-y-0.5 mb-3">
                  {c.itens.map((i, idx) => (
                    <div key={idx}>• {i.quantidade}x {i.nome} <span className="text-gray-400">({i.categoria_nome})</span></div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{c.criadoEm}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => excluirComanda(c.id)}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => router.push(`/editarcomanda/${c.id}`)}
                      className="px-3 py-1.5 bg-amber-400 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2 pr-4 font-semibold">ID</th>
                  <th className="pb-2 pr-4 font-semibold">Nome</th>
                  <th className="pb-2 pr-4 font-semibold">Descrição</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Itens</th>
                  <th className="pb-2 pr-4 font-semibold">Criado em</th>
                  <th className="pb-2 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {slice(comandas, pageComandas).map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
                    <td className="py-3 pr-4 font-mono text-gray-400 text-xs pt-3.5">#{c.id}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{c.nome}</td>
                    <td className="py-3 pr-4 text-gray-500 max-w-[160px] truncate">{c.descricao}</td>
                    <td className="py-3 pr-4"><Badge status={c.status} /></td>
                    <td className="py-3 pr-4 text-gray-600 space-y-0.5">
                      {c.itens.map((i, idx) => (
                        <div key={idx} className="text-xs">{i.quantidade}x {i.nome} <span className="text-gray-400">({i.categoria_nome})</span></div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap pt-3.5">{c.criadoEm}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => excluirComanda(c.id)}
                          className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => router.push(`/editarcomanda/${c.id}`)}
                          className="px-3 py-1.5 bg-amber-400 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination current={pageComandas} total={pages(comandas)} onChange={setPageComandas} />
        </section>
      </main>
    </div>
  );
}
