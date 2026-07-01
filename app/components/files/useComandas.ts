// hooks/useComandas.ts
// Hook que centraliza dados, filtro por data e ações (status, salvar, excluir) das comandas do dia.

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Comanda } from "@/app/components/files/comanda";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://sistema-mara-backend-1.onrender.com";

async function fetchComandasHoje(): Promise<Comanda[]> {
  const res = await fetch(`${API}/comandas/hoje`);
  if (!res.ok) throw new Error("Erro ao carregar comandas");
  return res.json();
}

async function parseErroApi(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
}


export function useComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const prevIdsRef = useRef<string>("");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["comandasHoje"],
    queryFn: fetchComandasHoje,
    refetchInterval: 5000,
  });

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    new Audio("/notification.mp3").play().catch(console.error);
  }, [soundEnabled]);

  const ativarSom = useCallback(() => {
    const a = new Audio("/notification.mp3");
    a.play()
      .then(() => setSoundEnabled(true))
      .catch(() => setSoundEnabled(true));
  }, []);

  // Detecta comandas novas para notificar, e sincroniza o estado local com o que veio do servidor.
useEffect(() => {
  const novaLista = data as Comanda[];
  const newIds = novaLista.map((c) => c.id).join(",");

  // notificação só quando aparecem IDs novos
  if (newIds !== prevIdsRef.current) {
    const novas = novaLista.filter((c) => !comandas.some((old) => old.id === c.id));

    if (novas.length > 0 && prevIdsRef.current !== "") {
      mostrarToastNovaComanda(novas[0].nome);
      playNotificationSound();
    }

    prevIdsRef.current = newIds;
  }

  // sempre sincroniza (captura mudanças de status, itens, etc.)
  setComandas(novaLista);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data, playNotificationSound]);
  const toggleItemSelecionado = useCallback(
    (comandaId: number, itemIndex: number, checked: boolean) => {
      setItensSelecionados((prev) => ({ ...prev, [`${comandaId}-${itemIndex}`]: checked }));
    },
    []
  );

  const handleStatusChange = useCallback(
    async (comandaId: number, novoStatus: Comanda["status"]) => {
      const comanda = comandas.find((c) => c.id === comandaId);
      if (!comanda) return;
      setErro(null);
      try {
        const res = await fetch(`${API}/comandas/${comandaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...comanda, status: novoStatus }),
        });
        if (!res.ok) {
          setErro(await parseErroApi(res, "Não foi possível atualizar o status."));
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        setErro("Não foi possível atualizar o status. Verifique sua conexão.");
      }
    },
    [comandas, refetch]
  );

  const excluirComanda = useCallback(
    async (id: number) => {
      if (!window.confirm("Tem certeza que deseja excluir esta comanda?")) return;
      setErro(null);
      try {
        const res = await fetch(`${API}/comandas/${id}`, { method: "DELETE" });
        if (!res.ok) {
          setErro(await parseErroApi(res, "Não foi possível excluir a comanda."));
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        setErro("Não foi possível excluir a comanda. Verifique sua conexão.");
      }
    },
    [refetch]
  );

  return {
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
    recarregar: refetch,
  };
}

function mostrarToastNovaComanda(nome: string) {
  const el = document.createElement("div");
  el.innerText = `🔔 Nova comanda: ${nome}`;
  el.className =
    "fixed top-4 right-4 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-sm font-semibold animate-bounce";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}