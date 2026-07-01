// hooks/useComandas.ts
// Hook que centraliza dados, filtro por data e ações (status, salvar, excluir) das comandas do dia.

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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

/** Garante "YYYY-MM-DD" a partir de uma string ISO completa ou já curta. */
function paraDataCurta(valor: string): string {
  return valor.length >= 10 ? valor.slice(0, 10) : valor;
}

export function useComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [statusCarregando, setStatusCarregando] = useState<number | null>(null);
  const [statusSucesso, setStatusSucesso] = useState<number | null>(null);

  const [dataFiltro, setDataFiltro] = useState("");
  const [mostrarTudo, setMostrarTudo] = useState(true);

  const prevIdsRef = useRef<string>("");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["comandasHoje"],
    queryFn: fetchComandasHoje,
    refetchInterval: 1000,
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
    if (newIds === prevIdsRef.current) return;

    const novas = novaLista.filter((c) => !comandas.some((old) => old.id === c.id));

    // prevIdsRef.current === "" só na primeira carga: não notifica o que já existia ao abrir a página.
    if (novas.length > 0 && prevIdsRef.current !== "") {
      mostrarToastNovaComanda(novas[0].nome);
      playNotificationSound();
    }

    prevIdsRef.current = newIds;
    setComandas(novaLista);
    // comandas é intencionalmente omitido: só queremos comparar contra o snapshot anterior, não re-rodar a cada setComandas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, playNotificationSound]);

  const comandasFiltradas = useMemo(() => {
    if (mostrarTudo || !dataFiltro) return comandas;
    return comandas.filter((c) => {
      if (!c.criadoEm) return true; // sem data no registro: não esconde o item
      return paraDataCurta(c.criadoEm) === dataFiltro;
    });
  }, [comandas, mostrarTudo, dataFiltro]);

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
      setStatusCarregando(comandaId);
      setStatusSucesso(null);
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
        setStatusSucesso(comandaId);
        setTimeout(() => setStatusSucesso(null), 2500);
        refetch();
      } catch (err) {
        console.error(err);
        setErro("Não foi possível atualizar o status. Verifique sua conexão.");
      } finally {
        setStatusCarregando(null);
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
    statusCarregando,
    statusSucesso,
  };
}

function mostrarToastNovaComanda(nome: string) {
  const el = document.createElement("div");
  el.innerText = `🔔 Nova comanda: ${nome}`;
  el.className =
    "fixed top-4 right-4 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-sm font-semibold animate-bounce";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
