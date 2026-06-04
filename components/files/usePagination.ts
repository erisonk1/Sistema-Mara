// hooks/usePagination.ts
// Hook que encapsula a lógica de paginação.
// Uso:
//   const { currentItems, currentPage, totalPages, setPage } = usePagination(myArray, 5);

import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], perPage = 5) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / perPage);

  const currentItems = useMemo(
    () => items.slice((currentPage - 1) * perPage, currentPage * perPage),
    [items, currentPage, perPage]
  );

  // Reseta para p.1 se os dados mudarem e a página atual ficar inválida
  const setPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), Math.max(1, totalPages)));
  };

  return { currentItems, currentPage, totalPages, setPage };
}
