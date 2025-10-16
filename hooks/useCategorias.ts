"use client";

import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";

// ============================================================================
// TYPES
// ============================================================================

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
  _count: {
    productos: number;
  };
}

interface CategoriasStore {
  categorias: Categoria[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setCategorias: (categorias: Categoria[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetched: (timestamp: number) => void;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const useCategoriasStore = create<CategoriasStore>((set) => ({
  categorias: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  setCategorias: (categorias) => set({ categorias }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
}));

// ============================================================================
// HOOK
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useCategorias() {
  const {
    categorias,
    isLoading,
    error,
    lastFetched,
    setCategorias,
    setLoading,
    setError,
    setLastFetched,
  } = useCategoriasStore();

  const fetchCategorias = useCallback(async (force = false) => {
    // Si ya tenemos datos recientes y no es una llamada forzada, no hacer fetch
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      console.log("🟢 [useCategorias] Usando caché de categorías");
      return;
    }

    // Si ya está cargando, no hacer otra llamada
    if (isLoading) {
      console.log("🟡 [useCategorias] Ya está cargando categorías, saltando...");
      return;
    }

    console.log("🔵 [useCategorias] Cargando categorías...");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categorias");
      const data = await response.json();

      if (data.success) {
        setCategorias(data.categorias);
        setLastFetched(Date.now());
        console.log("✅ [useCategorias] Categorías cargadas:", data.categorias.length);
      } else {
        throw new Error(data.message || "Error al cargar categorías");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("❌ [useCategorias] Error:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isLoading, lastFetched, setCategorias, setLoading, setError, setLastFetched]);

  const refreshCategorias = useCallback(() => {
    return fetchCategorias(true);
  }, [fetchCategorias]);

  // Auto-fetch en mount si no hay datos
  useEffect(() => {
    if (categorias.length === 0 && !isLoading) {
      fetchCategorias();
    }
  }, [categorias.length, isLoading, fetchCategorias]);

  return {
    categorias,
    isLoading,
    error,
    fetchCategorias,
    refreshCategorias,
  };
}

export default useCategorias;