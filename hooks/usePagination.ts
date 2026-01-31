'use client';

import { useState, useCallback } from 'react';
import { UI } from '@/lib/constants';

/**
 * Hook for managing pagination state
 */
export function usePagination(pageSize: number = UI.PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  // Go to next page
  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  // Go to previous page
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  // Reset to first page
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Calculate pagination info for a given total count
  const getPaginationInfo = useCallback((totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      pageSize,
      startIndex,
      endIndex,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    getPaginationInfo,
  };
}
