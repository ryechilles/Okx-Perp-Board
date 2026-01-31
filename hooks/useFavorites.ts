'use client';

import { useState, useCallback, useEffect } from 'react';
import { getFavoritesCache, setFavoritesCache } from '@/lib/cache';

/**
 * Hook for managing favorite tokens
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from cache on mount
  useEffect(() => {
    const savedFavorites = getFavoritesCache();
    if (savedFavorites.length > 0) {
      setFavorites(savedFavorites);
    }
  }, []);

  // Toggle favorite status for a token
  const toggleFavorite = useCallback((instId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(instId)
        ? prev.filter(f => f !== instId)
        : [...prev, instId];
      setFavoritesCache(newFavorites);
      return newFavorites;
    });
  }, []);

  // Check if a token is favorited
  const isFavorite = useCallback((instId: string) => {
    return favorites.includes(instId);
  }, [favorites]);

  // Direct setter for URL state sync
  const setFavoritesDirectly = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites);
    setFavoritesCache(newFavorites);
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    setFavoritesDirectly,
  };
}
