"use client";
import { useState, useRef, useEffect } from "react";

type ClienteSugestao = {
  id?: number;
  nome: string;
  telefone: number;
};

type NomeInputProps = {
  value: string;
  onChange: (nome: string) => void;
  onSelectCliente?: (cliente: ClienteSugestao) => void; // chamado ao escolher um cliente existente
};

export function NomeInput({ value, onChange, onSelectCliente }: NomeInputProps) {
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buscarClientes = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSugestoes([]);
      setAberto(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/clientes/search?q=${encodeURIComponent(query)}`
        );
        const data: ClienteSugestao[] = await res.json();
        setSugestoes(data);
        setAberto(data.length > 0);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setLoading(false);
      }
    }, 250); // debounce de 250ms
  };

  const selecionarCliente = (cliente: ClienteSugestao) => {
    onChange(cliente.nome);
    setSugestoes([]);
    setAberto(false);
    onSelectCliente?.(cliente);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          id="nome"
          name="nome"
          required
          autoComplete="off"
          placeholder="Ex: João Silva"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            buscarClientes(e.target.value);
          }}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-gray-50 placeholder-gray-400"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-300 border-t-rose-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {sugestoes.map((cliente, idx) => (
            <li key={cliente.id ?? idx}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
                onClick={() => selecionarCliente(cliente)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-rose-50 transition-colors text-left"
              >
                <span className="font-medium text-gray-800">{cliente.nome}</span>
                <span className="text-xs text-gray-400">{cliente.telefone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
