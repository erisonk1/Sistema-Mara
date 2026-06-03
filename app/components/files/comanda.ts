// types/comanda.ts
// Tipos compartilhados entre todas as páginas do sistema.

export type ItemComanda = {
  nome: string;
  quantidade: number;
  preco: number;
  categoria_nome?: string;
  porPeso?: boolean;
  peso?: number;
};

export type Comanda = {
  id: number;
  nome: string;
  descricao: string;
  status: "Pendente" | "Concluído";
  formaPagamento?: string;
  itens: ItemComanda[];
  criadoEm?: string;
};

export type ItemCardapio = {
  name: string;
  price: number;
  available: boolean;
  porPeso: boolean;
};

export type CategoriaCardapio = {
  category: string;
  items: ItemCardapio[];
};

export type FormaPagamento = "Pix" | "Crédito" | "Débito" | "Dinheiro" | "Cortesia";

export type DiaFaturamento = {
  data: string;
  valor: number;
};

export type ItemRanking = {
  nome: string;
  categoria: string;
  quantidade: number;
  valorTotal: number;
};
