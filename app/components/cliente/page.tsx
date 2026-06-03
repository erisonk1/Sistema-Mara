"use client";
import { useState } from "react";

export default function CadastroClientes() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const salvarCliente = async () => {
    if (!nome || !telefone) {
      setErro("Preencha todos os campos");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch("http://localhost:4000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar cliente");

      setNome("");
      setTelefone("");
      setMostrarFormulario(false);
    } catch (err) {
      setErro("Não foi possível cadastrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

return (
  <div className="relative">
    {/* Botão flutuante */}
    <button
      onClick={() => setMostrarFormulario(true)}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-rose-500 text-white rounded-2xl shadow-sm hover:bg-rose-600 transition-colors font-semibold text-sm"
    >
      ➕ Cadastrar Cliente
    </button>

    {/* Modal */}
    {mostrarFormulario && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                Cadastro de Cliente
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Preencha as informações do cliente
              </p>
            </div>

            <button
              onClick={() => setMostrarFormulario(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-5">
            
            {/* Erro */}
            {erro && (
              <div className="mb-4 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-medium">
                {erro}
              </div>
            )}

            <div className="space-y-4">
              
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nome
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={carregando}
                  placeholder="Digite o nome do cliente"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all disabled:bg-gray-50"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Telefone
                </label>

                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={carregando}
                  placeholder="(00) 00000-0000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-5">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarCliente}
                disabled={carregando}
                className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {carregando ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}