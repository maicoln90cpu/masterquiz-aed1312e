import { useState, useMemo, useEffect } from 'react';

export function usePagination<T>(data: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [data.length]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    totalItems: data.length,
    startIndex: (currentPage - 1) * itemsPerPage,
  };
}
